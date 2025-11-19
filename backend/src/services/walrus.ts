/**
 * Walrus Testnet Integration
 * Decentralized storage for media files and reports
 * 
 * Walrus is a decentralized storage network by Mysten Labs
 * For testnet setup: https://github.com/MystenLabs/walrus
 */

import axios from "axios";
import crypto from "crypto";

// Walrus Testnet Configuration
const WALRUS_TESTNET_PUBLISHER = process.env.WALRUS_PUBLISHER_URL || "https://publisher.walrus-testnet.walrus.space";
const WALRUS_TESTNET_AGGREGATOR = process.env.WALRUS_AGGREGATOR_URL || "https://aggregator.walrus-testnet.walrus.space";
const WALRUS_EPOCHS = 5; // Number of epochs to store (for testing)

interface WalrusStoreResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
      storedEpoch: number;
      blobId: string;
      size: number;
      erasureCodeType: string;
      certifiedEpoch: number;
    };
    encodedSize: number;
    cost: number;
  };
  alreadyCertified?: {
    blobId: string;
    event: any;
    endEpoch: number;
  };
}

interface WalrusBlob {
  blobId: string;
  size: number;
  uploadedAt: string;
  metadata?: Record<string, any>;
}

export class WalrusService {
  private publisherUrl: string;
  private aggregatorUrl: string;

  constructor() {
    this.publisherUrl = WALRUS_TESTNET_PUBLISHER;
    this.aggregatorUrl = WALRUS_AGGREGATOR;
  }

  /**
   * Store a blob on Walrus testnet
   * @param data Buffer of data to store
   * @param metadata Optional metadata
   * @returns Blob information including blobId
   */
  async storeBlob(
    data: Buffer,
    metadata?: Record<string, any>
  ): Promise<WalrusBlob> {
    try {
      console.log(`[Walrus] Storing blob (${data.length} bytes)...`);

      // Store on Walrus via PUT request
      const response = await axios.put(
        `${this.publisherUrl}/v1/store`,
        data,
        {
          params: {
            epochs: WALRUS_EPOCHS,
          },
          headers: {
            "Content-Type": "application/octet-stream",
          },
          timeout: 60000, // 60 second timeout
        }
      );

      const result: WalrusStoreResponse = response.data;

      // Handle response - can be newlyCreated or alreadyCertified
      let blobId: string;
      let size: number;

      if (result.newlyCreated) {
        blobId = result.newlyCreated.blobObject.blobId;
        size = result.newlyCreated.blobObject.size;
        console.log(`[Walrus] ✓ Newly stored blob: ${blobId}`);
      } else if (result.alreadyCertified) {
        blobId = result.alreadyCertified.blobId;
        size = data.length;
        console.log(`[Walrus] ✓ Already certified blob: ${blobId}`);
      } else {
        throw new Error("Unknown Walrus response format");
      }

      return {
        blobId,
        size,
        uploadedAt: new Date().toISOString(),
        metadata,
      };
    } catch (error: any) {
      console.error("[Walrus] Error storing blob:", error.message);
      
      // If Walrus testnet is down, log but don't fail completely
      if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        console.warn("[Walrus] Testnet unavailable, using mock fallback");
        // Return mock response
        return {
          blobId: `mock_${crypto.randomBytes(16).toString("hex")}`,
          size: data.length,
          uploadedAt: new Date().toISOString(),
          metadata: { ...metadata, mode: "mock_fallback" },
        };
      }

      throw new Error(`Failed to store blob on Walrus: ${error.message}`);
    }
  }

  /**
   * Retrieve a blob from Walrus testnet
   * @param blobId The blob ID to retrieve
   * @returns Buffer of blob data
   */
  async retrieveBlob(blobId: string): Promise<Buffer> {
    try {
      console.log(`[Walrus] Retrieving blob: ${blobId}...`);

      // Check if it's a mock blob
      if (blobId.startsWith("mock_")) {
        throw new Error("Mock blob cannot be retrieved from Walrus");
      }

      // Retrieve from Walrus via GET request
      const response = await axios.get(
        `${this.aggregatorUrl}/v1/${blobId}`,
        {
          responseType: "arraybuffer",
          timeout: 60000,
        }
      );

      console.log(`[Walrus] ✓ Retrieved blob (${response.data.length} bytes)`);
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error("[Walrus] Error retrieving blob:", error.message);
      
      if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        console.warn("[Walrus] Testnet unavailable for retrieval");
      }

      throw new Error(`Failed to retrieve blob from Walrus: ${error.message}`);
    }
  }

  /**
   * Check if Walrus testnet is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple connectivity check
      await axios.get(`${this.publisherUrl}/v1/api`, {
        timeout: 5000,
      });
      return true;
    } catch (error) {
      console.warn("[Walrus] Testnet health check failed");
      return false;
    }
  }

  /**
   * Get blob information without downloading
   * @param blobId The blob ID
   */
  async getBlobInfo(blobId: string): Promise<any> {
    try {
      const response = await axios.head(
        `${this.aggregatorUrl}/v1/${blobId}`,
        {
          timeout: 10000,
        }
      );

      return {
        exists: response.status === 200,
        contentLength: response.headers["content-length"],
        contentType: response.headers["content-type"],
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { exists: false };
      }
      throw error;
    }
  }
}

export default WalrusService;

