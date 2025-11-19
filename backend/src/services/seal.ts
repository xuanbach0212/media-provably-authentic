/**
 * Seal KMS Testnet Integration
 * Secure key management for TEE (Trusted Execution Environment)
 * 
 * Seal provides:
 * - Policy-based encryption
 * - Key management for enclaves
 * - Attested decryption
 * 
 * For testnet/production: https://github.com/MystenLabs/seal
 */

import axios from "axios";
import crypto from "crypto";
import { EncryptionMetadata } from "@media-auth/shared";

// Seal Configuration
const SEAL_API_URL = process.env.SEAL_API_URL || "";
const SEAL_API_KEY = process.env.SEAL_API_KEY || "";

interface SealPolicy {
  policyId: string;
  allowedEnclaves: string[];
  createdAt: string;
  algorithm: string;
}

interface SealEncryptionResult {
  encrypted: Buffer;
  metadata: EncryptionMetadata;
  keyId: string;
}

export class SealService {
  private apiUrl: string;
  private apiKey: string;
  private useMockCrypto: boolean;

  constructor() {
    this.apiUrl = SEAL_API_URL;
    this.apiKey = SEAL_API_KEY;
    // Use mock crypto if no API configured
    this.useMockCrypto = !this.apiUrl || !this.apiKey;

    if (this.useMockCrypto) {
      console.log("[Seal] Using mock crypto (AES-256-GCM)");
    } else {
      console.log("[Seal] Using Seal KMS API");
    }
  }

