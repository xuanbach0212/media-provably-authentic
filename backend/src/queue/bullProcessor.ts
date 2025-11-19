import { Job } from "bull";
import { VerificationJob } from "@media-auth/shared";
import { OrchestrationService } from "../services/orchestrator";
import verificationQueue, { jobQueue } from "./bullQueue";

const orchestrator = new OrchestrationService();

// Define the processor function
const processVerificationJob = async (job: Job<VerificationJob>) => {
  const verificationJob = job.data;
  console.log(`[BullProcessor] Processing job ${verificationJob.jobId}`);

  try {
    // Update progress
    await job.progress(10);

    // Process the verification
    const report = await orchestrator.processVerificationJob(verificationJob);

    // Update progress
    await job.progress(90);

    // Store the report
    await jobQueue.storeReport(verificationJob.jobId, report);

    // Update progress
    await job.progress(100);

    console.log(`[BullProcessor] Completed job ${verificationJob.jobId}`);
    return report;
  } catch (error: any) {
    console.error(
      `[BullProcessor] Failed to process job ${verificationJob.jobId}:`,
      error.message
    );
    throw error; // Bull will handle retries
  }
};

// Register the processor
export const startBullProcessor = () => {
  // Process 2 jobs concurrently
  verificationQueue.process(2, processVerificationJob);

  console.log("[BullProcessor] Started with concurrency: 2");
};

export const stopBullProcessor = async () => {
  console.log("[BullProcessor] Stopping...");
  await verificationQueue.close();
  console.log("[BullProcessor] Stopped");
};

