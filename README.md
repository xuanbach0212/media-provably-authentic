# Media Provably Authentic

End-to-end media analysis system using decentralized storage, secure compute enclaves, and blockchain attestations.

## Philosophy: Analysis, Not Judgment

This system **provides raw technical metrics and analysis data** rather than making binary judgments about authenticity. We believe users should interpret the data within their specific context.

**Key Principles:**
- 📊 **Transparent Metrics**: All model scores, forensic data, and analysis results are exposed
- 🧮 **No Black Boxes**: Every metric is explained and interpretable
- 👤 **User Interpretation**: You decide what the data means for your use case
- ⛓️ **Blockchain Verified**: All analysis is cryptographically signed and stored on-chain

See [ANALYSIS_GUIDE.md](./ANALYSIS_GUIDE.md) for detailed metric explanations.

## Architecture Overview

This system provides **cryptographically verified media analysis** through:

- **Decentralized Storage**: Walrus for encrypted media and reports
- **Secure Computation**: Nautilus TEE for verified processing
- **Key Management**: Seal KMS for encryption key handling
- **Blockchain Attestations**: Sui smart contracts for immutable proofs
- **AI Detection**: 7+ HuggingFace models with ensemble scoring
- **Forensic Analysis**: Compression artifacts, frequency domain, EXIF metadata
- **Provenance Tracking**: Conditional reverse image search

## Project Structure

```
media-provably-authentic/
├── frontend/              # Next.js + TypeScript UI
├── backend/              # Node.js + Express API Gateway
├── services/
│   ├── ai-detection/     # Python FastAPI - AI detection models
│   ├── reverse-search/   # Python FastAPI - Reverse image search
│   └── mock-services/    # TypeScript - Mock Walrus/Seal/Nautilus/Sui
├── contracts/            # Sui Move smart contracts
├── shared/               # Shared TypeScript types and utilities
└── docs/                 # Architecture and flow documentation
```

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- Python >= 3.10
- npm >= 9.0.0
- Redis (optional, for production job queue)

### Installation

1. Install Node.js dependencies:
```bash
npm run install:all
```

2. Install Python dependencies:
```bash
npm run install:python
# or manually:
cd services/ai-detection && pip install -r requirements.txt
cd ../reverse-search && pip install -r requirements.txt
```

### Running Development Servers

**Quick Start:**
```bash
./start-all-services.sh
```

This starts:
- Frontend (Next.js) - http://localhost:3000
- Backend API - http://localhost:3001
- AI Detection Service - http://localhost:8000
- Reverse Search Service - http://localhost:8001

**Stop All Services:**
```bash
./stop-all-services.sh
```

**Individual Services:**
```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm run dev

# AI Detection
cd services/ai-detection && ./start.sh

# Reverse Search
cd services/reverse-search && source venv/bin/activate && python main.py
```

## Current Phase: MVP with Mock Services

This implementation uses **mock services** for rapid development:

- ✅ Mock Walrus (local file storage)
- ✅ Mock Seal KMS (local encryption)
- ✅ Mock Nautilus TEE (simulated enclave)
- ✅ Mock Sui blockchain (in-memory attestations)

## Future: Testnet Integration

See `docs/` for detailed flows. Phase 7 covers:
- Real Walrus testnet integration
- Seal KMS with attested keys
- Nautilus SGX/TEE deployment
- Sui smart contract deployment

## Analysis Workflow

### 1. AI Detection (Always Runs)
- 7+ specialized models analyze the image
- Ensemble scoring combines results
- Forensic analysis checks compression, EXIF, frequency patterns
- Returns **raw metrics** (no verdict)

### 2. Conditional Reverse Search
Runs only when:
- **Ensemble score < 0.5** (likely real → verify online presence)
- **Ensemble score > 0.8** (likely AI → check for stolen real images)

This saves resources and focuses search on actionable cases.

### 3. Blockchain Attestation
All analysis data is:
- Cryptographically signed by TEE enclave
- Stored on Sui blockchain
- Linked to Walrus-stored full report
- Timestamped and immutable

## API Endpoints

### Backend API (port 3001)

- `POST /api/upload` - Upload and encrypt media
- `POST /api/verify` - Submit verification job
- `GET /api/job/:jobId` - Check job status
- `GET /api/attestation/:attestationId` - Get results
- `GET /api/report/:reportCID` - Fetch full report

**Response Format (Updated):**
```json
{
  "jobId": "...",
  "analysisData": {
    "aiDetection": {
      "ensembleScore": 0.73,
      "modelScores": { "individual_models": {...} },
      "forensicAnalysis": {...},
      "frequencyAnalysis": {...},
      "qualityMetrics": {...}
    },
    "reverseSearch": { "matches": [...] } | null
  },
  "blockchainAttestation": {...}
}
```

### AI Detection (port 8000)

- `POST /detect` - File upload detection
- `POST /detect/base64` - Base64 encoded detection
- `GET /health` - Service health check
- `GET /models/status` - Check loaded models

**Response Format:**
```json
{
  "modelScores": {...},
  "ensembleScore": 0.73,
  "forensicAnalysis": {...},
  "frequencyAnalysis": {...},
  "qualityMetrics": {...},
  "metadata": {...}
}
```

### Reverse Search (port 8001)

- `POST /search` - Reverse image search
- `GET /health` - Service health check

**Configuration:**
- Requires `SERPAPI_KEY` environment variable
- Uses Google Lens API for searches
- Falls back gracefully if disabled

### Mock Services (port 3002)

- `POST /walrus/store` - Store blob
- `GET /walrus/retrieve/:blobId` - Retrieve blob
- `POST /seal/encrypt` - Encrypt with CEK
- `POST /seal/decrypt` - Decrypt with policy
- `POST /nautilus/process` - Process in mock enclave
- `POST /sui/attest` - Create attestation
- `GET /sui/attestation/:id` - Get attestation

## Documentation

See `docs/` folder for detailed architecture:

- `PROVABLY_AUTHENTIC_FLOW_SUMMARY.md` - Complete flow overview
- `PROOF_OF_AUTHENTICITY_PIPELINE.md` - Pipeline diagram
- `PROOF_OF_AUTHENTICITY_PIPELINE_SEQUENCE.md` - Sequence diagram
- `MEDIA_PROVENANCE_VERIFICATION_FLOW.md` - Provenance tracking
- `INTEGRITY_AND_AI_GENERATED_DETECTION_FLOW.md` - AI detection
- `TRUST_ORACLE_TO_ONCHAIN_ATTESTATION_FLOW.md` - Oracle attestation

## License

MIT
