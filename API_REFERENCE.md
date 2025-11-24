# API Reference

Complete API documentation for Media Provably Authentic.

---

## 🌐 Base URLs

- **Production**: `https://api.yourdomain.com`
- **Development**: `http://localhost:3001`
- **AI Detection**: `http://localhost:8000`
- **Reverse Search**: `http://localhost:8001`

---

## 🔐 Authentication

### Wallet Signature

All upload requests require Sui wallet signature authentication:

```typescript
// Frontend example
const message = `Upload media for verification: ${filename} (${timestamp})`;
const signature = await wallet.signMessage(message);

// Include in request
headers: {
  'X-Wallet-Address': walletAddress,
  'X-Wallet-Signature': signature
}
```

### Socket.IO Authentication

```typescript
const socket = io('http://localhost:3001', {
  auth: {
    walletAddress: '0x...',
    signature: '...'
  }
});
```

---

## 📡 Backend API (Port 3001)

### Upload Media

Upload media for verification and analysis.

**Endpoint**: `POST /api/upload`

**Headers**:
```
Content-Type: multipart/form-data
X-Wallet-Address: 0x...
X-Wallet-Signature: ...
```

**Body** (multipart/form-data):
```
file: File (image/jpeg, image/png, image/webp)
walletAddress: string
signature: string
```

**Response** (200 OK):
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "mediaCID": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
  "encryptedCID": "bafybeih4zsgjw2yvl6m7gvz3zqzqzqzqzqzqzqzqzqzqzqzqzqzqzqzqzq",
  "progress": {
    "stage": 1,
    "substep": "hashing",
    "progress": 5
  }
}
```

**Error Responses**:
```json
// 400 Bad Request
{
  "error": "No file uploaded"
}

// 401 Unauthorized
{
  "error": "Invalid wallet signature"
}

// 413 Payload Too Large
{
  "error": "File size exceeds 10MB limit"
}

// 500 Internal Server Error
{
  "error": "Upload failed: <reason>"
}
```

---

### Get Job Status

Retrieve the current status and results of a verification job.

**Endpoint**: `GET /api/job/:jobId`

**Parameters**:
- `jobId` (path): Job UUID

**Response** (200 OK):
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "progress": {
    "stage": 5,
    "substep": "completed",
    "progress": 100
  },
  "report": {
    "mediaHash": "d5282b7cde85268df30f67fc2a957b10c5686c696cd62e98609da6ea754898d3",
    "mediaCID": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    "reportCID": "bafybeih4zsgjw2yvl6m7gvz3zqzqzqzqzqzqzqzqzqzqzqzqzqzqzqzqzq",
    "analysisData": {
      "aiDetection": {
        "ensembleScore": 0.85,
        "modelScores": {
          "ai_generated_score": 0.85,
          "ensemble_model_count": 7,
          "individual_models": {
            "umm-maybe/AI-image-detector": 0.92,
            "Organika/sdxl-detector": 0.88,
            "dima806/deepfake_vs_real_image_detection": 0.81,
            "Dafilab/AI-image-detector": 0.79,
            "Smogy/AI-image-detector": 0.86,
            "Hemg/AI-image-detector": 0.84,
            "Hemg/sdxl-detector": 0.85
          }
        },
        "forensicAnalysis": {
          "exifData": {},
          "compressionArtifacts": 0.47,
          "noisePattern": {
            "mean": 36.47,
            "std": 12.34
          },
          "colorDistribution": {
            "r_mean": 128.5,
            "g_mean": 130.2,
            "b_mean": 125.8
          },
          "brightness": 0.52,
          "contrast": 0.68,
          "color_saturation": 0.45,
          "sharpness": 0.72
        },
        "frequencyAnalysis": {
          "dct_ai_score": 0.78,
          "fft_ai_score": 0.82,
          "frequency_ai_score": 0.80
        },
        "qualityMetrics": {
          "sharpness": {
            "score": 0.72,
            "interpretation": "Good"
          },
          "contrast": {
            "score": 0.68,
            "interpretation": "Moderate"
          },
          "brightness": {
            "score": 0.52,
            "interpretation": "Normal"
          },
          "noise": {
            "score": 0.15,
            "interpretation": "Low"
          },
          "resolution": 1920,
          "overall_quality": 0.66
        }
      },
      "reverseSearch": {
        "matches": [
          {
            "url": "https://en.wikipedia.org/wiki/Starry_Night",
            "title": "The Starry Night - Wikipedia",
            "similarity": 0.98,
            "thumbnail": "https://...",
            "firstSeen": "2020-01-15"
          }
        ],
        "confidence": 0.95,
        "searchEngine": "google_lens"
      },
      "forensicAnalysis": {
        "filename": "test-image.jpg",
        "width": 1920,
        "height": 1080,
        "format": "JPEG",
        "size": 245678
      }
    },
    "enclaveAttestation": {
      "signature": "3045022100...",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "enclaveId": "enclave_1",
      "mrenclave": "abc123...",
      "attestationDocument": "hEShATgioFkQ...",
      "publicKey": "04a1b2c3...",
      "pcrs": {
        "PCR0": "000000000000000000000000000000000000000000000000000000000000000000",
        "PCR1": "000000000000000000000000000000000000000000000000000000000000000000",
        "PCR2": "000000000000000000000000000000000000000000000000000000000000000000",
        "PCR3": "0b76f97be7ed01786c315a6b8c3957389ee796042dc0fdc3065d1f03800f5918dba77bc50f3ccb282c70af3863a182e4504"
      }
    },
    "blockchainAttestation": {
      "txHash": "0x1234567890abcdef...",
      "blockNumber": 12345678,
      "timestamp": "2024-01-15T10:30:05.000Z",
      "reportCID": "bafybeih4zsgjw2yvl6m7gvz3zqzqzqzqzqzqzqzqzqzqzqzqzqzqzqzqzq",
      "enclaveId": "enclave_1"
    }
  }
}
```

