from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from io import BytesIO
from PIL import Image
import logging
from typing import List, Optional

from search_engines import ReverseSearchEngine
import config

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Reverse Search Service",
    description="Reverse image search using multiple sources (Google, pHash DB)",
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

# Initialize search engine
search_engine = None


def get_search_engine():
    global search_engine
    if search_engine is None:
        logger.info("Initializing reverse search engine...")
        search_engine = ReverseSearchEngine()
    return search_engine


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


@app.on_event("startup")
async def startup_event():
    """Initialize search engine on startup"""
    logger.info("Starting Reverse Search Service v2.0.0")
    get_search_engine()


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "reverse-search",
        "version": "2.0.0",
        "google_enabled": config.ENABLE_GOOGLE,
        "phash_db_size": len(get_search_engine().phash_db.db)
    }


@app.get("/search/status")
async def search_status():
    """Get status of search engines and rate limits"""
    engine = get_search_engine()
    return {
        "status": "ok",
        "google_search": {
            "enabled": engine.google_search.enabled,
            "api_key_configured": bool(config.SERPAPI_KEY)
        },
        "phash_database": {
            "enabled": True,
            "entries": len(engine.phash_db.db)
        },
        "metadata_crawler": {
            "enabled": True,
            "timeout": config.CRAWLER_TIMEOUT
        }
    }


@app.post("/search", response_model=ProvenanceResult)
async def search(request: SearchRequest):
    """
    Perform comprehensive reverse image search
    
    Process:
    1. Decode base64 image
    2. Search Google Reverse Image (if API key available)
    3. Search local pHash database
    4. Deduplicate and rank results
    5. Crawl metadata from top matches
    6. Return comprehensive provenance results
    """
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(request.media)
        image = Image.open(BytesIO(image_bytes))
        
        # Resize if too large
        max_size = (1200, 1200)
        if image.width > max_size[0] or image.height > max_size[1]:
            logger.info(f"Resizing image from {image.size}")
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        logger.info(f"Processing reverse search for image: {image.size}")
        
        # Get search engine
        engine = get_search_engine()
        
        # Perform search
        result = await engine.search(image, request.filename)
        
        logger.info(f"Search complete: {len(result['matches'])} matches found")
        
        return ProvenanceResult(**result)
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/google")
async def search_google_only(request: SearchRequest):
    """Search using Google Reverse Image Search only"""
    try:
        image_bytes = base64.b64decode(request.media)
        image = Image.open(BytesIO(image_bytes))
        
        engine = get_search_engine()
        matches = await engine.google_search.search(image)
        
        return {
            "status": "ok",
            "matches": matches,
            "count": len(matches)
        }
        
    except Exception as e:
        logger.error(f"Google search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/phash")
async def search_phash_only(request: SearchRequest):
    """Search using perceptual hash database only"""
    try:
        image_bytes = base64.b64decode(request.media)
        image = Image.open(BytesIO(image_bytes))
        
        engine = get_search_engine()
        matches = engine.phash_db.search(image)
        
        return {
            "status": "ok",
            "matches": matches,
            "count": len(matches)
        }
        
    except Exception as e:
        logger.error(f"pHash search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/phash/add")
async def add_to_phash_db(request: SearchRequest, url: str):
    """Add an image to the pHash database"""
    try:
        image_bytes = base64.b64decode(request.media)
        image = Image.open(BytesIO(image_bytes))
        
        engine = get_search_engine()
        engine.phash_db.add_image(url, image)
        
        return {
            "status": "ok",
            "message": f"Image added to pHash database",
            "url": url
        }
        
    except Exception as e:
        logger.error(f"Add to pHash error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
