import { EncryptionMetadata } from "@media-auth/shared";
import axios from "axios";
import { SealService } from "./seal";

const MOCK_SERVICES_URL =
  process.env.MOCK_SERVICES_URL || "http://localhost:3002";
const USE_SEAL_KMS = process.env.USE_SEAL_TESTNET === "true";

export class EncryptionService {
  private seal: SealService | null;

  constructor() {
    this.seal = USE_SEAL_KMS ? new SealService() : null;
  }

  async createPolicy(allowedEnclaves: string[]): Promise<string> {
    // Use Seal KMS if enabled
    if (this.seal) {
      try {
        return await this.seal.createPolicy(allowedEnclaves);
      } catch (error: any) {
        console.error("[Encryption] Seal failed, falling back to mock:", error.message);
        // Fall through to mock
      }
    }

    // Use mock service
    try {
      const response = await axios.post(
        `${MOCK_SERVICES_URL}/seal/create-policy`,
        {
          allowedEnclaves,
        }
      );

      return response.data.policy.policyId;
    } catch (error: any) {
      console.error("Error creating policy:", error.message);
      throw new Error("Failed to create encryption policy");
    }
  }

  async encryptData(
    data: Buffer,
    policyId: string
  ): Promise<{ encrypted: Buffer; metadata: EncryptionMetadata }> {
    // Use Seal KMS if enabled
    if (this.seal) {
      try {
        const result = await this.seal.encryptData(data, policyId);
        return {
          encrypted: result.encrypted,
          metadata: result.metadata,
        };
      } catch (error: any) {
        console.error("[Encryption] Seal encryption failed, falling back to mock:", error.message);
        // Fall through to mock
      }
    }

    // Use mock service
    try {
      const response = await axios.post(`${MOCK_SERVICES_URL}/seal/encrypt`, {
        data: data.toString("base64"),
        policyId,
      });

      return {
        encrypted: Buffer.from(response.data.encrypted, "base64"),
        metadata: response.data.metadata,
      };
    } catch (error: any) {
      console.error("Error encrypting data:", error.message);
      throw new Error("Failed to encrypt data");
    }
  }

  async decryptData(
    encrypted: Buffer,
    metadata: EncryptionMetadata,
    enclaveId: string
  ): Promise<Buffer> {
    // Use Seal KMS if enabled
    if (this.seal) {
      try {
        return await this.seal.decryptData(encrypted, metadata, enclaveId);
      } catch (error: any) {
        console.error("[Encryption] Seal decryption failed, falling back to mock:", error.message);
        // Fall through to mock
      }
    }

    // Use mock service
    try {
      const response = await axios.post(`${MOCK_SERVICES_URL}/seal/decrypt`, {
        encrypted: encrypted.toString("base64"),
        metadata,
        enclaveId,
      });

      return Buffer.from(response.data.decrypted, "base64");
    } catch (error: any) {
      console.error("Error decrypting data:", error.message);
      throw new Error("Failed to decrypt data");
    }
  }
}
