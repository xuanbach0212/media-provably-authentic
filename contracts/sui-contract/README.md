# Media Verification Smart Contract

## Overview
This Move smart contract records media verification attestations on Sui blockchain.

## Contract Structure

### Attestation Object
- `job_id`: Unique verification job identifier
- `media_hash`: SHA-256 hash of media file
- `report_cid`: Walrus CID of verification report
- `verdict`: AUTHENTIC | MANIPULATED | AI_GENERATED | UNKNOWN
- `enclave_signature`: Nautilus TEE signature
- `timestamp`: Verification time
- `submitter`: Address that submitted attestation

### Functions

#### `submit_attestation`
Submit a new verification attestation to blockchain.

**Parameters:**
- `job_id`: Job identifier
- `media_hash`: Media SHA-256 hash
- `report_cid`: Report storage CID
- `verdict`: Verification verdict
- `enclave_signature`: TEE signature
- `clock`: Sui clock object
- `ctx`: Transaction context

**Events:**
- `AttestationCreated`: Emitted on successful submission

## Deployment

### Prerequisites
1. Install Sui CLI: https://docs.sui.io/guides/developer/getting-started/sui-install
2. Get testnet SUI tokens from faucet
3. Configure wallet with private key

### Deploy Command
```bash
cd sui-contract
sui client publish --gas-budget 100000000
```

### After Deployment
1. Note the Package ID
2. Update backend/.env:
   ```
   SUI_PACKAGE_ID=<package-id>
   ```

## Usage from Backend

```typescript
import { SuiService } from './services/sui';

const sui = new SuiService();

await sui.submitAttestation(
  jobId,
  mediaHash,
  reportCID,
  verdict,
  enclaveSignature
);
```

## Security Considerations

1. **Immutability**: Attestations are permanent on-chain
2. **Verification**: All parameters are stored for verification
3. **Events**: Indexable for querying attestation history
4. **Access**: Any address can submit (consider access control for production)

## Gas Costs (Testnet)
- Attestation submission: ~0.001 SUI
- Query (read): Free

## Future Enhancements
- Add dispute mechanism
- Implement voting/consensus
- Oracle reputation tracking
- Slashing for fraud

