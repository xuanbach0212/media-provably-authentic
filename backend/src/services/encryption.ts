import { EncryptionMetadata } from "@media-auth/shared";
import { SealService } from "./seal";

export class EncryptionService {
  private seal: SealService;

  constructor() {
    // Always use Seal (production-grade crypto with mock KMS)
    this.seal = new SealService();
    console.log(`[Encryption] Seal service initialized`);
  }

  async createPolicy(allowedEnclaves: string[]): Promise<string> {
    try {
      const policyId = await this.seal.createPolicy(allowedEnclaves);
      console.log(`[Encryption] ✓ Policy created: ${policyId}`);
      return policyId;
    } catch (error: any) {
      console.error("[Encryption] Failed to create policy:", error.message);
      throw error;
    }
  }

  async encryptData(
    data: Buffer,
    policyId: string
  ): Promise<{ encrypted: Buffer; metadata: EncryptionMetadata }> {
    try {
      return await this.seal.encryptData(data, policyId);
    } catch (error: any) {
      console.error("[Encryption] Failed to encrypt:", error.message);
      throw error;
    }
  }

  async decryptData(
    encrypted: Buffer,
    metadata: EncryptionMetadata,
    enclaveId: string
  ): Promise<Buffer> {
    try {
      return await this.seal.decryptData(encrypted, metadata, enclaveId);
    } catch (error: any) {
      console.error("[Encryption] Failed to decrypt:", error.message);
      throw error;
    }
  }
}
