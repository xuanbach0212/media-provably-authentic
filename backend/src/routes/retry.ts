/**
 * Retry Route
 * Allows manual retry of failed verification jobs
 */

import express from "express";
import verificationQueue from "../queue/bullQueue";

const router = express.Router();

/**
 * POST /api/job/:jobId/retry
 * Retry a failed verification job
 */
router.post("/job/:jobId/retry", async (req, res) => {
  const { jobId } = req.params;

  try {
    // Get the original job
    const job = await verificationQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if job is in a retryable state
    const state = await job.getState();
    if (state !== "failed") {
      return res.status(400).json({ 
        error: `Job cannot be retried in state: ${state}`,
        currentState: state,
      });
    }

    // Retry the job
    await job.retry();

    console.log(`[Retry] Job ${jobId} queued for retry`);

    res.json({
      success: true,
      jobId,
      message: "Job queued for retry",
    });
  } catch (error: any) {
    console.error("[Retry] Error:", error);
    res.status(500).json({ error: error.message || "Failed to retry job" });
  }
});

export default router;

