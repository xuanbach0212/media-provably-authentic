/**
 * Seal KMS Service (Official SDK)
 * Uses @mysten/seal for decentralized encryption with access control
 * 
 * Seal provides threshold-based encryption with on-chain policy verification
 * Docs: https://seal-docs.wal.app/
 */

import { SealClient } from "@mysten/seal";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { fromHEX, toHEX } from "@mysten/bcs";
import { EncryptionMetadata } from "@media-auth/shared";

interface SealEncryptionResult {
  encrypted: Buffer;
  metadata: EncryptionMetadata;
  keyId: string;
}

export class SealService {
  private client: SealClient | null;
  private suiClient: SuiClient;
  private keypair: Ed25519Keypair | null;
  private policyPackageId: string | null;
  private policyObjectId: string | null;
  private useMock: boolean;

  constructor() {
    // Read env vars in constructor
    const SUI_NETWORK = (process.env.SUI_NETWORK as "testnet" | "devnet" | "mainnet") || "testnet";
    const SUI_PRIVATE_KEY = process.env.SUI_PRIVATE_KEY || "";
    const SEAL_POLICY_PACKAGE = process.env.SEAL_POLICY_PACKAGE || "";
    const SEAL_POLICY_OBJECT = process.env.SEAL_POLICY_OBJECT || "";

    this.policyPackageId = SEAL_POLICY_PACKAGE || null;
    this.policyObjectId = SEAL_POLICY_OBJECT || null;

    // Initialize Sui client
    this.suiClient = new SuiClient({ 
      url: getFullnodeUrl(SUI_NETWORK),
      // @ts-ignore - network property for SDK compatibility
      network: SUI_NETWORK,
    });

    // Initialize keypair
    if (!SUI_PRIVATE_KEY) {
      console.warn("[Seal] No private key configured");
      this.keypair = null;
      this.client = null;
      this.useMock = true;
    } else {
      try {
        if (SUI_PRIVATE_KEY.startsWith("suiprivkey")) {
          const { secretKey } = decodeSuiPrivateKey(SUI_PRIVATE_KEY);
          this.keypair = Ed25519Keypair.fromSecretKey(secretKey);
        } else {
          this.keypair = Ed25519Keypair.fromSecretKey(
            Buffer.from(SUI_PRIVATE_KEY, "hex")
          );
        }

        // Check if we have policy deployed
        if (this.policyPackageId && this.policyObjectId) {
          // Initialize Seal client
          this.client = new SealClient({ client: this.suiClient });
          this.useMock = false;
          console.log(`[Seal] ✅ SDK initialized (${SUI_NETWORK})`);
          console.log(`[Seal] Policy: ${this.policyPackageId.substring(0, 10)}...`);
        } else {
          console.warn("[Seal] ⚠️  Policy not deployed, using mock mode");
          console.warn("[Seal] Deploy policy and set SEAL_POLICY_PACKAGE + SEAL_POLICY_OBJECT");
          this.client = null;
          this.useMock = true;
        }
      } catch (error: any) {
        console.error("[Seal] Failed to initialize:", error.message);
        this.keypair = null;
        this.client = null;
        this.useMock = true;
      }
    }

    if (this.useMock) {
      console.log("[Seal] Using mock mode (local AES-256-GCM)");
    }
  }

  /**
   * Create encryption policy ID
   * In Seal, policy is managed by Move contract
   */
  async createPolicy(allowedEnclaves: string[]): Promise<string> {
    if (!this.client || this.useMock) {
      return this.mockCreatePolicy(allowedEnclaves);
    }

    // In real Seal, policy is the on-chain object ID
    // We return the policy object ID that's already deployed
    if (!this.policyObjectId) {
      console.warn("[Seal] No policy object configured, using mock");
      return this.mockCreatePolicy(allowedEnclaves);
    }

    console.log(`[Seal] Using deployed policy: ${this.policyObjectId.substring(0, 20)}...`);
    return this.policyObjectId;
  }

