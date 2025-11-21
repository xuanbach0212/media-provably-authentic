"""
Forensic analysis module for image authenticity verification
"""
import numpy as np
import cv2
from PIL import Image
import exifread
from io import BytesIO
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class ForensicAnalyzer:
    """Performs forensic analysis on images to detect manipulation"""
    
    def __init__(self):
        self.analysis_enabled = True
        
    def analyze(self, image: Image.Image, image_bytes: Optional[bytes] = None) -> Dict[str, Any]:
        """
        Perform comprehensive forensic analysis
        
        Args:
            image: PIL Image object
            image_bytes: Optional raw image bytes for EXIF analysis
            
        Returns:
            Dictionary with forensic analysis results
        """
        results = {}
        
        try:
            # Basic image properties
            results.update(self._get_basic_properties(image))
            
            # EXIF analysis
            if image_bytes:
                exif_data = self._analyze_exif(image_bytes)
                results.update(exif_data)
            else:
                results["exif_data"] = {}
                results["exif_data_present"] = False
            
            # Convert to numpy for analysis
            img_array = np.array(image)
            
            # Noise analysis
            noise_results = self._analyze_noise(img_array)
            results.update(noise_results)
            
            # Compression artifacts
            compression_results = self._analyze_compression(img_array)
            results.update(compression_results)
            # Map to standard fields
            if "block_variance_std" in compression_results:
                results["compression_artifacts"] = min(compression_results["block_variance_std"] / 1000.0, 1.0)
            
            # Color consistency
            color_results = self._analyze_color_consistency(img_array)
            results.update(color_results)
            # Add standard fields
            if len(img_array.shape) == 3:
                results["color_saturation"] = float(np.mean(np.std(img_array, axis=(0,1))) / 255.0)
                results["brightness"] = float(np.mean(img_array) / 255.0)
                results["contrast"] = float(np.std(img_array) / 128.0)
            else:
                results["color_saturation"] = 0.0
                results["brightness"] = float(np.mean(img_array) / 255.0)
                results["contrast"] = float(np.std(img_array) / 128.0)
            
            # Edge analysis (for sharpness)
            edge_results = self._analyze_edges(img_array)
            results.update(edge_results)
            # Map to standard fields
            if "edge_density" in edge_results:
                results["sharpness"] = edge_results["edge_density"]
            
            # Overall manipulation score
            results["manipulation_likelihood"] = self._calculate_manipulation_score(results)
            
        except Exception as e:
            logger.error(f"Forensic analysis error: {e}", exc_info=True)
            results["error"] = str(e)
        
        return results
    
    def _get_basic_properties(self, image: Image.Image) -> Dict[str, Any]:
        """Extract basic image properties"""
        return {
            "width": image.width,
            "height": image.height,
            "format": image.format,
            "mode": image.mode,
        }
    
    def _analyze_exif(self, image_bytes: bytes) -> Dict[str, Any]:
        """Analyze EXIF metadata"""
        try:
            tags = exifread.process_file(BytesIO(image_bytes), details=False)
            
            has_exif = len(tags) > 0
            exif_data = {}
            
            # Extract key EXIF fields
            important_tags = [
                'Image Make',
                'Image Model',
                'Image DateTime',
                'Image Software',
                'EXIF DateTimeOriginal',
                'EXIF DateTimeDigitized',
            ]
            
            for tag_name in important_tags:
                if tag_name in tags:
                    exif_data[tag_name] = str(tags[tag_name])
            
            # Check for suspicious signs
            suspicious_software = ['photoshop', 'gimp', 'paint.net', 'ai', 'generated']
            has_editing_software = False
            
            if 'Image Software' in exif_data:
                software = exif_data['Image Software'].lower()
                has_editing_software = any(s in software for s in suspicious_software)
            
            return {
                "has_exif": has_exif,
                "exif_fields_count": len(tags),
                "exif_data": exif_data,
                "has_editing_software": has_editing_software,
                "exif_suspicious": not has_exif or has_editing_software,
            }
        except Exception as e:
            logger.warning(f"EXIF analysis failed: {e}")
            return {
                "has_exif": False,
                "exif_fields_count": 0,
                "exif_data": {},
                "exif_error": str(e)
            }
    
    def _analyze_noise(self, img_array: np.ndarray) -> Dict[str, Any]:
        """Analyze noise patterns"""
        try:
            # Convert to grayscale if needed
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Calculate noise level using Laplacian variance
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Calculate standard deviation
            std_dev = np.std(gray)
            
            # AI-generated images often have very uniform noise
            uniform_noise = std_dev < 25 and laplacian_var < 100
            
            return {
                "noise_level": float(std_dev),
                "laplacian_variance": float(laplacian_var),
                "uniform_noise_pattern": uniform_noise,
            }
        except Exception as e:
            logger.warning(f"Noise analysis failed: {e}")
            return {"noise_analysis_error": str(e)}
    
    def _analyze_compression(self, img_array: np.ndarray) -> Dict[str, Any]:
        """Detect compression artifacts and inconsistencies"""
        try:
            # Convert to grayscale
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Detect blocking artifacts (typical in JPEG)
            # Calculate variance in 8x8 blocks
            h, w = gray.shape
            block_size = 8
            variances = []
            
            for i in range(0, h - block_size, block_size):
                for j in range(0, w - block_size, block_size):
                    block = gray[i:i+block_size, j:j+block_size]
                    variances.append(np.var(block))
            
            variance_std = np.std(variances) if variances else 0
            
            # Low variance in block differences suggests uniform compression
            # High variance suggests multiple compressions or manipulation
            inconsistent_compression = variance_std > 1000
            
            return {
                "block_variance_std": float(variance_std),
                "inconsistent_compression": inconsistent_compression,
                "compression_artifacts_detected": variance_std > 500,
            }
        except Exception as e:
            logger.warning(f"Compression analysis failed: {e}")
            return {"compression_analysis_error": str(e)}
    
    def _analyze_color_consistency(self, img_array: np.ndarray) -> Dict[str, Any]:
        """Analyze color distribution and consistency"""
        try:
            if len(img_array.shape) != 3:
                return {"color_analysis": "skipped_grayscale"}
            
            # Calculate color channel statistics
            r_std = np.std(img_array[:, :, 0])
            g_std = np.std(img_array[:, :, 1])
            b_std = np.std(img_array[:, :, 2])
            
            # Calculate color variance across image regions
            h, w = img_array.shape[:2]
            region_size = min(h, w) // 4
            
            if region_size > 0:
                regions_std = []
                for i in range(0, h - region_size, region_size):
                    for j in range(0, w - region_size, region_size):
                        region = img_array[i:i+region_size, j:j+region_size]
                        regions_std.append(np.std(region))
                
                region_consistency = np.std(regions_std) if regions_std else 0
            else:
                region_consistency = 0
            
            # Very consistent colors across regions might indicate AI generation
            color_too_consistent = region_consistency < 10
            
            return {
                "color_channel_std": {
                    "red": float(r_std),
                    "green": float(g_std),
                    "blue": float(b_std),
                },
                "region_color_consistency": float(region_consistency),
                "color_inconsistencies": region_consistency > 50,
                "unnaturally_consistent": color_too_consistent,
            }
        except Exception as e:
            logger.warning(f"Color analysis failed: {e}")
            return {"color_analysis_error": str(e)}
    
    def _analyze_edges(self, img_array: np.ndarray) -> Dict[str, Any]:
        """Detect edge artifacts that might indicate splicing"""
        try:
            # Convert to grayscale
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Edge detection using Canny
            edges = cv2.Canny(gray, 100, 200)
            edge_density = np.sum(edges > 0) / edges.size
            
            # Calculate edge sharpness
            sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            edge_magnitude = np.sqrt(sobelx**2 + sobely**2)
            avg_edge_strength = np.mean(edge_magnitude[edge_magnitude > 0]) if np.any(edge_magnitude > 0) else 0
            
            # Suspicious if edges are too sharp or too smooth
            suspicious_edges = avg_edge_strength > 100 or avg_edge_strength < 10
            
            return {
                "edge_density": float(edge_density),
                "average_edge_strength": float(avg_edge_strength),
                "edge_artifacts": suspicious_edges,
            }
        except Exception as e:
            logger.warning(f"Edge analysis failed: {e}")
            return {"edge_analysis_error": str(e)}
    
    def _calculate_manipulation_score(self, results: Dict[str, Any]) -> float:
        """
        Calculate overall manipulation likelihood score (0-1)
        Higher score = more likely manipulated
        """
        score = 0.0
        factors = 0
        
        # EXIF suspicion - higher weight to catch social media edits
        if results.get("exif_suspicious", False):
            score += 0.40  # Increased from 0.15 to detect manipulated/edited images
            factors += 1
        
        # Uniform noise (AI-generated indicator)
        if results.get("uniform_noise_pattern", False):
            score += 0.20
            factors += 1
        
        # Compression inconsistencies
        if results.get("inconsistent_compression", False):
            score += 0.25
            factors += 1
        
        # Color inconsistencies
        if results.get("color_inconsistencies", False):
            score += 0.20
            factors += 1
        
        # Edge artifacts
        if results.get("edge_artifacts", False):
            score += 0.20
            factors += 1
        
        # Normalize score
        if factors > 0:
            score = min(score, 1.0)
        
        return round(score, 3)

