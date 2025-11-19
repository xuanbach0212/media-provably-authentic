import logging
from typing import Dict, Optional

import config
import numpy as np
import torch
from forensics import ForensicAnalyzer
from model_loader import ModelRegistry
from PIL import Image
from transformers import pipeline

logger = logging.getLogger(__name__)


class AIDetectionModels:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        device_id = 0 if self.device == "cuda" else -1
        logger.info(f"Using device: {self.device}")

        self.models_loaded = False
        self.loaded_models = {}  # Dictionary of loaded models
        self.forensic_analyzer = ForensicAnalyzer()
        self.device_id = device_id

    def load_models(self):
        """Load verified models from registry"""
        if self.models_loaded:
            return

        try:
            logger.info("Loading verified AI detection models...")

            # Load models using registry
            self.loaded_models = ModelRegistry.load_best_available(
                device=self.device_id, try_all=config.LOAD_ALL_MODELS
            )

            self.models_loaded = True

            if not self.loaded_models:
                logger.warning("⚠️  No models loaded - using forensics only")
            else:
                model_names = [m["name"] for m in self.loaded_models.values()]
                logger.info(
                    f"✓ Loaded {len(self.loaded_models)} model(s): {model_names}"
                )

        except Exception as e:
            logger.error(f"Error loading models: {e}")
            logger.info("Continuing with forensics-only mode")

    def detect(self, image: Image.Image, image_bytes: Optional[bytes] = None) -> dict:
        """
        Detect if image is AI-generated or manipulated

        Args:
            image: PIL Image
            image_bytes: Optional raw image bytes for forensic analysis

        Returns:
            dict with verdict, confidence, model_scores, and forensic_analysis
        """
        self.load_models()

        # Run forensic analysis
        forensics = {}
        if config.ENABLE_FORENSICS:
            logger.info("Running forensic analysis...")
            forensics = self.forensic_analyzer.analyze(image, image_bytes)

        # Run model-based detection (ensemble approach)
        model_scores = {}
        all_predictions = []

        # Run all loaded models
        for model_key, model_info in self.loaded_models.items():
            try:
                logger.info(f"Running {model_key} model: {model_info['name']}")
                predictions = self._run_model(image, model_info)

                if predictions:
                    all_predictions.append(
                        {
                            "model": model_key,
                            "predictions": predictions,
                            "weight": model_info["config"].get("weight", 0.25),
                        }
                    )
                    model_scores[f"{model_key}_predictions"] = predictions
            except Exception as e:
                logger.error(f"Error running {model_key}: {e}")

        # Combine predictions using ensemble
        ai_generated_score, deepfake_score = self._ensemble_predict(all_predictions)

        model_scores["ai_generated_score"] = ai_generated_score
        model_scores["deepfake_score"] = deepfake_score

        # Manipulation detection (from forensics)
        manipulation_score = forensics.get("manipulation_likelihood", 0.0)
        model_scores["manipulation_score"] = manipulation_score

        # Calculate authenticity score
        authenticity_score = 1.0 - max(
            ai_generated_score, deepfake_score, manipulation_score
        )
        model_scores["authenticity_score"] = authenticity_score

        # Determine verdict and confidence
        verdict, confidence = self._determine_verdict(
            ai_generated_score, deepfake_score, manipulation_score
        )

        # Convert numpy types to Python natives for JSON serialization
        forensics_clean = self._convert_numpy_types(forensics)
        model_scores_clean = self._convert_numpy_types(model_scores)

        return {
            "verdict": verdict,
            "confidence": float(confidence),
            "modelScores": model_scores_clean,
            "forensicAnalysis": forensics_clean,
        }

    def _run_model(self, image: Image.Image, model_info: Dict) -> list:
        """Run a single model and return predictions"""
        try:
            model = model_info["model"]
            results = model(image)

            # Log raw predictions
            logger.info(f"Raw predictions: {results[:3]}")  # Log top 3

            return results
        except Exception as e:
            logger.error(f"Error running model: {e}")
            return []

    def _ensemble_predict(self, all_predictions: list) -> tuple:
        """
        Combine predictions from multiple models using weighted ensemble

        Returns:
            (ai_generated_score, deepfake_score)
        """
        if not all_predictions:
            logger.warning("No model predictions available, using fallback")
            return 0.5, 0.5

        ai_scores = []
        deepfake_scores = []

        for pred_info in all_predictions:
            model_key = pred_info["model"]
            predictions = pred_info["predictions"]
            weight = pred_info["weight"]

            # Parse predictions based on labels
            ai_score = self._extract_ai_score(predictions, model_key)
            deepfake_score = self._extract_deepfake_score(predictions, model_key)

            ai_scores.append((ai_score, weight))
            deepfake_scores.append((deepfake_score, weight))

        # Weighted average
        total_weight = sum(w for _, w in ai_scores)

        final_ai_score = (
            sum(score * weight for score, weight in ai_scores) / total_weight
            if total_weight > 0
            else 0.5
        )
        final_deepfake_score = (
            sum(score * weight for score, weight in deepfake_scores) / total_weight
            if total_weight > 0
            else 0.5
        )

        logger.info(
            f"Ensemble - AI score: {final_ai_score:.3f}, Deepfake score: {final_deepfake_score:.3f}"
        )

        return float(final_ai_score), float(final_deepfake_score)

    def _extract_ai_score(self, predictions: list, model_key: str) -> float:
        """Extract AI-generated score from predictions"""
        ai_score = 0.0

        for result in predictions:
            label = result["label"].lower()
            score = result["score"]

            # Keywords indicating AI-generated
            if any(
                keyword in label
                for keyword in ["artificial", "fake", "ai", "generated", "synthetic"]
            ):
                ai_score = max(ai_score, score)
            elif any(
                keyword in label
                for keyword in ["real", "authentic", "natural", "photo"]
            ):
                ai_score = max(ai_score, 1.0 - score)

        return ai_score

    def _extract_deepfake_score(self, predictions: list, model_key: str) -> float:
        """Extract deepfake score from predictions"""
        if model_key == "deepfake":
            # Deepfake-specific model
            fake_score = 0.0
            for result in predictions:
                label = result["label"].lower()
                score = result["score"]

                if any(
                    keyword in label for keyword in ["fake", "deepfake", "manipulated"]
                ):
                    fake_score = max(fake_score, score)
                elif "real" in label:
                    fake_score = max(fake_score, 1.0 - score)

            return fake_score
        else:
            # For other models, use a fraction of AI score
            return self._extract_ai_score(predictions, model_key) * 0.5

    def _heuristic_ai_detection(self, image: Image.Image) -> float:
        """Fallback heuristic-based AI detection"""
        img_array = np.array(image)
        score = 0.0

        # Check image statistics
        std = np.std(img_array)

        # Very uniform images might be AI-generated
        if std < 30:
            score += 0.3

        # Check for unnatural color distribution
        if len(img_array.shape) == 3:
            r_std = np.std(img_array[:, :, 0])
            g_std = np.std(img_array[:, :, 1])
            b_std = np.std(img_array[:, :, 2])

            # Very similar channel stddevs might indicate AI
            channel_diff = max(r_std, g_std, b_std) - min(r_std, g_std, b_std)
            if channel_diff < 5:
                score += 0.2

        return min(score, 1.0)

    def _determine_verdict(
        self, ai_score: float, deepfake_score: float, manipulation_score: float
    ) -> tuple[str, float]:
        """
        Determine final verdict and confidence

        Returns:
            (verdict, confidence) tuple
        """
        # Find the highest score
        max_score = max(ai_score, deepfake_score, manipulation_score)

        # Determine which type of issue (prioritize AI detection)
        if ai_score >= config.AI_GENERATED_THRESHOLD:
            return ("AI_GENERATED", ai_score)

        if deepfake_score >= config.DEEPFAKE_THRESHOLD:
            return ("MANIPULATED", deepfake_score)

        # For manipulation, only trigger if AI score is low
        # This prevents false positives from images that look AI-ish
        if manipulation_score >= config.MANIPULATION_THRESHOLD:
            # If AI score is also high (>0.5), need careful handling
            if ai_score >= 0.65:
                # High enough AI score → likely AI, not just manipulation
                return ("AI_GENERATED", ai_score * 0.8)
            elif ai_score > 0.5:
                # Medium AI score (0.5-0.65) → uncertain, prefer REAL
                return ("REAL", 1.0 - ai_score)
            else:
                # Low AI score → trust manipulation verdict
                return ("MANIPULATED", manipulation_score)

        # If all scores are low, likely REAL
        if max_score < 0.4:
            return ("REAL", 1.0 - max_score)

        # Medium range (0.4-0.7): uncertain
        # Only call it AI if score is reasonably high
        if ai_score >= 0.65:
            return ("AI_GENERATED", ai_score * 0.8)

        # Default to REAL with lower confidence for ambiguous cases
        return ("REAL", 1.0 - max_score)

    def _convert_numpy_types(self, obj):
        """Convert numpy types to Python native types for JSON serialization"""
        if isinstance(obj, dict):
            return {k: self._convert_numpy_types(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_numpy_types(item) for item in obj]
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.bool_):
            return bool(obj)
        else:
            return obj

    def get_model_status(self) -> dict:
        """Get status of loaded models"""
        loaded_model_names = [info["name"] for info in self.loaded_models.values()]

        return {
            "models_loaded": self.models_loaded,
            "loaded_models": loaded_model_names,
            "num_models": len(self.loaded_models),
            "device": self.device,
            "forensics_enabled": config.ENABLE_FORENSICS,
            "ensemble_enabled": config.USE_ENSEMBLE,
        }
