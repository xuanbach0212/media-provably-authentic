"""
Advanced Image Quality Assessment and Preprocessing

This module provides:
1. Comprehensive image quality assessment
2. Adaptive image enhancement based on quality
3. Preprocessing for optimal model performance
"""
import numpy as np
import cv2
import logging
from typing import Dict, Any, Tuple
from PIL import Image, ImageEnhance

logger = logging.getLogger(__name__)


class ImageQualityAssessor:
    """Assesses and enhances image quality for optimal detection"""
    
    def __init__(self):
        self.min_quality_threshold = 0.3
        self.target_quality = 0.7
        
    def assess_and_enhance(self, image: Image.Image) -> Tuple[Image.Image, Dict[str, Any]]:
        """
        Assess image quality and apply adaptive enhancement
        
        Args:
            image: PIL Image
            
        Returns:
            Tuple of (enhanced_image, quality_report)
        """
        try:
            # 1. Assess current quality
            quality_report = self.assess_quality(image)
            quality_score = quality_report["overall_quality"]
            
            logger.info(f"Image quality: {quality_score:.2f}")
            
            # 2. Determine enhancement strategy
            if quality_score < 0.3:
                # Very low quality - aggressive enhancement
                enhanced = self._aggressive_enhancement(image, quality_report)
                enhancement_level = "aggressive"
            elif quality_score < 0.6:
                # Medium quality - moderate enhancement
                enhanced = self._moderate_enhancement(image, quality_report)
                enhancement_level = "moderate"
            else:
                # High quality - minimal processing
                enhanced = self._minimal_enhancement(image)
                enhancement_level = "minimal"
            
            quality_report["enhancement_applied"] = enhancement_level
            
            return enhanced, quality_report
            
        except Exception as e:
            logger.error(f"Quality assessment failed: {e}")
            return image, {
                "error": str(e),
                "overall_quality": 0.5,
                "enhancement_applied": "none"
            }
    
    def assess_quality(self, image: Image.Image) -> Dict[str, Any]:
        """
        Comprehensive image quality assessment
        
        Evaluates:
        - Sharpness (Laplacian variance)
        - Contrast
        - Noise level
        - Resolution adequacy
        - Brightness
        - Color distribution
        """
        try:
            img_array = np.array(image)
            
            # Convert to grayscale for analysis
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # 1. Sharpness (Laplacian variance)
            sharpness = self._assess_sharpness(gray)
            
            # 2. Contrast
            contrast = self._assess_contrast(gray)
            
            # 3. Noise level
            noise_level = self._assess_noise(gray)
            
            # 4. Resolution adequacy
            resolution_score = self._assess_resolution(image)
            
            # 5. Brightness
            brightness_score = self._assess_brightness(gray)
            
            # 6. Color distribution (if color image)
            if len(img_array.shape) == 3:
                color_score = self._assess_color_distribution(img_array)
            else:
                color_score = 0.5  # Neutral for grayscale
            
            # Calculate overall quality (weighted average)
            overall = (
                sharpness["score"] * 0.30 +
                contrast["score"] * 0.25 +
                noise_level["score"] * 0.15 +
                resolution_score["score"] * 0.15 +
                brightness_score["score"] * 0.10 +
                color_score["score"] * 0.05
            )
            
            return {
                "overall_quality": round(overall, 3),
                "sharpness": sharpness,
                "contrast": contrast,
                "noise": noise_level,
                "resolution": resolution_score,
                "brightness": brightness_score,
                "color": color_score,
            }
            
        except Exception as e:
            logger.error(f"Quality assessment error: {e}")
            return {
                "error": str(e),
                "overall_quality": 0.5
            }
    
    def _assess_sharpness(self, gray: np.ndarray) -> Dict[str, Any]:
        """Assess image sharpness using Laplacian variance"""
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Score: 0 (very blurry) to 1 (very sharp)
        # Typical range: 0-1000, normalize to 0-1
        score = min(laplacian_var / 500.0, 1.0)
        
        quality = "sharp" if score > 0.7 else "moderate" if score > 0.4 else "blurry"
        
        return {
            "laplacian_variance": float(laplacian_var),
            "score": float(score),
            "quality": quality,
            "needs_sharpening": score < 0.5
        }
    
    def _assess_contrast(self, gray: np.ndarray) -> Dict[str, Any]:
        """Assess image contrast"""
        # Standard deviation as contrast measure
        std = np.std(gray)
        
        # Also check dynamic range
        min_val, max_val = np.min(gray), np.max(gray)
        dynamic_range = max_val - min_val
        
        # Score based on std (optimal around 50-80)
        if std < 30:
            score = std / 30.0
        elif std > 80:
            score = max(0.5, 1.0 - (std - 80) / 100.0)
        else:
            score = 0.7 + (std - 30) / 50.0 * 0.3
        
        score = np.clip(score, 0, 1)
        
        quality = "good" if score > 0.7 else "moderate" if score > 0.4 else "poor"
        
        return {
            "std_dev": float(std),
            "dynamic_range": int(dynamic_range),
            "score": float(score),
            "quality": quality,
            "needs_enhancement": score < 0.5
        }
    
    def _assess_noise(self, gray: np.ndarray) -> Dict[str, Any]:
        """Assess noise level"""
        # Estimate noise using high-pass filter
        # Subtract smoothed from original to get noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        noise = gray.astype(float) - blurred.astype(float)
        noise_std = np.std(noise)
        
        # Score: lower noise = higher score
        # Typical noise std: 0-50
        score = max(0, 1.0 - noise_std / 50.0)
        
        quality = "clean" if score > 0.7 else "moderate" if score > 0.4 else "noisy"
        
        return {
            "noise_std": float(noise_std),
            "score": float(score),
            "quality": quality,
            "needs_denoising": score < 0.5
        }
    
    def _assess_resolution(self, image: Image.Image) -> Dict[str, Any]:
        """Assess if resolution is adequate"""
        width, height = image.size
        pixel_count = width * height
        
        # Target: 512x512 = 262,144 pixels
        target = 512 * 512
        
        if pixel_count >= target * 2:
            score = 1.0
            quality = "high"
        elif pixel_count >= target:
            score = 0.8
            quality = "adequate"
        elif pixel_count >= target * 0.5:
            score = 0.5
            quality = "low"
        else:
            score = 0.3
            quality = "very_low"
        
        return {
            "width": width,
            "height": height,
            "pixel_count": pixel_count,
            "score": float(score),
            "quality": quality
        }
    
    def _assess_brightness(self, gray: np.ndarray) -> Dict[str, Any]:
        """Assess brightness level"""
        mean_brightness = np.mean(gray)
        
        # Optimal: 100-150 (on 0-255 scale)
        if 100 <= mean_brightness <= 150:
            score = 1.0
        elif 80 <= mean_brightness <= 170:
            score = 0.7
        elif 50 <= mean_brightness <= 200:
            score = 0.5
        else:
            score = 0.3
        
        quality = "good" if score > 0.7 else "moderate" if score > 0.5 else "poor"
        
        return {
            "mean": float(mean_brightness),
            "score": float(score),
            "quality": quality,
            "too_dark": mean_brightness < 80,
            "too_bright": mean_brightness > 170
        }
    
    def _assess_color_distribution(self, img_array: np.ndarray) -> Dict[str, Any]:
        """Assess color distribution"""
        r_std = np.std(img_array[:, :, 0])
        g_std = np.std(img_array[:, :, 1])
        b_std = np.std(img_array[:, :, 2])
        
        # Check balance between channels
        channel_balance = max(r_std, g_std, b_std) - min(r_std, g_std, b_std)
        
        # Good color distribution: similar std across channels
        if channel_balance < 20:
            score = 1.0
        elif channel_balance < 40:
            score = 0.7
        else:
            score = 0.5
        
        return {
            "channel_std": {
                "r": float(r_std),
                "g": float(g_std),
                "b": float(b_std)
            },
            "channel_balance": float(channel_balance),
            "score": float(score)
        }
    
    def _aggressive_enhancement(self, image: Image.Image, quality_report: Dict) -> Image.Image:
        """Apply aggressive enhancement for very low quality images"""
        logger.info("Applying aggressive enhancement")
        
        # Convert to numpy for OpenCV processing
        img_array = np.array(image)
        
        # 1. Denoise aggressively
        if len(img_array.shape) == 3:
            denoised = cv2.fastNlMeansDenoisingColored(img_array, None, 10, 10, 7, 21)
        else:
            denoised = cv2.fastNlMeansDenoising(img_array, None, 10, 7, 21)
        
        # Convert back to PIL
        enhanced = Image.fromarray(denoised)
        
        # 2. Enhance contrast
        contrast_factor = 1.5 if quality_report["contrast"]["needs_enhancement"] else 1.2
        enhancer = ImageEnhance.Contrast(enhanced)
        enhanced = enhancer.enhance(contrast_factor)
        
        # 3. Sharpen
        if quality_report["sharpness"]["needs_sharpening"]:
            enhancer = ImageEnhance.Sharpness(enhanced)
            enhanced = enhancer.enhance(1.8)
        
        # 4. Adjust brightness if needed
        if quality_report["brightness"]["too_dark"]:
            enhancer = ImageEnhance.Brightness(enhanced)
            enhanced = enhancer.enhance(1.3)
        elif quality_report["brightness"]["too_bright"]:
            enhancer = ImageEnhance.Brightness(enhanced)
            enhanced = enhancer.enhance(0.8)
        
        return enhanced
    
    def _moderate_enhancement(self, image: Image.Image, quality_report: Dict) -> Image.Image:
        """Apply moderate enhancement"""
        logger.info("Applying moderate enhancement")
        
        enhanced = image.copy()
        
        # 1. Moderate denoising if needed
        if quality_report["noise"]["needs_denoising"]:
            img_array = np.array(enhanced)
            if len(img_array.shape) == 3:
                denoised = cv2.fastNlMeansDenoisingColored(img_array, None, 5, 5, 7, 21)
            else:
                denoised = cv2.fastNlMeansDenoising(img_array, None, 5, 7, 21)
            enhanced = Image.fromarray(denoised)
        
        # 2. Moderate contrast enhancement
        if quality_report["contrast"]["needs_enhancement"]:
            enhancer = ImageEnhance.Contrast(enhanced)
            enhanced = enhancer.enhance(1.2)
        
        # 3. Light sharpening
        if quality_report["sharpness"]["needs_sharpening"]:
            enhancer = ImageEnhance.Sharpness(enhanced)
            enhanced = enhancer.enhance(1.3)
        
        return enhanced
    
    def _minimal_enhancement(self, image: Image.Image) -> Image.Image:
        """Apply minimal enhancement (mostly normalization)"""
        logger.info("Applying minimal enhancement")
        
        # Just normalize color/brightness slightly
        img_array = np.array(image)
        
        if len(img_array.shape) == 3:
            # Convert to LAB, normalize L channel, convert back
            lab = cv2.cvtColor(img_array, cv2.COLOR_RGB2LAB)
            l, a, b = cv2.split(lab)
            
            # Gentle CLAHE on L channel
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            
            lab = cv2.merge([l, a, b])
            normalized = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            
            return Image.fromarray(normalized)
        else:
            # Grayscale: gentle histogram equalization
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            equalized = clahe.apply(img_array)
            return Image.fromarray(equalized)

