# Setup Guide

## Installation

### 1. Install Node.js Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 2. Install Python Dependencies

```bash
# Install Python dependencies for services
npm run install:python

# Or manually:
cd services/ai-detection
pip install -r requirements.txt

cd ../reverse-search
pip install -r requirements.txt
```

### 3. Build Shared Package

```bash
cd shared
npm run build
```

## Running the Application

### Option 1: Run All Services at Once

```bash
npm run dev
```

This will start:
- Frontend (port 3000)
- Backend API (port 3001)
- Mock Services (port 3002)
- AI Detection Service (port 8001)
- Reverse Search Service (port 8002)

### Option 2: Run Services Individually

In separate terminals:

```bash
# Terminal 1: Mock Services
npm run dev:mock-services

# Terminal 2: Backend API
npm run dev:backend

# Terminal 3: AI Detection
npm run dev:ai

# Terminal 4: Reverse Search
npm run dev:reverse-search

# Terminal 5: Frontend
npm run dev:frontend
```

## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Mock Services: http://localhost:3002
- AI Detection: http://localhost:8001
- Reverse Search: http://localhost:8002

## Testing the Flow

1. Open http://localhost:3000
2. Upload an image or video file
3. Wait for processing (15-30 seconds)
4. View verification results including:
   - AI detection analysis
   - Provenance matches
   - Blockchain attestation

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Kill processes on specific ports (macOS/Linux)
lsof -ti:3000 | xargs kill
lsof -ti:3001 | xargs kill
lsof -ti:3002 | xargs kill
lsof -ti:8001 | xargs kill
lsof -ti:8002 | xargs kill
```

### Python Virtual Environment

If you prefer using a virtual environment:

```bash
cd services/ai-detection
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

cd ../reverse-search
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Module Not Found Errors

If you get module not found errors for @media-auth/shared:

```bash
cd shared
npm run build
cd ..
npm run install:all
```

## Architecture

See `docs/` folder for detailed architecture diagrams and flow documentation.

## Next Steps (Testnet Integration)

For production deployment with real SUI testnet:

1. Configure Walrus testnet credentials
2. Setup Seal KMS with real policies
3. Deploy Nautilus enclaves (SGX/TEE)
4. Deploy SUI Move smart contracts
5. Update service URLs in configuration

