# 🐋 Walrus on Raspberry Pi - Network Optimization

## ❓ Problem

Walrus SDK fails on Raspberry Pi with `fetch failed` errors:

```
[Walrus] SDK retrieve error: fetch failed
Failed to retrieve blob from Walrus testnet: fetch failed
```

## 🔍 Root Cause

1. **Walrus requires ~335 HTTP requests** to read a single blob (sharded storage)
2. **Raspberry Pi has slower network** than Mac/Desktop
3. **Default 60s timeout** is too short for Pi's network speed
4. **Single retry** is not enough for transient network issues

## ✅ Solution Applied

### 1. Increased Timeout: 60s → 180s (3 minutes)

```typescript
storageNodeClientOptions: {
  timeout: 180_000, // 3 minutes for Raspberry Pi
  onError: (error) => {
    console.warn("[Walrus] Storage node error:", error.message);
  },
}
```

### 2. Added Retry Logic with Exponential Backoff

```typescript
const maxRetries = 3;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const data = await this.client.walrus.readBlob({ blobId });
    return Buffer.from(data);
  } catch (error) {
    if (error.name === "RetryableWalrusClientError" && attempt < maxRetries) {
      this.client.walrus.reset();
      // Exponential backoff: 2s, 4s, 8s
      await sleep(Math.pow(2, attempt) * 1000);
      continue;
    }
    throw error;
  }
}
```

## 📊 Performance Expectations

### Mac/Desktop
- First blob read: ~10-20 seconds
- Subsequent reads: ~5-10 seconds

### Raspberry Pi 4
- First blob read: ~30-90 seconds (with 180s timeout)
- Subsequent reads: ~15-30 seconds
- With retries: Up to 3 attempts = max ~5 minutes

### Raspberry Pi 3 or slower network
- May need even longer timeout (300s = 5 minutes)
- Consider using local caching

## 🔧 If Still Failing

### Option 1: Increase Timeout Further

Edit `backend/src/services/walrus.ts`:

```typescript
storageNodeClientOptions: {
  timeout: 300_000, // 5 minutes for very slow networks
  // ...
}
```

### Option 2: Check Network Speed

Test connectivity to Walrus aggregator from your Raspberry Pi.

### Option 3: Monitor Logs

```bash
# Watch Walrus operations
docker-compose logs -f backend | grep Walrus

# You should see:
# [Walrus] Retrieving blob: ...
# [Walrus] ✓ Retrieved X bytes
# OR
# [Walrus] SDK retrieve error (attempt 1/3): ...
# [Walrus] Resetting client and retrying...
# [Walrus] Waiting 2000ms before retry...
```

## 🎯 Recommendations

### For Production on Raspberry Pi:

1. **Use Raspberry Pi 4** (4GB+ RAM)
2. **Wired Ethernet** (not WiFi) for stable network
3. **Good internet connection** (10+ Mbps)
4. **Monitor first deployment** to see actual timings
5. **Consider caching** frequently accessed blobs

### For Development:

1. **Test on Mac first** to verify Walrus works
2. **Deploy to Pi** with increased timeouts
3. **Monitor logs** for actual performance
4. **Adjust timeouts** based on real data

## 📝 Current Configuration

File: `backend/src/services/walrus.ts`

```typescript
// Timeout: 180 seconds (3 minutes)
timeout: 180_000

// Retries: 3 attempts with exponential backoff
maxRetries: 3
backoff: 2s, 4s, 8s
```

## 🚨 Important Notes

1. **First blob read is always slower** (cold start)
2. **Subsequent reads are faster** (warm cache)
3. **Network issues are retried automatically** (up to 3 times)
4. **Total max time**: 180s × 3 attempts = 9 minutes worst case
5. **This is normal for Walrus** on slower hardware/network

## ✅ Verification

After deploying to Raspberry Pi:

```bash
# 1. Upload an image via frontend
# 2. Watch backend logs
docker-compose logs -f backend | grep -E "Walrus|Storing|Retrieved"

# You should see:
# [Walrus] Storing X bytes via SDK...
# [Walrus] ✓ Stored: <blobId>
# [Walrus] Retrieving blob: <blobId>...
# [Walrus] ✓ Retrieved X bytes
```

If you see retries, that's OK! The system will automatically retry.

---

**Summary**: Walrus on Raspberry Pi is slower but works with proper timeout and retry configuration. Be patient on first run! 🐋🍓

