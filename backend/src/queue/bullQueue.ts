import Bull from "bull";
import {
  JobStatus,
  VerificationJob,
  VerificationReport,
} from "@media-auth/shared";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Create Bull queue for verification jobs
export const verificationQueue = new Bull<VerificationJob>("verification", REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500,     // Keep last 500 failed jobs
  },
});

// In-memory storage for reports (could be moved to Redis if needed)
class ReportStore {
  private reports: Map<string, VerificationReport> = new Map();

  async storeReport(jobId: string, report: VerificationReport): Promise<void> {
    this.reports.set(jobId, report);
    console.log(`[ReportStore] Stored report for job ${jobId}`);
  }

  async getReport(jobId: string): Promise<VerificationReport | null> {
    return this.reports.get(jobId) || null;
  }
}

export const reportStore = new ReportStore();

// Job Queue Interface (compatible with old in-memory queue)
export const jobQueue = {
  async addJob(job: VerificationJob): Promise<void> {
    await verificationQueue.add(job, {
      jobId: job.jobId,
      priority: 1,
    });
    console.log(`[BullQueue] Added job ${job.jobId} to queue`);
  },

  async getJob(jobId: string): Promise<VerificationJob | null> {
    const job = await verificationQueue.getJob(jobId);
    if (!job) return null;
    
    // Map Bull job to our VerificationJob format
    const data = job.data;
    const status = this.mapBullStateToStatus(await job.getState());
    
    return {
      ...data,
      status,
      updatedAt: new Date(job.processedOn || job.timestamp).toISOString(),
    };
  },

  async updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
    const job = await verificationQueue.getJob(jobId);
    if (!job) {
      console.warn(`[BullQueue] Job ${jobId} not found`);
      return;
    }
    
    // Bull manages status automatically, but we can add metadata
    await job.update({
      ...job.data,
      status,
      updatedAt: new Date().toISOString(),
    });
    
    console.log(`[BullQueue] Updated job ${jobId} status to ${status}`);
  },

  async getPendingJobs(): Promise<VerificationJob[]> {
    // This is handled by Bull's processor, not needed for manual polling
    return [];
  },

  markProcessing(jobId: string): void {
    // Bull handles this automatically
  },

  unmarkProcessing(jobId: string): void {
    // Bull handles this automatically
  },

  async storeReport(jobId: string, report: VerificationReport): Promise<void> {
    await reportStore.storeReport(jobId, report);
  },

  async getReport(jobId: string): Promise<VerificationReport | null> {
    return await reportStore.getReport(jobId);
  },

  mapBullStateToStatus(state: string): JobStatus {
    switch (state) {
      case "waiting":
      case "delayed":
        return "PENDING";
      case "active":
        return "PROCESSING";
      case "completed":
        return "COMPLETED";
      case "failed":
        return "FAILED";
      default:
        return "PENDING";
    }
  },
};

// Setup queue event listeners
verificationQueue.on("completed", (job) => {
  console.log(`[BullQueue] Job ${job.id} completed successfully`);
});

verificationQueue.on("failed", (job, err) => {
  console.error(`[BullQueue] Job ${job?.id} failed:`, err.message);
});

verificationQueue.on("error", (error) => {
  console.error("[BullQueue] Queue error:", error);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[BullQueue] Closing queue gracefully...");
  await verificationQueue.close();
});

export default verificationQueue;

