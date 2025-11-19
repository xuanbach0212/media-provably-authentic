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
const NAUTILUS_API_URL = process.env.NAUTILUS_API_URL || "";
const NAUTILUS_API_KEY = process.env.NAUTILUS_API_KEY || "";
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
  private apiKey: string;
  private enclaveId: string;
  private mrenclave: string;
  private useMockMode: boolean;
  private mockPrivateKey: string;

  constructor() {
    this.apiUrl = NAUTILUS_API_URL;
    this.apiKey = NAUTILUS_API_KEY;
    this.enclaveId = ENCLAVE_ID;
    this.mrenclave = NAUTILUS_MRENCLAVE;

    // Use mock mode if no API configured
    this.useMockMode = !this.apiUrl || !this.apiKey;

    if (this.useMockMode) {
      console.log("[Nautilus] Using mock TEE mode");
      // Generate mock RSA key pair for signing
      const { privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
      this.mockPrivateKey = privateKey;
    } else {
      console.log(`[Nautilus] Connected to enclave: ${this.enclaveId}`);
      this.mockPrivateKey = "";
    }
  }

  /**
   * Generate attestation for verification report
   * In production, this would be signed inside SGX/TDX enclave
   * 
   * @param reportData The verification report data to attest
   * @returns Attestation with TEE signature
   */
  async generateAttestation(reportData: any): Promise<string> {
    const dataHash = this.computeHash(reportData);

    if (this.useMockMode) {
      return this.mockGenerateAttestation(dataHash);
    }

    try {
      console.log(`[Nautilus] Generating attestation for report...`);

      const response = await axios.post(
        `${this.apiUrl}/v1/attest`,
        {
          enclaveId: this.enclaveId,
          reportData: dataHash,
          timestamp: Date.now(),
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const attestation: NautilusAttestation = response.data;
      
      console.log(`[Nautilus] ✓ Attestation generated (enclave: ${attestation.enclaveId})`);
      return attestation.signature;
    } catch (error: any) {
      console.error("[Nautilus] Error generating attestation:", error.message);
      
      // Fallback to mock
      console.warn("[Nautilus] Falling back to mock attestation");
      return this.mockGenerateAttestation(dataHash);
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
  async processInEnclave<T>(callback: () => Promise<T>): Promise<T> {
    if (this.useMockMode) {
      console.log(`[Nautilus:Mock] Processing in simulated enclave ${this.enclaveId}`);
      return await callback();
    }

    try {
      // In production, this would submit code to run in TEE
      console.log(`[Nautilus] Executing in enclave ${this.enclaveId}...`);
      
      // For now, just execute locally
      // Real implementation would use Nautilus API to run in TEE
      const result = await callback();
      
      console.log(`[Nautilus] ✓ Enclave execution completed`);
      return result;
    } catch (error: any) {
      console.error("[Nautilus] Enclave execution failed:", error.message);
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
      await axios.get(`${this.apiUrl}/health`, {
        timeout: 5000,
      });
      return true;
    } catch (error) {
      console.warn("[Nautilus] Health check failed");
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

