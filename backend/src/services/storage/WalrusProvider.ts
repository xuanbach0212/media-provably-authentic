/**
 * Walrus Storage Provider
 * Uses @mysten/walrus SDK for testnet integration
 * Implements IStorageProvider interface with comprehensive error handling
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { walrus } from "@mysten/walrus";
import { IStorageProvider, StorageBlob } from "./IStorageProvider";

const WALRUS_EPOCHS = 5; // Store for 5 epochs (~10 days on testnet)
const WALRUS_TIMEOUT = parseInt(process.env.WALRUS_TIMEOUT || "180000", 10);
const WALRUS_MAX_RETRIES = parseInt(process.env.WALRUS_MAX_RETRIES || "1", 10);

export class WalrusProvider implements IStorageProvider {
  private client: any; // WalrusClient (extended SuiClient)
  private keypair: Ed25519Keypair | null;
  private suiNetwork: "testnet" | "devnet" | "mainnet";

  constructor() {
    const SUI_NETWORK =
      (process.env.SUI_NETWORK as "testnet" | "devnet" | "mainnet") ||
      "testnet";
    const SUI_PRIVATE_KEY = process.env.SUI_PRIVATE_KEY || "";

    this.suiNetwork = SUI_NETWORK;

    // Initialize Sui client with network property (required by Walrus SDK)
    const suiClient = new SuiClient({
      url: getFullnodeUrl(SUI_NETWORK),
      // @ts-ignore - Walrus SDK requires network property
      network: SUI_NETWORK,
    });

    // Extend with Walrus SDK
    this.client = suiClient.$extend(
      walrus({
        uploadRelay: {
          host: process.env.WALRUS_PUBLISHER_URL || "https://publisher.walrus-testnet.walrus.space",
          sendTip: {
            max: 10_000, // Max 10,000 MIST tip per upload
          },
        },
        storageNodeClientOptions: {
          timeout: WALRUS_TIMEOUT,
          onError: (error) => {
            console.warn("[WalrusProvider] Storage node error:", error.message);
          },
        },
      })
    );

    // Initialize keypair
    if (!SUI_PRIVATE_KEY) {
      console.warn("[WalrusProvider] No private key configured");
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
          `[WalrusProvider] SDK initialized with upload relay (${SUI_NETWORK})`
        );
      } catch (error: any) {
        console.error("[WalrusProvider] Failed to load keypair:", error.message);
        this.keypair = null;
      }
    }
  }

  async storeBlob(
    data: Buffer,
    metadata?: Record<string, any>
  ): Promise<StorageBlob> {
    if (!this.keypair) {
      throw new Error(
        "Walrus requires keypair to store blobs. Set SUI_PRIVATE_KEY in .env"
      );
    }

    const startTime = Date.now();
    console.log(`[WalrusProvider] Storing ${data.length} bytes via SDK...`);

    try {
      const result = await this.client.walrus.writeBlob({
        blob: new Uint8Array(data),
        epochs: WALRUS_EPOCHS,
        deletable: false,
        signer: this.keypair,
      });

      const duration = Date.now() - startTime;
      console.log(
        `[WalrusProvider] ✓ Stored: ${result.blobId.substring(0, 20)}... (${duration}ms)`
      );

      return {
        blobId: result.blobId,
        size: data.length,
        uploadedAt: new Date().toISOString(),
        metadata,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[WalrusProvider] SDK store error (${duration}ms):`, error.message);
      console.error(`[WalrusProvider] Error type:`, error.name);
      console.error(`[WalrusProvider] Error details:`, {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"),
      });

      // Check if it's a retryable error
      if (error.name === "RetryableWalrusClientError") {
        console.log("[WalrusProvider] Resetting client and retrying...");
        this.client.walrus.reset();

        try {
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
        } catch (retryError: any) {
          console.error("[WalrusProvider] Retry failed:", retryError.message);
        }
      }

      throw new Error(
        `Failed to store blob on Walrus testnet: ${error.message}`
      );
    }
  }

  async retrieveBlob(blobId: string): Promise<Buffer> {
    const startTime = Date.now();
    console.log(`[WalrusProvider] Retrieving blob: ${blobId.substring(0, 20)}...`);

    let lastError: any;

    for (let attempt = 1; attempt <= WALRUS_MAX_RETRIES; attempt++) {
      try {
        const data = await this.client.walrus.readBlob({ blobId });

        const duration = Date.now() - startTime;
        console.log(
          `[WalrusProvider] ✓ Retrieved ${data.length} bytes (${duration}ms)`
        );
        return Buffer.from(data);
      } catch (error: any) {
        lastError = error;
        const duration = Date.now() - startTime;
        console.error(
          `[WalrusProvider] SDK retrieve error (attempt ${attempt}/${WALRUS_MAX_RETRIES}, ${duration}ms):`,
          error.message
        );
        console.error(`[WalrusProvider] Error details:`, {
          message: error.message,
          name: error.name,
          code: error.code,
          blobId: blobId.substring(0, 20) + "...",
        });

        // Check if it's a retryable error
        if (
          error.name === "RetryableWalrusClientError" &&
          attempt < WALRUS_MAX_RETRIES
        ) {
          console.log("[WalrusProvider] Resetting client and retrying...");
          this.client.walrus.reset();

          // Exponential backoff: 2s, 4s, 8s
          const backoffMs = Math.pow(2, attempt) * 1000;
          console.log(`[WalrusProvider] Waiting ${backoffMs}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        // If not retryable or last attempt, throw
        if (attempt === WALRUS_MAX_RETRIES) {
          throw new Error(
            `Failed to retrieve blob from Walrus testnet after ${WALRUS_MAX_RETRIES} attempts: ${lastError.message}`
          );
        }
      }
    }

    // Should never reach here
    throw new Error(
      `Failed to retrieve blob from Walrus testnet: ${
        lastError?.message || "Unknown error"
      }`
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple check: verify keypair is loaded
      if (!this.keypair) {
        console.warn("[WalrusProvider] Health check failed: No keypair");
        return false;
      }

      // Could add more checks here (e.g., ping storage nodes)
      console.log("[WalrusProvider] ✓ Health check passed");
      return true;
    } catch (error) {
      console.error("[WalrusProvider] Health check failed:", error);
      return false;
    }
  }

  getName(): string {
    return "Walrus";
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

