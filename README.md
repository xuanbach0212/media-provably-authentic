# Media Provably Authentic

End-to-end media verification system using decentralized storage, secure compute enclaves, and blockchain attestations.

## Architecture Overview

This system provides **provable authenticity** for media files through:

- **Decentralized Storage**: Walrus for encrypted media and reports
- **Secure Computation**: Nautilus TEE for verified processing
- **Key Management**: Seal KMS for encryption key handling
- **Blockchain Attestations**: Sui smart contracts for immutable proofs
- **AI Detection**: HuggingFace models for deepfake/AI-generated detection
- **Provenance Tracking**: Reverse image search and metadata analysis

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

Start all services at once:
```bash
npm run dev
```

Or start services individually:

```bash
# Frontend (Next.js) - http://localhost:3000
npm run dev:frontend

# Backend API - http://localhost:3001
npm run dev:backend

# Mock Services - http://localhost:3002
npm run dev:mock-services

# AI Detection Service - http://localhost:8001
npm run dev:ai

# Reverse Search Service - http://localhost:8002
npm run dev:reverse-search
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

## API Endpoints

### Backend API (port 3001)

- `POST /api/upload` - Upload and encrypt media
- `POST /api/verify` - Submit verification job
- `GET /api/job/:jobId` - Check job status
- `GET /api/attestation/:attestationId` - Get results
- `GET /api/report/:reportCID` - Fetch full report

### AI Detection (port 8001)

- `POST /detect` - Analyze media for AI generation
- `GET /health` - Service health check

### Reverse Search (port 8002)

- `POST /search` - Perform reverse image/video search
- `GET /health` - Service health check

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
