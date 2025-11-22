# ⚡ Quick Start - Deploy in 10 Minutes

This guide will get your Nautilus Nitro Enclave running in ~10 minutes.

## 🎯 Goal

Deploy 1 AWS Nitro Enclave for **$25-40/month** (or FREE with AWS credits).

## 📋 Prerequisites (5 minutes)

### 1. Install Tools

```bash
# Terraform
brew install terraform

# AWS CLI
brew install awscli

# Or see full install instructions in README.md
```

### 2. AWS Account Setup

```bash
# Configure AWS credentials
aws configure
# Enter your Access Key ID and Secret Access Key
# Region: us-east-1 (cheapest)
```

**💡 Get AWS Credits:**
- Apply for AWS Activate: https://aws.amazon.com/activate/
- Get $1,000 free credits (hackathon participants eligible)

### 3. Generate SSH Key

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/nautilus-key
# Press Enter for all prompts (no passphrase)
```

## 🚀 Deploy (5 minutes)

### Step 1: Configure

```bash
cd infra

# Copy example config
cp terraform.tfvars.example terraform.tfvars

# Add your SSH public key
cat ~/.ssh/nautilus-key.pub  # Copy this output

# Edit config
nano terraform.tfvars
# Paste the SSH key into ssh_public_key = "..."
# Save: Ctrl+X, Y, Enter
```

### Step 2: Deploy

```bash
# Quick deploy script
./scripts/deploy.sh

# Or manual:
terraform init
terraform plan
terraform apply
```

**Wait ~5 minutes for deployment...**

### Step 3: Verify

```bash
# Check status
./scripts/manage.sh status

# Test health
curl $(terraform output -raw enclave_api_endpoint)/health

# Should return:
# {
#   "status": "healthy",
#   "enclave": {...},
#   "timestamp": "2024-..."
# }
```

## ✅ Success!

You now have a real AWS Nitro Enclave running!

## 🔗 Connect Backend

### Update Backend .env

```bash
# Get environment variables
terraform output -json env_variables | jq -r 'to_entries[] | "\(.key)=\(.value)"'

# Add to backend/.env:
NAUTILUS_API_URL=http://[YOUR_IP]:5000
USE_REAL_NAUTILUS=true
ENCLAVE_ID=nitro_enclave_1
```

### Test Connection

```bash
cd ../backend

# Test enclave
curl $NAUTILUS_API_URL/health

# Start backend
npm run dev
```

## 💰 Cost Control

### Check Cost

```bash
./scripts/manage.sh cost
# Shows: $25-40/month (spot) or $120-150/month (on-demand)
```

### Stop When Not Needed (Save 90%)

```bash
# Stop instance (keeps infrastructure, only charges storage ~$2/mo)
./scripts/manage.sh stop

# Start before demo
./scripts/manage.sh start
```

### Demo Day Strategy

```bash
# 2 hours before demo
./scripts/manage.sh start

# After demo
./scripts/manage.sh stop

# Cost: ~$0.10 for demo day 🎉
```

## 🛠️ Common Commands

```bash
# Check status
./scripts/manage.sh status

# SSH into instance
./scripts/manage.sh ssh

# View enclave logs
./scripts/manage.sh logs

# Health check
./scripts/manage.sh health

# Stop instance (save cost)
./scripts/manage.sh stop

# Start instance
./scripts/manage.sh start
```

## 🔍 Verify It's Real TEE

### Get PCR Measurements

```bash
./scripts/manage.sh ssh

# Inside instance:
cat /opt/nautilus/measurements.txt

# PCR0: abc123def456... (your unique MRENCLAVE)
```

### Show to Judges

1. **Live Enclave Status**
   ```bash
   ./scripts/manage.sh status
   ```

2. **Hardware Attestation**
   ```bash
   curl http://[YOUR_IP]:5000/attest
   # Shows real PCR values
   ```

3. **Explain:**
   - "Running on AWS Nitro Enclaves (hardware TEE)"
   - "PCR0 measurement proves code integrity"
   - "Enclave signs reports with hardware-backed key"
   - "Cannot be tampered, even by AWS admins"

## 🐛 Troubleshooting

### Enclave Not Healthy

```bash
# SSH in
./scripts/manage.sh ssh

# Check enclave
sudo nitro-cli describe-enclaves

# View logs
sudo nitro-cli console --enclave-id $(sudo nitro-cli describe-enclaves | jq -r '.[0].EnclaveID')

# Restart
sudo systemctl restart nautilus-enclave
```

### Cannot Connect

```bash
# Check security group allows your IP
# Or temporarily allow all:
aws ec2 authorize-security-group-ingress \
  --group-id $(terraform output -raw security_group_id) \
  --protocol tcp \
  --port 5000 \
  --cidr 0.0.0.0/0
```

### Spot Instance Interrupted

```bash
# Just re-apply (gets new spot instance)
terraform apply
```

## 🧹 Cleanup

### Temporary Stop (Keep Infrastructure)

```bash
./scripts/manage.sh stop
# Cost: ~$2/month (storage only)
```

### Complete Removal

```bash
./scripts/manage.sh destroy
# Removes everything, cost = $0
```

## 📊 What You Get

```
✅ 1 AWS Nitro Enclave (c6a.xlarge)
✅ 4 vCPU, 8GB RAM
✅ 2 cores + 6GB dedicated to enclave
✅ Real hardware-backed attestation
✅ Auto-restarts on failure
✅ Health check endpoint
✅ CloudWatch logs
✅ Encrypted EBS storage

💰 $25-40/month with spot instances
💰 $0 with AWS Activate credits
💰 ~$0.10 per demo (start/stop strategy)
```

## 🎓 Next Steps

1. ✅ Update backend to use real enclave
2. ✅ Deploy smart contracts for verification
3. ✅ Add "Powered by AWS Nitro" badge to UI
4. ✅ Document TEE architecture for judges
5. ✅ Practice demo presentation

## 📞 Need Help?

- Check full README.md
- View logs: `./scripts/manage.sh logs`
- SSH access: `./scripts/manage.sh ssh`
- GitHub issues: https://github.com/yourusername/media-provably-authentic/issues

---

**Total Time:** ~10 minutes
**Cost:** $25-40/month (or $0 with credits)
**Difficulty:** ⭐⭐ (Easy with scripts)

Good luck with your hackathon! 🚀
