import { MediaMetadata, VerificationJob } from "@media-auth/shared";
import { Router } from "express";
import multer from "multer";
import { jobQueue } from "../queue/bullQueue";
import { EncryptionService } from "../services/encryption";
import { StorageService } from "../services/storage";
import { SocketManager } from "../services/socketManager";
import {
  computePerceptualHash,
  computeSHA256,
  generateJobId,
} from "../utils/crypto";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
}); // 100MB limit

const storage = new StorageService();
const encryption = new EncryptionService();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.body.userId || "anonymous";
    const signature = req.body.signature;
    if (!signature) {
      console.warn("[Upload] ⚠️  No signature provided by user");
    }

    // Generate jobId FIRST so we can emit socket updates
    const jobId = generateJobId();
    
    console.log(`[Upload] ═══════════════════════════════════════`);
    console.log(`[Upload] Job ID: ${jobId}`);
    console.log(`[Upload] User: ${userId}`);
    console.log(`[Upload] File: ${req.file.originalname}`);
    console.log(`[Upload] Size: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`[Upload] ═══════════════════════════════════════`);

    // Stage 1: Initializing (0-10%)
    SocketManager.emitProgress(jobId, {
      stage: 1,
      stageName: "Initializing",
      substep: "Computing file hashes...",
      progress: 2,
      timestamp: new Date().toISOString(),
    });

    // 1. Compute hashes
    const sha256 = computeSHA256(req.file.buffer);
    const pHash = computePerceptualHash(req.file.buffer);
    
    // Debug delay for visibility
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`[Upload] ✓ SHA-256: ${sha256.substring(0, 32)}...`);
    console.log(`[Upload] ✓ pHash: ${pHash}`);

    SocketManager.emitProgress(jobId, {
      stage: 1,
      stageName: "Initializing",
      substep: "Creating encryption policy...",
      progress: 8,
      timestamp: new Date().toISOString(),
    });

    // 2. Create encryption policy (use real enclave ID)
    const ENCLAVE_ID = process.env.ENCLAVE_ID || "nautilus_nitro_enclave";
    const policyId = await encryption.createPolicy([ENCLAVE_ID, "*"]);
    
    // Debug delay for visibility
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`[Upload] ✓ Policy created for enclave: ${ENCLAVE_ID}`);
    console.log(`[Upload] ✓ Policy ID: ${policyId}`);

    // Stage 2: Encrypting & Storing (10-20%)
    SocketManager.emitProgress(jobId, {
      stage: 2,
      stageName: "Encrypting & Storing",
      substep: "Encrypting media with Seal KMS...",
      progress: 12,
      timestamp: new Date().toISOString(),
    });

    // 3. Encrypt the media
    const { encrypted, metadata: encryptionMeta } =
      await encryption.encryptData(req.file.buffer, policyId);
    
    // Debug delay for visibility
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`[Upload] ✓ Media encrypted`);
    console.log(`[Upload]   Original size: ${req.file.size} bytes`);
    console.log(`[Upload]   Encrypted size: ${encrypted.length} bytes`);
    console.log(`[Upload]   Algorithm: ${encryptionMeta.algorithm}`);

    // Get current storage provider
    const storageProvider = storage.getCurrentProvider();
    const isUsingFallback = storageProvider === "LocalFile";

    SocketManager.emitProgress(jobId, {
      stage: 2,
      stageName: "Encrypting & Storing",
      substep: isUsingFallback 
        ? "Storing encrypted media locally..." 
        : "Storing encrypted media on Walrus...",
      progress: 16,
      timestamp: new Date().toISOString(),
    });

    // 4. Store encrypted media
    const mediaCID = await storage.storeBlob(encrypted, {
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      sha256,
      pHash,
    });
    
    // Debug delay for visibility
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`[Upload] ✓ Media stored`);
    console.log(`[Upload]   Provider: ${storageProvider}`);
    console.log(`[Upload]   CID: ${mediaCID}`);

    // Notify if using fallback storage
    if (isUsingFallback) {
      SocketManager.emitProgress(jobId, {
        stage: 2,
        stageName: "Encrypting & Storing",
        substep: "Using local storage (Walrus unavailable)",
        progress: 18,
        timestamp: new Date().toISOString(),
        warning: "Blobs stored locally, not on decentralized network",
      });
    }

    SocketManager.emitProgress(jobId, {
      stage: 2,
      stageName: "Encrypting & Storing",
      substep: "Upload complete! Preparing verification...",
      progress: 20,
      timestamp: new Date().toISOString(),
    });

    // 5. Create verification job
    const metadata: MediaMetadata = {
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      sha256,
      pHash,
      uploadedAt: new Date().toISOString(),
    };

    const job: VerificationJob = {
      jobId,
      userId,
      mediaCID,
      mediaHash: sha256,
      pHash,
      metadata,
      encryptionMeta,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 6. Add to queue
    await jobQueue.addJob(job);

    console.log(`[Upload] Job ${jobId} added to queue for media ${mediaCID}`);

    // Return jobId immediately so frontend can subscribe to socket
    res.json({
      success: true,
      jobId,
      mediaCID,
      status: "PENDING",
      mediaHash: sha256,
      storageProvider: storage.getCurrentProvider(),
      progress: {
        stage: 2,
        stageName: "Encrypting & Storing",
        substep: "Upload complete! Preparing verification...",
        progress: 20,
      },
    });
  } catch (error: any) {
    console.error("[Upload] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
