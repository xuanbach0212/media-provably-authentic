# Deployment Guide

This guide covers deploying Media Provably Authentic to production environments.

---

## 🎯 Deployment Options

### Option 1: Cloud Deployment (Recommended)
- **Frontend**: Vercel / Netlify
- **Backend**: AWS EC2 / DigitalOcean
- **Services**: Docker containers
- **Database**: Redis Cloud
- **Blockchain**: Sui Mainnet

### Option 2: Self-Hosted
- **All-in-one**: Docker Compose
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt
- **Monitoring**: Prometheus + Grafana

### Option 3: Hybrid
- **Frontend**: Vercel (CDN)
- **Backend + Services**: VPS
- **Blockchain**: Sui Mainnet
- **Storage**: Walrus Mainnet

---

## 🚀 Production Checklist

### Before Deployment

- [ ] All environment variables configured
- [ ] Sui mainnet wallet funded
- [ ] Walrus mainnet storage configured
- [ ] SerpAPI production key obtained
- [ ] Nautilus enclave deployed (3 instances)
- [ ] SSL certificates generated
- [ ] Domain names configured
- [ ] CORS origins whitelisted
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Backup strategy defined

---

## 🐳 Docker Deployment

### Build Images

```bash
# Backend
cd backend
docker build -t media-auth-backend:latest .

# AI Detection
cd services/ai-detection
docker build -t media-auth-ai:latest .

# Reverse Search
cd services/reverse-search
docker build -t media-auth-search:latest .

# Frontend
cd frontend
docker build -t media-auth-frontend:latest .
```

### Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  backend:
    image: media-auth-backend:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - SUI_NETWORK=mainnet
      - NAUTILUS_ENABLED=true
    depends_on:
      - redis

  ai-detection:
    image: media-auth-ai:latest
    ports:
      - "8000:8000"
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G

  reverse-search:
    image: media-auth-search:latest
    ports:
      - "8001:8001"
    environment:
      - SERPAPI_KEY=${SERPAPI_KEY}

  frontend:
    image: media-auth-frontend:latest
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    depends_on:
      - backend

volumes:
  redis-data:
```

### Start Production Stack

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## ☁️ Cloud Deployment (AWS)

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Route 53 (DNS)                       │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│              CloudFront (CDN) + S3 (Frontend)           │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│         Application Load Balancer (ALB)                 │
└─┬───────────────────┬───────────────────┬───────────────┘
  │                   │                   │
  ▼                   ▼                   ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│  EC2     │    │  EC2     │    │  EC2     │
│ Backend  │    │   AI     │    │  Search  │
│  (3001)  │    │  (8000)  │    │  (8001)  │
└─┬────────┘    └──────────┘    └──────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│              ElastiCache (Redis)                        │
└─────────────────────────────────────────────────────────┘
```

### Setup Steps

#### 1. Frontend (S3 + CloudFront)

```bash
# Build frontend
cd frontend
npm run build

# Deploy to S3
aws s3 sync out/ s3://your-bucket-name --delete

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name your-bucket-name.s3.amazonaws.com \
  --default-root-object index.html
```

#### 2. Backend (EC2)

```bash
# Launch EC2 instance (t3.medium or larger)
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Deploy backend
docker run -d \
  --name backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e REDIS_HOST=your-redis-endpoint \
  media-auth-backend:latest
```

#### 3. AI Detection (EC2 with GPU)

```bash
# Launch EC2 instance (g4dn.xlarge for GPU)
# Install NVIDIA drivers + Docker
# Deploy AI service
docker run -d \
  --name ai-detection \
  --gpus all \
  -p 8000:8000 \
  media-auth-ai:latest
```

#### 4. Reverse Search (EC2)

```bash
# Launch EC2 instance (t3.small)
docker run -d \
  --name reverse-search \
  -p 8001:8001 \
  -e SERPAPI_KEY=your_key \
  media-auth-search:latest
```

#### 5. Redis (ElastiCache)

```bash
# Create ElastiCache cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id media-auth-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

#### 6. Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name media-auth-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create target groups for each service
# Register EC2 instances
# Configure health checks
```

---

