import os

# API Keys
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")
TINEYE_PUBLIC_KEY = os.getenv("TINEYE_PUBLIC_KEY", "")
TINEYE_PRIVATE_KEY = os.getenv("TINEYE_PRIVATE_KEY", "")

# Search engines to use
SEARCH_ENGINES = ["google", "phash"]  # Start with google and local phash
ENABLE_TINEYE = bool(TINEYE_PUBLIC_KEY)  # Only enable if keys provided

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

# Mock mode fallback
MOCK_MODE = not SERPAPI_KEY  # Use mock if no API key

# Timeout settings
REQUEST_TIMEOUT = 30  # seconds
CRAWLER_TIMEOUT = 10  # seconds for metadata crawling

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Cache settings
ENABLE_CACHE = True
CACHE_TTL = 86400  # 24 hours in seconds

