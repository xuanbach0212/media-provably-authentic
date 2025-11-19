<!-- 74dd8a6f-70df-4b6d-b9ec-6a03cdd0ff70 fe0badc4-c60c-446d-a14e-a32d61fef61b -->
# Media Provably Authentic - Setup & Implementation Plan

## Tech Stack Summary

- **Frontend**: Next.js + TypeScript + Sui TypeScript SDK
- **Backend API**: Node.js + Express
- **AI Detection**: Python + Hugging Face models
- **Reverse Search**: Python services
- **Storage**: Mock Walrus → Testnet later
- **Encryption**: Mock Seal KMS → Testnet later
- **TEE**: Mock Nautilus → SGX/Real TEE later
- **Blockchain**: Sui (local/mock → Testnet later)

---

## 🎯 Phase 1: Project Structure & Foundation (Mock Services)

### 1.1 Initialize Monorepo Structure

```
media-provably-authentic/
├── frontend/              # Next.js + TypeScript
├── backend/              # Node.js + Express API
├── services/
│   ├── ai-detection/     # Python + HuggingFace
│   ├── reverse-search/   # Python reverse image search
│   └── mock-services/    # Mock Walrus, Seal, Nautilus
├── contracts/            # Sui Move smart contracts
├── shared/               # Shared types/utils
└── docs/                 # Existing documentation
```

### 1.2 Setup Mock Services

Create mock implementations for:

- **Mock Walrus**: Simple file storage API (returns blobID)
- **Mock Seal KMS**: Basic encryption/decryption with local keys
- **Mock Nautilus TEE**: Simulates enclave processing & signatures
- **Mock Sui Contract**: In-memory attestation storage

### 1.3 Dependency Management

- `frontend/package.json`: Next.js, Sui TS SDK, React libraries
- `backend/package.json`: Express, crypto, axios, job queue (Bull/BullMQ)
- `services/ai-detection/requirements.txt`: transformers, torch, PIL
- `services/reverse-search/requirements.txt`: requests, beautifulsoup4, selenium

---

## 🎯 Phase 2: Backend Core (Node.js + Express)

### 2.1 Gateway API Endpoints

- `POST /api/upload` - Accept media upload, compute hash, encrypt
- `POST /api/verify` - Submit verification job to queue
- `GET /api/job/:jobId` - Check job status
- `GET /api/attestation/:attestationId` - Get verification results
- `GET /api/report/:reportCID` - Fetch full report from storage

### 2.2 Job Queue System

- Setup Bull/BullMQ with Redis (or in-memory for local dev)
- Job processor for orchestrating verification pipeline
- Job states: PENDING → PROCESSING → COMPLETED → FAILED

### 2.3 Encryption Layer (Mock Seal)

- Generate random CEK for each upload
- Encrypt media with AES-256-GCM
- Mock policy-based key wrapping
- Store encrypted blobs in mock Walrus

### 2.4 Integration Orchestrator

- Coordinate calls to Python services (AI detection, reverse search)
- Aggregate results from multiple services
- Generate signed reports

---

## 🎯 Phase 3: Python Services

### 3.1 AI Detection Service (FastAPI)

**Endpoints**:

- `POST /detect` - Analyze media for AI-generated content

**Models from Hugging Face**:

- Image: `Organika/sdxl-detector` or `umm-maybe/AI-image-detector`
- Deepfake detection: `dima806/deepfake_vs_real_image_detection`
- CLIP-based analysis for manipulation detection

**Output**:

```json
{
  "verdict": "REAL" | "AI_GENERATED" | "MANIPULATED",
  "confidence": 0.95,
  "model_scores": {...},
  "forensic_analysis": {...}
}
```

### 3.2 Reverse Search Service (FastAPI)

**Endpoints**:

- `POST /search` - Reverse image/video search

**Integrations**:

- Google Reverse Image Search (via SerpAPI or scraping)
- TinEye API
- Bing Visual Search
- Custom perceptual hash matching

**Output**:

```json
{
  "matches": [{
    "url": "https://...",
    "first_seen": "2024-01-01",
    "similarity": 0.98,
    "metadata": {...}
  }],
  "provenance_chain": [...]
}
```

### 3.3 Metadata Crawler

- Extract EXIF data from images
- Parse video metadata
- Crawl discovered URLs for timestamps, publisher info
- Build provenance timeline

---

## 🎯 Phase 4: Mock Enclave Processing

### 4.1 Mock Nautilus TEE Service

Simulate enclave behavior:

- Accept jobs from backend queue
- Request CEK from mock Seal
- Decrypt media in "isolated" context
- Call AI detection + reverse search services
- Generate signed report with mock attestation
- Upload report to mock Walrus
- Submit minimal attestation to mock Sui

### 4.2 Report Generation

```json
{
  "jobId": "...",
  "mediaCID": "...",
  "mediaHash": "...",
  "verdict": "AUTHENTIC" | "MANIPULATED" | "AI_GENERATED",
  "confidence": 0.95,
  "provenance": [...],
  "ai_detection": {...},
  "forensic_analysis": {...},
  "enclave_attestation": {
    "signature": "mock_sig_...",
    "timestamp": "...",
    "enclave_id": "mock_enclave_1"
  }
}
```

