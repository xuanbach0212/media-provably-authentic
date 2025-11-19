import { OrchestrationService } from "../services/orchestrator";
import { jobQueue } from "./jobQueue";

const orchestrator = new OrchestrationService();

export class JobProcessor {
  private isRunning = false;
  private pollInterval = 2000; // 2 seconds

  start(): void {
    if (this.isRunning) {
      console.log("[JobProcessor] Already running");
      return;
    }

    this.isRunning = true;
    console.log("[JobProcessor] Started");
    this.processLoop();
  }

  stop(): void {
    this.isRunning = false;
    console.log("[JobProcessor] Stopped");
  }

  private async processLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processPendingJobs();
      } catch (error: any) {
        console.error(
          "[JobProcessor] Error in processing loop:",
          error.message
        );
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, this.pollInterval));
    }
  }

  private async processPendingJobs(): Promise<void> {
    const pendingJobs = await jobQueue.getPendingJobs();

    if (pendingJobs.length === 0) {
      return;
    }

    console.log(`[JobProcessor] Found ${pendingJobs.length} pending jobs`);

    // Process jobs (for now, one at a time - can be parallelized)
    for (const job of pendingJobs.slice(0, 1)) {
      // Process one at a time
      try {
        jobQueue.markProcessing(job.jobId);
        await jobQueue.updateJobStatus(job.jobId, "PROCESSING");

        console.log(`[JobProcessor] Processing job ${job.jobId}`);
        const report = await orchestrator.processVerificationJob(job);

        await jobQueue.storeReport(job.jobId, report);
        await jobQueue.updateJobStatus(job.jobId, "COMPLETED");

        console.log(`[JobProcessor] Completed job ${job.jobId}`);
      } catch (error: any) {
        console.error(
          `[JobProcessor] Failed to process job ${job.jobId}:`,
          error.message
        );
        await jobQueue.updateJobStatus(job.jobId, "FAILED");
      } finally {
        jobQueue.unmarkProcessing(job.jobId);
      }
    }
  }
}

export const jobProcessor = new JobProcessor();
