/**
 * Aggregator Service
 * Collects reports from multiple enclaves and computes consensus verdict
 */

import { VerificationReport, BlockchainAttestation } from "@media-auth/shared";
import crypto from "crypto";
import { StorageService } from "./storage";
import { BlockchainService } from "./blockchain";

interface EnclaveReport {
  enclaveId: string;
  report: VerificationReport;
  timestamp: string;
  reputation: number; // Oracle reputation score
  stake: number; // Oracle stake amount
}

interface ConsensusResult {
  reports: EnclaveReport[];
  consensusTimestamp: string;
  averageEnsembleScore: number;
}

export class AggregatorService {
  private pendingReports: Map<string, EnclaveReport[]>;
  private minEnclaves: number;
  private consensusThreshold: number;
  private storage: StorageService;
  private blockchain: BlockchainService;

  constructor() {
    this.pendingReports = new Map();
    this.minEnclaves = parseInt(process.env.MIN_ENCLAVES || "2"); // Minimum 2 enclaves
    this.consensusThreshold = parseFloat(process.env.CONSENSUS_THRESHOLD || "0.66"); // 66% agreement
    this.storage = new StorageService();
    this.blockchain = new BlockchainService();
  }

  /**
   * Submit a report from an enclave
   */
  async submitReport(
    jobId: string,
    enclaveId: string,
    report: VerificationReport,
    reputation: number = 1.0,
    stake: number = 100
  ): Promise<boolean> {
    console.log(`[Aggregator] Received report from enclave ${enclaveId} for job ${jobId}`);

    const enclaveReport: EnclaveReport = {
      enclaveId,
      report,
      timestamp: new Date().toISOString(),
      reputation,
      stake,
    };

    // Add to pending reports
    if (!this.pendingReports.has(jobId)) {
      this.pendingReports.set(jobId, []);
    }
    this.pendingReports.get(jobId)!.push(enclaveReport);

    const reports = this.pendingReports.get(jobId)!;
    console.log(`[Aggregator] Job ${jobId} has ${reports.length}/${this.minEnclaves} reports`);

    // Check if we have enough reports for consensus
    return reports.length >= this.minEnclaves;
  }

  /**
   * Compute consensus from all submitted reports
   */
  async computeConsensus(jobId: string): Promise<ConsensusResult | null> {
    const reports = this.pendingReports.get(jobId);
    
    if (!reports || reports.length < this.minEnclaves) {
      console.log(`[Aggregator] Not enough reports for consensus (${reports?.length || 0}/${this.minEnclaves})`);
      return null;
    }

    console.log(`[Aggregator] Computing consensus for job ${jobId} from ${reports.length} enclaves`);

    // Calculate average ensemble score from all enclaves
    const totalEnsembleScore = reports.reduce((sum, enclaveReport) => {
      const score = enclaveReport.report.analysisData.aiDetection.ensembleScore;
      console.log(`[Aggregator] Enclave ${enclaveReport.enclaveId}: ensemble score=${score.toFixed(3)}`);
      return sum + score;
    }, 0);

    const averageEnsembleScore = totalEnsembleScore / reports.length;
    
    console.log(
      `[Aggregator] Average ensemble score: ${averageEnsembleScore.toFixed(3)} ` +
      `(from ${reports.length} enclaves)`
    );

    const consensus: ConsensusResult = {
      averageEnsembleScore,
      reports,
      consensusTimestamp: new Date().toISOString(),
    };

    // Clean up
    this.pendingReports.delete(jobId);

    return consensus;
  }

