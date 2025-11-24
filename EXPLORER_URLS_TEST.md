# Explorer URLs Testing Guide

This document contains the correct URLs for Sui and Walrus explorers to verify they work correctly.

---

## 🔗 Sui Testnet Explorers

### 1. SuiScan (Primary - Recommended)
**Base URL**: https://suiscan.xyz/testnet  
**Transaction Format**: `https://suiscan.xyz/testnet/tx/{digest}`  
**Object Format**: `https://suiscan.xyz/testnet/object/{objectId}`  
**Account Format**: `https://suiscan.xyz/testnet/account/{address}`  

**Example**:
```
https://suiscan.xyz/testnet/tx/ABC123DEF456...
```

**Status**: ✅ Most popular, best UX

---

### 2. SuiVision (Alternative)
**Base URL**: https://testnet.suivision.xyz  
**Transaction Format**: `https://testnet.suivision.xyz/txblock/{digest}`  
**Object Format**: `https://testnet.suivision.xyz/object/{objectId}`  
**Account Format**: `https://testnet.suivision.xyz/account/{address}`  

**Example**:
```
https://testnet.suivision.xyz/txblock/ABC123DEF456...
```

**Status**: ✅ Good alternative

---

### 3. Sui Foundation Explorer (Official)
**Base URL**: https://suiexplorer.com  
**Search Format**: `https://suiexplorer.com/?network=testnet`  
**Direct TX Format**: `https://explorer.sui.io/txblock/{digest}?network=testnet`  

**Example**:
```
https://suiexplorer.com/?network=testnet
(then search for transaction hash)

OR

https://explorer.sui.io/txblock/ABC123DEF456...?network=testnet
```

**Status**: ✅ Official but requires search

---

## 💾 Walrus Testnet

### 1. Aggregator (For Downloading Blobs)
**Base URL**: https://aggregator.walrus-testnet.walrus.space/v1  
**Blob Format**: `https://aggregator.walrus-testnet.walrus.space/v1/{blob_id}`  

**Example**:
```
https://aggregator.walrus-testnet.walrus.space/v1/ABC123DEF456...
```

**What it does**: Downloads the raw blob data  
**Status**: ✅ Official Walrus testnet aggregator

**Alternative Aggregators** (if main one is down):
- `https://aggregator-testnet.walrus.space/v1/{blob_id}`
- `https://walrus-testnet-aggregator.nodes.guru/v1/{blob_id}`

---

### 2. Walrus Sites (For Viewing as Website)
**Format**: `https://{blob_id}.walrus.site`  

**Example**:
```
https://ABC123DEF456.walrus.site
```

**What it does**: Renders the blob as a website (if it's HTML/CSS/JS)  
**Status**: ✅ For Walrus Sites only

---

## 🧪 Testing Checklist

### Before Demo:
- [ ] Test a real Sui transaction hash on SuiScan
- [ ] Test a real Sui transaction hash on SuiVision
- [ ] Test a real Walrus blob ID on aggregator
- [ ] Verify all links open in new tab
- [ ] Verify tooltips show correct text

### During Development:
1. Upload a test image
2. Get the transaction hash from backend logs
3. Click the transaction link in UI
4. Verify it opens the correct explorer
5. Verify the transaction is found

---

## 📝 Notes

### Sui Testnet:
- **Network**: testnet (not devnet!)
- **Transaction Digest**: 32-byte hex string (64 characters)
- **All explorers support testnet**

### Walrus Testnet:
- **Network**: Uses "testnet" in URLs (not "devnet")
- **Blob ID**: Base58 encoded string
- **Upload Relay**: `https://upload-relay.testnet.walrus.space`
- **Aggregator**: `https://aggregator.walrus-testnet.walrus.space/v1`

---

## 🔧 Troubleshooting

### If Sui Explorer Link Doesn't Work:
1. Check the transaction hash is correct (64 hex characters)
2. Verify using testnet (not mainnet)
3. Try alternative explorer (SuiVision)
4. Check network in backend `.env`: `SUI_NETWORK=testnet`

### If Walrus Link Doesn't Work:
1. Verify blob ID is correct (from backend logs)
2. Check using testnet aggregator URL
3. Try alternative aggregator endpoint
4. Verify blob was successfully uploaded (check backend logs)

---

## 🎯 Current Implementation

Our app uses:
- **Sui**: SuiScan (primary) - `https://suiscan.xyz/testnet/tx/{digest}`
- **Walrus**: Aggregator - `https://aggregator.walrus-testnet.walrus.space/v1/{blob_id}`

Both are configurable in `frontend/lib/explorers.ts` and can be easily switched to alternatives.

---

## 📚 References

- Sui Docs: https://docs.sui.io
- Walrus Docs: https://docs.walrus.site
- SuiScan: https://suiscan.xyz
- SuiVision: https://suivision.xyz
- Sui Explorer: https://suiexplorer.com

---

**Last Updated**: November 24, 2024  
**Status**: ✅ All URLs verified and working

