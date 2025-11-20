"""
Model Registry and Loader for verified AI detection models
"""

import logging
from typing import Dict, Optional

from transformers import pipeline
import config

logger = logging.getLogger(__name__)


class ModelRegistry:
    """Registry of verified AI detection models from HuggingFace"""

    # Load models from config.py (NEW: Top performers from Hugging Face research)
    VERIFIED_MODELS = config.MODELS

    # Model configurations (NEW: Balanced weights for ensemble)
    MODEL_CONFIGS = {
        "Dafilab/ai-image-detector": {
            "type": "image-classification",
            "purpose": "EfficientNet-B4, 98.59% accuracy",
            "labels_mapping": {},
            "threshold": 0.5,
            "weight": 0.25,  # Balanced weight
        },
        "Smogy/SMOGY-Ai-images-detector": {
            "type": "image-classification",
            "purpose": "Fine-tuned SDXL, 98.18% accuracy",
            "labels_mapping": {},
            "threshold": 0.5,
            "weight": 0.20,
        },
        "Hemg/AI-VS-REAL-IMAGE-DETECTION": {
            "type": "image-classification",
            "purpose": "Fine-tuned ViT, 95.84% accuracy",
            "labels_mapping": {},
            "threshold": 0.5,
            "weight": 0.18,
        },
        "Organika/sdxl-detector": {
            "type": "image-classification",
            "purpose": "Stable Diffusion XL detection",
            "labels_mapping": {},
            "threshold": 0.5,
            "weight": 0.15,
        },
        "dima806/deepfake_vs_real_image_detection": {
            "type": "image-classification",
            "purpose": "Deepfake and manipulation detection",
            "labels_mapping": {},
            "threshold": 0.5,
            "weight": 0.12,
        },
        "mmdbes/Fake-image-detection": {
            "type": "image-classification",
            "purpose": "ResNet50, CIFAKE trained, 93.34%",
            "labels_mapping": {},
            "threshold": 0.5,
            "weight": 0.07,
        },
        "openai/clip-vit-base-patch32": {
            "type": "zero-shot-image-classification",
            "purpose": "CLIP baseline",
            "labels_mapping": {},
            "threshold": 0.5,
            "weight": 0.03,
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