  /**
   * Store consensus report to Walrus and submit attestation to blockchain
   * This is called AFTER consensus is computed to avoid race conditions
   */
  async finalizeConsensusReport(
    jobId: string,
    mediaHash: string,
    consensusReport: VerificationReport
  ): Promise<{ reportCID: string; blockchainAttestation: BlockchainAttestation }> {
    console.log(`[Aggregator] Finalizing consensus report for job ${jobId}...`);

    // 1. Store report in Walrus (single upload, no race condition)
    const reportJSON = JSON.stringify(consensusReport);
    const reportCID = await this.storage.storeBlob(Buffer.from(reportJSON), {
      type: "verification-report",
      jobId,
    });
    console.log(`[Aggregator] ✓ Consensus report stored in Walrus: ${reportCID}`);

    // 2. Submit attestation to blockchain
    // Use the first enclave's signature for now (in production, might aggregate signatures)
    const enclaveSignature = consensusReport.enclaveAttestation?.signature || "";
    const enclaveId = consensusReport.enclaveAttestation?.enclaveId || "consensus";
    
    // DEBUG: Log what we're passing to blockchain
    console.log(`[Aggregator] 🔍 DEBUG enclaveId being passed to blockchain: "${enclaveId}"`);
    console.log(`[Aggregator] 🔍 DEBUG consensusReport.enclaveAttestation:`, JSON.stringify(consensusReport.enclaveAttestation, null, 2));
    
    const blockchainAttestation = await this.blockchain.submitAttestation(
      jobId,
      mediaHash,
      reportCID,
      enclaveSignature,
      enclaveId
    );
    console.log(
      `[Aggregator] ✓ Attestation submitted to Sui: ${blockchainAttestation.txHash}`
    );

    return { reportCID, blockchainAttestation };
  }

  /**
   * Calculate weight for an enclave vote
   * Weight = reputation * sqrt(stake) 
   * This gives more weight to high-reputation oracles while limiting stake influence
   */
  private calculateWeight(reputation: number, stake: number): number {
    // Reputation: 0.0 to 1.0
    // Stake: in token units
    const stakeWeight = Math.sqrt(stake / 100); // Normalize stake
    return reputation * stakeWeight;
  }

  /**
   * Get pending reports for a job
   */
  getPendingReports(jobId: string): EnclaveReport[] {
    return this.pendingReports.get(jobId) || [];
  }

  /**
   * Check if job has consensus
   */
  hasConsensus(jobId: string): boolean {
    const reports = this.pendingReports.get(jobId);
    return reports ? reports.length >= this.minEnclaves : false;
  }

  /**
   * Handle disputed attestation
   * This would trigger re-verification by enclaves
   */
  async handleDispute(
    jobId: string,
    challengerAddress: string,
    evidenceCID: string
  ): Promise<void> {
    console.log(
      `[Aggregator] Dispute raised for job ${jobId} by ${challengerAddress}`
    );
    console.log(`[Aggregator] Evidence CID: ${evidenceCID}`);

    // Clear existing reports to trigger re-verification
    this.pendingReports.delete(jobId);

    // In production:
    // 1. Notify all enclaves to re-verify
    // 2. Include evidence in re-verification
    // 3. Compare new results with disputed attestation
    // 4. Slash misbehaving oracles if fraud detected
    
    console.log(`[Aggregator] Job ${jobId} queued for re-verification`);
  }

  /**
   * Calculate oracle reputation based on historical accuracy
   */
  calculateOracleReputation(
    enclaveId: string,
    totalReports: number,
    correctReports: number
  ): number {
    if (totalReports === 0) return 0.5; // Default for new oracles
    
    const accuracy = correctReports / totalReports;
    
    // Reputation formula:
    // - High accuracy = high reputation
    // - More reports = more confidence
    const confidence = Math.min(totalReports / 100, 1.0);
    const reputation = accuracy * 0.8 + confidence * 0.2;
    
    return Math.max(0.1, Math.min(1.0, reputation)); // Clamp between 0.1 and 1.0
  }

  /**
   * Slash oracle for misbehavior
   */
  async slashOracle(
    enclaveId: string,
    reason: string,
    slashAmount: number
  ): Promise<void> {
    console.log(`[Aggregator] Slashing oracle ${enclaveId}`);
    console.log(`[Aggregator] Reason: ${reason}`);
    console.log(`[Aggregator] Amount: ${slashAmount} tokens`);

    // In production:
    // 1. Submit slash transaction to Sui
    // 2. Update oracle reputation
    // 3. Emit event for monitoring
    // 4. Potentially ban oracle if severe
  }
}

export default AggregatorService;

