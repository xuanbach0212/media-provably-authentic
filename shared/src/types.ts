// Shared types across all services

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type Verdict = "AUTHENTIC" | "MANIPULATED" | "AI_GENERATED" | "UNKNOWN";

export interface MediaMetadata {
  filename: string;
  mimeType: string;
  size: number;
  sha256: string;
  pHash?: string;
  uploadedAt: string;
}

export interface EncryptionMetadata {
  cek: string; // Content Encryption Key (encrypted)
  iv: string;
  algorithm: string;
  policyId: string;
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

export interface AIDetectionResult {
  verdict: "REAL" | "AI_GENERATED" | "MANIPULATED";
  confidence: number;
  modelScores: {
    [modelName: string]: number;
  };
  forensicAnalysis: {
    compressionArtifacts?: boolean;
    metadata_consistency?: boolean;
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
  verdict: Verdict;
  confidence: number;
  provenance: ProvenanceResult;
  aiDetection: AIDetectionResult;
  forensicAnalysis: Record<string, any>;
  enclaveAttestation: EnclaveAttestation;
  generatedAt: string;
}

export interface BlockchainAttestation {
  attestationId: string;
  jobId: string;
  mediaHash: string;
  reportCID: string;
  verdict: Verdict;
  enclaveSignature: string;
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
