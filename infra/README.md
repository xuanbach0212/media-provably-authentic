# 🚀 Nautilus Nitro Enclave Infrastructure

Terraform configuration for deploying AWS Nitro Enclaves for the Media Provably Authentic project.

## 💰 Cost Estimate

| Configuration | Cost/Month | Notes |
|--------------|------------|-------|
| **Spot Instance** | **$25-40** | ✅ Recommended for hackathon |
| On-Demand | $120-150 | Production fallback |
| + Elastic IP | +$3.60 | Optional stable endpoint |

## 📋 Prerequisites

1. **AWS Account**
   - Free tier eligible OR AWS Activate credits ($1,000)
   - Apply: https://aws.amazon.com/activate/

2. **Terraform**
   ```bash
   # macOS
   brew install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

3. **AWS CLI**
   ```bash
   # macOS
   brew install awscli

   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

4. **SSH Key Pair**
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/nautilus-key
   ```

## 🚀 Quick Start

### 1. Configure AWS Credentials

```bash
aws configure
# AWS Access Key ID: [your-key]
# AWS Secret Access Key: [your-secret]
# Default region: us-east-1
# Default output format: json
```

### 2. Setup Terraform Variables

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
# REQUIRED: Add your SSH public key
cat ~/.ssh/nautilus-key.pub  # Copy this
nano terraform.tfvars        # Paste into ssh_public_key
```

### 3. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy (takes ~5 minutes)
terraform apply
```

### 4. Get Connection Info

```bash
# Get outputs
terraform output

# SSH into instance
terraform output -raw ssh_command | bash

# Get API endpoint
terraform output enclave_api_endpoint
```

## 🔧 Configuration Options

### Instance Types (Nitro-Enabled)

| Type | vCPU | RAM | Spot $/hr | On-Demand $/hr | Recommended |
|------|------|-----|-----------|----------------|-------------|
| **c6a.xlarge** | 4 | 8GB | $0.05 | $0.17 | ✅ Best value |
| c6a.large | 2 | 4GB | $0.03 | $0.09 | Budget option |
| c6i.xlarge | 4 | 8GB | $0.06 | $0.17 | Intel alternative |
| c6a.2xlarge | 8 | 16GB | $0.10 | $0.34 | Overkill |

### Cost Optimization

**Option 1: Spot Instances (70% discount)**
```hcl
use_spot_instance = true
spot_max_price    = "0.10"  # Max you'll pay
```

**Option 2: Start/Stop Schedule**
```bash
# Stop instance when not needed
aws ec2 stop-instances --instance-ids $(terraform output -raw instance_id)

# Start before demo
aws ec2 start-instances --instance-ids $(terraform output -raw instance_id)

# Cost: Only pay for uptime
# 8 hours/day = ~$12/month
# 4 hours for demos = ~$0.20
```

**Option 3: Auto-Shutdown**
```hcl
auto_shutdown_enabled = true
auto_shutdown_cron    = "0 2 * * *"  # 2 AM daily
```

## 📊 Verification

### Check Enclave Status

```bash
# SSH into instance
ssh -i ~/.ssh/nautilus-key ec2-user@$(terraform output -raw instance_public_ip)

# Inside instance:
sudo nitro-cli describe-enclaves

# Should show:
# {
#   "EnclaveID": "i-xxxxx-enc-xxxxx",
#   "ProcessID": 1234,
#   "EnclaveCID": 16,
#   "NumberOfCPUs": 2,
#   "CPUIDs": [1, 3],
#   "MemoryMiB": 6144,
#   "State": "RUNNING",
#   "Flags": "DEBUG_MODE"
# }
```

### Test Enclave Connection

```bash
# Health check
curl http://$(terraform output -raw instance_public_ip):8080/health

# Test enclave API
echo '{"action":"ping"}' | nc $(terraform output -raw instance_public_ip) 5000

# Should return:
# {"status":"ok","timestamp":"2024-01-..."}
```

### View Enclave Console

```bash
# SSH into instance
ssh -i ~/.ssh/nautilus-key ec2-user@$(terraform output -raw instance_public_ip)

# Get enclave ID
ENCLAVE_ID=$(sudo nitro-cli describe-enclaves | jq -r '.[0].EnclaveID')

# View console (live logs)
sudo nitro-cli console --enclave-id $ENCLAVE_ID

# Press Ctrl+C to exit
```

### Get PCR Measurements

```bash
# SSH into instance
ssh -i ~/.ssh/nautilus-key ec2-user@$(terraform output -raw instance_public_ip)

# View measurements
cat /opt/nautilus/measurements.txt

# PCR0: abc123def456...
# This is your MRENCLAVE value for verification
```

## 🔗 Integrate with Backend

### Update Backend Environment

```bash
# Get the enclave endpoint
terraform output -json env_variables > ../backend/.env.nitro

# Or manually add to backend/.env:
NAUTILUS_API_URL=http://[INSTANCE_IP]:5000
USE_REAL_NAUTILUS=true
ENCLAVE_ID=nitro_enclave_1
NAUTILUS_MRENCLAVE=[PCR0_VALUE]
```

### Test from Backend

```bash
cd ../backend

# Test connection
curl $NAUTILUS_API_URL/health

# Run backend with Nitro enabled
npm run dev
```

## 🛠️ Management Commands

### View Logs

```bash
# System logs
ssh -i ~/.ssh/nautilus-key ec2-user@$(terraform output -raw instance_public_ip) \
  "sudo journalctl -u nautilus-enclave -f"

