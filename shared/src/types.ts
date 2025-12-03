// Shared types across all services

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface MediaMetadata {
  filename: string;
  mimeType: string;
  size: number;
  sha256: string;
  pHash?: string;
  uploadedAt: string;
}

export interface EncryptionMetadata {
  cek?: string; // Content Encryption Key (encrypted)
  iv: string;
  algorithm: string;
  policyId: string;
  keyId?: string;
  authTag?: string; // For GCM mode
  threshold?: number; // For threshold encryption
  _mockKey?: string; // For mock mode only
  [key: string]: any; // Allow additional fields
}

export interface VerificationJob {
  jobId: string;
  userId: string;
  mediaCID: string;
  mediaHash: string;
  pHash?: string;
  metadata: MediaMetadata;
  encryptionMeta: EncryptionMetadata;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProvenanceMatch {
  url: string;
  firstSeen: string;
  similarity: number;
  metadata: {
    title?: string;
    publisher?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

export interface ProvenanceResult {
  matches: ProvenanceMatch[];
  earliestMatch?: ProvenanceMatch;
  provenanceChain: string[];
  confidence: number;
}

export interface ForensicMetrics {
  exifData: any;
  compressionArtifacts: number;
  noisePattern: any;
  colorDistribution: any;
  compressionArtifactsDetected?: boolean;
  metadata_consistency?: boolean;
  // Python returns these fields
  compression_artifacts?: number;
  sharpness?: number;
  noise_level?: number;
  color_saturation?: number;
  brightness?: number;
  contrast?: number;
  exif_data_present?: boolean;
  exif_data?: any;
  manipulation_likelihood?: number;
  [key: string]: any;
}

export interface FrequencyMetrics {
  dctAnalysis: any;
  fftAnalysis: any;
  // Python returns these fields
  dct_anomaly_score?: number;
  fft_anomaly_score?: number;
  frequency_ai_score?: number;
  [key: string]: any;
}

export interface QualityMetrics {
  sharpness: number;
  brightness: number;
  contrast: number;
  // Python returns these fields
  blurriness?: number;
  exposure?: number;
  colorfulness?: number;
  overall_quality?: number;
  enhancement_applied?: string;
  [key: string]: any;
}

// Individual model score from Python
export interface IndividualModelScore {
  ai_score: number;
  deepfake_score: number;
  confidence: number;
  weight: number;
}

// Model scores structure from Python
export interface ModelScoresData {
  ai_generated_score: number;
  deepfake_score: number;
  manipulation_score: number;
  authenticity_score: number;
  frequency_ai_score?: number;
  ensemble_model_count: number;
  individual_models: {
    [modelName: string]: IndividualModelScore;
  };
  ensemble_metadata?: any;
}

export interface AIDetectionResult {
  modelScores: ModelScoresData; // Updated to match Python structure
  ensembleScore: number;
  forensicAnalysis: ForensicMetrics;
  frequencyAnalysis: FrequencyMetrics;
  qualityMetrics: QualityMetrics;
  metadata?: any;
}

export interface AnalysisData {
  aiDetection: AIDetectionResult;
  reverseSearch: ProvenanceResult | null;
  forensicAnalysis: {
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    [key: string]: any;
  };
}

export interface EnclaveAttestation {
  signature: string;
  timestamp: string;
  enclaveId: string;
  mrenclave?: string;
  // NEW: Real Nautilus attestation fields
  attestationDocument?: string; // Base64-encoded AWS Nitro attestation
  publicKey?: string; // Enclave's ephemeral public key
  pcrs?: Record<string, string>; // PCR measurements
}

export interface VerificationReport {
  jobId: string;
  mediaCID: string;
  mediaHash: string;
  analysisData: AnalysisData;
  enclaveAttestation: EnclaveAttestation;
  generatedAt: string;
  reportStorageCID?: string; // Walrus CID for the report itself
  blockchainAttestation?: BlockchainAttestation; // On-chain attestation
  encryptionMetadata?: EncryptionMetadata; // Encryption info
  metadata?: MediaMetadata; // File metadata
}

export interface BlockchainAttestation {
  attestationId: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  // For frontend display
  transactionHash?: string;
  reportCID?: string;
  enclaveId?: string;
}

export interface ConsensusMetadata {
  enclaveCount: number;
  agreementRate: number;
  consensusTimestamp: string;
  finalVerdict?: string;
  confidence?: number;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  report?: VerificationReport;
  analysisData?: AnalysisData;
  error?: string;
  consensusMetadata?: ConsensusMetadata;
}

// Socket.IO event types
export interface ProgressUpdate {
  jobId: string;
  stage: number;
  stageName: string;
  substep: string;
  progress: number; // 0-100
  timestamp: string;
  metadata?: any;
  warning?: string; // Optional warning message for user
}

export interface ErrorUpdate {
  jobId: string;
  message: string;
  retryable: boolean;
  timestamp: string;
}

export interface JobCompleteEvent {
  jobId: string;
  report: VerificationReport;
  timestamp: string;
}
