import axios from "axios";

const MOCK_SERVICES_URL =
  process.env.MOCK_SERVICES_URL || "http://localhost:3002";

export class StorageService {
  async storeBlob(
    data: Buffer,
    metadata?: Record<string, any>
  ): Promise<string> {
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
