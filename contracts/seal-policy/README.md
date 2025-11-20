# Seal Access Policy - Enclave Allowlist

This Move module defines an access policy for Seal encryption that only allows specific enclave IDs to decrypt data.

## Policy Design

**Type:** Enclave-based allowlist  
**Use case:** Media authentication with multi-enclave verification

Only enclaves with pre-approved IDs can decrypt the media data. This ensures:
- Only trusted verification enclaves can access encrypted media
- Centralized control over which enclaves are authorized
- Easy to add/remove enclaves as needed

## Functions

### `create_policy(allowed_enclaves, ctx)`
Creates a new policy with initial list of allowed enclave IDs.

### `seal_approve(policy, enclave_id, ctx)`
**This is the key function called by Seal SDK.**  
Checks if the requesting enclave ID is in the allowed list.
- If YES → Seal provides decryption keys
- If NO → Transaction fails, no decryption

### `add_enclave(policy, enclave_id, ctx)`
Owner can add new enclave to allowlist.

### `remove_enclave(policy, enclave_id, ctx)`
Owner can remove enclave from allowlist.

## Deployment

```bash
cd contracts/seal-policy
sui move build
sui client publish --gas-budget 100000000
```

Save the Package ID and Policy Object ID for Seal SDK configuration.

## Usage with Seal SDK

```typescript
// Encrypt with this policy
const { encryptedObject } = await sealClient.encrypt({
  threshold: 2,
  packageId: fromHEX(policyPackageId),
  id: fromHEX(policyObjectId),
  data: mediaBuffer,
});

// Decrypt (only if enclave is allowed)
const tx = new Transaction();
tx.moveCall({
  target: `${packageId}::enclave_policy::seal_approve`,
  arguments: [
    tx.object(policyObjectId),
    tx.pure.vector("u8", fromHEX(enclaveId)),
  ],
});
const txBytes = tx.build({ client: suiClient, onlyTransactionKind: true });
const decryptedBytes = await sealClient.decrypt({
  data: encryptedObject,
  sessionKey,
  txBytes,
});
```

## Example Enclave IDs

For development/testing:
- `enclave_1` (worker 1)
- `enclave_2` (worker 2)  
- `enclave_3` (worker 3)

For production with Nautilus:
- AWS Nitro Enclave PCR values
- Hash of enclave image