## 🔐 Security Hardening

### Environment Variables

**Never commit secrets!** Use:
- AWS Secrets Manager
- HashiCorp Vault
- Docker secrets
- Environment-specific `.env` files (gitignored)

### SSL/TLS

```bash
# Install Certbot
sudo yum install -y certbot

# Generate certificates
sudo certbot certonly --standalone \
  -d api.yourdomain.com \
  -d yourdomain.com

# Auto-renewal
sudo crontab -e
0 0 * * * certbot renew --quiet
```

### Firewall Rules

```bash
# Backend (only ALB)
sudo ufw allow from <alb-ip> to any port 3001

# AI Detection (only backend)
sudo ufw allow from <backend-ip> to any port 8000

# Reverse Search (only backend)
sudo ufw allow from <backend-ip> to any port 8001

# SSH (your IP only)
sudo ufw allow from <your-ip> to any port 22

# Enable firewall
sudo ufw enable
```

### Rate Limiting

**Backend** (`backend/src/middleware/rateLimit.ts`):
```typescript
import rateLimit from 'express-rate-limit';

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 min
  message: 'Too many uploads, please try again later'
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please slow down'
});
```

---

## 📊 Monitoring

### Prometheus + Grafana

**docker-compose.monitoring.yml**:
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your_password
    volumes:
      - grafana-data:/var/lib/grafana

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"

volumes:
  prometheus-data:
  grafana-data:
```

### Health Checks

```bash
# Backend
curl https://api.yourdomain.com/health

# AI Detection
curl https://api.yourdomain.com/ai/health

# Reverse Search
curl https://api.yourdomain.com/search/health
```

### Logging

**Centralized Logging** (ELK Stack):
```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    ports:
      - "5000:5000"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t media-auth-backend:${{ github.sha }} ./backend
          docker build -t media-auth-ai:${{ github.sha }} ./services/ai-detection
          docker build -t media-auth-search:${{ github.sha }} ./services/reverse-search
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin <ecr-url>
          docker push media-auth-backend:${{ github.sha }}
          docker push media-auth-ai:${{ github.sha }}
          docker push media-auth-search:${{ github.sha }}
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster media-auth --service backend --force-new-deployment
          aws ecs update-service --cluster media-auth --service ai-detection --force-new-deployment
          aws ecs update-service --cluster media-auth --service reverse-search --force-new-deployment
```

---

## 🔧 Maintenance

### Backup Strategy

```bash
# Backup Redis
redis-cli --rdb /backup/dump.rdb

# Backup environment configs
tar -czf configs-backup-$(date +%Y%m%d).tar.gz backend/.env services/*/.env

# Backup blockchain data
sui client export --address <your-address> > wallet-backup.json
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild images
docker-compose build

# Rolling update (zero downtime)
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build ai-detection
docker-compose up -d --no-deps --build reverse-search
```

### Scaling

**Horizontal Scaling**:
```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Scale AI detection to 2 instances
docker-compose up -d --scale ai-detection=2
```

**Vertical Scaling**:
```yaml
# Increase resources
services:
  ai-detection:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
```

---

## 📈 Performance Optimization

### Caching

**Redis Cache**:
```typescript
// Cache AI detection results
const cacheKey = `ai:${mediaHash}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await aiDetection(media);
await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1 hour
```

### CDN

- Serve static assets from CloudFront
- Cache API responses (GET only)
- Enable gzip compression

### Database

- Use Redis for job queue
- Index frequently queried fields
- Implement connection pooling

---

## 🆘 Disaster Recovery

### Backup Restoration

```bash
# Restore Redis
redis-cli --pipe < dump.rdb

# Restore configs
tar -xzf configs-backup-20240101.tar.gz

# Restore wallet
sui client import --keystore wallet-backup.json
```

### Rollback

```bash
# Rollback to previous version
docker-compose down
git checkout <previous-commit>
docker-compose up -d
```

---

## 📞 Support

For production deployment support:
- **Email**: devops@yourdomain.com
- **Slack**: #deployment-help
- **On-call**: +1-xxx-xxx-xxxx

---

**Production-ready deployment! 🚀**