---

## 🎯 Phase 5: Frontend (Next.js + TypeScript)

### 5.1 Core Pages

- `/` - Landing page
- `/upload` - Media upload interface
- `/verify/:jobId` - Verification status & results
- `/attestation/:attestationId` - Public attestation viewer
- `/dashboard` - User dashboard with history

### 5.2 Key Features

- Drag-and-drop file upload
- Real-time job status updates (polling or WebSocket)
- Provenance timeline visualization
- AI detection confidence meters
- Export legal evidence bundle (PDF)
- Challenge/dispute interface (Phase 6)

### 5.3 Sui Wallet Integration

- Integrate Sui Wallet adapter
- Sign upload requests with user wallet
- Display on-chain attestations
- (Phase 6: actual testnet transactions)

### 5.4 UI Components

- Media viewer (image/video player)
- Verification progress tracker
- Results dashboard with charts
- Provenance graph/timeline
- Forensic details panel

---

## 🎯 Phase 6: Local Integration Testing

### 6.1 End-to-End Flow Testing

1. Upload media through frontend
2. Backend encrypts & stores in mock Walrus
3. Job queued and processed by mock enclave
4. Python services return AI + provenance data
5. Report generated and stored
6. Mock attestation created
7. Frontend displays full results

### 6.2 Multi-Enclave Simulation

- Run multiple mock enclave instances
- Implement simple consensus/aggregation
- Test dispute/challenge flow

---

## 🎯 Phase 7: Testnet Connection (Future Implementation)

### 7.1 Walrus Testnet Setup

- Get testnet credentials from Walrus docs
- Replace mock storage with real Walrus SDK
- Update blob upload/retrieval logic
- Test encryption with real Walrus redundancy

### 7.2 Seal KMS Integration

- Setup Seal testnet account
- Create key policies for enclaves
- Integrate real CEK wrapping/unwrapping
- Test attested decryption flow

### 7.3 Sui Smart Contracts

Write Move contracts:

- `ProvenanceAttestation.move` - Store media provenance
- `IntegrityAttestation.move` - Store AI detection results
- `TrustOracle.move` - Oracle registration, reputation, staking
- `ChallengeDispute.move` - Challenge mechanism

Deploy to Sui testnet and integrate with backend.

### 7.4 Real Nautilus TEE

- Setup SGX-enabled environment or cloud TEE
- Deploy actual enclave code
- Implement remote attestation
- Connect to Seal KMS with attested channels

---

## 📋 Implementation Order

For hackathon MVP, focus on:

1. ✅ Project structure + dependencies
2. ✅ Mock services (Walrus, Seal, Nautilus, Sui)
3. ✅ Backend API + job queue
4. ✅ Python AI detection service (1-2 models)
5. ✅ Python reverse search (basic Google/TinEye)
6. ✅ Mock enclave processing
7. ✅ Frontend upload + results display
8. ✅ End-to-end demo flow

Post-hackathon:

- Real testnet integration (Phase 7)
- Multi-enclave consensus
- Challenge/dispute mechanism
- Legal evidence export
- Production hardening

---

## Key Files to Create

**Backend**:

- `backend/src/server.ts` - Express app
- `backend/src/routes/upload.ts` - Upload endpoint
- `backend/src/services/encryption.ts` - Mock Seal integration
- `backend/src/services/storage.ts` - Mock Walrus client
- `backend/src/queue/processor.ts` - Job processing
- `backend/src/services/orchestrator.ts` - Main verification logic

**Python Services**:

- `services/ai-detection/main.py` - FastAPI server
- `services/ai-detection/models.py` - HuggingFace model loading
- `services/reverse-search/main.py` - FastAPI server
- `services/reverse-search/engines.py` - Search integrations

**Mock Services**:

- `services/mock-services/walrus.ts` - Mock storage API
- `services/mock-services/seal.ts` - Mock encryption
- `services/mock-services/nautilus.ts` - Mock enclave
- `services/mock-services/sui.ts` - Mock blockchain

**Frontend**:

- `frontend/app/page.tsx` - Landing page
- `frontend/app/upload/page.tsx` - Upload interface
- `frontend/app/verify/[jobId]/page.tsx` - Results page
- `frontend/components/MediaUploader.tsx`
- `frontend/components/VerificationResults.tsx`
- `frontend/lib/api.ts` - API client

### To-dos

- [ ] Initialize monorepo structure with frontend, backend, services folders
- [ ] Create mock services for Walrus, Seal KMS, Nautilus TEE, and Sui
- [ ] Setup Node.js + Express backend with API endpoints and job queue
- [ ] Create Python FastAPI service for AI detection with HuggingFace models
- [ ] Create Python FastAPI service for reverse image/video search
- [ ] Implement mock enclave processing and report generation
- [ ] Setup Next.js frontend with upload interface and results display
- [ ] Test end-to-end flow from upload to attestation display