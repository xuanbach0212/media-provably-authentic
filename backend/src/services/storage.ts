import axios from "axios";
import { WalrusService } from "./walrus";

const MOCK_SERVICES_URL =
  process.env.MOCK_SERVICES_URL || "http://localhost:3002";
const USE_WALRUS_TESTNET = process.env.USE_WALRUS_TESTNET === "true";

export class StorageService {
  private walrus: WalrusService | null;

  constructor() {
    this.walrus = USE_WALRUS_TESTNET ? new WalrusService() : null;
  }

  async storeBlob(
    data: Buffer,
    metadata?: Record<string, any>
  ): Promise<string> {
    // Use Walrus testnet if enabled
    if (this.walrus) {
      try {
        const blob = await this.walrus.storeBlob(data, metadata);
        return blob.blobId;
      } catch (error: any) {
        console.error("[Storage] Walrus failed, falling back to mock:", error.message);
        // Fall through to mock
      }
    }

    // Use mock service
    try {
      const response = await axios.post(`${MOCK_SERVICES_URL}/walrus/store`, {
        data: data.toString("base64"),
        metadata,
      });

      return response.data.blobId;
    } catch (error: any) {
      console.error("Error storing blob:", error.message);
      throw new Error("Failed to store blob");
    }
  }

  async retrieveBlob(blobId: string): Promise<Buffer> {
    // Use Walrus testnet if enabled and not a mock blob
    if (this.walrus && !blobId.startsWith("mock_")) {
      try {
        return await this.walrus.retrieveBlob(blobId);
      } catch (error: any) {
        console.error("[Storage] Walrus retrieval failed, falling back to mock:", error.message);
        // Fall through to mock
      }
    }

    // Use mock service
    try {
      const response = await axios.get(
        `${MOCK_SERVICES_URL}/walrus/retrieve/${blobId}`
      );
      return Buffer.from(response.data.blob.data, "base64");
    } catch (error: any) {
      console.error("Error retrieving blob:", error.message);
      throw new Error("Failed to retrieve blob");
    }
  }
}
