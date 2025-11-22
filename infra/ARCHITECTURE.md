# 🏗️ Nautilus Infrastructure Architecture

## Overview

This Terraform configuration deploys a production-ready AWS Nitro Enclave for the Media Provably Authentic project.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS Region (us-east-1)                  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              VPC (10.0.0.0/16)                         │ │
│  │                                                         │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │   Public Subnet (10.0.1.0/24)                    │ │ │
│  │  │                                                   │ │ │
│  │  │   ┌────────────────────────────────────────┐    │ │ │
│  │  │   │  EC2: c6a.xlarge (Spot)                │    │ │ │
│  │  │   │  - 4 vCPU, 8GB RAM                     │    │ │ │
│  │  │   │  - Nitro Enclaves Enabled              │    │ │ │
│  │  │   │                                         │    │ │ │
│  │  │   │  Parent Instance (2 CPU, 2GB RAM)      │    │ │ │
│  │  │   │  ┌───────────────────────────────┐    │    │ │ │
│  │  │   │  │ - Docker                      │    │    │ │ │
│  │  │   │  │ - vsock-proxy (port 5000)     │    │    │ │ │
│  │  │   │  │ - Health server (port 8080)   │    │    │ │ │
│  │  │   │  └───────────────────────────────┘    │    │ │ │
│  │  │   │            ↕ vsock                      │    │ │ │
│  │  │   │  ┌───────────────────────────────┐    │    │ │ │
│  │  │   │  │  Nitro Enclave                │    │    │ │ │
│  │  │   │  │  (2 CPU, 6GB RAM)             │    │    │ │ │
│  │  │   │  │                                │    │    │ │ │
│  │  │   │  │  - Node.js server             │    │    │ │ │
│  │  │   │  │  - Report signing             │    │    │ │ │
│  │  │   │  │  - Attestation generation     │    │    │ │ │
│  │  │   │  │                                │    │    │ │ │
│  │  │   │  │  Hardware Isolated ✓          │    │    │ │ │
│  │  │   │  │  No Network Access ✓          │    │    │ │ │
│  │  │   │  │  Encrypted Memory ✓           │    │    │ │ │
│  │  │   │  └───────────────────────────────┘    │    │ │ │
│  │  │   │                                         │    │ │ │
│  │  │   │  Public IP: [Dynamic or Elastic]       │    │ │ │
│  │  │   └────────────────────────────────────────┘    │ │ │
│  │  │                                                   │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                         │ │
│  │  Security Group:                                       │ │
│  │  - Port 22: SSH (restricted)                          │ │
│  │  - Port 5000: Enclave API                             │ │
│  │  - Port 8080: Health check                            │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────── │ │
│                                                               │
│  IAM Role:                                                    │
│  - EC2 assume role                                            │
│  - KMS decrypt                                                │
│  - S3 access                                                  │
│  - CloudWatch logs                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘

External Access:
- Backend → http://[IP]:5000 (Enclave API)
- Monitoring → http://[IP]:8080/health
- Admin → ssh ec2-user@[IP]
```

## Component Details

### VPC & Networking

```hcl
VPC: 10.0.0.0/16
├── Public Subnet: 10.0.1.0/24
│   ├── Internet Gateway
│   └── Route Table (0.0.0.0/0 → IGW)
└── Security Group
    ├── Ingress: SSH (22)
    ├── Ingress: API (5000)
    ├── Ingress: Health (8080)
    └── Egress: All (0.0.0.0/0)
```

### EC2 Instance

**Instance Type:** c6a.xlarge (AMD EPYC, Nitro Enclaves)
- **vCPU:** 4 cores
- **RAM:** 8GB
- **Storage:** 30GB gp3 EBS (encrypted)
- **Network:** Enhanced networking

**Resource Allocation:**
```
Parent Instance:
- CPU: 2 cores
- RAM: 2GB
- Purpose: Host OS, Docker, proxy

Nitro Enclave:
- CPU: 2 cores (isolated)
- RAM: 6GB (isolated)
- Purpose: Secure computation
```

### Nitro Enclave

**Features:**
- ✅ Hardware isolation (CPU + Memory)
- ✅ No network access (only vsock to parent)
- ✅ No persistent storage
- ✅ Encrypted memory
- ✅ Attestation support (PCR measurements)

**Communication:**
```
Backend → TCP:5000 → Parent Instance → vsock → Enclave
                        ↓
                  socat proxy
```

### Launch Configuration

**Spot Instance Strategy:**
- **Type:** Persistent
- **Max Price:** $0.10/hour
- **Interruption:** Auto-restart
- **Savings:** ~70% vs on-demand

**User Data:**
- Install Nitro CLI
- Configure allocator
- Build enclave image
- Start enclave
- Setup proxy & health check

## Data Flow

### 1. Verification Request

```
Backend API
    ↓
HTTP POST http://[ENCLAVE_IP]:5000
    ↓
Parent Instance (socat proxy)
    ↓
vsock:16:5000
    ↓