  /**
   * Encrypt data with Seal SDK
   */
  async encryptData(
    data: Buffer,
    policyId: string
  ): Promise<SealEncryptionResult> {
    if (!this.client || this.useMock || !this.policyPackageId) {
      return this.mockEncrypt(data, policyId);
    }

    try {
      console.log(`[Seal] Encrypting ${data.length} bytes with SDK...`);

      const { encryptedObject, key: backupKey } = await this.client.encrypt({
        threshold: 2, // Need 2 key servers for decryption
        packageId: fromHEX(this.policyPackageId),
        id: fromHEX(policyId),
        data: new Uint8Array(data),
      });

      console.log(`[Seal] ✓ Encrypted with threshold=2`);

      return {
        encrypted: Buffer.from(encryptedObject),
        metadata: {
          policyId,
          algorithm: "SEAL_THRESHOLD",
          threshold: 2,
          backupKey: toHEX(backupKey),
        },
        keyId: `seal_${Date.now()}`,
      };
    } catch (error: any) {
      console.error("[Seal] SDK encryption failed:", error.message);
      console.warn("[Seal] Falling back to mock encryption");
      return this.mockEncrypt(data, policyId);
    }
  }

  /**
   * Decrypt data with Seal SDK
   * Requires on-chain policy approval
   */
  async decryptData(
    encrypted: Buffer,
    metadata: EncryptionMetadata,
    enclaveId: string
  ): Promise<Buffer> {
    if (!this.client || this.useMock || !this.policyPackageId || !this.policyObjectId) {
      return this.mockDecrypt(encrypted, metadata, enclaveId);
    }

    try {
      console.log(`[Seal] Decrypting for enclave: ${enclaveId}...`);

      // Create transaction to call seal_approve
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.policyPackageId}::enclave_policy::seal_approve`,
        arguments: [
          tx.object(this.policyObjectId),
          tx.pure.vector("u8", Array.from(Buffer.from(enclaveId, "utf-8"))),
        ],
      });

      const txBytes = await tx.build({ 
        client: this.suiClient, 
        onlyTransactionKind: true 
      });

      // Decrypt with Seal SDK (will verify policy on-chain)
      const decryptedBytes = await this.client.decrypt({
        data: new Uint8Array(encrypted),
        sessionKey: this.keypair!,
        txBytes,
      });

      console.log(`[Seal] ✓ Decrypted ${decryptedBytes.length} bytes`);
      return Buffer.from(decryptedBytes);
    } catch (error: any) {
      console.error("[Seal] SDK decryption failed:", error.message);
      console.warn("[Seal] Falling back to mock decryption");
      return this.mockDecrypt(encrypted, metadata, enclaveId);
    }
  }

  // ========== Mock Implementation (for development) ==========

  private mockCreatePolicy(allowedEnclaves: string[]): string {
    const policyId = `mock_policy_${Math.random().toString(36).substring(7)}`;
    console.log(`[Seal:Mock] Created policy for ${allowedEnclaves.length} enclaves`);
    return policyId;
  }

  private mockEncrypt(data: Buffer, policyId: string): SealEncryptionResult {
    const crypto = require("crypto");
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const metadata: EncryptionMetadata = {
      policyId,
      algorithm: "AES-256-GCM",
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      _mockKey: key.toString("base64"),
    };

    console.log(`[Seal:Mock] Encrypted ${data.length} → ${encrypted.length} bytes`);

    return {
      encrypted,
      metadata,
      keyId: `mock_key_${Date.now()}`,
    };
  }

  private mockDecrypt(
    encrypted: Buffer,
    metadata: EncryptionMetadata,
    enclaveId: string
  ): Buffer {
    const crypto = require("crypto");
    
    if (!metadata._mockKey) {
      throw new Error("Mock key not found in metadata");
    }

    const key = Buffer.from(metadata._mockKey, "base64");
    const iv = Buffer.from(metadata.iv, "base64");
    const authTag = Buffer.from(metadata.authTag, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    console.log(`[Seal:Mock] Decrypted ${encrypted.length} → ${decrypted.length} bytes`);
    return decrypted;
  }
}
