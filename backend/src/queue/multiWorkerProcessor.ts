/**
 * Multi-Worker Processor
 * Runs multiple enclave workers that independently process jobs
 */

import { Job } from "bull";
import { VerificationJob } from "@media-auth/shared";
import { OrchestrationService } from "../services/orchestrator";
import { AggregatorService } from "../services/aggregator";
import verificationQueue, { jobQueue, reportStore } from "./bullQueue";
import { SocketManager } from "../services/socketManager";

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
      // Stage 3: Dispatching to Enclaves (20-30%)
      await job.progress(20);
      SocketManager.emitProgress(verificationJob.jobId, {
        stage: 3,
        stageName: "Dispatching to Enclaves",
        substep: `Creating ${NUM_WORKERS} enclave verification tasks...`,
        progress: 20,
        timestamp: new Date().toISOString(),
      });

      // Stage 4: Enclave Processing (30-75%)
      SocketManager.emitProgress(verificationJob.jobId, {
        stage: 4,
        stageName: "Enclave Processing",
        substep: "Starting parallel enclave verification...",
        progress: 30,
        timestamp: new Date().toISOString(),
      });

      // Process with all enclaves in parallel
      const enclavePromises = this.workers.map(async (worker, index) => {
        const { enclaveId, reputation, stake, workerId } = worker;
        
        console.log(`[MultiWorker] Enclave ${enclaveId} starting verification...`);
        
        // Emit enclave start
        const enclaveProgress = 30 + (index * 15); // Distribute 30-75% across enclaves
        SocketManager.emitProgress(verificationJob.jobId, {
          stage: 4,
          stageName: "Enclave Processing",
          substep: `Enclave ${workerId}/${NUM_WORKERS}: Retrieving and decrypting media...`,
          progress: enclaveProgress,
          timestamp: new Date().toISOString(),
          metadata: { enclaveId },
        });

        // Get or create orchestrator for this enclave
        if (!this.orchestrators.has(enclaveId)) {
          this.orchestrators.set(
            enclaveId,
            new OrchestrationService(enclaveId)
          );
        }
        const orchestrator = this.orchestrators.get(enclaveId)!;

        // Emit AI detection progress
        SocketManager.emitProgress(verificationJob.jobId, {
          stage: 4,
          stageName: "Enclave Processing",
          substep: `Enclave ${workerId}/${NUM_WORKERS}: Running AI detection models...`,
          progress: enclaveProgress + 5,
          timestamp: new Date().toISOString(),
          metadata: { enclaveId },
        });

        // Process verification
        const report = await orchestrator.processVerificationJob(verificationJob);
        
        // Emit enclave completion
        SocketManager.emitProgress(verificationJob.jobId, {
          stage: 4,
          stageName: "Enclave Processing",
          substep: `Enclave ${workerId}/${NUM_WORKERS}: Completed (score: ${report.analysisData.aiDetection.ensembleScore.toFixed(2)})`,
          progress: enclaveProgress + 15,
          timestamp: new Date().toISOString(),
          metadata: { enclaveId },
        });
        
        console.log(
          `[MultiWorker] Enclave ${enclaveId} completed: ensemble score=${report.analysisData.aiDetection.ensembleScore.toFixed(3)}`
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
      
      // Stage 5: Computing Consensus (75-90%)
      await job.progress(75);
      SocketManager.emitProgress(verificationJob.jobId, {
        stage: 5,
        stageName: "Computing Consensus",
        substep: "Collecting reports from all enclaves...",
        progress: 75,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[MultiWorker] All ${NUM_WORKERS} enclaves completed for job ${verificationJob.jobId}`
      );

      SocketManager.emitProgress(verificationJob.jobId, {
        stage: 5,
        stageName: "Computing Consensus",
        substep: "Computing weighted votes from enclave verdicts...",
        progress: 80,
        timestamp: new Date().toISOString(),
      });

      // Compute consensus
      const consensus = await this.aggregator.computeConsensus(verificationJob.jobId);
      
      if (!consensus) {
        throw new Error("Failed to reach consensus");
      }

      SocketManager.emitProgress(verificationJob.jobId, {
        stage: 5,
        stageName: "Computing Consensus",
        substep: `Analysis complete: avg ensemble score ${consensus.averageEnsembleScore.toFixed(2)}`,
        progress: 85,
        timestamp: new Date().toISOString(),
      });

      // Stage 6: Blockchain Attestation (90-100%)
      await job.progress(90);
      SocketManager.emitProgress(verificationJob.jobId, {
        stage: 6,
        stageName: "Blockchain Attestation",
        substep: "Storing final report on Walrus...",
        progress: 90,
        timestamp: new Date().toISOString(),
      });

      // Create final report (just use first enclave's report - all should have similar results)
      const finalReport = {
        ...results[0].report,
      };

      console.log(
        `[MultiWorker] Processing complete with ${results.length} enclave reports`
      );

      // Finalize: Store to Walrus and submit to blockchain (single upload, no race condition)
      const { reportCID, blockchainAttestation } = await this.aggregator.finalizeConsensusReport(
        verificationJob.jobId,
        verificationJob.mediaHash,
        finalReport
      );

      SocketManager.emitProgress(verificationJob.jobId, {
        stage: 6,
        stageName: "Blockchain Attestation",
        substep: "Submitting attestation to Sui blockchain...",
        progress: 95,
        timestamp: new Date().toISOString(),
      });

      // Add storage and blockchain info to final report
      finalReport.reportStorageCID = reportCID;
      finalReport.blockchainAttestation = blockchainAttestation;

      // Store final report
      await reportStore.storeReport(verificationJob.jobId, finalReport);

      // Emit completion
      await job.progress(100);
      SocketManager.emitProgress(verificationJob.jobId, {
        stage: 6,
        stageName: "Completed",
        substep: "Verification complete! Report attested on blockchain.",
        progress: 100,
        timestamp: new Date().toISOString(),
      });

      SocketManager.emitComplete(verificationJob.jobId, finalReport);

      return finalReport;
      
    } catch (error: any) {
      console.error(
        `[MultiWorker] Failed to process job ${verificationJob.jobId}:`,
        error.message
      );
      
      // Emit error to socket
      SocketManager.emitError(verificationJob.jobId, {
        stage: 0,
        message: error.message || "Verification failed",
        retryable: true,
        timestamp: new Date().toISOString(),
        details: error.stack,
      });
      
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

