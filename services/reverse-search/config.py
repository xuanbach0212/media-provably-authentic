import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Keys (REQUIRED - no mock mode)
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")
TINEYE_PUBLIC_KEY = os.getenv("TINEYE_PUBLIC_KEY", "")
TINEYE_PRIVATE_KEY = os.getenv("TINEYE_PRIVATE_KEY", "")

# Validation
if not SERPAPI_KEY:
    import logging
    logging.warning("⚠️  SERPAPI_KEY not configured - Google Reverse Search will be DISABLED")

# Search engines to use
SEARCH_ENGINES = ["google", "phash"]  # Google and local phash
ENABLE_TINEYE = bool(TINEYE_PUBLIC_KEY)  # Only enable if keys provided
ENABLE_GOOGLE = bool(SERPAPI_KEY)  # Only enable if API key provided

# Search settings
MAX_RESULTS_PER_ENGINE = 10
SIMILARITY_THRESHOLD = 0.80  # 80% similarity threshold
MIN_MATCH_QUALITY = 0.7

# Perceptual hash settings
PHASH_THRESHOLD = 10  # Hamming distance threshold for pHash
PHASH_DB_PATH = os.getenv("PHASH_DB_PATH", "./phash_db.json")

# Rate limiting
GOOGLE_RATE_LIMIT = 100  # requests per day (SerpAPI free tier)
TINEYE_RATE_LIMIT = 5000  # requests per month

# Timeout settings
REQUEST_TIMEOUT = 30  # seconds
CRAWLER_TIMEOUT = 10  # seconds for metadata crawling

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Cache settings
ENABLE_CACHE = True
CACHE_TTL = 86400  # 24 hours in seconds

