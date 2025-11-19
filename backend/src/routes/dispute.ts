/**
 * Dispute Routes
 * Handle challenge/dispute flow for attestations
 */

import { Router } from "express";
import { getAggregator } from "../queue/multiWorkerProcessor";

const router = Router();

/**
 * Submit a dispute/challenge for an attestation
 * POST /api/dispute
 */
router.post("/", async (req, res) => {
  try {
    const { jobId, challengerAddress, evidenceCID, reason } = req.body;

    if (!jobId || !challengerAddress || !evidenceCID) {
      return res.status(400).json({
        error: "Missing required fields: jobId, challengerAddress, evidenceCID",
      });
    }

    console.log(`[Dispute API] Challenge submitted for job ${jobId}`);
    console.log(`[Dispute API] Challenger: ${challengerAddress}`);
    console.log(`[Dispute API] Evidence: ${evidenceCID}`);

    // Submit dispute to aggregator
    const aggregator = getAggregator();
    await aggregator.handleDispute(jobId, challengerAddress, evidenceCID);

    res.json({
      success: true,
      message: "Dispute submitted successfully",
      jobId,
      status: "pending_reverification",
      estimatedTime: "2-5 minutes",
    });
  } catch (error: any) {
    console.error("[Dispute API] Error submitting dispute:", error.message);
    res.status(500).json({ error: "Failed to submit dispute" });
  }
});

/**
 * Get dispute status
 * GET /api/dispute/:jobId
 */
router.get("/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    const aggregator = getAggregator();
    const pendingReports = aggregator.getPendingReports(jobId);

    res.json({
      jobId,
      status: pendingReports.length > 0 ? "reverifying" : "resolved",
      pendingReports: pendingReports.length,
    });
  } catch (error: any) {
    console.error("[Dispute API] Error getting dispute status:", error.message);
    res.status(500).json({ error: "Failed to get dispute status" });
  }
});

export default router;

