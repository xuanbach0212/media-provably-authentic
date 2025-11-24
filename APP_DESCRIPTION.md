# Media Provably Authentic

## 🎯 Overview

**Media Provably Authentic** is a decentralized media authentication platform that combines AI detection, blockchain attestation, and Trusted Execution Environments (TEE) to provide cryptographic proof of media authenticity.

## 🚀 Key Features

### 1. **AI Detection** 🤖
- Detects AI-generated images and deepfakes
- Forensic analysis (metadata, compression, frequency domain)
- Ensemble of 4 different AI models
- High accuracy with Smart Ensemble approach

### 2. **Reverse Image Search** 🔍
- Searches for image origins on Google
- Detects previously published images
- Identifies source and publication timeline

### 3. **TEE Attestation** 🔒
- Processing in AWS Nitro Enclave (Nautilus)
- Hardware-backed cryptographic signatures
- Tamper-proof attestation documents

### 4. **Blockchain Proof** ⛓️
- Results stored on Sui blockchain
- Immutable and transparent
- Byzantine Fault Tolerance (3 enclaves consensus)

### 5. **Decentralized Storage** 💾
- Media and reports encrypted and stored on Walrus
- Only TEE can decrypt
- Privacy and security guaranteed

## 🏗️ Architecture

```
User Upload
    ↓
Encrypt & Store (Walrus)
    ↓
3 Parallel TEE Enclaves
    ├─→ AI Detection
    ├─→ Reverse Search
    └─→ Sign with TEE
    ↓
Byzantine Consensus (2/3)
    ↓
Blockchain Attestation (Sui)
    ↓
Immutable Proof
```

## 💡 Use Cases

1. **News Verification** - Detect deepfakes and AI-generated images
2. **Copyright Protection** - Prove original image ownership
3. **Combat Misinformation** - Verify images on social media
4. **Legal Evidence** - Images with irrefutable blockchain proof

## 🔐 Security

- ✅ **Hardware Security**: AWS Nitro Enclave
- ✅ **Encryption**: AES-256-GCM
- ✅ **Blockchain**: Immutable Sui testnet
- ✅ **Decentralized**: Walrus storage
- ✅ **Multi-Oracle**: Byzantine Fault Tolerance

## 🌐 Tech Stack

**Frontend**: Next.js, React, Tailwind CSS, Framer Motion  
**Backend**: Node.js, Express, Socket.IO, Bull/Redis  
**AI**: Python, FastAPI, Hugging Face Transformers  
**Blockchain**: Sui (Move smart contracts)  
**Storage**: Walrus (Sui-based decentralized storage)  
**TEE**: AWS Nitro Enclave (Nautilus)

## 📊 Results

After upload, users receive:

1. **AI Analysis** - Detailed scores and metrics
2. **Forensic Data** - Compression, frequency, quality analysis
3. **Reverse Search** - Image origins and history
4. **TEE Attestation** - Cryptographic signature and attestation document
5. **Blockchain Proof** - Transaction hash on Sui
6. **Walrus CIDs** - Links to encrypted media and report

## 🎬 Demo Flow

1. Upload image
2. Sign with Sui wallet
3. View real-time progress (3 enclaves processing)
4. Receive results with blockchain proof

## 🔗 Links

- **Frontend**: http://localhost:3000
- **Sui Contract**: `0xd049b6b324eb83d44f01e3accb0c4e092ade72dbaf8ff4bbaff46984e315a4d9`
- **Seal Policy**: `0x3e7704f3fdf24284fb3e5bf0568698444c4c892d59009657d17734a4a020db8b`
- **Nautilus**: http://54.226.172.237:3000

---

## 🎯 TL;DR

**Upload Image → AI Analysis → TEE Signature → Blockchain Storage → Tamper-Proof Verification**

Combining AI, TEE, and Blockchain to create a **trustless**, **transparent**, and **immutable** media authentication system.

