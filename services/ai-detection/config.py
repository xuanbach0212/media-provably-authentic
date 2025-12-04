import os

import torch

# Model configuration - TOP PERFORMERS from Hugging Face research (2024)
# OPTIMIZED for Docker: Only 2 best models
MODELS = {
    # "dafilab": "Dafilab/ai-image-detector",  # EfficientNet-B4, 98.59% accuracy 🏆 (gated repo)
    "smogy": "Smogy/SMOGY-Ai-images-detector",  # Fine-tuned SDXL, 98.18% accuracy 🥇
    "hemg": "Hemg/AI-VS-REAL-IMAGE-DETECTION",  # Fine-tuned ViT, 95.84% accuracy 🥈
    # "sdxl": "Organika/sdxl-detector",  # SDXL specific (redundant with smogy)
    # "deepfake": "dima806/deepfake_vs_real_image_detection",  # Deepfake detection
    # "mmdbes": "mmdbes/Fake-image-detection",  # ResNet50, CIFAKE trained, 93.34%
    # "clip": "openai/clip-vit-base-patch32",  # CLIP baseline - too heavy for Docker
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

# Detection thresholds (optimized for smart ensemble) - PRODUCTION TUNED
AI_GENERATED_THRESHOLD = 0.60  # Threshold for AI detection (increased from 0.50 for fewer false positives)
DEEPFAKE_THRESHOLD = 0.65  # Threshold for deepfake detection
MANIPULATION_THRESHOLD = 0.35  # Threshold for manipulation detection
ENSEMBLE_MIN_CONFIDENCE = 0.60  # Minimum confidence for ensemble verdict

# Forensic analysis settings
ENABLE_FORENSICS = True  # Enable forensic analysis
FORENSICS_DETAILED = True

# Advanced feature flags (NEW)
ENABLE_FREQUENCY_ANALYSIS = True  # DCT/FFT analysis for GAN fingerprints
ENABLE_SMART_ENSEMBLE = True  # Confidence gating and outlier detection
ENABLE_QUALITY_ENHANCEMENT = True  # Adaptive image preprocessing

# Frequency analysis settings
FREQUENCY_DCT_THRESHOLD = 15.0  # High-freq uniformity threshold
FREQUENCY_FFT_PERIODICITY = 0.3  # Periodic artifact threshold
FREQUENCY_ANALYSIS_WEIGHT = 0.2  # Weight in final score (0-1)

# Quality enhancement settings
QUALITY_MIN_THRESHOLD = 0.3  # Below this: aggressive enhancement
QUALITY_TARGET = 0.7  # Target quality level
QUALITY_ADAPTIVE_ENHANCEMENT = True  # Use adaptive enhancement

# Smart ensemble settings
ENSEMBLE_LOW_CONFIDENCE = 0.6  # Below: reduce model weight
ENSEMBLE_HIGH_CONFIDENCE = 0.85  # Above: boost model weight
ENSEMBLE_MIN_CONSENSUS = 0.5  # Minimum cross-model agreement
ENSEMBLE_OUTLIER_THRESHOLD = 0.3  # Deviation threshold for outliers

# Performance settings
MODEL_WARM_UP = os.getenv("MODEL_WARM_UP", "false").lower() == "true"  # Disabled warm-up to avoid container restart
USE_HALF_PRECISION = False  # Set to True for faster inference on GPU

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
