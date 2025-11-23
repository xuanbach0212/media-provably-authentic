# 🎬 Demo Mode - Cost Optimized Setup

## 💰 Current Status

**Instance:** i-0844022e8ea065ce3
**IP:** 3.87.126.26 (changes when restarted)
**Status:** STOPPED
**Cost when stopped:** ~$2/month (EBS storage only)
**Cost per demo:** ~$0.15/hour

## 🚀 Before Demo (1 hour before)

### Step 1: Start Instance

```bash
cd infra
AWS_PROFILE=tyler aws ec2 start-instances --instance-ids i-0844022e8ea065ce3 --region us-east-1

# Wait 2 minutes for boot
sleep 120
```

### Step 2: Get New IP Address

```bash
NEW_IP=$(AWS_PROFILE=tyler terraform output -raw instance_public_ip)
echo "New IP: $NEW_IP"
```

### Step 3: Fix Enclave (Quick Workaround)

```bash
# SSH into instance
ssh -i ~/.ssh/nautilus-key ec2-user@$NEW_IP

# Kill any stuck processes
sudo pkill -9 -f nitro-cli

# Restart allocator
sudo systemctl restart nitro-enclaves-allocator

# Run enclave manually (or use mock mode)
# For demo, use MOCK mode in backend instead
exit
```

### Step 4: Update Backend Config

```bash
cd ../backend

# Option A: Use Real Enclave (if fixed)
cat > .env.local <<EOF
NAUTILUS_API_URL=http://$NEW_IP:5000
USE_REAL_NAUTILUS=true
ENCLAVE_ID=nitro_enclave_1
EOF

# Option B: Use Mock Mode (recommended for hackathon)
cat > .env.local <<EOF
USE_REAL_NAUTILUS=false
EOF

npm run dev
```

## 🛑 After Demo (immediately)

```bash
cd infra
AWS_PROFILE=tyler aws ec2 stop-instances --instance-ids i-0844022e8ea065ce3 --region us-east-1
```

**Saves:** ~$120/month by stopping when not in use!

## 📊 Cost Breakdown

| Scenario | Cost |
|----------|------|
| Running 24/7 | $120-150/month |
| Stopped | $2/month |
| 1 hour demo | $0.15 |
| 10 demos/month | $3.50/month total |

## 🎯 Recommended: Use Mock Mode

For hackathon demo, **use mock Nautilus mode**:

```bash
cd backend
USE_REAL_NAUTILUS=false npm run dev
```

Benefits:
- ✅ No AWS costs
- ✅ No instance management
- ✅ Works offline
- ✅ Same API interface
- ✅ Faster responses

The backend already has full mock implementation!

## 🔧 If You Need Real Enclave Later

After hackathon, when you have time to debug:

1. Fix the enclave Node.js code issues
2. Or rewrite in Python/Rust (more stable)
3. Test thoroughly before demo
4. Deploy to production

## 📝 Quick Commands

```bash
# Check instance status
AWS_PROFILE=tyler aws ec2 describe-instances \
  --instance-ids i-0844022e8ea065ce3 \
  --query 'Reservations[0].Instances[0].State.Name' \
  --output text

# Start instance
AWS_PROFILE=tyler aws ec2 start-instances --instance-ids i-0844022e8ea065ce3

# Stop instance
AWS_PROFILE=tyler aws ec2 stop-instances --instance-ids i-0844022e8ea065ce3

# Get current IP
AWS_PROFILE=tyler terraform -chdir=infra output -raw instance_public_ip

# SSH into instance
ssh -i ~/.ssh/nautilus-key ec2-user@$(AWS_PROFILE=tyler terraform -chdir=infra output -raw instance_public_ip)
```

---

**TL;DR:** Dùng mock mode cho demo. Instance đã stopped để tiết kiệm tiền. Chỉ start khi cần real enclave.
