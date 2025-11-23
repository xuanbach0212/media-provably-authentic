# Getting Started with Media Provably Authentic

This guide will help you get the system up and running in **under 10 minutes**.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js 18+** installed ([Download](https://nodejs.org/))
- [ ] **Python 3.11+** installed ([Download](https://www.python.org/))
- [ ] **Redis** installed (optional, for production)
- [ ] **Sui Wallet** browser extension ([Download](https://chrome.google.com/webstore/detail/sui-wallet))
- [ ] **SerpAPI Key** (for reverse search) ([Get Free Key](https://serpapi.com/))

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone & Install

```bash
# Clone repository
git clone https://github.com/yourusername/media-provably-authentic.git
cd media-provably-authentic

# Install all dependencies (this may take 2-3 minutes)
npm install
cd frontend && npm install
cd ../backend && npm install
cd ../shared && npm install
```

### Step 2: Setup Python Services

```bash
# AI Detection Service
cd services/ai-detection
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Reverse Search Service
cd ../reverse-search
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

**Backend** (`backend/.env`):
```env
# Sui Blockchain (use testnet for development)
SUI_NETWORK=testnet
SUI_PRIVATE_KEY=your_sui_private_key_here
SUI_ADDRESS=your_sui_address_here

# Nautilus TEE (already configured)
NAUTILUS_ENCLAVE_URL=http://54.226.172.237:3000
NAUTILUS_ENABLED=true
ENCLAVE_ID=enclave_1

# Service URLs (default ports)
AI_DETECTION_URL=http://localhost:8000
REVERSE_SEARCH_URL=http://localhost:8001

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Reverse Search** (`services/reverse-search/.env`):
```env
SERPAPI_KEY=your_serpapi_key_here
```

### Step 4: Start All Services

```bash
# From project root
./start-all-services.sh
```

This will start:
- ✅ Frontend: http://localhost:3000
- ✅ Backend: http://localhost:3001
- ✅ AI Detection: http://localhost:8000
- ✅ Reverse Search: http://localhost:8001

### Step 5: Test the System

1. Open http://localhost:3000 in your browser
2. Click "Launch App"
3. Connect your Sui wallet
4. Upload a test image
5. Sign the wallet message
6. Watch the real-time progress tree
7. View comprehensive analysis results

---

## 🔑 Getting API Keys

### Sui Wallet Setup

1. Install [Sui Wallet Extension](https://chrome.google.com/webstore/detail/sui-wallet)
2. Create a new wallet or import existing
3. Switch to **Testnet** network
4. Get free testnet SUI from [faucet](https://discord.com/channels/916379725201563759/971488439931392130)

### SerpAPI Key (Free Tier)

1. Sign up at [serpapi.com](https://serpapi.com/)
2. Free tier: **100 searches/month**
3. Copy your API key
4. Paste into `services/reverse-search/.env`

### Sui Private Key (Backend)

```bash
# Generate new Sui keypair
sui client new-address ed25519

# Export private key
sui keytool export --key-identity <address>

# Copy to backend/.env
```

---

## 🧪 Testing the System

### Test 1: AI Detection Only

```bash
# Upload an AI-generated image
curl -X POST http://localhost:8000/detect \
  -F "file=@test-images/ai-generated.jpg"
```

Expected response:
```json
{
  "ensembleScore": 0.85,
  "modelScores": { ... },
  "forensicAnalysis": { ... }
}
```

### Test 2: Reverse Search Only

```bash
# Search for a real image
curl -X POST http://localhost:8001/search \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "..."}'
```

### Test 3: Full Flow

1. Open frontend: http://localhost:3000/app
2. Connect Sui wallet
3. Upload image
4. Sign message
5. Wait for processing (25-40s)
6. View results

---

## 📊 Understanding the Results

### AI Detection Metrics

- **Ensemble Score** (0-1): Average of 7 AI models
  - < 0.5: Likely real
  - 0.5-0.8: Uncertain (reverse search skipped)
  - > 0.8: Likely AI-generated

- **Individual Model Scores**: Each model's prediction
- **Forensic Analysis**: EXIF, compression, noise
- **Frequency Analysis**: DCT/FFT anomalies
- **Quality Metrics**: Sharpness, brightness, contrast

### Reverse Search Results

- **Matches**: URLs where image was found
- **Similarity**: Visual similarity score (0-1)
- **First Seen**: Estimated age of match
- **Notable Sources**: Wikipedia, .gov, .edu prioritized

### Blockchain Attestation

- **Transaction Hash**: Sui blockchain transaction
- **Enclave Signature**: Cryptographic proof from TEE
- **Attestation Document**: AWS Nitro Enclave proof
- **PCRs**: Platform Configuration Registers

---

## 🛠️ Troubleshooting

### Frontend won't start

```bash
# Clear cache and reinstall
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

### Backend can't connect to services

```bash
# Check if services are running
curl http://localhost:8000/health  # AI Detection
curl http://localhost:8001/health  # Reverse Search

# Restart services
./stop-all-services.sh
./start-all-services.sh
```

### Python dependencies fail

```bash
# Upgrade pip
pip install --upgrade pip

# Install with verbose output
pip install -r requirements.txt -v
```

### Wallet connection fails

1. Ensure Sui Wallet extension is installed
2. Switch to **Testnet** network
3. Refresh the page
4. Try connecting again

### Reverse search returns no results

1. Check `SERPAPI_KEY` in `services/reverse-search/.env`
2. Verify key is valid: https://serpapi.com/manage-api-key
3. Check quota: Free tier = 100 searches/month
4. Restart reverse search service

### Nautilus TEE connection fails

1. Check `NAUTILUS_ENCLAVE_URL` in `backend/.env`
2. Test enclave health:
   ```bash
   curl http://54.226.172.237:3000/health_check
   ```
3. If down, set `NAUTILUS_ENABLED=false` for mock mode

---

## 📚 Next Steps

- **[README.md](README.md)** - Full documentation
- **[ANALYSIS_GUIDE.md](ANALYSIS_GUIDE.md)** - Interpret metrics
- **[NAUTILUS_INTEGRATION_COMPLETE.md](NAUTILUS_INTEGRATION_COMPLETE.md)** - TEE setup
- **[FINAL_SYSTEM_AUDIT.md](FINAL_SYSTEM_AUDIT.md)** - System status
- **[docs/PROOF_OF_AUTHENTICITY_PIPELINE_SEQUENCE.md](docs/PROOF_OF_AUTHENTICITY_PIPELINE_SEQUENCE.md)** - Flow diagram

---

## 🤝 Need Help?

- **GitHub Issues**: [Report a bug](https://github.com/yourusername/media-provably-authentic/issues)
- **Discord**: [Join our community](#)
- **Email**: your.email@example.com

---

**Happy verifying! 🚀**

