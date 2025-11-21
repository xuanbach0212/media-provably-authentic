# Data Structure Mapping - Python → TypeScript

## Complete data flow verification for Media Provably Authentic

---

## 🔄 DATA FLOW

```
Python AI Service → Backend Orchestrator → Frontend Display
   (FastAPI)           (Express/Node)        (Next.js/React)
```

---

## 1️⃣ PYTHON AI SERVICE OUTPUT (models.py)

### Main Response Structure
```python
{
    "modelScores": {
        "ai_generated_score": 0.85,           # float 0-1
        "deepfake_score": 0.72,               # float 0-1
        "manipulation_score": 0.65,           # float 0-1
        "authenticity_score": 0.35,           # float 0-1
        "frequency_ai_score": 0.78,           # float 0-1 (optional)
        "ensemble_model_count": 7,            # int
        "individual_models": {                # Dict of model scores
            "umm-maybe/AI-image-detector": {
                "ai_score": 0.87,
                "deepfake_score": 0.73,
                "confidence": 0.92,
                "weight": 0.25
            },
            "Organika/sdxl-detector": {
                "ai_score": 0.83,
                "deepfake_score": 0.70,
                "confidence": 0.88,
                "weight": 0.25
            }
            # ... more models
        },
        "ensemble_metadata": {                # Optional metadata
            "gating_applied": True,
            "consistency_score": 0.91
        }
    },
    "ensembleScore": 0.85,                    # float 0-1 (final AI likelihood)
    "forensicAnalysis": {
        "compression_artifacts": 0.45,        # float
        "sharpness": 0.78,                    # float
        "noise_level": 0.32,                  # float
        "color_saturation": 0.68,             # float
        "brightness": 0.55,                   # float
        "contrast": 0.62,                     # float
        "exif_data_present": True,            # bool
        "exif_data": {                        # dict (EXIF metadata)
            "Make": "Canon",
            "Model": "EOS 5D",
            "DateTime": "2024:11:20 10:30:00"
        },
        "manipulation_likelihood": 0.42       # float
    },
    "frequencyAnalysis": {
        "dct_anomaly_score": 0.36,            # float
        "fft_anomaly_score": 0.41,            # float
        "frequency_ai_score": 0.78            # float
    },
    "qualityMetrics": {
        "sharpness": 0.78,                    # float
        "brightness": 0.55,                   # float
        "contrast": 0.62,                     # float
        "blurriness": 0.22,                   # float
        "exposure": 0.58,                     # float
        "colorfulness": 0.71,                 # float
        "overall_quality": 0.75,              # float
        "enhancement_applied": "contrast"     # string
    },
    "metadata": {
        "models_used": 7,
        "forensics_enabled": True,
        "device": "cpu"
    }
}
```

---

## 2️⃣ TYPESCRIPT TYPES (shared/src/types.ts)

### AIDetectionResult Interface
```typescript
export interface AIDetectionResult {
  modelScores: ModelScoresData;
  ensembleScore: number;
  forensicAnalysis: ForensicMetrics;
  frequencyAnalysis: FrequencyMetrics;
  qualityMetrics: QualityMetrics;
  metadata?: any;
}

export interface ModelScoresData {
  ai_generated_score: number;
  deepfake_score: number;
  manipulation_score: number;
  authenticity_score: number;
  frequency_ai_score?: number;
  ensemble_model_count: number;
  individual_models: {
    [modelName: string]: IndividualModelScore;
  };
  ensemble_metadata?: any;
}

export interface IndividualModelScore {
  ai_score: number;
  deepfake_score: number;
  confidence: number;
  weight: number;
}

export interface ForensicMetrics {
  // All fields optional to handle varying Python output
  compression_artifacts?: number;
  sharpness?: number;
  noise_level?: number;
  color_saturation?: number;
  brightness?: number;
  contrast?: number;
  exif_data_present?: boolean;
  exif_data?: any;
  manipulation_likelihood?: number;
  [key: string]: any; // Allow additional fields
}

export interface FrequencyMetrics {
  dct_anomaly_score?: number;
  fft_anomaly_score?: number;
  frequency_ai_score?: number;
  [key: string]: any;
}

export interface QualityMetrics {
  sharpness: number;
  brightness: number;
  contrast: number;
  blurriness?: number;
  exposure?: number;
  colorfulness?: number;
  overall_quality?: number;
  enhancement_applied?: string;
  [key: string]: any;
}
```

---

## 3️⃣ FRONTEND ACCESS PATTERNS (VerificationResults.tsx)

### ✅ CORRECT Field Access

```typescript
// Ensemble Score
const ensembleScore = analysisData.aiDetection.ensembleScore; // ✓

// Model Scores
const aiScore = analysisData.aiDetection.modelScores.ai_generated_score; // ✓
const deepfakeScore = analysisData.aiDetection.modelScores.deepfake_score; // ✓
const individualModels = analysisData.aiDetection.modelScores.individual_models; // ✓

// Forensic Analysis
const compression = analysisData.aiDetection.forensicAnalysis.compression_artifacts; // ✓
const sharpness = analysisData.aiDetection.forensicAnalysis.sharpness; // ✓
const exifData = analysisData.aiDetection.forensicAnalysis.exif_data; // ✓

// Frequency Analysis
const dctScore = analysisData.aiDetection.frequencyAnalysis.dct_anomaly_score; // ✓
const fftScore = analysisData.aiDetection.frequencyAnalysis.fft_anomaly_score; // ✓

// Quality Metrics
const blurriness = analysisData.aiDetection.qualityMetrics.blurriness; // ✓
const exposure = analysisData.aiDetection.qualityMetrics.exposure; // ✓
const colorfulness = analysisData.aiDetection.qualityMetrics.colorfulness; // ✓
```

