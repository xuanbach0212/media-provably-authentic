# 🍓 Raspberry Pi Deployment Guide

## 📋 Prerequisites

### Hardware Requirements
- Raspberry Pi 4 (4GB+ RAM recommended)
- 32GB+ SD card
- Stable internet connection

### Software Requirements
- Raspberry Pi OS (64-bit recommended)
- Docker & Docker Compose
- Git

---

## 🔧 Step 1: Install Dependencies on Raspberry Pi

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Install Git
sudo apt install git -y

# Reboot to apply Docker group
sudo reboot
```

---

## 📥 Step 2: Clone Repository

```bash
cd ~
git clone <your-repo-url> media-provably-authentic
cd media-provably-authentic
```

---

## 🔐 Step 3: Setup Environment Variables

### Backend `.env`
```bash
cd backend
cp .env.example .env
nano .env
```

**Update these values:**
```bash
# Sui Blockchain
SUI_PRIVATE_KEY=<your-private-key>
SUI_PACKAGE_ID=<your-package-id>
SEAL_POLICY_PACKAGE=<your-policy-package>
SUI_NETWORK=testnet

# Nautilus TEE (IMPORTANT: Use new IP!)
NAUTILUS_ENCLAVE_URL=http://100.29.40.239:3000
NAUTILUS_ENABLED=true
ENCLAVE_ID=nautilus_nitro_enclave
NAUTILUS_MRENCLAVE=

# SerpAPI for Reverse Search
SERPAPI_KEY=<your-serpapi-key>

# Docker service URLs (NOT localhost!)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379
AI_DETECTION_URL=http://ai-detection:8000
REVERSE_SEARCH_URL=http://reverse-search:8002

# Server Config
PORT=3001
NODE_ENV=production
```

### Reverse Search `.env`
```bash
cd ../services/reverse-search
cp .env.example .env
nano .env
```

```bash
SERPAPI_KEY=<your-serpapi-key>
LOG_LEVEL=info
```

---

## 🐳 Step 4: Update Docker Compose for Production

The `docker-compose.yml` is already configured for production!

**Key points:**
- ✅ No volume mounts (uses built code)
- ✅ Service discovery via hostnames
- ✅ Persistent volumes for Redis & models
- ✅ Auto-restart enabled

---

## 🚀 Step 5: Build and Start Services

```bash
cd ~/media-provably-authentic

# Build all services (this will take 10-20 minutes on Pi)
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## 🌐 Step 6: Setup Cloudflare Tunnel

### Option A: Quick Tunnel (Temporary, for testing)
```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb

# Start quick tunnel
cloudflared tunnel --url http://localhost:3001
```

### Option B: Named Tunnel (Permanent, requires domain)
```bash
# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create media-auth-backend

# Configure tunnel
cat > ~/.cloudflared/config.yml << 'TUNNEL_CONFIG'
tunnel: <tunnel-id>
credentials-file: /home/pi/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
TUNNEL_CONFIG

# Route DNS
cloudflared tunnel route dns media-auth-backend api.yourdomain.com

# Run tunnel as service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

## 🔍 Step 7: Verify Services

```bash
# Check all containers are running
docker-compose ps

# Test AI Detection
curl http://localhost:8000/health

# Test Reverse Search
curl http://localhost:8002/health

# Test Backend
curl http://localhost:3001/health

# Check Redis
docker-compose exec redis redis-cli ping
```

---

## 📊 Step 8: Monitor Services

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f ai-detection

# Check resource usage
docker stats

# Check disk space
df -h
```

---

## 🔄 Step 9: Update Vercel Frontend

Update frontend environment variables on Vercel:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# OR for Quick Tunnel:
NEXT_PUBLIC_API_URL=https://<random-subdomain>.trycloudflare.com

NEXT_PUBLIC_SUI_NETWORK=testnet
```

**Via Vercel CLI:**
```bash
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_SUI_NETWORK
vercel --prod
```

---

## ⚠️ Important Differences: Mac vs Raspberry Pi

### 1. **Environment Variables**
| Variable | Mac (Local) | Raspberry Pi (Docker) |
|----------|-------------|----------------------|
| `REDIS_HOST` | `localhost` | `redis` |
| `AI_DETECTION_URL` | `http://localhost:8000` | `http://ai-detection:8000` |
| `REVERSE_SEARCH_URL` | `http://localhost:8002` | `http://reverse-search:8002` |

### 2. **Service Discovery**
- **Mac**: Services talk via `localhost`
- **Pi**: Services talk via Docker network hostnames

### 3. **Build Time**
- **Mac**: ~5 minutes
- **Pi**: ~15-20 minutes (ARM architecture)

### 4. **AI Model Loading**
- **First run**: ~5-10 minutes to download models
- **Subsequent runs**: Fast (models cached in volume)

---

## 🐛 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart

# Rebuild if needed
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Out of memory
```bash
# Check memory
free -h

# Increase swap (if needed)
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### AI Detection slow
```bash
# This is normal on Pi! Models run on CPU.
# First inference: ~30-60 seconds
# Subsequent: ~10-20 seconds
```

### Disk space full
```bash
# Clean up Docker
docker system prune -a

# Check volumes
docker volume ls
```

---

## 🔒 Security Checklist

- [ ] Change default passwords
- [ ] Use strong SUI private key
- [ ] Keep `.env` files secure (never commit!)
- [ ] Use HTTPS (Cloudflare Tunnel provides this)
- [ ] Enable firewall on Pi
- [ ] Regular system updates

---

## 📝 Maintenance

### Update code
```bash
cd ~/media-provably-authentic
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

### Backup important data
```bash
# Backup .env files
cp backend/.env backend/.env.backup
cp services/reverse-search/.env services/reverse-search/.env.backup

# Backup Redis data
docker-compose exec redis redis-cli BGSAVE
```

### Monitor logs
```bash
# Setup log rotation
sudo nano /etc/docker/daemon.json
```
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

---

## 🎯 Quick Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a service
docker-compose restart backend

# View logs
docker-compose logs -f backend

# Check status
docker-compose ps

# Update and restart
git pull && docker-compose down && docker-compose build && docker-compose up -d
```

---

## 📞 Need Help?

- Check logs: `docker-compose logs -f`
- Check service health: `curl http://localhost:<port>/health`
- Check Docker: `docker ps -a`
- Check resources: `docker stats`

