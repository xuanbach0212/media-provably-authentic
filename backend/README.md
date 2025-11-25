# 🔧 Backend Service

Node.js/Express backend for Media Provably Authentic verification system.

## 🚀 Quick Start

### 1. Setup Environment Variables

```bash
# Copy example file
cp env.example .env

# Edit with your values
nano .env
```

**Minimum required:**
```bash
SUI_PRIVATE_KEY=your-sui-private-key
SUI_PACKAGE_ID=0x...
SEAL_POLICY_PACKAGE=0x...
```

See `../ENV_SETUP.md` for detailed guide.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3001`

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 📋 Environment Variables

See `env.example` for all available options.

**Required:**
- `SUI_PRIVATE_KEY` - Sui wallet private key
- `SUI_PACKAGE_ID` - Deployed contract package ID
- `SEAL_POLICY_PACKAGE` - Seal policy package ID

**Optional (with defaults):**
- `PORT=3001` - Server port
- `REDIS_URL=redis://localhost:6379` - Redis connection
- `AI_DETECTION_URL=http://localhost:8000` - AI service URL
- `REVERSE_SEARCH_URL=http://localhost:8002` - Reverse search URL
- `FRONTEND_URL=http://localhost:3000` - CORS origin

---

## 🏗️ Architecture

```
Backend (Express + Socket.IO)
├── Routes
│   ├── /upload - Upload media for verification
│   ├── /verify/:jobId - Get verification status
│   ├── /verify-attestation - Verify TEE attestation
│   ├── /dispute - Submit dispute
│   └── /retry/:jobId - Retry failed job
├── Services
│   ├── Orchestrator - Coordinate verification flow
│   ├── Aggregator - Multi-enclave consensus
│   ├── Sui - Blockchain attestation
│   ├── Seal - Seal policy management
│   ├── Walrus - Decentralized storage
│   └── Nautilus - TEE integration
└── Queue
    ├── Bull - Job queue (Redis)
    └── Multi-Worker - Parallel processing
```

---

## 🔌 API Endpoints

### Upload Media
```bash
POST /upload
Content-Type: multipart/form-data

Body:
- media: File (image/video)
- walletAddress: string

Response:
{
  "jobId": "uuid",
  "status": "pending"
}
```

### Get Verification Status
```bash
GET /verify/:jobId

Response:
{
  "jobId": "uuid",
  "status": "completed",
  "report": { ... }
}
```

### Verify TEE Attestation
```bash
POST /verify-attestation

Body:
{
  "attestation": "base64...",
  "mrenclave": "hex..."
}

Response:
{
  "valid": true,
  "enclaveId": "...",
  "timestamp": "..."
}
```

---

## 🧪 Testing

```bash
# Test upload
curl -X POST http://localhost:3001/upload \
  -F "media=@test.jpg" \
  -F "walletAddress=0x123..."

# Test verification
curl http://localhost:3001/verify/job-id-here
```

---

## 🐳 Docker

```bash
# Build
docker build -t media-auth-backend .

# Run
docker run -p 3001:3001 \
  -e SUI_PRIVATE_KEY=your-key \
  -e SUI_PACKAGE_ID=0x... \
  media-auth-backend
```

---

## 📊 Dependencies

**Core:**
- `express` - Web framework
- `socket.io` - Real-time communication
- `bull` - Job queue
- `ioredis` - Redis client

**Blockchain:**
- `@mysten/sui` - Sui SDK
- `@mysten/seal` - Seal SDK
- `@mysten/walrus` - Walrus SDK

**Utilities:**
- `axios` - HTTP client
- `multer` - File upload
- `dotenv` - Environment variables

---

## 🔧 Development

### File Structure

```
src/
├── server.ts           # Main entry point
├── routes/            # API routes
├── services/          # Business logic
│   ├── orchestrator.ts    # Main verification flow
│   ├── aggregator.ts      # Multi-enclave consensus
│   ├── sui.ts            # Blockchain integration
│   ├── seal.ts           # Seal policy
│   ├── walrus.ts         # Storage
│   └── nautilus.ts       # TEE integration
├── queue/             # Job processing
│   ├── bullQueue.ts      # Queue setup
│   └── multiWorkerProcessor.ts  # Multi-worker
└── utils/             # Helpers
```

### Adding New Routes

```typescript
// src/routes/myroute.ts
import { Router } from 'express';

const router = Router();

router.get('/my-endpoint', (req, res) => {
  res.json({ message: 'Hello' });
});

export default router;
```

```typescript
// src/server.ts
import myRoute from './routes/myroute';
app.use('/api', myRoute);
```

---

## 🐛 Troubleshooting

### Server won't start

```bash
# Check .env file exists
ls -la .env

# Check required variables
cat .env | grep SUI_PRIVATE_KEY

# Check logs
npm run dev 2>&1 | tee backend.log
```

### Redis connection failed

```bash
# Check Redis is running
redis-cli ping

# Should return: PONG

# Start Redis
redis-server
```

### Sui transaction failed

```bash
# Check wallet has balance
sui client gas

# Check network
sui client active-env

# Should be: testnet
```

---

## 📚 Additional Resources

- **Main Documentation**: `../README.md`
- **Environment Setup**: `../ENV_SETUP.md`
- **Docker Deployment**: `../DEPLOY_RASPBERRY_PI.md`
- **API Documentation**: See routes in `src/routes/`

---

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Submit PR

---

## 📄 License

See main project LICENSE

