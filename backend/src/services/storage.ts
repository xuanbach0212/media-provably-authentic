/**
 * Storage Service
 * Manages storage provider selection and fallback logic
 * Supports Walrus (decentralized) and LocalFile (fallback) providers
 */

import { IStorageProvider } from "./storage/IStorageProvider";
import { WalrusProvider } from "./storage/WalrusProvider";
import { LocalFileProvider } from "./storage/LocalFileProvider";

export class StorageService {
  private provider: IStorageProvider;
  private fallbackEnabled: boolean;
  private primaryProvider: IStorageProvider | null = null;

  constructor() {
    this.fallbackEnabled =
      process.env.WALRUS_FALLBACK_ENABLED !== "false";
    
    const storageProvider = process.env.STORAGE_PROVIDER || "walrus";

    console.log(`[Storage] Initializing with provider: ${storageProvider}`);
    console.log(`[Storage] Fallback enabled: ${this.fallbackEnabled}`);

    if (storageProvider === "local") {
      // Use local storage directly
      this.provider = new LocalFileProvider();
      console.log(`[Storage] Using LocalFile provider`);
    } else {
      // Try Walrus first
      try {
        this.provider = new WalrusProvider();
        this.primaryProvider = this.provider;
        
        // Test connectivity asynchronously
        if (this.fallbackEnabled) {
          this.testProviderHealth();
        }
      } catch (error: any) {
        console.error(`[Storage] Failed to initialize Walrus:`, error.message);
        
        if (this.fallbackEnabled) {
          console.warn(`[Storage] Falling back to LocalFile provider`);
          this.provider = new LocalFileProvider();
        } else {
          throw error;
        }
      }
    }
  }

  private async testProviderHealth(): Promise<void> {
    try {
      const isHealthy = await this.provider.healthCheck();
      
      if (!isHealthy && this.fallbackEnabled) {
        console.warn(
          `[Storage] ${this.provider.getName()} health check failed, switching to fallback`
        );
        this.provider = new LocalFileProvider();
        console.log(`[Storage] Now using ${this.provider.getName()} provider`);
      }
    } catch (error: any) {
      console.error(`[Storage] Health check error:`, error.message);
      
      if (this.fallbackEnabled) {
        console.warn(`[Storage] Switching to fallback provider`);
        this.provider = new LocalFileProvider();
        console.log(`[Storage] Now using ${this.provider.getName()} provider`);
      }
    }
  }

  async storeBlob(
    data: Buffer,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const blob = await this.provider.storeBlob(data, metadata);
      return blob.blobId;
    } catch (error: any) {
      console.error(
        `[Storage] ${this.provider.getName()} store failed:`,
        error.message
      );

      // Try fallback if enabled and we haven't already
      if (
        this.fallbackEnabled &&
        this.provider.getName() === "Walrus" &&
        this.primaryProvider
      ) {
        console.warn(`[Storage] Attempting fallback to LocalFile`);
        this.provider = new LocalFileProvider();
        
        try {
          const blob = await this.provider.storeBlob(data, metadata);
          console.log(`[Storage] ✓ Fallback successful`);
          return blob.blobId;
        } catch (fallbackError: any) {
          console.error(`[Storage] Fallback also failed:`, fallbackError.message);
          throw new Error(
            `Storage failed: ${error.message} (fallback: ${fallbackError.message})`
          );
        }
      }

      throw error;
    }
  }

  async retrieveBlob(blobId: string): Promise<Buffer> {
    try {
      return await this.provider.retrieveBlob(blobId);
    } catch (error: any) {
      console.error(
        `[Storage] ${this.provider.getName()} retrieve failed:`,
        error.message
      );

      // Try fallback if enabled and we haven't already
      if (
        this.fallbackEnabled &&
        this.provider.getName() === "Walrus" &&
        this.primaryProvider
      ) {
        console.warn(`[Storage] Attempting fallback to LocalFile`);
        const fallbackProvider = new LocalFileProvider();
        
        try {
          const data = await fallbackProvider.retrieveBlob(blobId);
          console.log(`[Storage] ✓ Fallback successful`);
          // Switch to fallback for future operations
          this.provider = fallbackProvider;
          return data;
        } catch (fallbackError: any) {
          console.error(`[Storage] Fallback also failed:`, fallbackError.message);
          throw new Error(
            `Storage retrieval failed: ${error.message} (fallback: ${fallbackError.message})`
          );
        }
      }

      throw error;
    }
  }

  getCurrentProvider(): string {
    return this.provider.getName();
  }

  async healthCheck(): Promise<boolean> {
    return await this.provider.healthCheck();
  }
}
