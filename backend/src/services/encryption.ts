import { EncryptionMetadata } from "@media-auth/shared";
import axios from "axios";

const MOCK_SERVICES_URL =
  process.env.MOCK_SERVICES_URL || "http://localhost:3002";

export class EncryptionService {
  async createPolicy(allowedEnclaves: string[]): Promise<string> {
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
