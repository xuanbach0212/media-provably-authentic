import {
  AIDetectionResult,
  ProvenanceResult,
  VerificationJob,
  VerificationReport,
  AnalysisData,
} from "@media-auth/shared";
import axios from "axios";
import { BlockchainService } from "./blockchain";
import { EncryptionService } from "./encryption";
import { StorageService } from "./storage";
import { NautilusService } from "./nautilus";

const AI_DETECTION_URL =
  process.env.AI_DETECTION_URL || "http://localhost:8000";
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

    // 2. Run AI detection first
    console.log(`[Orchestrator] Running AI detection...`);
    const aiDetection = await this.runAIDetection(decryptedMedia);
    console.log(`[Orchestrator] AI ensemble score: ${aiDetection.ensembleScore}`);

    // 3. Always run reverse search (for demo/hackathon)
    console.log(`[Orchestrator] Running reverse search...`);
    const reverseSearch = await this.runReverseSearch(decryptedMedia, job.metadata);
    console.log(`[Orchestrator] Found ${reverseSearch.matches.length} matches`);

    // 4. Build analysis data (NO verdict determination)
    const analysisData: AnalysisData = {
      aiDetection,
      reverseSearch,
      forensicAnalysis: {
        filename: job.metadata.filename,
        fileSize: job.metadata.size,
        mimeType: job.metadata.mimeType,
        uploadedAt: job.metadata.uploadedAt,
        width: aiDetection.forensicAnalysis.width,
        height: aiDetection.forensicAnalysis.height,
      },
    };

    // 5. Generate report with raw analysis data
    const report: VerificationReport = {
      jobId: job.jobId,
      mediaCID: job.mediaCID,
      mediaHash: job.mediaHash,
      analysisData,
      enclaveAttestation: {
        signature: "",
        timestamp: new Date().toISOString(),
        enclaveId: ENCLAVE_ID,
      },
      generatedAt: new Date().toISOString(),
    };

    // 6. Sign the report with Nautilus TEE enclave
    let attestationResult: {
      signature: string;
      attestationDocument?: string;
      publicKey?: string;
      pcrs?: Record<string, string>;
    };
    
    try {
      attestationResult = await this.nautilus.generateAttestation(report);
      console.log(`[Orchestrator] ✓ Report signed by Nautilus enclave ${this.enclaveId}`);
    } catch (error: any) {
      console.error("[Orchestrator] Nautilus signing failed:", error.message);
      throw error;
    }
    
    report.enclaveAttestation = {
      signature: attestationResult.signature,
      enclaveId: this.enclaveId,
      timestamp: new Date().toISOString(),
      mrenclave: this.nautilus.getEnclaveInfo().mrenclave,
      attestationDocument: attestationResult.attestationDocument,
      publicKey: attestationResult.publicKey,
      pcrs: attestationResult.pcrs,
    };

    // NOTE: Walrus storage and blockchain submission now handled by Aggregator
    // to avoid race conditions when multiple enclaves process in parallel

    // Add encryption metadata to report
    report.encryptionMetadata = job.encryptionMeta;

    console.log(
      `[Orchestrator] Job ${job.jobId} completed - ensemble score: ${aiDetection.ensembleScore}`
    );
    return report;
  }

  private async runAIDetection(
    mediaBuffer: Buffer
  ): Promise<AIDetectionResult> {
    try {
      const response = await axios.post(
        `${AI_DETECTION_URL}/detect/base64`,
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
        modelScores: {
          ai_generated_score: 0.5,
          deepfake_score: 0.5,
          manipulation_score: 0.5,
          authenticity_score: 0.5,
          ensemble_model_count: 0,
          individual_models: {},
        },
        ensembleScore: 0.5,
        forensicAnalysis: {
          exifData: {},
          compressionArtifacts: 0,
          noisePattern: {},
          colorDistribution: {},
          error: error.message,
        },
        frequencyAnalysis: {
          dctAnalysis: {},
          fftAnalysis: {},
        },
        qualityMetrics: {
          sharpness: 0,
          brightness: 0,
          contrast: 0,
        },
        metadata: {
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
      console.error("Error code:", error.code);
      console.error("Error response:", error.response?.status, error.response?.statusText);
      console.error("Full error:", error);
      // Return empty result if reverse search fails
      return {
        matches: [],
        provenanceChain: [],
        confidence: 0,
      };
    }
  }

}
