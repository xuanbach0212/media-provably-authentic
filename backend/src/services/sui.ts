/**
 * Sui Blockchain Testnet Integration
 * For immutable attestation storage
 * 
 * Sui is a high-performance L1 blockchain with object-centric design
 * For testnet: https://docs.sui.io/guides/developer/getting-started/sui-environment
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { TransactionBlock } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { BlockchainAttestation, Verdict } from "@media-auth/shared";
import crypto from "crypto";

// Sui Configuration
const SUI_NETWORK = (process.env.SUI_NETWORK as "testnet" | "devnet" | "mainnet") || "testnet";
const SUI_PRIVATE_KEY = process.env.SUI_PRIVATE_KEY || "";
const SUI_PACKAGE_ID = process.env.SUI_PACKAGE_ID || "";

interface SuiTransactionResult {
  digest: string;
  effects: {
    status: { status: string };
  };
}

export class SuiService {
  private client: SuiClient;
  private keypair: Ed25519Keypair | null;
  private useMockMode: boolean;
  private mockAttestations: Map<string, BlockchainAttestation>;

  constructor() {
    // Initialize Sui client
    this.client = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });
    
    // Initialize keypair if private key provided
    if (SUI_PRIVATE_KEY) {
      try {
        this.keypair = Ed25519Keypair.fromSecretKey(
          Buffer.from(SUI_PRIVATE_KEY, "hex")
        );
        this.useMockMode = false;
        console.log(`[Sui] Connected to ${SUI_NETWORK}`);
      } catch (error) {
        console.warn("[Sui] Invalid private key, using mock mode");
        this.keypair = null;
        this.useMockMode = true;
      }
    } else {
      this.keypair = null;
      this.useMockMode = true;
      console.log("[Sui] No private key, using mock mode");
    }

    this.mockAttestations = new Map();
  }

  /**
   * Submit attestation to Sui blockchain
   */
  async submitAttestation(
    jobId: string,
    mediaHash: string,
    reportCID: string,
    verdict: Verdict,
    enclaveSignature: string
  ): Promise<BlockchainAttestation> {
    if (this.useMockMode || !this.keypair || !SUI_PACKAGE_ID) {
      return this.mockSubmitAttestation(
        jobId,
        mediaHash,
        reportCID,
        verdict,
        enclaveSignature
      );
    }

    try {
      console.log(`[Sui] Submitting attestation for job ${jobId}...`);

      // Create transaction block
      const tx = new TransactionBlock();

      // Call the smart contract function to store attestation
      // Note: This requires a deployed Move smart contract
      tx.moveCall({
        target: `${SUI_PACKAGE_ID}::media_verification::submit_attestation`,
        arguments: [
          tx.pure(jobId),
          tx.pure(mediaHash),
          tx.pure(reportCID),
          tx.pure(verdict),
          tx.pure(enclaveSignature),
          tx.pure(Date.now()),
        ],
      });

      // Execute transaction
      const result = await this.client.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: tx,
        options: {
          showEffects: true,
        },
      });

      const txResult = result as unknown as SuiTransactionResult;

      if (txResult.effects.status.status !== "success") {
        throw new Error("Transaction failed");
      }

      // Get transaction details
      const txDetails = await this.client.getTransactionBlock({
        digest: txResult.digest,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      // Extract block number (epoch)
      const blockNumber = txDetails.checkpoint ? parseInt(txDetails.checkpoint) : 0;

      const attestation: BlockchainAttestation = {
        attestationId: crypto.randomUUID(),
        jobId,
        mediaHash,
        reportCID,
        verdict,
        enclaveSignature,
        txHash: txResult.digest,
        blockNumber,
        timestamp: new Date().toISOString(),
        network: SUI_NETWORK,
      };

      console.log(`[Sui] ✓ Attestation submitted (tx: ${txResult.digest})`);
      return attestation;
    } catch (error: any) {
      console.error("[Sui] Error submitting attestation:", error.message);
      
      // Fallback to mock
      console.warn("[Sui] Falling back to mock attestation");
      return this.mockSubmitAttestation(
        jobId,
        mediaHash,
        reportCID,
        verdict,
        enclaveSignature
      );
    }
  }

  /**
   * Get attestation by ID
   */
  async getAttestation(
    attestationId: string
  ): Promise<BlockchainAttestation | null> {
    if (this.useMockMode) {
      return this.mockAttestations.get(attestationId) || null;
    }

    try {
      // In production, query the smart contract
      // This would use getObject or queryEvents
      console.log(`[Sui] Querying attestation ${attestationId}...`);

      // Mock implementation until smart contract is deployed
      return this.mockAttestations.get(attestationId) || null;
    } catch (error: any) {
      console.error("[Sui] Error getting attestation:", error.message);
      return null;
    }
  }

  /**
   * Get all attestations for a job
   */
  async getAttestationsByJobId(jobId: string): Promise<BlockchainAttestation[]> {
    if (this.useMockMode) {
      return Array.from(this.mockAttestations.values()).filter(
        (a) => a.jobId === jobId
      );
    }

    try {
      console.log(`[Sui] Querying attestations for job ${jobId}...`);

      // In production, use queryEvents to find attestations by jobId
      // For now, return mock data
      return Array.from(this.mockAttestations.values()).filter(
        (a) => a.jobId === jobId
      );
    } catch (error: any) {
      console.error("[Sui] Error getting attestations:", error.message);
      return [];
    }
  }

  /**
   * Get current wallet address
   */
  getAddress(): string | null {
    if (!this.keypair) return null;
    return this.keypair.getPublicKey().toSuiAddress();
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<string> {
    if (!this.keypair) return "0";

    try {
      const address = this.getAddress();
      if (!address) return "0";

      const balance = await this.client.getBalance({
        owner: address,
      });

      return balance.totalBalance;
    } catch (error) {
      return "0";
    }
  }

  /**
   * Check Sui network health
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getLatestCheckpointSequenceNumber();
      return true;
    } catch (error) {
      return false;
    }
  }

  // ========== Mock Implementation ==========

  private mockSubmitAttestation(
    jobId: string,
    mediaHash: string,
    reportCID: string,
    verdict: Verdict,
    enclaveSignature: string
  ): BlockchainAttestation {
    const attestationId = crypto.randomUUID();
    const attestation: BlockchainAttestation = {
      attestationId,
      jobId,
      mediaHash,
      reportCID,
      verdict,
      enclaveSignature,
      txHash: `0x${crypto.randomBytes(32).toString("hex")}`,
      blockNumber: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString(),
      network: "mock",
    };

    this.mockAttestations.set(attestationId, attestation);
    console.log(`[Sui:Mock] Created attestation ${attestationId}`);

    return attestation;
  }
}

export default SuiService;

