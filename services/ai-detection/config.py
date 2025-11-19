import os

import torch

# Model configuration - VERIFIED MODELS from research
MODELS = {
    "primary": "umm-maybe/AI-image-detector",  # Main AI detection (10K downloads)
    "deepfake": "dima806/deepfake_vs_real_image_detection",  # Deepfake (33K downloads)
    "sdxl": "Organika/sdxl-detector",  # SDXL specific (4K downloads)
    "clip": "openai/clip-vit-base-patch32",  # Always available (18M downloads)
    "vit": "google/vit-base-patch16-224",  # Vision Transformer
    "resnet": "microsoft/resnet-50",  # ResNet baseline
}

# Detection strategy
USE_ENSEMBLE = True  # Use multiple models for better accuracy
LOAD_ALL_MODELS = True  # Load all models for ensemble (slower but more accurate)

# Single model testing (overrides ensemble if set)
# Set to model key to test single model: "primary", "deepfake", "sdxl", "clip", "vit", "resnet"
# Set to None to use ensemble
SINGLE_MODEL_TEST = None  # Use ensemble detection

# Device configuration
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Model cache directory
MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "./models")

# Image processing
MAX_IMAGE_SIZE = (1024, 1024)
MIN_IMAGE_SIZE = (32, 32)

# Detection thresholds (optimized for ensemble)
AI_GENERATED_THRESHOLD = 0.50  # Lower threshold for ensemble (models will vote)
DEEPFAKE_THRESHOLD = 0.65  # Medium threshold
MANIPULATION_THRESHOLD = 0.35  # Lower to catch subtle manipulations
ENSEMBLE_MIN_CONFIDENCE = 0.60  # Minimum confidence for ensemble verdict

# Forensic analysis settings
ENABLE_FORENSICS = True  # Re-enabled after model testing
FORENSICS_DETAILED = True

# Performance settings
MODEL_WARM_UP = os.getenv("MODEL_WARM_UP", "false").lower() == "true"
USE_HALF_PRECISION = False  # Set to True for faster inference on GPU

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
