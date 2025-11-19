<!-- 74dd8a6f-70df-4b6d-b9ec-6a03cdd0ff70 fe0badc4-c60c-446d-a14e-a32d61fef61b -->
# Research & Implement Specialized AI Detection Models

## Overview

Systematically research and verify specialized AI detection models from HuggingFace, implement them with proper error handling, and test accuracy.

---

## 🔍 Phase 1: Model Research & Verification

### 1.1 Research Candidate Models

**Search Strategy:**

1. HuggingFace search queries:

                                                - "AI generated image detection"
                                                - "deepfake detection"
                                                - "synthetic image detection"
                                                - "fake image classifier"
                                                - "AI art detector"

2. Check model cards for:

                                                - Training dataset
                                                - Model architecture
                                                - Accuracy metrics
                                                - Last update date
                                                - Number of downloads
                                                - License

3. Priority models to test:
   ```
   Tier 1 (High priority):
                           - umm-maybe/AI-image-detector
                           - Organika/sdxl-detector
                           - saltacc/anime-ai-detect
                           - dima806/deepfake_vs_real_image_detection
   
   Tier 2 (Alternative):
                           - Any CNN-based detection models
                           - ResNet/EfficientNet fine-tuned for AI detection
                           - CLIP fine-tuned models
   
   Tier 3 (Backup):
                           - General vision models with custom prompting
   ```


### 1.2 Verify Model Availability

For each candidate model:

```python
# Test script: verify_model.py
from transformers import pipeline, AutoModel
import requests

def verify_model_exists(model_name):
    """Check if model exists and is accessible"""
    try:
        # Check HuggingFace API
        api_url = f"https://huggingface.co/api/models/{model_name}"
        response = requests.get(api_url)
        
        if response.status_code == 200:
            info = response.json()
            print(f"✓ {model_name} exists")
            print(f"  Downloads: {info.get('downloads', 0)}")
            print(f"  Updated: {info.get('lastModified', 'unknown')}")
            return True
        else:
            print(f"✗ {model_name} not found (status: {response.status_code})")
            return False
    except Exception as e:
        print(f"✗ Error checking {model_name}: {e}")
        return False

def test_model_load(model_name):
    """Try to actually load the model"""
    try:
        print(f"Testing load: {model_name}")
        model = AutoModel.from_pretrained(model_name)
        print(f"✓ {model_name} loaded successfully")
        return True
    except Exception as e:
        print(f"✗ Cannot load {model_name}: {e}")
        return False
```

---

## 🧪 Phase 2: Model Testing & Evaluation

### 2.1 Create Test Dataset

Prepare test images:

```
test_images/
├── real/
│   ├── real_photo_1.jpg (camera photo with EXIF)
│   ├── real_photo_2.jpg (phone photo)
│   └── real_photo_3.jpg (professional photo)
├── ai_generated/
│   ├── midjourney_v6.png
│   ├── dalle3_output.png
│   ├── stable_diffusion_xl.png
│   └── old_gan_output.jpg
└── manipulated/
    ├── photoshop_edited.jpg
    ├── face_swap.jpg
    └── background_replaced.jpg
```

### 2.2 Test Script for Each Model