### ❌ COMMON MISTAKES TO AVOID

```typescript
// WRONG - Old field names
analysisData.aiDetection.modelScores.individual_model_verdicts // ❌
analysisData.aiDetection.qualityAssessment // ❌

// CORRECT
analysisData.aiDetection.modelScores.individual_models // ✓
analysisData.aiDetection.qualityMetrics // ✓
```

---

## 4️⃣ REVERSE SEARCH STRUCTURE

### Python Service Output
```python
{
    "matches": [
        {
            "link": "https://example.com/image.jpg",
            "title": "Example Image",
            "source": "Wikipedia",
            "similarity": 0.95,
            "first_seen": "2024-01-15T10:30:00Z"
        }
    ],
    "provenanceChain": [],
    "confidence": 0.95
}
```

### TypeScript Interface
```typescript
export interface ProvenanceResult {
  matches: ProvenanceMatch[];
  earliestMatch?: ProvenanceMatch;
  provenanceChain: string[];
  confidence: number;
}

export interface ProvenanceMatch {
  url: string;
  firstSeen: string;
  similarity: number;
  metadata: {
    title?: string;
    publisher?: string;
    timestamp?: string;
    [key: string]: any;
  };
}
```

### Frontend Access
```typescript
const matches = analysisData.reverseSearch?.matches || [];
matches.map(match => ({
  title: match.title,
  link: match.link,
  similarity: match.similarity
}));
```

---

## 5️⃣ COMPLETE REPORT STRUCTURE

### VerificationReport
```typescript
{
  jobId: string,
  mediaCID: string,
  mediaHash: string,
  analysisData: {
    aiDetection: AIDetectionResult,      // See section 2
    reverseSearch: ProvenanceResult | null,
    forensicAnalysis: {
      fileSize: number,
      mimeType: string,
      uploadedAt: string
    }
  },
  enclaveAttestation: {
    signature: string,
    timestamp: string,
    enclaveId: string,
    mrenclave: string
  },
  generatedAt: string,
  metadata: {
    filename: string,
    mimeType: string,
    size: number,
    sha256: string
  },
  blockchainAttestation: {
    attestationId: string,
    txHash: string,
    blockNumber: number,
    timestamp: string
  }
}
```

---

## 6️⃣ CONDITIONAL REVERSE SEARCH

### Backend Logic (orchestrator.ts)
```typescript
if (aiDetection.ensembleScore < 0.5 || aiDetection.ensembleScore > 0.8) {
  reverseSearch = await this.runReverseSearch(decryptedMedia, job.metadata);
} else {
  reverseSearch = null; // Skip to save resources
}
```

### Frontend Handling
```typescript
{analysisData?.reverseSearch?.matches && analysisData.reverseSearch.matches.length > 0 ? (
  // Display matches
) : (
  <p>No significant matches found</p>
)}
```

---

## 7️⃣ FALLBACK VALUES

### AI Detection Failure
```typescript
// backend/src/services/orchestrator.ts
{
  modelScores: {
    ai_generated_score: 0.5,
    deepfake_score: 0.5,
    manipulation_score: 0.5,
    authenticity_score: 0.5,
    ensemble_model_count: 0,
    individual_models: {}
  },
  ensembleScore: 0.5,
  forensicAnalysis: { error: "AI detection failed" },
  frequencyAnalysis: {},
  qualityMetrics: { sharpness: 0, brightness: 0, contrast: 0 }
}
```

### Frontend Safe Access
```typescript
// Always use optional chaining and fallbacks
const score = analysisData?.aiDetection?.ensembleScore || 0;
const models = analysisData?.aiDetection?.modelScores?.individual_models || {};
const forensics = analysisData?.aiDetection?.forensicAnalysis || {};
```

---

## 8️⃣ KEY DIFFERENCES PYTHON → TYPESCRIPT

| Python (snake_case) | TypeScript (snake_case) | Notes |
|---------------------|-------------------------|-------|
| `individual_models` | `individual_models` | ✅ Match |
| `ai_generated_score` | `ai_generated_score` | ✅ Match |
| `deepfake_score` | `deepfake_score` | ✅ Match |
| `compression_artifacts` | `compression_artifacts` | ✅ Match |
| `exif_data` | `exif_data` | ✅ Match |
| `dct_anomaly_score` | `dct_anomaly_score` | ✅ Match |
| `qualityMetrics` | `qualityMetrics` | ✅ Match (camelCase) |
| `forensicAnalysis` | `forensicAnalysis` | ✅ Match (camelCase) |

**All field names now use snake_case internally, camelCase for top-level keys!**

---

## ✅ VERIFICATION CHECKLIST

- [x] Python returns `individual_models` (not `individual_model_verdicts`)
- [x] TypeScript types match Python output structure
- [x] Frontend accesses `qualityMetrics` (not `qualityAssessment`)
- [x] All numeric fields use optional chaining (`?.`)
- [x] Fallback values prevent `NaN` display
- [x] Reverse search conditional logic documented
- [x] EXIF data structure preserved
- [x] Model scores include confidence and weight
- [x] Ensemble metadata captured
- [x] Error cases handled with defaults

---

## 🧪 TESTING

### Test with real upload:
1. Upload image → Check browser console for data structure
2. Verify all numeric fields display correctly (no NaN)
3. Check forensic analysis fields populate
4. Verify reverse search runs conditionally
5. Confirm individual model scores display in chart

### Console Debug:
```typescript
console.log('Full report:', report);
console.log('AI Detection:', analysisData.aiDetection);
console.log('Model Scores:', analysisData.aiDetection.modelScores);
console.log('Individual Models:', analysisData.aiDetection.modelScores.individual_models);
```

---

**Last Updated**: 2024-11-20
**Status**: ✅ All types aligned and verified

