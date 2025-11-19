from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from io import BytesIO
from PIL import Image
import logging
from typing import List, Optional

from search_engines import ReverseSearchEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Reverse Search Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize search engine
search_engine = ReverseSearchEngine()

class SearchRequest(BaseModel):
    media: str  # base64 encoded image
    filename: Optional[str] = None

class ProvenanceMatch(BaseModel):
    url: str
    firstSeen: str
    similarity: float
    metadata: dict

class ProvenanceResult(BaseModel):
    matches: List[ProvenanceMatch]
    earliestMatch: Optional[ProvenanceMatch]
    provenanceChain: List[str]
    confidence: float

@app.get("/health")
async def health():
    return {"status": "ok", "service": "reverse-search"}

@app.post("/search", response_model=ProvenanceResult)
async def search(request: SearchRequest):
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(request.media)
        image = Image.open(BytesIO(image_bytes))
        
        logger.info(f"Processing reverse search for image: {image.size}")
        
        # Perform reverse search
        result = await search_engine.search(image, request.filename)
        
        return ProvenanceResult(**result)
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

