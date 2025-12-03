# Walrus Storage Troubleshooting Guide

## Overview

This document details the Walrus SDK connectivity issues encountered in Docker environments and provides comprehensive troubleshooting steps and workarounds.

## Problem Description

**Symptom:** Walrus SDK fails with "fetch failed" error in Docker containers for both `storeBlob()` and `retrieveBlob()` operations.

**Error Message:**
```
[Walrus] SDK store error: fetch failed
[Walrus] SDK retrieve error: fetch failed
```

**Impact:** Users cannot complete media verification flow when Walrus is the primary storage provider.

---

## Root Causes

### 1. Docker Networking Limitations
- Docker's internal networking prevents Walrus SDK from reaching external storage nodes
- Network isolation interferes with SDK's fetch implementation

### 2. IPv6/IPv4 DNS Resolution Conflicts
- Node.js in Docker prefers IPv6 addresses when available
- Walrus storage nodes may not support IPv6 connections properly
- DNS resolution returns IPv6 addresses first, causing connection failures

### 3. Walrus SDK Internal Fetch Implementation
- SDK's internal fetch mechanism is incompatible with Docker's network stack
- Custom fetch configurations cannot be easily passed to the SDK
- SDK does not expose low-level network configuration options

### 4. Storage Node Availability
- Walrus testnet storage nodes may be temporarily unavailable
- Network latency from Docker containers to storage nodes exceeds timeouts
- Geographic distance to storage nodes causes connection issues

---

## Solutions Implemented

### 1. Storage Abstraction Layer

**What:** Created a provider-based architecture with fallback support.

**Files:**
- `backend/src/services/storage/IStorageProvider.ts` - Interface definition
- `backend/src/services/storage/WalrusProvider.ts` - Walrus implementation
- `backend/src/services/storage/LocalFileProvider.ts` - Local fallback
- `backend/src/services/storage.ts` - Provider management

**Benefits:**
- Automatic fallback to local storage when Walrus fails
- Seamless user experience regardless of storage backend
- Easy to add new storage providers in the future

### 2. Local File Storage Fallback

**What:** Local filesystem-based storage as a reliable fallback.

**Location:** `backend/uploads/blobs/`

**Features:**
- Deterministic blob IDs using SHA-256 hashing
- Metadata storage alongside blobs
- Same interface as Walrus provider

**Trade-offs:**
- Not decentralized
- Limited to single server
- No built-in redundancy

### 3. Docker Network Optimizations

**Applied Fixes:**

```yaml
# docker-compose.yml
backend:
  environment:
    - NODE_OPTIONS=--dns-result-order=ipv4first
    - STORAGE_PROVIDER=local  # Force local in Docker
  dns:
    - 8.8.8.8  # Google DNS
    - 8.8.4.4
  extra_hosts:
    - "publisher.walrus-testnet.walrus.space:34.13.79.249"
    - "aggregator.walrus-testnet.walrus.space:172.64.151.247"
  sysctls:
    - net.ipv6.conf.all.disable_ipv6=1
  cap_add:
    - NET_ADMIN
```

```dockerfile
# backend/Dockerfile
RUN echo 'net.ipv6.conf.all.disable_ipv6 = 1' >> /etc/sysctl.conf || true
RUN apk add --no-cache curl bind-tools
```

**Result:** Improved but did not fully resolve Walrus SDK issues in Docker.

### 4. Configuration-Based Provider Selection

**Environment Variables:**

```env
# Use local storage in Docker
STORAGE_PROVIDER=local

# Enable automatic fallback
WALRUS_FALLBACK_ENABLED=true

# Walrus SDK timeouts
WALRUS_TIMEOUT=180000
WALRUS_MAX_RETRIES=1
```

---

## Diagnostic Tools

### Walrus Diagnostic Script

**Location:** `backend/src/scripts/test-walrus.ts`

**Run locally:**
```bash
cd backend
npm run test-walrus
```

**Run in Docker:**
```bash
docker exec media-auth-backend npm run test-walrus
```

**What it tests:**
1. DNS resolution for Walrus domains
2. Direct HTTPS connectivity to storage nodes
3. Walrus SDK initialization
4. Store and retrieve operations (if keypair available)

**Output:** Detailed diagnostics showing exactly where the failure occurs.

---

## Troubleshooting Steps

### Step 1: Check Current Storage Provider

```bash
# Check backend logs
docker-compose logs backend | grep Storage

# Expected output:
# [Storage] Using LocalFile provider
# OR
# [Storage] Using Walrus provider
```

