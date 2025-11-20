const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UploadResponse {
  success: boolean;
  jobId: string;
  mediaCID: string;
  status: string;
  mediaHash: string;
}

export interface JobStatusResponse {
  success: boolean;
  jobId: string;
  status: string;
  progress?: number;
  message?: string;
  createdAt: string;
  updatedAt: string;
  report?: any;
}

export interface VerifyResponse {
  success: boolean;
  jobId: string;
  status: string;
  report?: any;
  attestation?: any;
}

export class ApiClient {
  static async uploadMedia(file: File, userId: string = 'anonymous'): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('signature', 'mock_signature');

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  static async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/job/${jobId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get job status');
    }

    return response.json();
  }

  static async verify(jobId: string): Promise<VerifyResponse> {
    const response = await fetch(`${API_BASE_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Verification failed');
    }

    return response.json();
  }

  static async getAttestation(attestationId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/attestation/${attestationId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get attestation');
    }

    return response.json();
  }

  static async getAttestationsByJobId(jobId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/attestations/job/${jobId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get attestations');
    }

    return response.json();
  }
}

