/**
 * Storage Provider Interface
 * Defines the contract for all storage implementations (Walrus, local file, etc.)
 */

export interface StorageBlob {
  blobId: string;
  size: number;
  uploadedAt: string;
  metadata?: Record<string, any>;
}

export interface IStorageProvider {
  /**
   * Store a blob and return its identifier
   * @param data Buffer containing the blob data
   * @param metadata Optional metadata to store with the blob
   * @returns Promise resolving to blob identifier
   */
  storeBlob(data: Buffer, metadata?: Record<string, any>): Promise<StorageBlob>;

  /**
   * Retrieve a blob by its identifier
   * @param blobId The blob identifier
   * @returns Promise resolving to the blob data
   */
  retrieveBlob(blobId: string): Promise<Buffer>;

  /**
   * Check if the storage provider is healthy and accessible
   * @returns Promise resolving to true if healthy, false otherwise
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get the name of this storage provider
   */
  getName(): string;
}

