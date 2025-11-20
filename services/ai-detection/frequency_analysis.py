"""
Frequency Domain Analysis for AI-Generated Image Detection

This module analyzes images in the frequency domain (DCT/FFT) to detect
GAN fingerprints and upsampling artifacts that are invisible in spatial domain.

References:
- "Detecting GAN-Generated Images via Frequency Analysis" (2020)
- JPEG compression analysis via DCT
"""
import numpy as np
import cv2
import logging
from typing import Dict, Any, Tuple
from PIL import Image

logger = logging.getLogger(__name__)


class FrequencyAnalyzer:
    """Performs frequency domain analysis to detect AI-generated images"""
    
    def __init__(self):
        # Thresholds (will be fine-tuned based on testing)
        self.DCT_HIGH_FREQ_THRESHOLD = 15.0  # For uniformity detection
        self.FFT_PERIODICITY_THRESHOLD = 0.3  # For GAN artifact detection
        
    def analyze(self, image: Image.Image) -> Dict[str, Any]:
        """
        Perform comprehensive frequency analysis
        
        Args:
            image: PIL Image object
            
        Returns:
            Dictionary with frequency analysis results
        """
        results = {}
        
        try:
            img_array = np.array(image)
            
            # DCT Analysis (JPEG-like, detects smoothness artifacts)
            results.update(self._analyze_dct(img_array))
            
            # FFT Analysis (detects periodic GAN artifacts)
            results.update(self._analyze_fft(img_array))
            
            # Combined frequency score
            results["frequency_ai_score"] = self._calculate_frequency_score(results)
            
        except Exception as e:
            logger.error(f"Frequency analysis error: {e}")
            results["frequency_analysis_error"] = str(e)
            results["frequency_ai_score"] = 0.5  # Neutral fallback
        
        return results
    
    def _analyze_dct(self, img_array: np.ndarray) -> Dict[str, Any]:
        """
        Analyze DCT (Discrete Cosine Transform) coefficients
        
        AI-generated images have:
        - Lower high-frequency energy (too smooth)
        - More uniform DCT coefficient distribution
        - Less natural noise in high frequencies
        """
        try:
            # Convert to grayscale if needed
            if len(img_array.shape) == 3:
                # Use Y channel from YCbCr for luminance analysis
                ycbcr = cv2.cvtColor(img_array, cv2.COLOR_RGB2YCrCb)
                y_channel = ycbcr[:, :, 0]
            else:
                y_channel = img_array
            
            h, w = y_channel.shape
            block_size = 8
            
            high_freq_energies = []
            mid_freq_energies = []
            low_freq_energies = []
            
            # Process image in 8x8 blocks (JPEG-style)
            for i in range(0, h - block_size, block_size):
                for j in range(0, w - block_size, block_size):
                    block = y_channel[i:i+block_size, j:j+block_size]
                    
                    # Apply DCT
                    dct = cv2.dct(np.float32(block))
                    
                    # Split into frequency bands
                    # Low freq: top-left (DC and low AC)
                    low_freq = np.abs(dct[0:3, 0:3])
                    low_freq_energies.append(np.sum(low_freq))
                    
                    # Mid freq: diagonal band
                    mid_freq = np.abs(dct[3:6, 3:6])
                    mid_freq_energies.append(np.sum(mid_freq))
                    
                    # High freq: bottom-right (high AC)
                    high_freq = np.abs(dct[4:8, 4:8])
                    high_freq_energies.append(np.sum(high_freq))
            
            # Calculate statistics
            avg_high_freq = np.mean(high_freq_energies) if high_freq_energies else 0
            std_high_freq = np.std(high_freq_energies) if high_freq_energies else 0
            avg_mid_freq = np.mean(mid_freq_energies) if mid_freq_energies else 0
            avg_low_freq = np.mean(low_freq_energies) if low_freq_energies else 0
            
            # Calculate ratios
            high_to_low_ratio = avg_high_freq / (avg_low_freq + 1e-6)
            mid_to_low_ratio = avg_mid_freq / (avg_low_freq + 1e-6)
            
            # AI images have:
            # 1. Lower high-frequency energy (too smooth)
            # 2. More uniform distribution (lower std)
            ai_smoothness_indicator = std_high_freq < self.DCT_HIGH_FREQ_THRESHOLD
            ai_low_high_freq = high_to_low_ratio < 0.05
            
            # Combined DCT-based AI score
            dct_ai_score = 0.0
            if ai_smoothness_indicator:
                dct_ai_score += 0.4
            if ai_low_high_freq:
                dct_ai_score += 0.4
            if std_high_freq < 10:  # Very uniform
                dct_ai_score += 0.2
            
            dct_ai_score = min(dct_ai_score, 1.0)
            
            return {
                "dct_avg_high_freq_energy": float(avg_high_freq),
                "dct_high_freq_uniformity": float(std_high_freq),
                "dct_high_to_low_ratio": float(high_to_low_ratio),
                "dct_mid_to_low_ratio": float(mid_to_low_ratio),
                "dct_ai_smoothness": ai_smoothness_indicator,
                "dct_ai_score": float(dct_ai_score),
            }
            
        except Exception as e:
            logger.warning(f"DCT analysis failed: {e}")
            return {
                "dct_analysis_error": str(e),
                "dct_ai_score": 0.5
            }
    
    def _analyze_fft(self, img_array: np.ndarray) -> Dict[str, Any]:
        """
        Analyze FFT (Fast Fourier Transform) spectrum
        
        GAN-generated images have:
        - Periodic artifacts from upsampling
        - Regular patterns in frequency spectrum
        - Checkerboard artifacts
        """
        try:
            # Convert to grayscale
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Apply FFT
            f_transform = np.fft.fft2(gray)
            f_shift = np.fft.fftshift(f_transform)
            magnitude_spectrum = np.abs(f_shift)
            
            # Log scale for better visualization
            magnitude_spectrum = np.log1p(magnitude_spectrum)
            
            # Calculate radial frequency profile
            h, w = magnitude_spectrum.shape
            center = (h // 2, w // 2)
            
            # Create radius map
            y, x = np.ogrid[:h, :w]
            r = np.sqrt((x - center[1])**2 + (y - center[0])**2)
            
            # Bin by radius
            max_radius = int(min(center) * 0.8)  # Use 80% of max radius
            radial_profile = []
            
            for radius in range(0, max_radius, 5):
                mask = (r >= radius) & (r < radius + 5)
                if np.any(mask):
                    radial_profile.append(magnitude_spectrum[mask].mean())
            
            # Detect periodic peaks (GAN artifacts)
            peaks = self._detect_periodic_peaks(radial_profile)
            
            # Calculate spectrum uniformity
            spectrum_std = np.std(radial_profile) if radial_profile else 0
            spectrum_mean = np.mean(radial_profile) if radial_profile else 0
            
            # Check for checkerboard artifacts (high-frequency grid)
            # These appear as peaks at specific frequencies
            checkerboard_score = self._detect_checkerboard_artifacts(magnitude_spectrum, center)
            
            # AI score based on FFT
            fft_ai_score = 0.0
            if len(peaks) > 2:  # Multiple periodic peaks
                fft_ai_score += 0.4
            if checkerboard_score > 0.5:
                fft_ai_score += 0.4
            if spectrum_std < 0.5:  # Very uniform spectrum
                fft_ai_score += 0.2
            
            fft_ai_score = min(fft_ai_score, 1.0)
            
            return {
                "fft_periodic_peaks": len(peaks),
                "fft_checkerboard_score": float(checkerboard_score),
                "fft_spectrum_uniformity": float(spectrum_std),
                "fft_spectrum_mean": float(spectrum_mean),
                "fft_ai_score": float(fft_ai_score),
                "fft_gan_artifacts_detected": len(peaks) > 2 or checkerboard_score > 0.5,
            }
            
        except Exception as e:
            logger.warning(f"FFT analysis failed: {e}")
            return {
                "fft_analysis_error": str(e),
                "fft_ai_score": 0.5
            }
    
    def _detect_periodic_peaks(self, radial_profile: list) -> list:
        """
        Detect periodic peaks in radial frequency profile
        Returns list of peak indices
        """
        if len(radial_profile) < 10:
            return []
        
        profile_array = np.array(radial_profile)
        
        # Smooth the profile
        from scipy.ndimage import gaussian_filter1d
        smoothed = gaussian_filter1d(profile_array, sigma=2)
        
        # Find peaks
        peaks = []
        for i in range(2, len(smoothed) - 2):
            # Local maximum
            if (smoothed[i] > smoothed[i-1] and 
                smoothed[i] > smoothed[i+1] and
                smoothed[i] > smoothed[i-2] and
                smoothed[i] > smoothed[i+2]):
                
                # Peak must be significant
                if smoothed[i] > np.mean(smoothed) + 0.5 * np.std(smoothed):
                    peaks.append(i)
        
        return peaks
    
    def _detect_checkerboard_artifacts(
        self, 
        magnitude_spectrum: np.ndarray, 
        center: Tuple[int, int]
    ) -> float:
        """
        Detect checkerboard artifacts from GAN upsampling
        Returns score 0-1 (higher = more likely checkerboard)
        """
        try:
            h, w = magnitude_spectrum.shape
            cy, cx = center
            
            # Check high-frequency corners (where checkerboard artifacts appear)
            # These are at 45-degree diagonals from center
            corner_regions = [
                magnitude_spectrum[cy-20:cy-5, cx-20:cx-5],  # Top-left
                magnitude_spectrum[cy-20:cy-5, cx+5:cx+20],  # Top-right
                magnitude_spectrum[cy+5:cy+20, cx-20:cx-5],  # Bottom-left
                magnitude_spectrum[cy+5:cy+20, cx+5:cx+20],  # Bottom-right
            ]
            
            corner_energies = []
            for region in corner_regions:
                if region.size > 0:
                    corner_energies.append(np.mean(region))
            
            # Get background (mid-frequency)
            bg_region = magnitude_spectrum[cy-10:cy+10, cx-10:cx+10]
            bg_energy = np.mean(bg_region) if bg_region.size > 0 else 0
            
            # Checkerboard artifacts show as elevated corner energy
            avg_corner_energy = np.mean(corner_energies) if corner_energies else 0
            
            if bg_energy > 0:
                corner_to_bg_ratio = avg_corner_energy / bg_energy
                # Ratio > 1.5 suggests checkerboard
                checkerboard_score = min((corner_to_bg_ratio - 1.0) / 2.0, 1.0)
                checkerboard_score = max(checkerboard_score, 0.0)
            else:
                checkerboard_score = 0.0
            
            return float(checkerboard_score)
            
        except Exception as e:
            logger.warning(f"Checkerboard detection failed: {e}")
            return 0.0
    
    def _calculate_frequency_score(self, results: Dict[str, Any]) -> float:
        """
        Calculate combined frequency-based AI detection score
        
        Combines DCT and FFT analysis for final score
        """
        dct_score = results.get("dct_ai_score", 0.5)
        fft_score = results.get("fft_ai_score", 0.5)
        
        # Weighted average (DCT is more reliable for general AI detection)
        frequency_score = 0.6 * dct_score + 0.4 * fft_score
        
        return round(frequency_score, 3)

