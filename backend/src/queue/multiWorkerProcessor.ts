/**
 * Multi-Worker Processor
 * Runs multiple enclave workers that independently process jobs
 */

import { Job } from "bull";
import { VerificationJob } from "@media-auth/shared";
import { OrchestrationService } from "../services/orchestrator";
import { AggregatorService } from "../services/aggregator";
import verificationQueue, { jobQueue, reportStore } from "./bullQueue";

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
    // Single processor that spawns multiple enclave verifications
    verificationQueue.process(async (job: Job<VerificationJob>) => {
      return await this.processJobWithAllEnclaves(job);
    });

    console.log(`[MultiWorker] Started processor with ${NUM_WORKERS} enclave consensus`);
  }

  /**
   * Process job with all enclaves in parallel
   */
  private async processJobWithAllEnclaves(
    job: Job<VerificationJob>
  ): Promise<any> {
    const verificationJob = job.data;

    console.log(
      `[MultiWorker] Processing job ${verificationJob.jobId} with ${NUM_WORKERS} enclaves`
    );

    try {
      await job.progress(10);

      // Process with all enclaves in parallel
      const enclavePromises = this.workers.map(async (worker) => {
        const { enclaveId, reputation, stake } = worker;
        
        console.log(`[MultiWorker] Enclave ${enclaveId} starting verification...`);

        // Get or create orchestrator for this enclave
        if (!this.orchestrators.has(enclaveId)) {
          this.orchestrators.set(
            enclaveId,
            new OrchestrationService(enclaveId)
          );
        }
        const orchestrator = this.orchestrators.get(enclaveId)!;

        // Process verification
        const report = await orchestrator.processVerificationJob(verificationJob);
        
        console.log(
          `[MultiWorker] Enclave ${enclaveId} completed: verdict=${report.verdict}, ` +
          `confidence=${(report.confidence * 100).toFixed(1)}%`
        );

        // Submit report to aggregator
        await this.aggregator.submitReport(
          verificationJob.jobId,
          enclaveId,
          report,
          reputation,
          stake
        );

        return { enclaveId, report, reputation, stake };
      });

      // Wait for all enclaves to complete
      const results = await Promise.all(enclavePromises);
      await job.progress(80);

      console.log(
        `[MultiWorker] All ${NUM_WORKERS} enclaves completed for job ${verificationJob.jobId}`
      );

      // Compute consensus
      const consensus = await this.aggregator.computeConsensus(verificationJob.jobId);
      
      if (!consensus) {
        throw new Error("Failed to reach consensus");
      }

      await job.progress(90);

      // Create final report with consensus
      const finalReport = {
        ...results[0].report, // Use first report as base
        verdict: consensus.finalVerdict,
        confidence: consensus.confidence,
        consensusMetadata: {
          agreementRate: consensus.agreementRate,
          participatingEnclaves: consensus.reports.length,
          consensusTimestamp: consensus.consensusTimestamp,
          enclaveReports: results.map(r => ({
            enclaveId: r.enclaveId,
            verdict: r.report.verdict,
            confidence: r.report.confidence,
            reputation: r.reputation,
            stake: r.stake,
          })),
        },
      };

      console.log(
        `[MultiWorker] Consensus: verdict=${consensus.finalVerdict}, ` +
        `agreement=${(consensus.agreementRate * 100).toFixed(1)}%`
      );

      // Store final report
      await reportStore.storeReport(verificationJob.jobId, finalReport);

      await job.progress(100);
      return finalReport;
      
    } catch (error: any) {
      console.error(
        `[MultiWorker] Failed to process job ${verificationJob.jobId}:`,
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

