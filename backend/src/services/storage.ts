import { WalrusService } from "./walrus";

export class StorageService {
  private walrus: WalrusService;

  constructor() {
    // Use Walrus testnet only
    this.walrus = new WalrusService();
    console.log(`[Storage] Walrus testnet initialized`);
  }

  async storeBlob(
    data: Buffer,
    metadata?: Record<string, any>
  ): Promise<string> {
    const blob = await this.walrus.storeBlob(data, metadata);
    return blob.blobId;
  }

  async retrieveBlob(blobId: string): Promise<Buffer> {
    return await this.walrus.retrieveBlob(blobId);
  }
}
