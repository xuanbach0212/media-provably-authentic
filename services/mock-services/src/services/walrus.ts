import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { WalrusBlob } from '@media-auth/shared';

const STORAGE_DIR = path.join(__dirname, '../../storage/walrus');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export class MockWalrus {
  async storeBlob(data: Buffer, metadata?: Record<string, any>): Promise<WalrusBlob> {
    const blobId = uuidv4();
    const filePath = path.join(STORAGE_DIR, blobId);
    
    // Store the data
    fs.writeFileSync(filePath, data);
    
    // Store metadata separately
    if (metadata) {
      fs.writeFileSync(
        path.join(STORAGE_DIR, `${blobId}.meta`),
        JSON.stringify(metadata)
      );
    }
    
    const blob: WalrusBlob = {
      blobId,
      data: data.toString('base64'),
      metadata,
      uploadedAt: new Date().toISOString()
    };
    
    console.log(`[MockWalrus] Stored blob ${blobId}, size: ${data.length} bytes`);
    return blob;
  }
  
  async retrieveBlob(blobId: string): Promise<WalrusBlob | null> {
    const filePath = path.join(STORAGE_DIR, blobId);
    
    if (!fs.existsSync(filePath)) {
      console.log(`[MockWalrus] Blob ${blobId} not found`);
      return null;
    }
    
    const data = fs.readFileSync(filePath);
    
    // Try to load metadata
    let metadata: Record<string, any> | undefined;
    const metaPath = path.join(STORAGE_DIR, `${blobId}.meta`);
    if (fs.existsSync(metaPath)) {
      metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }
    
    const blob: WalrusBlob = {
      blobId,
      data: data.toString('base64'),
      metadata,
      uploadedAt: new Date().toISOString()
    };
    
    console.log(`[MockWalrus] Retrieved blob ${blobId}`);
    return blob;
  }
  
  async deleteBlob(blobId: string): Promise<boolean> {
    const filePath = path.join(STORAGE_DIR, blobId);
    const metaPath = path.join(STORAGE_DIR, `${blobId}.meta`);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    fs.unlinkSync(filePath);
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }
    
    console.log(`[MockWalrus] Deleted blob ${blobId}`);
    return true;
  }
}

