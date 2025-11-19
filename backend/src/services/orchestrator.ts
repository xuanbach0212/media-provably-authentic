import {
  AIDetectionResult,
  ProvenanceResult,
  Verdict,
  VerificationJob,
  VerificationReport,
} from "@media-auth/shared";
import axios from "axios";
import { BlockchainService } from "./blockchain";
import { EncryptionService } from "./encryption";
import { StorageService } from "./storage";
import { NautilusService } from "./nautilus";

const AI_DETECTION_URL =
  process.env.AI_DETECTION_URL || "http://localhost:8001";
const REVERSE_SEARCH_URL =
  process.env.REVERSE_SEARCH_URL || "http://localhost:8002";
const ENCLAVE_ID = process.env.ENCLAVE_ID || "mock_enclave_1";

export class OrchestrationService {
  private storage: StorageService;
  private encryption: EncryptionService;
  private blockchain: BlockchainService;
  private nautilus: NautilusService;
  private enclaveId: string;

  constructor(enclaveId?: string) {
    this.storage = new StorageService();
    this.encryption = new EncryptionService();
    this.blockchain = new BlockchainService();
    this.enclaveId = enclaveId || ENCLAVE_ID;
    // Always use Nautilus (production-grade crypto with mock TEE)
    this.nautilus = new NautilusService();
    
    console.log(`[Orchestrator] Initialized for enclave: ${this.enclaveId}`);
  }

  async processVerificationJob(
    job: VerificationJob
  ): Promise<VerificationReport> {
    console.log(`[Orchestrator] Processing job ${job.jobId}`);

    // 1. Retrieve and decrypt media
    const encryptedMedia = await this.storage.retrieveBlob(job.mediaCID);
    const decryptedMedia = await this.encryption.decryptData(
      encryptedMedia,
      job.encryptionMeta,
      this.enclaveId
    );

    // 2. Run AI detection
    const aiDetection = await this.runAIDetection(decryptedMedia);

    // 3. Run reverse search for provenance
    const reverseSearch = await this.runReverseSearch(
      decryptedMedia,
      job.metadata
    );

    // 4. Determine verdict based on results
    const verdict = this.determineVerdict(aiDetection, reverseSearch);
    const confidence = this.calculateConfidence(aiDetection, reverseSearch);

    // 5. Generate report
    const report: VerificationReport = {
      jobId: job.jobId,
      mediaCID: job.mediaCID,
      mediaHash: job.mediaHash,
      verdict,
      confidence,
      provenance: reverseSearch,
      reverseSearch: reverseSearch,
      aiDetection,
      forensicAnalysis: {
        fileSize: job.metadata.size,
        mimeType: job.metadata.mimeType,
        uploadedAt: job.metadata.uploadedAt,
      },
      enclaveAttestation: {
        signature: "",
        timestamp: new Date().toISOString(),
        enclaveId: ENCLAVE_ID,
      },
      generatedAt: new Date().toISOString(),
    };

    // 6. Sign the report with Nautilus TEE enclave
    let enclaveSignature: string;
    try {
      enclaveSignature = await this.nautilus.generateAttestation(report);
      console.log("[Orchestrator] ✓ Report signed by Nautilus");
    } catch (error: any) {
      console.error("[Orchestrator] Nautilus signing failed:", error.message);
      throw error;
    }
    
    report.enclaveAttestation = {
      signature: enclaveSignature,
      enclaveId: this.enclaveId,
      timestamp: new Date().toISOString(),
      mrenclave: this.nautilus.getEnclaveInfo().mrenclave,
    };

    // 7. Store report in Walrus
    const reportJSON = JSON.stringify(report);
    const reportCID = await this.storage.storeBlob(Buffer.from(reportJSON), {
      type: "verification-report",
      jobId: job.jobId,
    });
    report.reportStorageCID = reportCID;
    console.log(`[Orchestrator] ✓ Report stored in Walrus: ${reportCID}`);

    // 8. Submit attestation to blockchain
    const blockchainAttestation = await this.blockchain.submitAttestation(
      job.jobId,
      job.mediaHash,
      reportCID,
      verdict,
      report.enclaveAttestation.signature
    );
    report.blockchainAttestation = blockchainAttestation;
    console.log(
      `[Orchestrator] ✓ Attestation submitted to Sui: ${blockchainAttestation.txHash}`
    );

    // 9. Add encryption metadata to report
    report.encryptionMetadata = job.encryptionMeta;

    console.log(
      `[Orchestrator] Job ${job.jobId} completed with verdict: ${verdict}`
    );
    return report;
  }

  private async runAIDetection(
    mediaBuffer: Buffer
  ): Promise<AIDetectionResult> {
    try {
      const response = await axios.post(
        `${AI_DETECTION_URL}/detect`,
        {
          media: mediaBuffer.toString("base64"),
        },
        {
          timeout: 30000, // 30 seconds timeout
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("AI detection failed:", error.message);
      // Return a default result if AI detection fails
      return {
        verdict: "REAL",
        confidence: 0.5,
        modelScores: {},
        forensicAnalysis: {
          error: error.message,
        },
      };
    }
  }

  private async runReverseSearch(
    mediaBuffer: Buffer,
    metadata: any
  ): Promise<ProvenanceResult> {
    try {
      const response = await axios.post(
        `${REVERSE_SEARCH_URL}/search`,
        {
          media: mediaBuffer.toString("base64"),
          filename: metadata.filename,
        },
        {
          timeout: 30000, // 30 seconds timeout
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Reverse search failed:", error.message);
      // Return empty result if reverse search fails
      return {
        matches: [],
        provenanceChain: [],
        confidence: 0,
      };
    }
  }

  private determineVerdict(
    aiDetection: AIDetectionResult,
    provenance: ProvenanceResult
  ): Verdict {
    // Simple logic - can be enhanced with more sophisticated rules
    if (
      aiDetection.verdict === "AI_GENERATED" &&
      aiDetection.confidence > 0.7
    ) {
      return "AI_GENERATED";
    }

    if (aiDetection.verdict === "MANIPULATED" && aiDetection.confidence > 0.7) {
      return "MANIPULATED";
    }

    if (provenance.matches.length > 0 && provenance.confidence > 0.6) {
      return "AUTHENTIC";
    }

    return "UNKNOWN";
  }

  private calculateConfidence(
    aiDetection: AIDetectionResult,
    provenance: ProvenanceResult
  ): number {
    // Weighted average of different confidence scores
    const aiWeight = 0.6;
    const provenanceWeight = 0.4;

    return (
      aiDetection.confidence * aiWeight +
      provenance.confidence * provenanceWeight
    );
  }
}
