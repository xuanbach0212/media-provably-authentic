import { BlockchainAttestation, Verdict } from "@media-auth/shared";
import axios from "axios";
import { SuiService } from "./sui";

const MOCK_SERVICES_URL =
  process.env.MOCK_SERVICES_URL || "http://localhost:3002";
const USE_SUI_TESTNET = process.env.USE_SUI_TESTNET === "true";

export class BlockchainService {
  private sui: SuiService | null;

  constructor() {
    this.sui = USE_SUI_TESTNET ? new SuiService() : null;
  }

  async submitAttestation(
    jobId: string,
    mediaHash: string,
    reportCID: string,
    verdict: Verdict,
    enclaveSignature: string
  ): Promise<BlockchainAttestation> {
    // Use Sui if enabled
    if (this.sui) {
      try {
        return await this.sui.submitAttestation(
          jobId,
          mediaHash,
          reportCID,
          verdict,
          enclaveSignature
        );
      } catch (error: any) {
        console.error("[Blockchain] Sui failed, falling back to mock:", error.message);
        // Fall through to mock
      }
    }

    // Use mock service
    try {
      const response = await axios.post(`${MOCK_SERVICES_URL}/sui/attest`, {
        jobId,
        mediaHash,
        reportCID,
        verdict,
        enclaveSignature,
      });

      return response.data.attestation;
    } catch (error: any) {
      console.error("Error submitting attestation:", error.message);
      throw new Error("Failed to submit blockchain attestation");
    }
  }

  async getAttestation(
    attestationId: string
  ): Promise<BlockchainAttestation | null> {
    // Use Sui if enabled
    if (this.sui) {
      try {
        return await this.sui.getAttestation(attestationId);
      } catch (error: any) {
        console.error("[Blockchain] Sui query failed, falling back to mock:", error.message);
        // Fall through to mock
      }
    }

    // Use mock service
    try {
      const response = await axios.get(
        `${MOCK_SERVICES_URL}/sui/attestation/${attestationId}`
      );
      return response.data.attestation;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error("Error getting attestation:", error.message);
      throw new Error("Failed to get attestation");
    }
  }

  async getAttestationsByJobId(
    jobId: string
  ): Promise<BlockchainAttestation[]> {
    // Use Sui if enabled
    if (this.sui) {
      try {
        return await this.sui.getAttestationsByJobId(jobId);
      } catch (error: any) {
        console.error("[Blockchain] Sui query failed, falling back to mock:", error.message);
        // Fall through to mock
      }
    }

    // Use mock service
    try {
      const response = await axios.get(
        `${MOCK_SERVICES_URL}/sui/attestations/job/${jobId}`
      );
      return response.data.attestations;
    } catch (error: any) {
      console.error("Error getting attestations:", error.message);
      return [];
    }
  }
}
