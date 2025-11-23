# 🏗️ Nautilus Infrastructure - Demo Mode

AWS Nitro Enclave infrastructure for Media Provably Authentic hackathon project.

## 📋 What's Deployed

- ✅ AWS EC2 c6a.xlarge instance with Nitro Enclaves enabled
- ✅ VPC, security groups, IAM roles configured
- ✅ Enclave image built (262MB EIF file)
- ✅ Health check server on port 8080
- ⚠️ Enclave application needs debugging (Node.js runtime issue)

**Current Status:** Instance STOPPED to save costs

## 💰 Cost Strategy

### Hackathon Demo Mode (Recommended)

**Use mock Nautilus mode** - no AWS costs!

```bash
cd backend
USE_REAL_NAUTILUS=false npm run dev
```

The backend already has full mock implementation. Works great for demos.

### If You Need Real Enclave

**Cost when stopped:** ~$2/month (storage only)
**Cost when running:** ~$0.15/hour

```bash
# Before demo
./scripts/demo-start.sh

# After demo (IMPORTANT!)
./scripts/demo-stop.sh

# Check status
./scripts/demo-status.sh
```

## 🚀 Quick Start

### Check Current Status

```bash
cd infra
./scripts/demo-status.sh
```

### Start for Demo

```bash
# Start instance (takes ~2 minutes)
./scripts/demo-start.sh

# Get new IP address
terraform output instance_public_ip
```

### Stop After Demo

```bash
# IMPORTANT: Stop to save money!
./scripts/demo-stop.sh
```

## 🔧 Configuration

**Instance:** i-0844022e8ea065ce3
**Region:** us-east-1
**Type:** c6a.xlarge (4 vCPU, 8GB RAM)
**Enclave:** 2 CPU, 6GB RAM allocated
**Node.js:** v16 (Amazon Linux 2 compatible)

## ⚠️ Known Issues

### Enclave Runtime Crashes

The enclave starts but immediately crashes. Likely issues:

1. **Node.js application bug** in `/opt/nautilus/enclave-server.js`
2. **vsock communication setup** not working correctly
3. **Docker init** failing silently

**Workaround:** Use mock mode for hackathon demo.

**Future fix:** Rewrite enclave in Python or Rust for stability.

## 📊 Cost Breakdown

| Scenario | Monthly Cost |
|----------|-------------|
| 24/7 running | $120-150 |
| Stopped | $2 |
| 10 demo hours | $3.50 |
| Mock mode | $0 |

## 🎯 Recommendations

### For Hackathon

1. ✅ **Use mock mode** - free, works great
2. ✅ **Keep instance stopped** - save $118/month
3. ✅ **Start only if judges want to see real enclave**

### After Hackathon

1. Fix enclave code (Python/Rust more stable than Node.js)
2. Test thoroughly before production
3. Consider spot instances ($25-40/month)
4. Or use start/stop strategy for low usage

---

**TL;DR:**
- Instance deployed ✅
- Currently STOPPED to save money ✅
- Use mock mode for demo (recommended) ✅
- Real enclave needs debugging ⚠️
