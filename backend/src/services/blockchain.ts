import { BlockchainAttestation } from "@media-auth/shared";
import { SuiService } from "./sui";

export class BlockchainService {
  private sui: SuiService;

  constructor() {
    // Always use Sui (testnet with automatic mock fallback)
    this.sui = new SuiService();
    console.log(`[Blockchain] Sui service initialized`);
  }

  async submitAttestation(
    jobId: string,
    mediaHash: string,
    reportCID: string,
    enclaveSignature: string
  ): Promise<BlockchainAttestation> {
    // Sui service has built-in fallback to mock
    try {
      return await this.sui.submitAttestation(
        jobId,
        mediaHash,
        reportCID,
        enclaveSignature
      );
    } catch (error: any) {
      console.error("[Blockchain] Failed to submit attestation:", error.message);
      throw error;
    }
  }

  async getAttestation(attestationId: string): Promise<BlockchainAttestation | null> {
    try {
      return await this.sui.getAttestation(attestationId);
    } catch (error: any) {
      console.error("[Blockchain] Failed to get attestation:", error.message);
      return null;
    }
  }

  async getAttestationsByJobId(jobId: string): Promise<BlockchainAttestation[]> {
    try {
      return await this.sui.getAttestationsByJobId(jobId);
    } catch (error: any) {
      console.error("[Blockchain] Failed to get attestations by job:", error.message);
      return [];
    }
  }
}
