import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { SealPolicy, EncryptionMetadata } from '@media-auth/shared';

const ALGORITHM = 'aes-256-gcm';

export class MockSeal {
  private policies: Map<string, SealPolicy> = new Map();
  private keys: Map<string, string> = new Map(); // policyId -> CEK
  
  createPolicy(allowedEnclaves: string[]): SealPolicy {
    const policyId = uuidv4();
    const policy: SealPolicy = {
      policyId,
      allowedEnclaves,
      createdAt: new Date().toISOString()
    };
    
    this.policies.set(policyId, policy);
    console.log(`[MockSeal] Created policy ${policyId}`);
    return policy;
  }
  
  async encryptData(data: Buffer, policyId: string): Promise<{ encrypted: Buffer; metadata: EncryptionMetadata }> {
    // Generate a random CEK (Content Encryption Key)
    const cek = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    // Encrypt the data
    const cipher = crypto.createCipheriv(ALGORITHM, cek, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Store CEK for this policy
    this.keys.set(policyId, cek.toString('base64'));
    
    const metadata: EncryptionMetadata = {
      cek: cek.toString('base64'), // In real Seal, this would be encrypted/wrapped
      iv: iv.toString('base64'),
      algorithm: ALGORITHM,
      policyId
    };
    
    // Prepend auth tag to encrypted data
    const encryptedWithTag = Buffer.concat([authTag, encrypted]);
    
    console.log(`[MockSeal] Encrypted data with policy ${policyId}`);
    return { encrypted: encryptedWithTag, metadata };
  }
  
  async decryptData(encryptedData: Buffer, metadata: EncryptionMetadata, enclaveId: string): Promise<Buffer> {
    const policy = this.policies.get(metadata.policyId);
    
    if (!policy) {
      throw new Error(`Policy ${metadata.policyId} not found`);
    }
    
    // Check if enclave is allowed
    if (!policy.allowedEnclaves.includes(enclaveId) && !policy.allowedEnclaves.includes('*')) {
      throw new Error(`Enclave ${enclaveId} not allowed by policy ${metadata.policyId}`);
    }
    
    // Extract auth tag (first 16 bytes)
    const authTag = encryptedData.slice(0, 16);
    const encrypted = encryptedData.slice(16);
    
    const cek = Buffer.from(metadata.cek, 'base64');
    const iv = Buffer.from(metadata.iv, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, cek, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    
    console.log(`[MockSeal] Decrypted data for enclave ${enclaveId}`);
    return decrypted;
  }
  
  getPolicy(policyId: string): SealPolicy | undefined {
    return this.policies.get(policyId);
  }
}

