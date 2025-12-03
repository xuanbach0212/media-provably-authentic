/**
 * Local File Storage Provider
 * Fallback storage implementation using local filesystem
 * Stores blobs in backend/uploads/blobs/ directory
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { IStorageProvider, StorageBlob } from "./IStorageProvider";

const BLOBS_DIR = path.join(process.cwd(), "uploads", "blobs");

export class LocalFileProvider implements IStorageProvider {
  constructor() {
    this.ensureBlobsDirectory();
  }

  private async ensureBlobsDirectory(): Promise<void> {
    try {
      await fs.mkdir(BLOBS_DIR, { recursive: true });
      console.log(`[LocalFileProvider] Blobs directory ready: ${BLOBS_DIR}`);
    } catch (error: any) {
      console.error(
        `[LocalFileProvider] Failed to create blobs directory:`,
        error.message
      );
    }
  }

  /**
   * Generate a deterministic blob ID from the data
   * Uses SHA-256 hash to ensure same data = same ID
   */
  private generateBlobId(data: Buffer): string {
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    // Use first 32 chars to match Walrus-style IDs
    return hash.substring(0, 32);
  }

  private getBlobPath(blobId: string): string {
    return path.join(BLOBS_DIR, `${blobId}.blob`);
  }

  private getMetadataPath(blobId: string): string {
    return path.join(BLOBS_DIR, `${blobId}.meta.json`);
  }

  async storeBlob(
    data: Buffer,
    metadata?: Record<string, any>
  ): Promise<StorageBlob> {
    const blobId = this.generateBlobId(data);
    const blobPath = this.getBlobPath(blobId);
    const metaPath = this.getMetadataPath(blobId);

    console.log(
      `[LocalFileProvider] Storing ${data.length} bytes as ${blobId}`
    );

    try {
      // Store blob data
      await fs.writeFile(blobPath, data);

      // Store metadata
      const blobInfo: StorageBlob = {
        blobId,
        size: data.length,
        uploadedAt: new Date().toISOString(),
        metadata,
      };
      await fs.writeFile(metaPath, JSON.stringify(blobInfo, null, 2));

      console.log(`[LocalFileProvider] ✓ Stored blob: ${blobId}`);
      return blobInfo;
    } catch (error: any) {
      console.error(
        `[LocalFileProvider] Failed to store blob:`,
        error.message
      );
      throw new Error(`Failed to store blob locally: ${error.message}`);
    }
  }

  async retrieveBlob(blobId: string): Promise<Buffer> {
    const blobPath = this.getBlobPath(blobId);

    console.log(`[LocalFileProvider] Retrieving blob: ${blobId}`);

    try {
      const data = await fs.readFile(blobPath);
      console.log(`[LocalFileProvider] ✓ Retrieved ${data.length} bytes`);
      return data;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.error(`[LocalFileProvider] Blob not found: ${blobId}`);
        throw new Error(`Blob not found: ${blobId}`);
      }
      console.error(
        `[LocalFileProvider] Failed to retrieve blob:`,
        error.message
      );
      throw new Error(`Failed to retrieve blob locally: ${error.message}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Check if we can write to the blobs directory
      const testFile = path.join(BLOBS_DIR, ".health_check");
      await fs.writeFile(testFile, "ok");
      await fs.unlink(testFile);
      return true;
    } catch (error) {
      console.error(`[LocalFileProvider] Health check failed:`, error);
      return false;
    }
  }

  getName(): string {
    return "LocalFile";
  }
}

