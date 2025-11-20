from fastapi import FastAPI, HTTPException, UploadFile, File
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
    modelScores: dict  # All individual model scores
    ensembleScore: float  # Raw ensemble score (0-1)
    forensicAnalysis: dict  # All forensic metrics
    frequencyAnalysis: dict  # DCT/FFT analysis
    qualityMetrics: dict  # Image quality scores
    metadata: dict  # EXIF, file info


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
async def detect(image: UploadFile = File(...)):
    """
    Analyze media and return raw detection metrics (File Upload)
    
    Process:
    1. Read uploaded image file
    2. Run HuggingFace models (if available)
    3. Perform forensic analysis
    4. Return comprehensive raw metrics (no verdict)
    """
    try:
        # Read image file
        image_bytes = await image.read()
        pil_image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Validate and resize image
        MIN_SIZE = 224  # Minimum size for most models
        
        # Resize if too small (pad to minimum size)
        if pil_image.width < MIN_SIZE or pil_image.height < MIN_SIZE:
            logger.warning(f"Image too small ({pil_image.size}), padding to {MIN_SIZE}x{MIN_SIZE}")
            new_image = Image.new('RGB', (MIN_SIZE, MIN_SIZE), (255, 255, 255))
            # Center the image
            offset = ((MIN_SIZE - pil_image.width) // 2, (MIN_SIZE - pil_image.height) // 2)
            new_image.paste(pil_image, offset)
            pil_image = new_image
        
        # Resize if too large
        if pil_image.width > config.MAX_IMAGE_SIZE[0] or pil_image.height > config.MAX_IMAGE_SIZE[1]:
            logger.info(f"Resizing image from {pil_image.size} to {config.MAX_IMAGE_SIZE}")
            pil_image.thumbnail(config.MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
        
        logger.info(f"Processing image: {pil_image.size}, mode: {pil_image.mode}")
        
        # Get models
        detector = get_models()
        
        # Run detection (pass image_bytes for EXIF analysis)
        result = detector.detect(pil_image, image_bytes)
        
        logger.info(f"Detection complete: {result['verdict']} (confidence: {result['confidence']:.2f})")
        
        return DetectionResponse(**result)
        
    except Exception as e:
        logger.error(f"Detection error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect/base64", response_model=DetectionResponse)
async def detect_base64(request: DetectionRequest):
    """
    Analyze media and return raw detection metrics (Base64 Input)
    
    Process:
    1. Decode base64 image
    2. Run HuggingFace models (if available)
    3. Perform forensic analysis
    4. Return comprehensive raw metrics (no verdict)
    """
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(request.media)
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Validate and resize image
        MIN_SIZE = 224  # Minimum size for most models
        
        # Resize if too small (pad to minimum size)
        if image.width < MIN_SIZE or image.height < MIN_SIZE:
            logger.warning(f"Image too small ({image.size}), padding to {MIN_SIZE}x{MIN_SIZE}")
            new_image = Image.new('RGB', (MIN_SIZE, MIN_SIZE), (255, 255, 255))
            # Center the image
            offset = ((MIN_SIZE - image.width) // 2, (MIN_SIZE - image.height) // 2)
            new_image.paste(image, offset)
            image = new_image
        
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
