import {
  JobStatus,
  VerificationJob,
  VerificationReport,
} from "@media-auth/shared";

// Simple in-memory queue for development
// In production, use Bull with Redis

class InMemoryQueue {
  private jobs: Map<string, VerificationJob> = new Map();
  private reports: Map<string, VerificationReport> = new Map();
  private processing: Set<string> = new Set();

  async addJob(job: VerificationJob): Promise<void> {
    this.jobs.set(job.jobId, job);
    console.log(`[JobQueue] Added job ${job.jobId}`);
  }

  async getJob(jobId: string): Promise<VerificationJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      job.updatedAt = new Date().toISOString();
      this.jobs.set(jobId, job);
      console.log(`[JobQueue] Updated job ${jobId} status to ${status}`);
    }
  }

  async getPendingJobs(): Promise<VerificationJob[]> {
    const pending: VerificationJob[] = [];
    for (const job of this.jobs.values()) {
      if (job.status === "PENDING" && !this.processing.has(job.jobId)) {
        pending.push(job);
      }
    }
    return pending;
  }

  markProcessing(jobId: string): void {
    this.processing.add(jobId);
  }

  unmarkProcessing(jobId: string): void {
    this.processing.delete(jobId);
  }

  async storeReport(jobId: string, report: VerificationReport): Promise<void> {
    this.reports.set(jobId, report);
    console.log(`[JobQueue] Stored report for job ${jobId}`);
  }

  async getReport(jobId: string): Promise<VerificationReport | null> {
    return this.reports.get(jobId) || null;
  }
}

export const jobQueue = new InMemoryQueue();
