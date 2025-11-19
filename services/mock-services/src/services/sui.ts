import { v4 as uuidv4 } from 'uuid';
import { BlockchainAttestation } from '@media-auth/shared';

export class MockSui {
  private attestations: Map<string, BlockchainAttestation> = new Map();
  private blockNumber: number = 0;
  
  async submitAttestation(
    jobId: string,
    mediaHash: string,
    reportCID: string,
    verdict: BlockchainAttestation['verdict'],
    enclaveSignature: string
  ): Promise<BlockchainAttestation> {
    this.blockNumber++;
    
    const attestationId = uuidv4();
    const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    
    const attestation: BlockchainAttestation = {
      attestationId,
      jobId,
      mediaHash,
      reportCID,
      verdict,
      enclaveSignature,
      timestamp: new Date().toISOString(),
      blockNumber: this.blockNumber,
      txHash
    };
    
    this.attestations.set(attestationId, attestation);
    
    console.log(`[MockSui] Created attestation ${attestationId} at block ${this.blockNumber}`);
    return attestation;
  }
  
  async getAttestation(attestationId: string): Promise<BlockchainAttestation | null> {
    const attestation = this.attestations.get(attestationId);
    if (!attestation) {
      console.log(`[MockSui] Attestation ${attestationId} not found`);
      return null;
    }
    return attestation;
  }
  
  async getAttestationsByMediaHash(mediaHash: string): Promise<BlockchainAttestation[]> {
    const attestations: BlockchainAttestation[] = [];
    for (const attestation of this.attestations.values()) {
      if (attestation.mediaHash === mediaHash) {
        attestations.push(attestation);
      }
    }
    return attestations;
  }
  
  async getAttestationsByJobId(jobId: string): Promise<BlockchainAttestation[]> {
    const attestations: BlockchainAttestation[] = [];
    for (const attestation of this.attestations.values()) {
      if (attestation.jobId === jobId) {
        attestations.push(attestation);
      }
    }
    return attestations;
  }
  
  getCurrentBlock(): number {
    return this.blockNumber;
  }
}

import * as crypto from 'crypto';

