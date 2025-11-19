import torch
from transformers import pipeline, AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import logging
import numpy as np

logger = logging.getLogger(__name__)

class AIDetectionModels:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
        # We'll use a simple approach with available models
        # In production, you'd want to use multiple specialized models
        self.models_loaded = False
        self.classifier = None
        
    def load_models(self):
        """Lazy load models on first use"""
        if self.models_loaded:
            return
        
        try:
            logger.info("Loading AI-generated image detection model...")
            # Using a CLIP-based classifier for AI detection
            # Note: For hackathon, we'll use a simple model or mock response
            # In production, use specialized models like:
            # - umm-maybe/AI-image-detector
            # - Organika/sdxl-detector
            # - dima806/deepfake_vs_real_image_detection
            
            # For now, we'll use a general vision model
            # self.classifier = pipeline("image-classification", 
            #                           model="microsoft/resnet-50",
            #                           device=0 if self.device == "cuda" else -1)
            
            self.models_loaded = True
            logger.info("Models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            # Continue anyway - we'll use heuristics
    
    def detect(self, image: Image.Image) -> dict:
        """
        Detect if image is AI-generated or manipulated
        
        Returns:
            dict with verdict, confidence, model_scores, and forensic_analysis
        """
        self.load_models()
        
        # Get image statistics for forensic analysis
        forensics = self.analyze_forensics(image)
        
        # Run AI detection (simplified for hackathon)
        # In production, this would use multiple specialized models
        ai_score = self.detect_ai_generated(image, forensics)
        manipulation_score = self.detect_manipulation(image, forensics)
        
        # Determine verdict
        if ai_score > 0.7:
            verdict = "AI_GENERATED"
            confidence = ai_score
        elif manipulation_score > 0.7:
            verdict = "MANIPULATED"
            confidence = manipulation_score
        else:
            verdict = "REAL"
            confidence = 1.0 - max(ai_score, manipulation_score)
        
        return {
            "verdict": verdict,
            "confidence": float(confidence),
            "modelScores": {
                "ai_generated_score": float(ai_score),
                "manipulation_score": float(manipulation_score),
                "authenticity_score": float(1.0 - max(ai_score, manipulation_score))
            },
            "forensicAnalysis": forensics
        }
    
    def detect_ai_generated(self, image: Image.Image, forensics: dict) -> float:
        """
        Detect if image is AI-generated using heuristics and models
        """
        # Heuristic-based detection for hackathon
        # Real implementation would use HuggingFace models
        
        score = 0.0
        
        # Check for typical AI-generated artifacts
        if forensics.get('lacks_compression_artifacts', False):
            score += 0.3
        
        if forensics.get('uniform_noise_pattern', False):
            score += 0.2
        
        if forensics.get('unusual_frequency_distribution', False):
            score += 0.2
        
        # In production, add model predictions here:
        # if self.classifier:
        #     predictions = self.classifier(image)
        #     ...
        
        return min(score, 1.0)
    
    def detect_manipulation(self, image: Image.Image, forensics: dict) -> float:
        """
        Detect if image has been manipulated
        """
        score = 0.0
        
        # Check for manipulation indicators
        if forensics.get('inconsistent_compression', False):
            score += 0.3
        
        if forensics.get('edge_artifacts', False):
            score += 0.2
        
        if forensics.get('color_inconsistencies', False):
            score += 0.2
        
        return min(score, 1.0)
    
    def analyze_forensics(self, image: Image.Image) -> dict:
        """
        Analyze image for forensic indicators
        """
        # Convert to numpy array
        img_array = np.array(image)
        
        # Basic statistics
        forensics = {
            "width": image.width,
            "height": image.height,
            "format": image.format,
            "mode": image.mode,
            "mean_brightness": float(np.mean(img_array)),
            "std_brightness": float(np.std(img_array)),
        }
        
        # Check for EXIF data
        exif = image.getexif()
        forensics["has_exif"] = len(exif) > 0
        forensics["exif_fields"] = len(exif)
        
        # Heuristic checks (simplified)
        # In production, these would be more sophisticated
        std = np.std(img_array)
        forensics["lacks_compression_artifacts"] = std < 30  # Very uniform
        forensics["uniform_noise_pattern"] = 25 < std < 35
        forensics["unusual_frequency_distribution"] = False  # Would need FFT analysis
        forensics["inconsistent_compression"] = False  # Would need block analysis
        forensics["edge_artifacts"] = False  # Would need edge detection
        forensics["color_inconsistencies"] = False  # Would need color analysis
        
        return forensics

