from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from io import BytesIO
from PIL import Image
import logging

from models import AIDetectionModels

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Detection Service")

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
    return models

class DetectionRequest(BaseModel):
    media: str  # base64 encoded image

class DetectionResponse(BaseModel):
    verdict: str  # REAL, AI_GENERATED, MANIPULATED
    confidence: float
    modelScores: dict
    forensicAnalysis: dict

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-detection"}

@app.post("/detect", response_model=DetectionResponse)
async def detect(request: DetectionRequest):
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(request.media)
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        logger.info(f"Processing image: {image.size}, mode: {image.mode}")
        
        # Get models
        detector = get_models()
        
        # Run detection
        result = detector.detect(image)
        
        return DetectionResponse(**result)
    except Exception as e:
        logger.error(f"Detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

