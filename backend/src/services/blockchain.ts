import { BlockchainAttestation, Verdict } from "@media-auth/shared";
import axios from "axios";

const MOCK_SERVICES_URL =
  process.env.MOCK_SERVICES_URL || "http://localhost:3002";

export class BlockchainService {
  async submitAttestation(
    jobId: string,
    mediaHash: string,
    reportCID: string,
    verdict: Verdict,
    enclaveSignature: string
  ): Promise<BlockchainAttestation> {
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