```python
# test_model_accuracy.py
import torch
from transformers import pipeline
from PIL import Image
import glob
from pathlib import Path

def test_model_accuracy(model_name, test_dir="test_images"):
    """Test a model's accuracy on test dataset"""
    
    results = {
        "model": model_name,
        "total_tests": 0,
        "correct": 0,
        "by_category": {}
    }
    
    try:
        # Load model
        classifier = pipeline("image-classification", model=model_name)
        
        # Test each category
        for category in ["real", "ai_generated", "manipulated"]:
            category_path = Path(test_dir) / category
            if not category_path.exists():
                continue
            
            images = list(category_path.glob("*.jpg")) + list(category_path.glob("*.png"))
            correct = 0
            
            for img_path in images:
                image = Image.open(img_path)
                predictions = classifier(image)
                
                # Check if prediction matches expected category
                top_pred = predictions[0]['label'].lower()
                is_correct = check_prediction(top_pred, category)
                
                if is_correct:
                    correct += 1
                
                results["total_tests"] += 1
            
            results["by_category"][category] = {
                "total": len(images),
                "correct": correct,
                "accuracy": correct / len(images) if images else 0
            }
            results["correct"] += correct
        
        results["overall_accuracy"] = results["correct"] / results["total_tests"]
        
    except Exception as e:
        results["error"] = str(e)
    
    return results

def check_prediction(prediction, expected_category):
    """Map prediction to expected category"""
    # Custom mapping based on model's label format
    real_keywords = ['real', 'natural', 'authentic', 'photograph']
    ai_keywords = ['ai', 'generated', 'synthetic', 'fake', 'artificial']
    manip_keywords = ['manipulated', 'edited', 'photoshop', 'altered']
    
    pred_lower = prediction.lower()
    
    if expected_category == "real":
        return any(kw in pred_lower for kw in real_keywords)
    elif expected_category == "ai_generated":
        return any(kw in pred_lower for kw in ai_keywords)
    elif expected_category == "manipulated":
        return any(kw in pred_lower for kw in manip_keywords)
    
    return False
```

### 2.3 Benchmark Results Format

```json
{
  "model_name": "example/ai-detector",
  "test_date": "2024-01-15",
  "overall_accuracy": 0.82,
  "by_category": {
    "real": {"accuracy": 0.85, "total": 10},
    "ai_generated": {"accuracy": 0.90, "total": 10},
    "manipulated": {"accuracy": 0.70, "total": 10}
  },
  "performance": {
    "avg_inference_time": "1.2s",
    "model_size": "500MB"
  },
  "verdict": "APPROVED" | "REJECTED"
}
```

---

## 🛠️ Phase 3: Implementation with Multi-Model Support

### 3.1 Create Flexible Model Loader

```python
# services/ai-detection/model_loader.py
from typing import List, Dict, Optional
from transformers import pipeline, AutoModel, AutoProcessor
import logging

logger = logging.getLogger(__name__)


class ModelRegistry:
    """Registry of verified AI detection models"""
    
    VERIFIED_MODELS = {
        # Will be populated after testing phase
        "primary": None,  # Best performing model
        "secondary": None,  # Backup model
        "fallback": None,  # Always-working model (CLIP)
    }
    
    MODEL_CONFIGS = {
        # Example config (will be updated with real models)
        "example/ai-detector": {
            "type": "image-classification",
            "labels": {
                "LABEL_0": "real",
                "LABEL_1": "ai_generated"
            },
            "threshold": 0.7
        }
    }
    
    @classmethod
    def load_best_available(cls) -> Dict:
        """Load the best available model"""
        models_to_try = [
            cls.VERIFIED_MODELS.get("primary"),
            cls.VERIFIED_MODELS.get("secondary"),
            cls.VERIFIED_MODELS.get("fallback"),
        ]
        
        for model_name in models_to_try:
            if model_name:
                try:
                    logger.info(f"Attempting to load: {model_name}")
                    model = pipeline("image-classification", model=model_name)
                    logger.info(f"✓ Successfully loaded: {model_name}")
                    return {
                        "model": model,
                        "name": model_name,
                        "config": cls.MODEL_CONFIGS.get(model_name, {})
                    }
                except Exception as e:
                    logger.warning(f"✗ Failed to load {model_name}: {e}")
                    continue
        
        logger.error("No models could be loaded")
        return None
```

### 3.2 Update Detection Logic