  /**
   * Create encryption policy for specific enclaves
   * @param allowedEnclaves List of enclave IDs that can decrypt
   * @returns Policy ID
   */
  async createPolicy(allowedEnclaves: string[]): Promise<string> {
    if (this.useMockCrypto) {
      return this.mockCreatePolicy(allowedEnclaves);
    }

    try {
      console.log(`[Seal] Creating policy for enclaves: ${allowedEnclaves.join(", ")}`);

      const response = await axios.post(
        `${this.apiUrl}/v1/policies`,
        {
          allowedEnclaves,
          algorithm: "AES-256-GCM",
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const policyId = response.data.policyId;
      console.log(`[Seal] ✓ Created policy: ${policyId}`);
      return policyId;
    } catch (error: any) {
      console.error("[Seal] Error creating policy:", error.message);
      
      // Fallback to mock
      console.warn("[Seal] Falling back to mock policy");
      return this.mockCreatePolicy(allowedEnclaves);
    }
  }

  /**
   * Encrypt data with policy-based key
   * @param data Data to encrypt
   * @param policyId Policy ID
   * @returns Encrypted data and metadata
   */
  async encryptData(
    data: Buffer,
    policyId: string
  ): Promise<SealEncryptionResult> {
    if (this.useMockCrypto) {
      return this.mockEncrypt(data, policyId);
    }

    try {
      console.log(`[Seal] Encrypting ${data.length} bytes with policy ${policyId}...`);

      const response = await axios.post(
        `${this.apiUrl}/v1/encrypt`,
        {
          data: data.toString("base64"),
          policyId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const result = {
        encrypted: Buffer.from(response.data.encrypted, "base64"),
        metadata: response.data.metadata,
        keyId: response.data.keyId,
      };

      console.log(`[Seal] ✓ Encrypted successfully (key: ${result.keyId})`);
      return result;
    } catch (error: any) {
      console.error("[Seal] Error encrypting:", error.message);
      
      // Fallback to mock
      console.warn("[Seal] Falling back to mock encryption");
      return this.mockEncrypt(data, policyId);
    }
  }

  /**
   * Decrypt data (must be called from allowed enclave)
   * @param encrypted Encrypted data
   * @param metadata Encryption metadata
   * @param enclaveId Enclave requesting decryption
   * @returns Decrypted data
   */
  async decryptData(
    encrypted: Buffer,
    metadata: EncryptionMetadata,
    enclaveId: string
  ): Promise<Buffer> {
    if (this.useMockCrypto) {
      return this.mockDecrypt(encrypted, metadata, enclaveId);
    }

    try {
      console.log(`[Seal] Decrypting data for enclave ${enclaveId}...`);

      const response = await axios.post(
        `${this.apiUrl}/v1/decrypt`,
        {
          encrypted: encrypted.toString("base64"),
          metadata,
          enclaveId,
          // In real Seal, this would include TEE attestation
          attestation: this.generateMockAttestation(enclaveId),
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const decrypted = Buffer.from(response.data.decrypted, "base64");
      console.log(`[Seal] ✓ Decrypted ${decrypted.length} bytes`);
      return decrypted;
    } catch (error: any) {
      console.error("[Seal] Error decrypting:", error.message);
      
      // Fallback to mock
      console.warn("[Seal] Falling back to mock decryption");
      return this.mockDecrypt(encrypted, metadata, enclaveId);
    }
  }

  /**
   * Rotate encryption key for a policy
   */
  async rotateKey(policyId: string): Promise<string> {
    if (this.useMockCrypto) {
      return `mock_key_${Date.now()}`;
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/v1/policies/${policyId}/rotate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.newKeyId;
    } catch (error: any) {
      console.error("[Seal] Error rotating key:", error.message);
      return `mock_key_${Date.now()}`;
    }
  }

  /**
   * Get policy details
   */
  async getPolicy(policyId: string): Promise<SealPolicy | null> {
    if (this.useMockCrypto) {
      return {
        policyId,
        allowedEnclaves: ["mock_enclave_1"],
        createdAt: new Date().toISOString(),
        algorithm: "AES-256-GCM",
      };
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/v1/policies/${policyId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.policy;
    } catch (error) {
      return null;
    }
  }

  // ========== Mock Implementation (for development) ==========

  private mockCreatePolicy(allowedEnclaves: string[]): string {
    const policyId = `policy_${crypto.randomBytes(8).toString("hex")}`;
    console.log(`[Seal:Mock] Created policy ${policyId} for ${allowedEnclaves.length} enclaves`);
    return policyId;
  }

  private mockEncrypt(
    data: Buffer,
    policyId: string
  ): SealEncryptionResult {
    // Use AES-256-GCM
    const key = crypto.randomBytes(32); // 256-bit key
    const iv = crypto.randomBytes(16); // 128-bit IV
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Store key and IV in metadata (in real Seal, this would be in secure storage)
    const metadata: EncryptionMetadata = {
      policyId,
      algorithm: "AES-256-GCM",
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      // Mock key storage (DO NOT do this in production!)
      _mockKey: key.toString("base64"),
    };

    console.log(`[Seal:Mock] Encrypted ${data.length} → ${encrypted.length} bytes`);

    return {
      encrypted,
      metadata,
      keyId: `key_${crypto.randomBytes(8).toString("hex")}`,
    };
  }

  private mockDecrypt(
    encrypted: Buffer,
    metadata: EncryptionMetadata,
    enclaveId: string
  ): Buffer {
    try {
      // In mock mode, we stored the key in metadata
      if (!metadata._mockKey) {
        throw new Error("Mock key not found in metadata");
      }

      const key = Buffer.from(metadata._mockKey, "base64");
      const iv = Buffer.from(metadata.iv, "base64");
      const authTag = Buffer.from(metadata.authTag, "base64");

      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      console.log(`[Seal:Mock] Decrypted ${encrypted.length} → ${decrypted.length} bytes`);
      return decrypted;
    } catch (error: any) {
      console.error("[Seal:Mock] Decryption failed:", error.message);
      throw new Error("Failed to decrypt data");
    }
  }

  private generateMockAttestation(enclaveId: string): any {
    // In real Seal, this would be a cryptographic attestation from the TEE
    return {
      enclaveId,
      timestamp: Date.now(),
      signature: crypto.randomBytes(64).toString("hex"),
      mock: true,
    };
  }
}

export { SealService };
export default SealService;

