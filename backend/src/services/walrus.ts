/**
 * Walrus Storage Service (Official SDK)
 * Uses @mysten/walrus SDK for testnet integration
 *
 * Walrus provides decentralized blob storage on Sui
 * Docs: https://sdk.mystenlabs.com/walrus
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { walrus } from "@mysten/walrus";

const WALRUS_EPOCHS = 5; // Store for 5 epochs (~10 days on testnet)

export interface WalrusBlob {
  blobId: string;
  size: number;
  uploadedAt: string;
  metadata?: Record<string, any>;
}

export class WalrusService {
  private client: any; // WalrusClient (extended SuiClient)
  private keypair: Ed25519Keypair | null;

  constructor() {
    // Read env vars in constructor (after dotenv.config())
    const SUI_NETWORK =
      (process.env.SUI_NETWORK as "testnet" | "devnet" | "mainnet") ||
      "testnet";
    const SUI_PRIVATE_KEY = process.env.SUI_PRIVATE_KEY || "";
    // Initialize Sui client with network property (required by Walrus SDK)
    const suiClient = new SuiClient({
      url: getFullnodeUrl(SUI_NETWORK),
      // @ts-ignore - Walrus SDK requires network property
      network: SUI_NETWORK,
    });

    // Extend with Walrus SDK
    // Note: Walrus SDK v0.8.4 uses default aggregator for testnet
    // https://aggregator.walrus-testnet.walrus.space
    this.client = suiClient.$extend(
      walrus({
        uploadRelay: {
          host: "https://upload-relay.testnet.walrus.space",
          sendTip: {
            max: 10_000, // Max 10,000 MIST tip per upload (~0.00001 SUI)
          },
        },
        storageNodeClientOptions: {
          timeout: 60_000, // 60 seconds timeout for storage node requests
          onError: (error) => {
            console.warn("[Walrus] Storage node error:", error.message);
          },
        },
      })
    );

    // Initialize keypair (same as Sui service)
    if (!SUI_PRIVATE_KEY) {
      console.warn("[Walrus] No private key configured");
      this.keypair = null;
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
        console.log(
          `[Walrus] SDK initialized with upload relay (${SUI_NETWORK})`
        );
      } catch (error: any) {
        console.error("[Walrus] Failed to load keypair:", error.message);
        this.keypair = null;
      }
    }
  }

  /**
   * Store a blob on Walrus using the official SDK
   * @param data Buffer of data to store
   * @param metadata Optional metadata
   * @returns Blob information including blobId
   */
  async storeBlob(
    data: Buffer,
    metadata?: Record<string, any>
  ): Promise<WalrusBlob> {
    if (!this.keypair) {
      throw new Error(
        "Walrus requires keypair to store blobs. Set SUI_PRIVATE_KEY in .env"
      );
    }

    console.log(`[Walrus] Storing ${data.length} bytes via SDK...`);

    try {
      const result = await this.client.walrus.writeBlob({
        blob: new Uint8Array(data),
        epochs: WALRUS_EPOCHS,
        deletable: false, // Make blobs permanent
        signer: this.keypair,
      });

      console.log(`[Walrus] ✓ Stored: ${result.blobId.substring(0, 20)}...`);

      return {
        blobId: result.blobId,
        size: data.length,
        uploadedAt: new Date().toISOString(),
        metadata,
      };
    } catch (error: any) {
      console.error("[Walrus] SDK store error:", error.message);

      // Check if it's a retryable error
      if (error.name === "RetryableWalrusClientError") {
        console.log("[Walrus] Resetting client and retrying...");
        this.client.walrus.reset();

        // Retry once
        const result = await this.client.walrus.writeBlob({
          blob: new Uint8Array(data),
          epochs: WALRUS_EPOCHS,
          deletable: false,
          signer: this.keypair,
        });

        return {
          blobId: result.blobId,
          size: data.length,
          uploadedAt: new Date().toISOString(),
          metadata,
        };
      }

      // No fallback - must use real Walrus testnet
      throw new Error(
        `Failed to store blob on Walrus testnet: ${error.message}`
      );
    }
  }

  /**
   * Retrieve a blob from Walrus using the official SDK
   * @param blobId The blob ID to retrieve
   * @returns Buffer of blob data
   */
  async retrieveBlob(blobId: string): Promise<Buffer> {
    console.log(`[Walrus] Retrieving blob: ${blobId.substring(0, 20)}...`);

    try {
      const data = await this.client.walrus.readBlob({ blobId });

      console.log(`[Walrus] ✓ Retrieved ${data.length} bytes`);
      return Buffer.from(data);
    } catch (error: any) {
      console.error(`[Walrus] SDK retrieve error: ${error.message}`);

      // Check if it's a retryable error
      if (error.name === "RetryableWalrusClientError") {
        console.log("[Walrus] Resetting client and retrying...");
        this.client.walrus.reset();

        const data = await this.client.walrus.readBlob({ blobId });
        console.log(`[Walrus] ✓ Retrieved after retry`);
        return Buffer.from(data);
      }

      // No fallback - must use real Walrus testnet
      throw new Error(
        `Failed to retrieve blob from Walrus testnet: ${error.message}`
      );
    }
  }

  /**
   * Check if Walrus SDK is properly configured
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to read a known blob or just check if client is initialized
      return this.keypair !== null;
    } catch (error) {
      console.error("[Walrus] Health check failed:", error);
      return false;
    }
  }

  /**
   * Get storage cost estimate
   * @param size Size in bytes
   * @param epochs Number of epochs to store
   */
  getStorageCostEstimate(size: number, epochs: number = WALRUS_EPOCHS): string {
    // Rough estimate: ~0.001 WAL per KB per epoch
    const sizeInKB = size / 1024;
    const estimatedWAL = sizeInKB * epochs * 0.001;
    return `~${estimatedWAL.toFixed(4)} WAL + gas fees`;
  }
}
