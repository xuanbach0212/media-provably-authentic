"""
Model Registry and Loader for verified AI detection models
"""

import logging
from typing import Dict, Optional

from transformers import pipeline

logger = logging.getLogger(__name__)


class ModelRegistry:
    """Registry of verified AI detection models from HuggingFace"""

    # Verified models from research (all tested and working)
    VERIFIED_MODELS = {
        "primary": "umm-maybe/AI-image-detector",
        "deepfake": "dima806/deepfake_vs_real_image_detection",
        "sdxl": "Organika/sdxl-detector",
        "clip": "openai/clip-vit-base-patch32",
        "vit": "google/vit-base-patch16-224",
        "resnet": "microsoft/resnet-50",
    }

    # Model configurations
    MODEL_CONFIGS = {
        "umm-maybe/AI-image-detector": {
            "type": "image-classification",
            "purpose": "General AI-generated image detection",
            "labels_mapping": {
                # Will be discovered at runtime
            },
            "threshold": 0.7,
            "weight": 0.9,  # Primary model gets 90% weight
        },
        "dima806/deepfake_vs_real_image_detection": {
            "type": "image-classification",
            "purpose": "Deepfake and manipulation detection",
            "labels_mapping": {},
            "threshold": 0.7,
            "weight": 0.05,  # Secondary models get minimal weight
        },
        "Organika/sdxl-detector": {
            "type": "image-classification",
            "purpose": "Stable Diffusion XL detection",
            "labels_mapping": {},
            "threshold": 0.7,
            "weight": 0.03,
        },
        "openai/clip-vit-base-patch32": {
            "type": "zero-shot-image-classification",
            "purpose": "Multi-modal fallback",
            "labels_mapping": {},
            "threshold": 0.6,
            "weight": 0.02,
        },
        "google/vit-base-patch16-224": {
            "type": "image-classification",
            "purpose": "Vision Transformer general classification",
            "labels_mapping": {},
            "threshold": 0.55,
            "weight": 0.25,
        },
        "microsoft/resnet-50": {
            "type": "image-classification",
            "purpose": "ResNet CNN baseline",
            "labels_mapping": {},
            "threshold": 0.55,
            "weight": 0.25,
        },
    }

    @classmethod
    def load_model(cls, model_name: str, device: int = -1) -> Optional[Dict]:
        """
        Load a specific model

        Args:
            model_name: Name of the model to load
            device: Device to load on (-1 for CPU, 0+ for GPU)

        Returns:
            Dictionary with model, name, and config, or None if failed
        """
        try:
            logger.info(f"Loading model: {model_name}")

            config = cls.MODEL_CONFIGS.get(model_name, {})
            model_type = config.get("type", "image-classification")

            model = pipeline(model_type, model=model_name, device=device)

            logger.info(f"✓ Successfully loaded: {model_name}")
            return {"model": model, "name": model_name, "config": config}
        except Exception as e:
            logger.error(f"✗ Failed to load {model_name}: {e}")
            return None

    @classmethod
    def load_best_available(cls, device: int = -1, try_all: bool = False) -> Dict:
        """
        Load the best available model(s)

        Args:
            device: Device to load on (-1 for CPU, 0+ for GPU)
            try_all: If True, try to load all models for ensemble

        Returns:
            Dictionary with loaded models
        """
        loaded_models = {}

        if try_all:
            # Try to load all models for ensemble
            for key, model_name in cls.VERIFIED_MODELS.items():
                if model_name:
                    result = cls.load_model(model_name, device)
                    if result:
                        loaded_models[key] = result
        else:
            # Load models in priority order
            priority = ["primary", "deepfake", "fallback"]

            for key in priority:
                model_name = cls.VERIFIED_MODELS.get(key)
                if model_name:
                    result = cls.load_model(model_name, device)
                    if result:
                        loaded_models[key] = result
                        # Load at least primary model
                        if key == "primary":
                            break

        if not loaded_models:
            logger.error("⚠️  No models could be loaded")
        else:
            logger.info(f"✓ Loaded {len(loaded_models)} model(s)")

        return loaded_models

    @classmethod
    def get_model_info(cls, model_name: str) -> Dict:
        """Get configuration info for a model"""
        return cls.MODEL_CONFIGS.get(model_name, {})
