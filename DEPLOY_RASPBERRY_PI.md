# 🥧 Deploy to Raspberry Pi with Docker + Cloudflare Tunnel

## 📋 Prerequisites

1. **Raspberry Pi** (preferably Pi 4 or 5 with 4GB+ RAM)
2. **Docker & Docker Compose** installed
3. **Cloudflare account** (free tier works)
4. **Domain name** (can use Cloudflare's free subdomain)

---

## 🚀 Step 1: Install Docker on Raspberry Pi

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

**Logout and login again** for group changes to take effect.

---

## 📦 Step 2: Clone & Setup Project

```bash
# Clone your repository
git clone https://github.com/your-username/media-provably-authentic.git
cd media-provably-authentic

# Copy environment file
cp .env.production .env

# Edit .env with your values
nano .env
```

**Required environment variables:**
- `SUI_PRIVATE_KEY` - Your Sui wallet private key
- `NAUTILUS_URL` - Nautilus TEE endpoint
- `NAUTILUS_MRENCLAVE` - Your enclave measurement
- `SERPAPI_KEY` - SerpAPI key for reverse search
- `CORS_ORIGIN` - Your frontend URL (e.g., https://your-app.vercel.app)

---

## 🐳 Step 3: Build & Run with Docker Compose

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f ai-detection
docker-compose logs -f reverse-search
```

**Services will be available at:**
- Backend API: `http://localhost:3001`
- AI Detection: `http://localhost:8000`
- Reverse Search: `http://localhost:8002`
- Redis: `http://localhost:6379`

---

## ☁️ Step 4: Setup Cloudflare Tunnel

### 4.1 Install Cloudflared

```bash
# Download cloudflared for ARM64
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb

# Install
sudo dpkg -i cloudflared-linux-arm64.deb

# Verify
cloudflared --version
```

### 4.2 Authenticate with Cloudflare

```bash
# Login to Cloudflare
cloudflared tunnel login
```

This will open a browser. Select your domain and authorize.

### 4.3 Create Tunnel

```bash
# Create a tunnel
cloudflared tunnel create media-auth-backend

# Note the Tunnel ID from output
# Example: Created tunnel media-auth-backend with id: abc123...
```

### 4.4 Create Tunnel Configuration

```bash
# Create config directory
mkdir -p ~/.cloudflared

# Create config file
nano ~/.cloudflared/config.yml
```

**Add this configuration:**

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/pi/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  # Backend API
  - hostname: api.yourdomain.com
    service: http://localhost:3001
  
  # Catch-all rule (required)
  - service: http_status:404
```

**Replace:**
- `YOUR_TUNNEL_ID` with your actual tunnel ID
- `api.yourdomain.com` with your desired subdomain

### 4.5 Create DNS Record

```bash
# Create DNS record
cloudflared tunnel route dns media-auth-backend api.yourdomain.com
```

### 4.6 Run Tunnel as Service

```bash
# Install as system service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared

# Enable on boot
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

---

## 🔧 Step 5: Update Frontend Environment

Update your **Vercel** frontend environment variables:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUI_NETWORK=testnet
```

Redeploy frontend:

```bash
# If using Vercel CLI
vercel --prod

# Or push to GitHub (auto-deploy)
git push origin main
```

---

## ✅ Step 6: Verify Deployment

### Test Backend

```bash
# Test health endpoint
curl https://api.yourdomain.com/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### Test from Frontend

1. Open your frontend: `https://your-app.vercel.app`
2. Connect wallet
3. Upload an image
4. Verify processing works end-to-end

---

## 📊 Monitoring & Maintenance

### View Logs

```bash
# Docker logs
docker-compose logs -f

# Cloudflare tunnel logs
sudo journalctl -u cloudflared -f
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# Restart tunnel
sudo systemctl restart cloudflared
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 🔒 Security Recommendations

1. **Firewall**: Only expose necessary ports
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw enable
   ```

2. **HTTPS Only**: Cloudflare Tunnel provides automatic HTTPS

3. **Environment Variables**: Never commit `.env` to git

4. **Regular Updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   docker-compose pull
   ```

5. **Backup**: Regularly backup your `.env` and Redis data

---

## 🐛 Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs service-name

# Check disk space
df -h

# Check memory
free -h
```

### Cloudflare Tunnel not working

```bash
# Check tunnel status
sudo systemctl status cloudflared

# Check config
cat ~/.cloudflared/config.yml

# Restart tunnel
sudo systemctl restart cloudflared
```

### Out of memory

```bash
# Add swap space (if needed)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📈 Performance Tips

1. **Use SSD**: Boot from SSD instead of SD card
2. **Increase Swap**: Add 2-4GB swap space
3. **Limit Logs**: Configure log rotation
4. **Monitor Resources**: Use `htop` or `docker stats`

---

## 🎯 Architecture Overview

```
Internet
   ↓
Cloudflare Tunnel (HTTPS)
   ↓
Raspberry Pi (localhost:3001)
   ↓
Docker Compose
   ├── Backend (Node.js)
   ├── AI Detection (Python)
   ├── Reverse Search (Python)
   └── Redis (Cache/Queue)
```

---

## 📞 Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Check tunnel: `sudo systemctl status cloudflared`
3. Verify `.env` variables
4. Check Raspberry Pi resources: `htop`

---

**🎉 Your backend is now deployed on Raspberry Pi with Cloudflare Tunnel!**

Access your API at: `https://api.yourdomain.com`

