# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install
cd shared && npm install && npm run build
cd ../backend && npm install
cd ../services/mock-services && npm install
cd ../../../

# Install Python dependencies (optional for MVP)
cd services/ai-detection
pip install -r requirements.txt

cd ../reverse-search
pip install -r requirements.txt
cd ../../
```

### 2. Start Services

**Terminal 1 - Mock Services:**
```bash
cd services/mock-services
npm run dev
```

**Terminal 2 - Backend API:**
```bash
cd backend
npm run dev
```

**Terminal 3 - AI Detection (Optional):**
```bash
cd services/ai-detection
python -m uvicorn main:app --reload --port 8001
```

**Terminal 4 - Reverse Search (Optional):**
```bash
cd services/reverse-search
python -m uvicorn main:app --reload --port 8002
```

**Terminal 5 - Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Test the System

Open http://localhost:3000 and:
1. Upload an image file
2. Wait for processing (~10-30 seconds)
3. View results with AI detection, provenance, and blockchain attestation

## ✅ Verify Services are Running

Run the test script:
```bash
./test-system.sh
```

Or manually check:
- Mock Services: http://localhost:3002/health
- Backend API: http://localhost:3001/health
- AI Detection: http://localhost:8001/health
- Reverse Search: http://localhost:8002/health
- Frontend: http://localhost:3000

## 📁 Project Structure

```
media-provably-authentic/
├── frontend/              # Next.js UI (port 3000)
├── backend/              # Express API (port 3001)
├── services/
│   ├── mock-services/    # Mock Walrus/Seal/Nautilus/Sui (port 3002)
│   ├── ai-detection/     # Python AI detection (port 8001)
│   └── reverse-search/   # Python reverse search (port 8002)
├── shared/               # Shared TypeScript types
└── docs/                 # Architecture documentation
```

## 🔧 Key Features Implemented

### Phase 1 (MVP - Current)
✅ Mock Walrus Storage
✅ Mock Seal KMS Encryption
✅ Mock Nautilus TEE Processing
✅ Mock Sui Blockchain Attestations
✅ Backend API with Job Queue
✅ AI Detection Service (heuristic-based)
✅ Reverse Search Service (mock data)
✅ Frontend Upload & Results UI
✅ End-to-end verification flow

### Phase 2 (Future - Testnet)
⏳ Real Walrus testnet integration
⏳ Real Seal KMS policies
⏳ Real Nautilus SGX enclaves
⏳ Sui Move smart contracts deployment
⏳ HuggingFace model integration
⏳ Real reverse search APIs

## 🎯 Testing the Flow

### Upload Flow:
1. User uploads media → Frontend
2. Frontend encrypts → Sends to Backend
3. Backend creates job → Stores in Walrus (mock)
4. Job enters queue

### Verification Flow:
1. Job processor picks up job
2. Decrypts media via Seal (mock)
3. Calls AI detection service
4. Calls reverse search service
5. Generates signed report
6. Stores report in Walrus
7. Creates blockchain attestation
8. Returns results to user

## 🐛 Troubleshooting

### Ports Already in Use
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill
lsof -ti:3001 | xargs kill
lsof -ti:3002 | xargs kill
```

### Python Services Not Starting
Make sure Python 3.10+ is installed:
```bash
python --version
pip install --upgrade pip
```

### TypeScript Errors
Rebuild shared package:
```bash
cd shared
npm run build
```

## 📚 Documentation

See `docs/` folder for:
- Complete flow diagrams
- Architecture details
- Sequence diagrams
- Integration guides

## 🎓 Next Steps

1. **For Development:**
   - Add real HuggingFace models for AI detection
   - Integrate real reverse search APIs (SerpAPI, TinEye)
   - Implement multi-enclave consensus

2. **For Production:**
   - Deploy to Sui testnet
   - Configure real Walrus storage
   - Setup Seal KMS with production policies
   - Deploy Nautilus SGX enclaves

3. **For Enhancement:**
   - Add user authentication (zkLogin)
   - Implement challenge/dispute mechanism
   - Create legal evidence export (PDF)
   - Add analytics dashboard

