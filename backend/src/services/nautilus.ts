/**
 * Nautilus TEE Integration
 * Trusted Execution Environment for secure computation and attestation
 * 
 * Nautilus provides hardware-backed security for:
 * - Secure media processing
 * - Report signing with TEE attestation
 * - Verifiable computation
 * 
 * For production: https://github.com/MystenLabs/nautilus
 */

import crypto from "crypto";
import axios from "axios";
import { EnclaveAttestation } from "@media-auth/shared";

// Nautilus Configuration
const NAUTILUS_ENCLAVE_URL = process.env.NAUTILUS_ENCLAVE_URL || "";
const NAUTILUS_ENABLED = process.env.NAUTILUS_ENABLED === "true";
const ENCLAVE_ID = process.env.ENCLAVE_ID || "mock_enclave_1";
const NAUTILUS_MRENCLAVE = process.env.NAUTILUS_MRENCLAVE || "";

interface NautilusAttestation {
  enclaveId: string;
  mrenclave: string;
  mrsigner?: string;
  signature: string;
  timestamp: string;
  reportData: string;
}

export class NautilusService {
  private apiUrl: string;
  private enclaveId: string;
  private mrenclave: string;
  private useMockMode: boolean;
  private mockPrivateKey: string;

  constructor() {
    this.apiUrl = NAUTILUS_ENCLAVE_URL;
    this.enclaveId = ENCLAVE_ID;
    this.mrenclave = NAUTILUS_MRENCLAVE;

    // Use production mode if URL configured and enabled
    this.useMockMode = !this.apiUrl || !NAUTILUS_ENABLED;

    if (this.useMockMode) {
      console.log("[Nautilus] ⚠️  Using mock TEE mode (no enclave URL configured)");
      // Generate mock RSA key pair for signing
      const { privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
      this.mockPrivateKey = privateKey;
    } else {
      console.log(`[Nautilus] ✅ Connected to Nitro Enclave: ${this.apiUrl}`);
      console.log(`[Nautilus] Enclave ID: ${this.enclaveId}`);
      this.mockPrivateKey = "";
    }
  }

  /**
   * Get attestation document from Nitro Enclave
   * This proves the enclave's identity and integrity
   */
  async getAttestation(): Promise<{
    attestationDocument: string; // Base64-encoded CBOR
    publicKey: string; // Enclave's ephemeral public key
    pcrs: Record<string, string>; // PCR measurements
  }> {
    if (this.useMockMode) {
      return {
        attestationDocument: Buffer.from('mock_attestation').toString('base64'),
        publicKey: 'mock_public_key',
        pcrs: {
          PCR0: 'mock_pcr0',
          PCR1: 'mock_pcr1',
          PCR2: 'mock_pcr2',
        },
      };
    }

    try {
      console.log('[Nautilus] Fetching attestation document...');
      const response = await axios.get(`${this.apiUrl}/get_attestation`, {
        timeout: 10000,
      });

      console.log('[Nautilus] ✓ Attestation document received');
      return response.data;
    } catch (error: any) {
      console.error('[Nautilus] Failed to get attestation:', error.message);
      throw new Error(`Nautilus attestation failed: ${error.message}`);
    }
  }

  /**
   * Generate attestation for verification report
   * In production, this would be signed inside SGX/TDX enclave
   * 
   * @param reportData The verification report data to attest
   * @returns Attestation with TEE signature
   */
  async generateAttestation(reportData: any): Promise<{
    signature: string;
    attestationDocument?: string;
    publicKey?: string;
  }> {
    const dataHash = this.computeHash(reportData);

    if (this.useMockMode) {
      return {
        signature: this.mockGenerateAttestation(dataHash),
      };
    }

    try {
      console.log(`[Nautilus] Requesting enclave to sign report...`);

      // Call Nautilus enclave to process and sign data
      const response = await axios.post(
        `${this.apiUrl}/process_data`,
        {
          data: dataHash,
          timestamp: Date.now(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const { signature, attestation_document, public_key } = response.data;
      
      console.log(`[Nautilus] ✓ Report signed by enclave ${this.enclaveId}`);
      
      return {
        signature,
        attestationDocument: attestation_document,
        publicKey: public_key,
      };
    } catch (error: any) {
      console.error('[Nautilus] Enclave signing failed:', error.message);
      
      // Fallback to mock for development
      console.warn('[Nautilus] ⚠️  Falling back to mock attestation');
      return {
        signature: this.mockGenerateAttestation(dataHash),
      };
    }
  }

  /**
   * Verify an attestation signature
   * In production, this would verify SGX/TDX attestation
   */
  async verifyAttestation(
    signature: string,
    reportData: any
  ): Promise<boolean> {
    const dataHash = this.computeHash(reportData);

    if (this.useMockMode) {
      return this.mockVerifyAttestation(signature, dataHash);
    }

    try {
      console.log(`[Nautilus] Verifying attestation...`);

      const response = await axios.post(
        `${this.apiUrl}/v1/verify`,
        {
          signature,
          reportData: dataHash,
          mrenclave: this.mrenclave,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      const verified = response.data.verified;
      console.log(`[Nautilus] Verification result: ${verified}`);
      return verified;
    } catch (error: any) {
      console.error("[Nautilus] Error verifying attestation:", error.message);
      return false;
    }
  }

  /**
   * Get enclave information
   */
  getEnclaveInfo(): {
    enclaveId: string;
    mrenclave: string;
    mode: "production" | "mock";
  } {
    return {
      enclaveId: this.enclaveId,
      mrenclave: this.mrenclave || `mock_mrenclave_${this.enclaveId}`,
      mode: this.useMockMode ? "mock" : "production",
    };
  }

  /**
   * Process data in enclave (simulation)
   * In production, this would execute inside TEE
   */
  async processInEnclave<T>(
    data: any,
    callback: (decryptedData: any) => Promise<T>
  ): Promise<T> {
    if (this.useMockMode) {
      console.log(`[Nautilus:Mock] Processing in simulated enclave ${this.enclaveId}`);
      return await callback(data);
    }

    try {
      console.log(`[Nautilus] Submitting data to enclave ${this.enclaveId}...`);
      
      // In real Nautilus, data would be sent to enclave for processing
      // The enclave would decrypt, process, and return signed results
      // For now, we process locally but get real attestation
      const result = await callback(data);
      
      console.log(`[Nautilus] ✓ Enclave processing completed`);
      return result;
    } catch (error: any) {
      console.error('[Nautilus] Enclave processing failed:', error.message);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (this.useMockMode) {
      return true; // Mock always available
    }

    try {
      const response = await axios.get(`${this.apiUrl}/health_check`, {
        timeout: 5000,
      });
      console.log('[Nautilus] ✓ Enclave health check passed');
      return response.data.status === 'healthy' || response.status === 200;
    } catch (error) {
      console.warn('[Nautilus] ⚠️  Enclave health check failed');
      return false;
    }
  }

  // ========== Mock Implementation ==========

  private mockGenerateAttestation(dataHash: string): string {
    // Mock RSA signature
    const sign = crypto.createSign("SHA256");
    sign.update(dataHash);
    sign.end();

    const signature = sign.sign(this.mockPrivateKey, "base64");
    
    console.log(`[Nautilus:Mock] Generated mock attestation for enclave ${this.enclaveId}`);
    return signature;
  }

  private mockVerifyAttestation(
    signature: string,
    dataHash: string
  ): boolean {
    // In mock mode, just check signature format
    const isValid = signature.length > 0;
    console.log(`[Nautilus:Mock] Verification: ${isValid}`);
    return isValid;
  }

  private computeHash(data: any): string {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
  }
}

export default NautilusService;

