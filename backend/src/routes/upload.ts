import { MediaMetadata, VerificationJob } from "@media-auth/shared";
import { Router } from "express";
import multer from "multer";
import { jobQueue } from "../queue/bullQueue";
import { EncryptionService } from "../services/encryption";
import { StorageService } from "../services/storage";
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
    const signature = req.body.signature || "mock_signature";

    console.log(
      `[Upload] Received file: ${req.file.originalname}, size: ${req.file.size}`
    );

    // 1. Compute hashes
    const sha256 = computeSHA256(req.file.buffer);
    const pHash = computePerceptualHash(req.file.buffer);

    // 2. Create encryption policy (allow our mock enclave)
    const policyId = await encryption.createPolicy(["mock_enclave_1", "*"]);

    // 3. Encrypt the media
    const { encrypted, metadata: encryptionMeta } =
      await encryption.encryptData(req.file.buffer, policyId);

    // 4. Store encrypted media in Walrus
    const mediaCID = await storage.storeBlob(encrypted, {
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      sha256,
      pHash,
    });

    // 5. Create verification job
    const jobId = generateJobId();
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

    console.log(`[Upload] Created job ${jobId} for media ${mediaCID}`);

    res.json({
      success: true,
      jobId,
      mediaCID,
      status: "PENDING",
      mediaHash: sha256,
    });
  } catch (error: any) {
    console.error("[Upload] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
