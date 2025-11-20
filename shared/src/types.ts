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
  [key: string]: any;
}

export interface FrequencyMetrics {
  dctAnalysis: any;
  fftAnalysis: any;
}

export interface QualityMetrics {
  sharpness: number;
  brightness: number;
  contrast: number;
}

export interface AIDetectionResult {
  modelScores: {
    [modelName: string]: number;
  };
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
}

export interface BlockchainAttestation {
  attestationId: string;
  jobId?: string;
  mediaHash?: string;
  reportCID?: string;
  enclaveSignature?: string;
  timestamp: string;
  blockNumber?: number;
  txHash?: string;
}

export interface WalrusBlob {
  blobId: string;
  data: Buffer | string;
  metadata?: Record<string, any>;
  uploadedAt: string;
}

export interface SealPolicy {
  policyId: string;
  allowedEnclaves: string[];
  createdAt: string;
}

// API Request/Response types

export interface UploadRequest {
  file: Buffer;
  filename: string;
  userId: string;
  signature: string;
}

export interface UploadResponse {
  jobId: string;
  mediaCID: string;
  status: JobStatus;
}

export interface VerifyRequest {
  jobId: string;
}

export interface VerifyResponse {
  jobId: string;
  status: JobStatus;
  report?: VerificationReport;
  attestation?: BlockchainAttestation;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress?: number;
  message?: string;
  report?: VerificationReport;
}

// Socket.IO event types
export interface ProgressUpdate {
  stage: number;
  stageName: string;
  substep: string;
  progress: number;
  timestamp: string;
  metadata?: {
    enclaveId?: string;
    modelName?: string;
    uploadProgress?: number;
  };
}

export interface ErrorUpdate {
  stage: number;
  message: string;
  retryable: boolean;
  timestamp: string;
  details?: any;
}

export interface SocketAuthData {
  walletAddress: string;
  signature: string;
}