**Status Values**:
- `PENDING`: Job queued
- `PROCESSING`: Currently processing
- `COMPLETED`: Successfully completed
- `FAILED`: Processing failed

**Error Responses**:
```json
// 404 Not Found
{
  "error": "Job not found"
}
```

---

### Verify Attestation

Verify the cryptographic attestation of a report.

**Endpoint**: `POST /api/verify-attestation`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "signature": "3045022100...",
  "reportData": {
    "mediaHash": "d5282b7cde85268df30f67fc2a957b10c5686c696cd62e98609da6ea754898d3",
    "analysisData": { ... }
  },
  "publicKey": "04a1b2c3...",
  "attestationDocument": "hEShATgioFkQ..."
}
```

**Response** (200 OK):
```json
{
  "valid": true,
  "enclaveInfo": {
    "enclaveId": "enclave_1",
    "mrenclave": "abc123...",
    "pcrs": {
      "PCR0": "...",
      "PCR1": "...",
      "PCR2": "...",
      "PCR3": "..."
    }
  },
  "verifiedAt": "2024-01-15T10:30:10.000Z"
}
```

**Error Responses**:
```json
// 400 Bad Request
{
  "error": "Missing required fields for attestation verification"
}

// 400 Bad Request (invalid signature)
{
  "message": "Attestation verification failed",
  "isValid": false
}
```

---

## 🤖 AI Detection API (Port 8000)

### Detect AI-Generated Content

Analyze an image using 7 AI models and forensic analysis.

**Endpoint**: `POST /detect`

**Headers**:
```
Content-Type: multipart/form-data
```

**Body** (multipart/form-data):
```
file: File (image/jpeg, image/png, image/webp)
```

**Response** (200 OK):
```json
{
  "modelScores": {
    "ai_generated_score": 0.85,
    "ensemble_model_count": 7,
    "individual_models": {
      "umm-maybe/AI-image-detector": 0.92,
      "Organika/sdxl-detector": 0.88,
      "dima806/deepfake_vs_real_image_detection": 0.81,
      "Dafilab/AI-image-detector": 0.79,
      "Smogy/AI-image-detector": 0.86,
      "Hemg/AI-image-detector": 0.84,
      "Hemg/sdxl-detector": 0.85
    }
  },
  "ensembleScore": 0.85,
  "forensicAnalysis": {
    "exifData": {},
    "compressionArtifacts": 0.47,
    "noisePattern": {
      "mean": 36.47,
      "std": 12.34
    },
    "colorDistribution": {
      "r_mean": 128.5,
      "g_mean": 130.2,
      "b_mean": 125.8
    },
    "brightness": 0.52,
    "contrast": 0.68,
    "color_saturation": 0.45,
    "sharpness": 0.72
  },
  "frequencyAnalysis": {
    "dct_ai_score": 0.78,
    "fft_ai_score": 0.82,
    "frequency_ai_score": 0.80
  },
  "qualityMetrics": {
    "sharpness": {
      "score": 0.72,
      "interpretation": "Good"
    },
    "contrast": {
      "score": 0.68,
      "interpretation": "Moderate"
    },
    "brightness": {
      "score": 0.52,
      "interpretation": "Normal"
    },
    "noise": {
      "score": 0.15,
      "interpretation": "Low"
    },
    "resolution": 1920,
    "overall_quality": 0.66
  }
}
```

**Error Responses**:
```json
// 400 Bad Request
{
  "detail": "No file uploaded"
}