# Enclave console
ssh -i ~/.ssh/nautilus-key ec2-user@$(terraform output -raw instance_public_ip) \
  "sudo nitro-cli console --enclave-id \$(sudo nitro-cli describe-enclaves | jq -r '.[0].EnclaveID')"

# CloudWatch logs
aws logs tail /aws/ec2/media-auth-nitro-enclave --follow
```

### Restart Enclave

```bash
ssh -i ~/.ssh/nautilus-key ec2-user@$(terraform output -raw instance_public_ip) << 'EOF'
  # Stop enclave
  ENCLAVE_ID=$(sudo nitro-cli describe-enclaves | jq -r '.[0].EnclaveID')
  sudo nitro-cli terminate-enclave --enclave-id $ENCLAVE_ID

  # Restart via systemd
  sudo systemctl restart nautilus-enclave
EOF
```

### Update Enclave Code

```bash
# 1. Build new Docker image locally
cd enclave
docker build -t nautilus-enclave:latest .
docker save nautilus-enclave:latest | gzip > nautilus-enclave.tar.gz

# 2. Upload to instance
scp -i ~/.ssh/nautilus-key nautilus-enclave.tar.gz \
  ec2-user@$(terraform output -raw instance_public_ip):/tmp/

# 3. Deploy on instance
ssh -i ~/.ssh/nautilus-key ec2-user@$(terraform output -raw instance_public_ip) << 'EOF'
  cd /opt/nautilus

  # Load new image
  sudo docker load < /tmp/nautilus-enclave.tar.gz

  # Rebuild EIF
  sudo nitro-cli build-enclave \
    --docker-uri nautilus-enclave:latest \
    --output-file nautilus.eif

  # Restart enclave
  sudo systemctl restart nautilus-enclave
EOF
```

## 🔒 Security Best Practices

### 1. Restrict SSH Access

```hcl
# In terraform.tfvars
allowed_ssh_cidr = ["YOUR_IP/32"]  # Only your IP
```

### 2. Restrict API Access

```hcl
# In terraform.tfvars
allowed_api_cidr = ["YOUR_BACKEND_IP/32"]  # Only your backend
```

### 3. Enable Encryption

- ✅ EBS volumes encrypted (already configured)
- ✅ Use HTTPS for API (add ALB + ACM certificate)

### 4. Rotate SSH Keys

```bash
# Generate new key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/nautilus-key-new

# Update in terraform.tfvars
ssh_public_key = "ssh-rsa ..."

# Apply
terraform apply
```

## 🐛 Troubleshooting

### Enclave Not Running

```bash
# Check status
sudo nitro-cli describe-enclaves

# Check why it failed
sudo journalctl -u nautilus-enclave -n 50

# Manually start
cd /opt/nautilus
sudo nitro-cli run-enclave \
  --eif-path nautilus.eif \
  --memory 6144 \
  --cpu-count 2 \
  --enclave-cid 16 \
  --debug-mode
```

### Cannot Connect to Enclave

```bash
# Check if proxy is running
ps aux | grep socat

# Restart proxy
sudo pkill socat
sudo nohup socat TCP-LISTEN:5000,fork VSOCK-CONNECT:16:5000 &

# Test locally
echo '{"action":"ping"}' | nc localhost 5000
```

### Spot Instance Interrupted

```bash
# Check if terminated
terraform show | grep spot_instance_id

# Re-apply to get new spot
terraform apply
```

### Out of Memory

```bash
# Reduce enclave memory
nano terraform.tfvars
# enclave_memory_mb = 4096  # Reduce to 4GB

terraform apply
```

## 💸 Cost Monitoring

### View Current Costs

```bash
# Get instance cost
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --filter file://cost-filter.json

# cost-filter.json:
{
  "Tags": {
    "Key": "Project",
    "Values": ["media-provably-authentic"]
  }
}
```

### Set Budget Alert

```bash
# Create budget
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget.json

# budget.json:
{
  "BudgetName": "nautilus-hackathon",
  "BudgetLimit": {
    "Amount": "50",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

## 🧹 Cleanup

### Destroy Infrastructure

```bash
# Preview what will be destroyed
terraform plan -destroy

# Destroy all resources
terraform destroy

# Confirm: yes
```

### Manual Cleanup (if needed)

```bash
# Terminate spot instances
aws ec2 terminate-instances --instance-ids $(terraform output -raw instance_id)

# Delete security group
aws ec2 delete-security-group --group-id $(terraform output -raw security_group_id)

# Delete VPC
aws ec2 delete-vpc --vpc-id $(terraform output -raw vpc_id)
```

## 📚 Resources

- [AWS Nitro Enclaves Docs](https://docs.aws.amazon.com/enclaves/)
- [Nautilus GitHub](https://github.com/MystenLabs/nautilus)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Pricing Calculator](https://calculator.aws/)

## 🆘 Support

Issues? Check:
1. [Troubleshooting Guide](#-troubleshooting)
2. [AWS EC2 Status](https://health.aws.amazon.com/health/status)
3. Create issue: https://github.com/yourusername/media-provably-authentic/issues

## 📝 Next Steps

After deployment:

1. ✅ Update backend .env with enclave endpoint
2. ✅ Test connection from backend
3. ✅ Deploy smart contracts to verify attestations
4. ✅ Update frontend to show "Real TEE" badge
5. ✅ Document for hackathon judges

**Estimated Total Time:** 30 minutes
**Estimated Monthly Cost:** $25-40 (or $0 with AWS credits)
