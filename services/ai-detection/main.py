from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from io import BytesIO
from PIL import Image
import logging
from typing import Optional

from models import AIDetectionModels
import config

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Detection Service",
    description="AI-generated content and deepfake detection using HuggingFace models",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models (lazy loading)
models = None


def get_models():
    global models
    if models is None:
        logger.info("Initializing AI detection models...")
        models = AIDetectionModels()
        if config.MODEL_WARM_UP:
            logger.info("Warming up models...")
            models.load_models()
    return models


class DetectionRequest(BaseModel):
    media: str  # base64 encoded image


class DetectionResponse(BaseModel):
    verdict: str  # REAL, AI_GENERATED, MANIPULATED
    confidence: float
    modelScores: dict
    forensicAnalysis: dict


@app.on_event("startup")
async def startup_event():
    """Warm up models on startup if configured"""
    if config.MODEL_WARM_UP:
        logger.info("Warming up models on startup...")
        get_models()


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "ai-detection",
        "version": "2.0.0",
        "device": config.DEVICE
    }


@app.get("/models/status")
async def models_status():
    """Get status of loaded models"""
    detector = get_models()
    return {
        "status": "ok",
        **detector.get_model_status()
    }


@app.post("/models/warm-up")
async def warm_up_models():
    """Explicitly warm up models"""
    try:
        detector = get_models()
        detector.load_models()
        return {
            "status": "ok",
            "message": "Models warmed up successfully",
            **detector.get_model_status()
        }
    except Exception as e:
        logger.error(f"Model warm-up error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect", response_model=DetectionResponse)
async def detect(request: DetectionRequest):
    """
    Detect if media is AI-generated or manipulated
    
    Process:
    1. Decode base64 image
    2. Run HuggingFace models (if available)
    3. Perform forensic analysis
    4. Return comprehensive verdict
    """
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(request.media)
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large
        if image.width > config.MAX_IMAGE_SIZE[0] or image.height > config.MAX_IMAGE_SIZE[1]:
            logger.info(f"Resizing image from {image.size} to {config.MAX_IMAGE_SIZE}")
            image.thumbnail(config.MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
        
        logger.info(f"Processing image: {image.size}, mode: {image.mode}")
        
        # Get models
        detector = get_models()
        
        # Run detection (pass image_bytes for EXIF analysis)
        result = detector.detect(image, image_bytes)
        
        logger.info(f"Detection complete: {result['verdict']} (confidence: {result['confidence']:.2f})")
        
        return DetectionResponse(**result)
        
    except Exception as e:
        logger.error(f"Detection error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