// 500 Internal Server Error
{
  "detail": "AI detection failed: <reason>"
}
```

---

### Health Check

**Endpoint**: `GET /health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "models_loaded": 7,
  "service": "ai-detection"
}
```

---

## 🔍 Reverse Search API (Port 8001)

### Search for Image

Search for an image across the web using Google Lens.

**Endpoint**: `POST /search`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Response** (200 OK):
```json
{
  "matches": [
    {
      "url": "https://en.wikipedia.org/wiki/Starry_Night",
      "title": "The Starry Night - Wikipedia",
      "similarity": 0.98,
      "thumbnail": "https://upload.wikimedia.org/...",
      "firstSeen": "2020-01-15",
      "source": "wikipedia"
    },
    {
      "url": "https://www.moma.org/collection/works/79802",
      "title": "The Starry Night | MoMA",
      "similarity": 0.95,
      "thumbnail": "https://www.moma.org/...",
      "firstSeen": "2019-06-10",
      "source": "museum"
    }
  ],
  "confidence": 0.95,
  "searchEngine": "google_lens",
  "google_enabled": true,
  "total_matches": 2
}
```

**Response** (200 OK - No matches):
```json
{
  "matches": [],
  "confidence": 0.0,
  "searchEngine": "google_lens",
  "google_enabled": true,
  "total_matches": 0
}
```

**Error Responses**:
```json
// 400 Bad Request
{
  "detail": "Missing image_base64 in request"
}

// 500 Internal Server Error
{
  "detail": "Reverse search failed: <reason>"
}
```

---

### Health Check

**Endpoint**: `GET /health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "google_enabled": true,
  "service": "reverse-search"
}
```

---

## 🔌 WebSocket Events (Socket.IO)

### Connection

```typescript
const socket = io('http://localhost:3001', {
  auth: {
    walletAddress: '0x...',
    signature: '...'
  }
});
```

### Subscribe to Job

```typescript
socket.emit('subscribe', { jobId: '550e8400-e29b-41d4-a716-446655440000' });
```

### Events

#### `progress`

Emitted during job processing to update progress.

**Payload**:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "stage": 3,
  "substep": "oracle_1_processing",
  "progress": 45,
  "message": "Processing in Enclave 1..."
}
```

**Stages**:
1. Upload & Encryption (0-10%)
2. Storage (10-20%)
3. Enclave Processing (20-70%)
4. Consensus (70-85%)
5. Blockchain (85-100%)

#### `complete`

Emitted when job completes successfully.

**Payload**:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "report": { ... }
}
```

#### `error`

Emitted when job fails.

**Payload**:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "error": "AI detection service unavailable"
}
```

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/upload` | 10 requests | 15 minutes |
| `GET /api/job/:jobId` | 60 requests | 1 minute |
| `POST /api/verify-attestation` | 30 requests | 1 minute |
| `POST /detect` | 20 requests | 1 minute |
| `POST /search` | 100 requests | 1 day (SerpAPI limit) |

---

## 🔧 Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid wallet signature |
| 404 | Not Found - Resource doesn't exist |
| 413 | Payload Too Large - File exceeds size limit |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |
| 503 | Service Unavailable - Service temporarily down |

---

## 📝 Examples

### cURL

```bash
# Upload media
curl -X POST http://localhost:3001/api/upload \
  -F "file=@test-image.jpg" \
  -F "walletAddress=0x..." \
  -F "signature=..." \
  -H "X-Wallet-Address: 0x..." \
  -H "X-Wallet-Signature: ..."

# Get job status
curl http://localhost:3001/api/job/550e8400-e29b-41d4-a716-446655440000

# AI detection
curl -X POST http://localhost:8000/detect \
  -F "file=@test-image.jpg"

# Reverse search
curl -X POST http://localhost:8001/search \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "iVBORw0KGgo..."}'
```

### JavaScript

```javascript
// Upload media
const formData = new FormData();
formData.append('file', file);
formData.append('walletAddress', walletAddress);
formData.append('signature', signature);

const response = await fetch('http://localhost:3001/api/upload', {
  method: 'POST',
  headers: {
    'X-Wallet-Address': walletAddress,
    'X-Wallet-Signature': signature
  },
  body: formData
});

const { jobId } = await response.json();

// Subscribe to progress
const socket = io('http://localhost:3001', {
  auth: { walletAddress, signature }
});

socket.emit('subscribe', { jobId });

socket.on('progress', (data) => {
  console.log(`Progress: ${data.progress}%`);
});

socket.on('complete', (data) => {
  console.log('Analysis complete:', data.report);
});
```

### Python

```python
import requests

# AI detection
with open('test-image.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/detect',
        files={'file': f}
    )

result = response.json()
print(f"Ensemble Score: {result['ensembleScore']}")

# Reverse search
import base64

with open('test-image.jpg', 'rb') as f:
    image_base64 = base64.b64encode(f.read()).decode()

response = requests.post(
    'http://localhost:8001/search',
    json={'image_base64': image_base64}
)

matches = response.json()['matches']
print(f"Found {len(matches)} matches")
```

---

## 📚 Additional Resources

- **[README.md](README.md)** - Main documentation
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Quick start guide
- **[ANALYSIS_GUIDE.md](ANALYSIS_GUIDE.md)** - Interpret metrics
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment

---

**Complete API reference! 🚀**

