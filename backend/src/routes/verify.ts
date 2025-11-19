import { Router } from "express";
import { jobQueue } from "../queue/bullQueue";
import { BlockchainService } from "../services/blockchain";

const router = Router();
const blockchain = new BlockchainService();

router.get("/job/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await jobQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const report = await jobQueue.getReport(jobId);

    res.json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      report: report || undefined,
    });
  } catch (error: any) {
    console.error("[Verify] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/attestation/:attestationId", async (req, res) => {
  try {
    const { attestationId } = req.params;
    const attestation = await blockchain.getAttestation(attestationId);

    if (!attestation) {
      return res.status(404).json({ error: "Attestation not found" });
    }

    res.json({
      success: true,
      attestation,
    });
  } catch (error: any) {
    console.error("[Verify] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/attestations/job/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const attestations = await blockchain.getAttestationsByJobId(jobId);

    res.json({
      success: true,
      attestations,
    });
  } catch (error: any) {
    console.error("[Verify] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" });
    }

    const job = await jobQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Job is already in queue, just return status
    const report = await jobQueue.getReport(jobId);
    const attestations = await blockchain.getAttestationsByJobId(jobId);

    res.json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      report: report || undefined,
      attestation: attestations[0] || undefined,
    });
  } catch (error: any) {
    console.error("[Verify] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