```python
# services/ai-detection/models.py - Updated version
class AIDetectionModels:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_info = None
        self.forensic_analyzer = ForensicAnalyzer()
        
    def load_models(self):
        """Load best available verified model"""
        if self.model_info is None:
            from model_loader import ModelRegistry
            self.model_info = ModelRegistry.load_best_available()
            
            if self.model_info:
                logger.info(f"Loaded model: {self.model_info['name']}")
            else:
                logger.warning("No HF models available, using forensics only")
    
    def detect(self, image: Image.Image, image_bytes: Optional[bytes] = None) -> dict:
        """Detect with loaded model + forensics"""
        self.load_models()
        
        # Forensics (always run)
        forensics = self.forensic_analyzer.analyze(image, image_bytes)
        
        # Model prediction (if available)
        if self.model_info and self.model_info["model"]:
            model_result = self._predict_with_model(image)
        else:
            model_result = self._fallback_detection(forensics)
        
        # Combine signals
        verdict, confidence = self._combine_signals(
            model_result,
            forensics
        )
        
        return {
            "verdict": verdict,
            "confidence": confidence,
            "modelScores": model_result,
            "forensicAnalysis": forensics,
            "model_used": self.model_info["name"] if self.model_info else "forensics_only"
        }
```

---

## 📊 Phase 4: Documentation & Results

### 4.1 Document Findings

Create: `MODEL_RESEARCH_RESULTS.md`

```markdown
# AI Detection Models Research Results

## Tested Models

### Model 1: [name]
- **Status**: ✓ Working / ✗ Failed
- **Accuracy**: 85%
- **Pros**: Fast, accurate on modern AI
- **Cons**: Large model size
- **Verdict**: APPROVED

### Model 2: [name]
...

## Recommended Setup

**Production**: Use [best model]
**Fallback**: Use [backup model]
**Final fallback**: Forensics + CLIP prompting

## Test Results Summary
[Insert benchmark data]
```

### 4.2 Update Configuration

Based on findings, update `config.py`:

```python
# Final config after research
MODELS = {
    "primary": "verified/model-name",  # Best performer
    "secondary": "backup/model-name",  # Backup
    "fallback": "openai/clip-vit-base-patch32",  # Always works
}

USE_ENSEMBLE = True  # Combine multiple models
MODEL_SELECTION = "auto"  # Auto-select best available
```

---

## 🎯 Success Criteria

After this phase:

- ✅ At least 1 verified specialized model found
- ✅ Accuracy > 75% on test dataset
- ✅ Graceful fallback if model unavailable
- ✅ Documentation of all tested models
- ✅ Clear recommendation for production use

---

## 📋 Implementation Checklist

**Phase 1: Research** (2-3 hours)

- [ ] Search HuggingFace for candidate models
- [ ] Check model cards and metadata
- [ ] Create list of 10+ candidates
- [ ] Verify each model exists and is accessible

**Phase 2: Testing** (2-3 hours)

- [ ] Prepare test image dataset (real/AI/manipulated)
- [ ] Create testing script
- [ ] Test each verified model
- [ ] Benchmark accuracy and performance
- [ ] Document results

**Phase 3: Implementation** (1-2 hours)

- [ ] Create ModelRegistry with verified models
- [ ] Implement flexible model loader
- [ ] Update detection logic
- [ ] Add proper error handling
- [ ] Test full integration

**Phase 4: Documentation** (1 hour)

- [ ] Document all findings
- [ ] Create usage guide
- [ ] Update README
- [ ] Provide recommendations

**Total Time Estimate: 6-9 hours**

---

## ⚠️ Risk Mitigation

**Risk 1: No specialized models found**

- Mitigation: Fall back to CLIP + forensics
- Document limitations clearly

**Risk 2: Models require authentication**

- Mitigation: Use HuggingFace token
- Document setup process

**Risk 3: Low accuracy**

- Mitigation: Use ensemble approach
- Consider external API as option

**Risk 4: Large model sizes**

- Mitigation: Implement lazy loading
- Cache models locally

---

## 🚀 Next Steps After Completion

If successful:

1. Integrate with backend orchestrator
2. Test end-to-end flow
3. Prepare demo with real examples
4. Document accuracy claims

If unsuccessful:

1. Pivot to external API (Hive AI)
2. Or focus on provenance tracking
3. Position forensics as "supporting evidence"

### To-dos

- [x] 
- [x] 
- [x] 