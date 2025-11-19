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
      blobId: string;
      size: number;
      erasureCodeType: string;
      certifiedEpoch: number;
    };
  };
  alreadyCertified?: {
    blobId: string;
    event: {
      txDigest: string;
      eventSeq: string;
    };
    endEpoch: number;
  };
}

interface WalrusBlob {
  blobId: string;
  size: number;
  uploadedAt?: string;
  metadata?: Record<string, any>;
}

export class WalrusService {
  private publisherUrl: string;
  private aggregatorUrl: string;

  constructor() {
    this.publisherUrl = WALRUS_TESTNET_PUBLISHER;
    this.aggregatorUrl = WALRUS_TESTNET_AGGREGATOR;
    console.log(`[Walrus] Initialized (testnet with fallback)`);
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
    console.log(`[Walrus] Storing ${data.length} bytes on testnet...`);

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
        timeout: 60000,
      }
    );

    const result: WalrusStoreResponse = response.data;

    let blobId: string;
    let size: number;

    if (result.newlyCreated) {
      blobId = result.newlyCreated.blobObject.blobId;
      size = result.newlyCreated.blobObject.size;
      console.log(`[Walrus] ✓ Stored: ${blobId.substring(0, 20)}...`);
    } else if (result.alreadyCertified) {
      blobId = result.alreadyCertified.blobId;
      size = data.length;
      console.log(`[Walrus] ✓ Already exists: ${blobId.substring(0, 20)}...`);
    } else {
      throw new Error("Unknown Walrus response");
    }

    return {
      blobId,
      size,
      uploadedAt: new Date().toISOString(),
      metadata,
    };
  }

  /**
   * Retrieve a blob from Walrus testnet
   * @param blobId The blob ID to retrieve
   * @returns Buffer of blob data
   */
  async retrieveBlob(blobId: string): Promise<Buffer> {
    console.log(`[Walrus] Retrieving from testnet: ${blobId.substring(0, 20)}...`);

    const response = await axios.get(
      `${this.aggregatorUrl}/v1/${blobId}`,
      {
        responseType: "arraybuffer",
        timeout: 60000,
      }
    );

    console.log(`[Walrus] ✓ Retrieved ${response.data.length} bytes`);
    return Buffer.from(response.data);
  }

  /**
   * Check if Walrus testnet is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await axios.get(`${this.publisherUrl}/v1/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
