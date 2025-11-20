"""
Smart Ensemble with Confidence Gating

This module implements advanced ensemble logic:
1. Adaptive model weighting based on confidence
2. Outlier detection and removal
3. Cross-model consistency checking
4. Dynamic threshold adjustment based on image quality
"""
import numpy as np
import logging
from typing import Dict, List, Any, Tuple, Optional

logger = logging.getLogger(__name__)


class SmartEnsemble:
    """Advanced ensemble voting with confidence gating"""
    
    def __init__(self):
        # Confidence thresholds
        self.LOW_CONFIDENCE_THRESHOLD = 0.6
        self.HIGH_CONFIDENCE_THRESHOLD = 0.85
        
        # Consensus thresholds
        self.MIN_CONSENSUS_STRENGTH = 0.5
        self.OUTLIER_DEVIATION_THRESHOLD = 0.3
        
        # Verdict thresholds
        self.AI_GENERATED_THRESHOLD = 0.50
        self.DEEPFAKE_THRESHOLD = 0.65
        self.MANIPULATION_THRESHOLD = 0.35
        
    def combine_predictions(
        self,
        model_predictions: List[Dict[str, Any]],
        image_quality: Optional[Dict[str, Any]] = None,
        forensics: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Combine predictions from multiple models using smart ensemble
        
        Args:
            model_predictions: List of {model, predictions, weight, confidence}
            image_quality: Optional quality assessment results
            forensics: Optional forensic analysis results
            
        Returns:
            Combined verdict with confidence and metadata
        """
        try:
            if not model_predictions:
                logger.warning("No model predictions provided")
                return self._fallback_verdict()
            
            # 1. Apply confidence gating
            gated_predictions = self._apply_confidence_gating(
                model_predictions, image_quality
            )
            
            if not gated_predictions:
                logger.warning("All models filtered by confidence gating")
                return self._uncertain_verdict("Low confidence across all models")
            
            # 2. Detect and remove outliers
            filtered_predictions = self._remove_outliers(gated_predictions)
            
            # 3. Calculate cross-model consistency
            consistency_info = self._check_cross_model_consistency(filtered_predictions)
            
            # 4. Check if consensus is strong enough
            if consistency_info["avg_agreement"] < self.MIN_CONSENSUS_STRENGTH:
                return self._uncertain_verdict(
                    "Models disagree significantly",
                    {
                        "consistency": consistency_info,
                        "predictions": filtered_predictions
                    }
                )
            
            # 5. Combine scores with adjusted weights
            combined_scores = self._weighted_combination(filtered_predictions)
            
            # 6. Incorporate forensics if available
            if forensics:
                combined_scores = self._incorporate_forensics(combined_scores, forensics)
            
            # 7. Determine final verdict
            verdict_info = self._determine_verdict(
                combined_scores,
                consistency_info,
                len(filtered_predictions),
                len(model_predictions)
            )
            
            # Add metadata
            verdict_info.update({
                "ensemble_metadata": {
                    "total_models": len(model_predictions),
                    "active_models": len(filtered_predictions),
                    "outliers_removed": len(gated_predictions) - len(filtered_predictions),
                    "confidence_gating_removed": len(model_predictions) - len(gated_predictions),
                    "cross_model_agreement": consistency_info["avg_agreement"],
                    "consensus_strength": consistency_info["consensus_strength"],
                    "prediction_clusters": consistency_info["clusters"]
                }
            })
            
            return verdict_info
            
        except Exception as e:
            logger.error(f"Smart ensemble error: {e}")
            return self._fallback_verdict()
    
    def _apply_confidence_gating(
        self,
        predictions: List[Dict[str, Any]],
        image_quality: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Apply confidence-based gating to filter unreliable predictions
        
        Adjusts model weights based on:
        - Model's own confidence
        - Image quality (low quality reduces weight)
        - Model-specific quality factors
        """
        gated = []
        
        for pred in predictions:
            model_name = pred["model"]
            base_weight = pred["weight"]
            confidence = pred.get("confidence", 0.5)
            
            # 1. Confidence factor
            if confidence < self.LOW_CONFIDENCE_THRESHOLD:
                # Model is uncertain, reduce weight significantly
                confidence_factor = 0.3
            elif confidence > self.HIGH_CONFIDENCE_THRESHOLD:
                # Model is very confident, boost weight
                confidence_factor = 1.5
            else:
                # Normal confidence
                confidence_factor = 1.0
            
            # 2. Quality factor (if available)
            quality_factor = 1.0
            if image_quality:
                quality_factor = self._calculate_quality_factor(
                    model_name, 
                    image_quality
                )
            
            # 3. Calculate final weight
            final_weight = base_weight * confidence_factor * quality_factor
            
            # 4. Filter out if weight is too low
            if final_weight > 0.1:  # Minimum threshold
                pred_copy = pred.copy()
                pred_copy["adjusted_weight"] = final_weight
                pred_copy["confidence_factor"] = confidence_factor
                pred_copy["quality_factor"] = quality_factor
                gated.append(pred_copy)
            else:
                logger.info(f"Filtering {model_name}: weight too low ({final_weight:.2f})")
        
        return gated
    
    def _calculate_quality_factor(
        self, 
        model_name: str, 
        quality: Dict[str, Any]
    ) -> float:
        """
        Calculate quality-based adjustment factor for specific model
        
        Different models perform better/worse on low quality images
        """
        overall_quality = quality.get("overall_quality", 0.7)
        
        # Model-specific adjustments
        if "clip" in model_name.lower():
            # CLIP is robust to low quality
            if overall_quality < 0.5:
                return 1.2  # Boost CLIP on low quality
            else:
                return 1.0
        
        elif "vit" in model_name.lower() or "transformer" in model_name.lower():
            # ViT needs good quality
            if overall_quality < 0.5:
                return 0.7  # Reduce ViT on low quality
            else:
                return 1.1  # Boost on high quality
        
        elif "resnet" in model_name.lower() or "cnn" in model_name.lower():
            # CNNs are moderately affected
            if overall_quality < 0.4:
                return 0.8
            else:
                return 1.0
        
        else:
            # Default: slight penalty for low quality
            return max(0.7, overall_quality)
    
    def _remove_outliers(self, predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Remove outlier predictions using median absolute deviation
        """
        if len(predictions) < 3:
            # Not enough predictions to detect outliers
            return predictions
        
        # Extract scores
        scores = [pred["ai_score"] for pred in predictions]
        median_score = np.median(scores)
        
        # Calculate MAD (Median Absolute Deviation)
        mad = np.median([abs(s - median_score) for s in scores])
        
        # Filter outliers
        filtered = []
        for pred in predictions:
            score = pred["ai_score"]
            deviation = abs(score - median_score)
            
            # Check if outlier
            if mad > 0:
                z_score = deviation / (mad * 1.4826)  # Convert to Z-score equivalent
                is_outlier = z_score > 2.5  # ~98% confidence
            else:
                # If MAD is 0, all scores are identical (no outliers)
                is_outlier = deviation > self.OUTLIER_DEVIATION_THRESHOLD
            
            if not is_outlier:
                filtered.append(pred)
            else:
                logger.warning(
                    f"Outlier detected: {pred['model']} "
                    f"score={score:.3f} vs median={median_score:.3f}"
                )
        
        return filtered if filtered else predictions  # Keep all if all are outliers
    
    def _check_cross_model_consistency(
        self, 
        predictions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze agreement patterns across models
        """
        if len(predictions) < 2:
            return {
                "avg_agreement": 1.0,
                "consensus_strength": 1.0,
                "clusters": 1,
                "edge_case": False
            }
        
        scores = [pred["ai_score"] for pred in predictions]
        
        # Calculate pairwise agreement
        agreements = []
        for i in range(len(scores)):
            for j in range(i + 1, len(scores)):
                agreement = 1.0 - abs(scores[i] - scores[j])
                agreements.append(agreement)
        
        avg_agreement = np.mean(agreements) if agreements else 1.0
        
        # Calculate consensus strength (inverse of std)
        std = np.std(scores)
        consensus_strength = max(0, 1.0 - std * 2)  # Normalize
        
        # Detect clusters (simple: check if bimodal distribution)
        # If scores split into 2 groups, it's an edge case
        median = np.median(scores)
        below_median = [s for s in scores if s < median]
        above_median = [s for s in scores if s >= median]
        
        # Check if clear separation
        if below_median and above_median:
            gap = min(above_median) - max(below_median)
            has_clusters = gap > 0.3  # Significant gap
        else:
            has_clusters = False
        
        clusters = 2 if has_clusters else 1
        edge_case = clusters > 1 and avg_agreement < 0.6
        
        return {
            "avg_agreement": float(avg_agreement),
            "consensus_strength": float(consensus_strength),
            "clusters": clusters,
            "edge_case": edge_case,
            "score_std": float(std),
            "score_range": float(max(scores) - min(scores))
        }
    
    def _weighted_combination(self, predictions: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Combine predictions using adjusted weights
        """
        total_weight = sum(pred["adjusted_weight"] for pred in predictions)
        
        if total_weight == 0:
            logger.warning("Total weight is 0, using uniform weights")
            total_weight = len(predictions)
            for pred in predictions:
                pred["adjusted_weight"] = 1.0
        
        # Calculate weighted scores
        ai_score = sum(
            pred["ai_score"] * pred["adjusted_weight"] 
            for pred in predictions
        ) / total_weight
        
        deepfake_score = sum(
            pred.get("deepfake_score", pred["ai_score"] * 0.5) * pred["adjusted_weight"]
            for pred in predictions
        ) / total_weight
        
        return {
            "ai_generated_score": float(ai_score),
            "deepfake_score": float(deepfake_score),
        }
    
    def _incorporate_forensics(
        self, 
        combined_scores: Dict[str, float],
        forensics: Dict[str, Any]
    ) -> Dict[str, float]:
        """
        Blend forensic analysis into combined scores
        """
        # Get forensic indicators
        manipulation_score = forensics.get("manipulation_likelihood", 0.0)
        
        # Forensics are good at detecting manipulation but not AI generation
        # Use them to adjust scores, not replace them
        
        # If forensics strongly suggest manipulation, boost manipulation score
        if manipulation_score > 0.6:
            combined_scores["manipulation_score"] = manipulation_score
        else:
            combined_scores["manipulation_score"] = manipulation_score * 0.5
        
        return combined_scores
    
    def _determine_verdict(
        self,
        scores: Dict[str, float],
        consistency: Dict[str, Any],
        active_models: int,
        total_models: int
    ) -> Dict[str, Any]:
        """
        Determine final verdict based on scores and consensus
        """
        ai_score = scores["ai_generated_score"]
        deepfake_score = scores.get("deepfake_score", 0.0)
        manipulation_score = scores.get("manipulation_score", 0.0)
        
        consensus_strength = consistency["consensus_strength"]
        
        # Apply consensus penalty to confidence
        # Weak consensus = lower confidence
        consensus_penalty = max(0.7, consensus_strength)
        
        # Determine verdict
        if ai_score >= self.AI_GENERATED_THRESHOLD:
            verdict = "AI_GENERATED"
            confidence = ai_score * consensus_penalty
            
        elif deepfake_score >= self.DEEPFAKE_THRESHOLD:
            verdict = "MANIPULATED"
            confidence = deepfake_score * consensus_penalty
            
        elif manipulation_score >= self.MANIPULATION_THRESHOLD:
            # Complex logic: check if AI score is also elevated
            if ai_score >= 0.65:
                verdict = "AI_GENERATED"
                confidence = ai_score * 0.8 * consensus_penalty
            elif ai_score > 0.5:
                # Uncertain zone
                verdict = "UNCERTAIN"
                confidence = 0.5
            else:
                verdict = "MANIPULATED"
                confidence = manipulation_score * consensus_penalty
                
        else:
            # All scores low
            max_score = max(ai_score, deepfake_score, manipulation_score)
            if max_score < 0.4:
                verdict = "REAL"
                confidence = (1.0 - max_score) * consensus_penalty
            elif ai_score >= 0.65:
                # AI score is high enough despite threshold
                verdict = "AI_GENERATED"
                confidence = ai_score * 0.7 * consensus_penalty
            else:
                # Uncertain
                verdict = "UNCERTAIN"
                confidence = 0.5
        
        # Final confidence adjustment based on model coverage
        coverage_penalty = active_models / max(total_models, 1)
        confidence *= max(0.8, coverage_penalty)  # Max 20% penalty
        
        return {
            "verdict": verdict,
            "confidence": float(np.clip(confidence, 0, 1)),
            "scores": {
                "ai_generated": float(ai_score),
                "deepfake": float(deepfake_score),
                "manipulation": float(manipulation_score),
                "authenticity": float(1.0 - max(ai_score, deepfake_score, manipulation_score))
            }
        }
    
    def _uncertain_verdict(
        self, 
        reason: str, 
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Return an UNCERTAIN verdict"""
        result = {
            "verdict": "UNCERTAIN",
            "confidence": 0.5,
            "reason": reason,
            "scores": {
                "ai_generated": 0.5,
                "deepfake": 0.5,
                "manipulation": 0.5,
                "authenticity": 0.5
            }
        }
        
        if metadata:
            result.update(metadata)
        
        return result
    
    def _fallback_verdict(self) -> Dict[str, Any]:
        """Fallback when ensemble fails"""
        return {
            "verdict": "UNCERTAIN",
            "confidence": 0.5,
            "reason": "Ensemble processing failed",
            "scores": {
                "ai_generated": 0.5,
                "deepfake": 0.5,
                "manipulation": 0.5,
                "authenticity": 0.5
            },
            "error": True
        }