Nitro Enclave
    ↓
Process request (sign report)
    ↓
Return signature + attestation
```

### 2. Health Check

```
Monitoring System
    ↓
HTTP GET http://[ENCLAVE_IP]:8080/health
    ↓
Parent Instance (health server)
    ↓
nitro-cli describe-enclaves
    ↓
Return enclave status JSON
```

### 3. Attestation Verification

```
Sui Smart Contract
    ↓
Verify attestation document
    ↓
Check PCR0 == expected MRENCLAVE
    ↓
Verify AWS signature chain
    ↓
Accept/reject report
```

## Security Model

### Threat Model

**Protected Against:**
- ✅ Compromised OS (enclave isolated)
- ✅ Malicious admin (no access to enclave)
- ✅ Memory dump attacks (encrypted)
- ✅ Network sniffing (no network in enclave)
- ✅ Code tampering (PCR verification)

**Not Protected Against:**
- ❌ Physical hardware attacks
- ❌ Side-channel attacks (partially mitigated)
- ❌ AWS infrastructure compromise (assumed trusted)

### Trust Boundaries

```
Untrusted Zone:
- Internet
- Backend servers
- Admin access

Trust Boundary:
- AWS Nitro Hypervisor

Trusted Zone:
- Nitro Enclave
- Enclave code
- Private keys
```

## Cost Breakdown

### Monthly Cost (Spot Instance)

```
EC2 c6a.xlarge spot:
- Rate: $0.05/hour
- Hours: 730/month
- Cost: $36.50

EBS gp3 30GB:
- Rate: $0.08/GB/month
- Cost: $2.40

Data Transfer:
- First 1GB: Free
- Estimated: ~$1/month

Total: ~$40/month
```

### Cost Optimization

**Strategy 1: Stop When Idle**
```
Running:  $40/month (24/7)
Stopped:  $2/month (storage only)
Savings:  $38/month (95%)
```

**Strategy 2: Demo Mode**
```
Running: 4 hours for demo
Cost: $0.20 per demo
Monthly: ~$1 (5 demos/month)
Savings: $39/month (97%)
```

## Scalability

### Current Capacity

```
1 Enclave = ~100 verifications/hour
- AI detection: ~30s per image
- Processing: 2 parallel workers
- Queue: Bull with Redis
```

### Scale Up Options

**Horizontal (More Enclaves):**
```hcl
# Add 2 more enclaves
count = 3

Cost: $40 × 3 = $120/month
Capacity: ~300 verifications/hour
```

**Vertical (Larger Instance):**
```hcl
instance_type = "c6a.2xlarge"
# 8 vCPU, 16GB RAM
# Enclave: 6 CPU, 12GB

Cost: ~$80/month
Capacity: ~200 verifications/hour
```

## Monitoring

### CloudWatch Metrics

```
- CPUUtilization (Parent + Enclave)
- MemoryUtilization
- NetworkIn/Out
- EBSReadOps/WriteOps
```

### Health Checks

```
External:
- HTTP GET :8080/health
- Response: {"status":"healthy","enclave":{...}}
- Frequency: Every 30s

Internal:
- nitro-cli describe-enclaves
- Check State == "RUNNING"
- Check CPUs/Memory allocation
```

### Logs

```
CloudWatch Logs:
- /aws/ec2/media-auth-nitro-enclave
- Retention: 7 days

Enclave Console:
- Real-time via nitro-cli console
- Stdout/stderr from enclave
```

## Disaster Recovery

### Backup Strategy

**Infrastructure:**
- ✅ Terraform state (S3 + versioning)
- ✅ Enclave image (Docker registry)
- ✅ Configuration (Git)

**Data:**
- N/A (stateless enclave)
- Reports stored in Walrus (separate)

### Recovery Procedures

**Enclave Crash:**
```bash
# Auto-restart via systemd
systemctl restart nautilus-enclave
```

**Instance Termination:**
```bash
# Spot interruption → New instance
terraform apply  # Provisions replacement
```

**Region Failure:**
```bash
# Switch region in terraform.tfvars
aws_region = "us-west-2"
terraform apply
```

## Compliance

### Certifications

- **AWS Nitro:** FIPS 140-2 Level 2
- **EBS Encryption:** AES-256
- **TLS:** 1.2+ (if using ALB)

### Audit Trail

```
CloudTrail:
- EC2 API calls
- IAM role assumptions
- Security group changes

CloudWatch Logs:
- Enclave operations
- API requests
- Health checks
```

## Future Enhancements

### Short Term
- [ ] ALB + HTTPS (SSL/TLS)
- [ ] Auto-scaling group
- [ ] Enhanced monitoring (Datadog/Grafana)

### Long Term
- [ ] Multi-region deployment
- [ ] Blue-green deployments
- [ ] Enclave attestation on-chain verification
- [ ] Hardware Security Module (HSM) integration

---

**Last Updated:** 2024-01
**Terraform Version:** 1.6+
**AWS Provider:** 5.0+
