/**
 * Multi-Worker Processor
 * Runs multiple enclave workers that independently process jobs
 */

import { Job } from "bull";
import { VerificationJob } from "@media-auth/shared";
import { OrchestrationService } from "../services/orchestrator";
import { AggregatorService } from "../services/aggregator";
import verificationQueue, { jobQueue } from "./bullQueue";

const NUM_WORKERS = parseInt(process.env.NUM_ENCLAVE_WORKERS || "3");
const ORACLE_REPUTATION_BASE = parseFloat(process.env.ORACLE_REPUTATION || "0.8");
const ORACLE_STAKE_BASE = parseInt(process.env.ORACLE_STAKE || "1000");

interface WorkerConfig {
  workerId: number;
  enclaveId: string;
  reputation: number;
  stake: number;
}

class MultiWorkerProcessor {
  private workers: WorkerConfig[];
  private aggregator: AggregatorService;
  private orchestrators: Map<string, OrchestrationService>;

  constructor() {
    this.aggregator = new AggregatorService();
    this.orchestrators = new Map();
    
    // Initialize worker configurations
    this.workers = [];
    for (let i = 0; i < NUM_WORKERS; i++) {
      const workerId = i + 1;
      const config: WorkerConfig = {
        workerId,
        enclaveId: `enclave_${workerId}`,
        // Simulate different reputation/stake for workers
        reputation: ORACLE_REPUTATION_BASE + (Math.random() * 0.2 - 0.1), // ±0.1
        stake: ORACLE_STAKE_BASE + Math.floor(Math.random() * 500 - 250), // ±250
      };
      this.workers.push(config);
      
      console.log(
        `[MultiWorker] Initialized ${config.enclaveId}: ` +
        `reputation=${config.reputation.toFixed(2)}, stake=${config.stake}`
      );
    }
  }

  /**
   * Start all workers
   */
  start(): void {
    this.workers.forEach((worker) => {
      this.startWorker(worker);
    });

    console.log(`[MultiWorker] Started ${NUM_WORKERS} enclave workers`);
  }

  /**
   * Start individual worker
   */
  private startWorker(worker: WorkerConfig): void {
    const { enclaveId, reputation, stake } = worker;

    // Each worker processes jobs independently
    verificationQueue.process(
      enclaveId, // Worker name
      1, // Concurrency per worker
      async (job: Job<VerificationJob>) => {
        return await this.processJob(job, worker);
      }
    );

    console.log(`[MultiWorker] Worker ${enclaveId} ready`);
  }

  /**
   * Process job with specific worker/enclave
   */
  private async processJob(
    job: Job<VerificationJob>,
    worker: WorkerConfig
  ): Promise<any> {
    const { enclaveId, reputation, stake } = worker;
    const verificationJob = job.data;

    console.log(
      `[MultiWorker] Worker ${enclaveId} processing job ${verificationJob.jobId}`
    );

    try {
      // Get or create orchestrator for this enclave
      if (!this.orchestrators.has(enclaveId)) {
        this.orchestrators.set(
          enclaveId,
          new OrchestrationService(enclaveId)
        );
      }
      const orchestrator = this.orchestrators.get(enclaveId)!;

      // Process verification
      await job.progress(10);
      const report = await orchestrator.processVerificationJob(verificationJob);
      await job.progress(80);

      // Submit report to aggregator
      const hasConsensus = await this.aggregator.submitReport(
        verificationJob.jobId,
        enclaveId,
        report,
        reputation,
        stake
      );

      await job.progress(90);

      // If consensus reached, finalize
      if (hasConsensus) {
        console.log(`[MultiWorker] Consensus reached for job ${verificationJob.jobId}`);
        
        const consensus = await this.aggregator.computeConsensus(verificationJob.jobId);
        
        if (consensus) {
          // Store consensus report
          const finalReport = {
            ...report,
            verdict: consensus.finalVerdict,
            confidence: consensus.confidence,
            consensusMetadata: {
              agreementRate: consensus.agreementRate,
              participatingEnclaves: consensus.reports.length,
              consensusTimestamp: consensus.consensusTimestamp,
            },
          };

          await jobQueue.storeReport(verificationJob.jobId, finalReport);
          
          console.log(
            `[MultiWorker] Job ${verificationJob.jobId} completed with consensus: ` +
            `verdict=${consensus.finalVerdict}, agreement=${(consensus.agreementRate * 100).toFixed(1)}%`
          );
        }
      } else {
        console.log(
          `[MultiWorker] Waiting for more reports (worker ${enclaveId})`
        );
      }

      await job.progress(100);
      return report;
      
    } catch (error: any) {
      console.error(
        `[MultiWorker] Worker ${enclaveId} failed to process job ${verificationJob.jobId}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Stop all workers
   */
  async stop(): Promise<void> {
    console.log("[MultiWorker] Stopping all workers...");
    await verificationQueue.close();
    console.log("[MultiWorker] All workers stopped");
  }

  /**
   * Get aggregator instance
   */
  getAggregator(): AggregatorService {
    return this.aggregator;
  }
}

// Export singleton instance
export const multiWorkerProcessor = new MultiWorkerProcessor();

export const startMultiWorkerProcessor = () => {
  multiWorkerProcessor.start();
};

export const stopMultiWorkerProcessor = async () => {
  await multiWorkerProcessor.stop();
};

export const getAggregator = () => {
  return multiWorkerProcessor.getAggregator();
};