### Step 2: Verify Environment Configuration

```bash
# Check .env file
cat backend/.env | grep STORAGE

# Should see:
# STORAGE_PROVIDER=local (for Docker)
# WALRUS_FALLBACK_ENABLED=true
```

### Step 3: Test Walrus Connectivity

```bash
# From host machine
curl -v https://publisher.walrus-testnet.walrus.space/v1/status

# From Docker container
docker exec media-auth-backend curl -v https://publisher.walrus-testnet.walrus.space/v1/status

# Compare results
```

### Step 4: Run Diagnostic Script

```bash
# In Docker
docker exec media-auth-backend npm run test-walrus

# Review output for failures
```

### Step 5: Check DNS Resolution

```bash
# In Docker container
docker exec media-auth-backend nslookup publisher.walrus-testnet.walrus.space

# Should resolve to IPv4 address: 34.13.79.249
```

### Step 6: Test with Local Storage

```bash
# Update docker-compose.yml
environment:
  - STORAGE_PROVIDER=local

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Test upload - should work
```

---

## Common Issues and Fixes

### Issue 1: "fetch failed" in Docker

**Cause:** Walrus SDK cannot reach storage nodes from Docker.

**Fix:** Use local storage provider in Docker:
```env
STORAGE_PROVIDER=local
```

### Issue 2: Upload works but retrieve fails

**Cause:** Blob not yet synced across storage nodes.

**Fix:** 
- Increase `WALRUS_TIMEOUT`
- Enable fallback to local storage
- Wait longer before retrieving

### Issue 3: Works locally but not in Docker

**Cause:** Docker networking restrictions.

**Fix:** Run backend locally (not in Docker) for Walrus support:
```bash
./stop-all-services.sh
cd backend && npm run dev
```

### Issue 4: "No keypair" error

**Cause:** `SUI_PRIVATE_KEY` not set or invalid.

**Fix:** 
```bash
# Check if set
docker exec media-auth-backend printenv SUI_PRIVATE_KEY

# Update .env with valid key
```

### Issue 5: Timeout errors

**Cause:** Network latency or slow storage nodes.

**Fix:**
```env
WALRUS_TIMEOUT=300000  # Increase to 5 minutes
WALRUS_MAX_RETRIES=3   # More retry attempts
```

---

## Recommended Deployment Strategies

### For Docker Deployment (Raspberry Pi, Production)

**Use local storage:**
```env
STORAGE_PROVIDER=local
WALRUS_FALLBACK_ENABLED=true
```

**Pros:**
- Reliable and fast
- No network dependencies
- Works in all environments

**Cons:**
- Not decentralized
- Single point of failure
- Limited to server storage capacity

### For Local Development

**Use Walrus with fallback:**
```env
STORAGE_PROVIDER=walrus
WALRUS_FALLBACK_ENABLED=true
```

**Pros:**
- Tests real Walrus integration
- Automatic fallback if issues occur
- Best of both worlds

**Cons:**
- Requires valid SUI private key
- Dependent on Walrus testnet availability

### For Demo/Hackathon

**Use local storage:**
```env
STORAGE_PROVIDER=local
```

**Reason:** Ensures demo works reliably without network dependencies.

---

## Future Improvements

### Short-term
1. Investigate Walrus SDK source code for custom fetch configuration
2. Test with different Docker network modes (bridge, host)
3. Contact Walrus team about Docker compatibility

### Long-term
1. Implement IPFS as alternative decentralized storage
2. Add S3-compatible storage provider
3. Implement hybrid storage (local + Walrus sync)
4. Create custom Walrus client without SDK dependency

---

## Additional Resources

- [Walrus SDK Documentation](https://sdk.mystenlabs.com/walrus)
- [Walrus Testnet Status](https://walrus-testnet.walrus.space)
- [Docker Networking Guide](https://docs.docker.com/network/)
- [Sui Documentation](https://docs.sui.io)

---

## Support

If you encounter issues not covered in this guide:

1. Run the diagnostic script and save output
2. Check Docker logs: `docker-compose logs backend`
3. Test connectivity from host machine
4. Compare results between Docker and host
5. Open an issue with diagnostic output

---

## Changelog

- **2024-11-28**: Initial troubleshooting guide created
- **2024-11-28**: Added storage abstraction layer
- **2024-11-28**: Implemented local file fallback
- **2024-11-28**: Created diagnostic script

