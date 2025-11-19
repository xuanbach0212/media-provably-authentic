import os

import torch

# Model configuration - VERIFIED MODELS from research
MODELS = {
    "primary": "umm-maybe/AI-image-detector",  # Main AI detection (10K downloads)
    "deepfake": "dima806/deepfake_vs_real_image_detection",  # Deepfake (33K downloads)
    "sdxl": "Organika/sdxl-detector",  # SDXL specific (4K downloads)
    "fallback": "openai/clip-vit-base-patch32",  # Always available (18M downloads)
}

# Detection strategy
USE_ENSEMBLE = True  # Use multiple models for better accuracy
LOAD_ALL_MODELS = False  # Set True to load all models (slower but more accurate)

# Device configuration
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Model cache directory
MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "./models")

# Image processing
MAX_IMAGE_SIZE = (1024, 1024)
MIN_IMAGE_SIZE = (32, 32)

# Detection thresholds
AI_GENERATED_THRESHOLD = 0.55  # Lowered for higher recall on realistic AI images
DEEPFAKE_THRESHOLD = 0.7
MANIPULATION_THRESHOLD = 0.4  # Lowered to catch more manipulated images

# Forensic analysis settings
ENABLE_FORENSICS = True
FORENSICS_DETAILED = True

# Performance settings
MODEL_WARM_UP = os.getenv("MODEL_WARM_UP", "false").lower() == "true"
USE_HALF_PRECISION = False  # Set to True for faster inference on GPU

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
