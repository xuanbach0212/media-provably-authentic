/**
 * Aggregator Service
 * Collects reports from multiple enclaves and computes consensus verdict
 */

import { VerificationReport, Verdict } from "@media-auth/shared";
import crypto from "crypto";

interface EnclaveReport {
  enclaveId: string;
  report: VerificationReport;
  timestamp: string;
  reputation: number; // Oracle reputation score
  stake: number; // Oracle stake amount
}

interface ConsensusResult {
  finalVerdict: Verdict;
  confidence: number;
  agreementRate: number;
  reports: EnclaveReport[];
  consensusTimestamp: string;
}

export class AggregatorService {
  private pendingReports: Map<string, EnclaveReport[]>;
  private minEnclaves: number;
  private consensusThreshold: number;

  constructor() {
    this.pendingReports = new Map();
    this.minEnclaves = parseInt(process.env.MIN_ENCLAVES || "2"); // Minimum 2 enclaves
    this.consensusThreshold = parseFloat(process.env.CONSENSUS_THRESHOLD || "0.66"); // 66% agreement
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

    // Weighted voting based on reputation and stake
    const verdictVotes: Map<Verdict, number> = new Map();
    let totalWeight = 0;

    reports.forEach((enclaveReport) => {
      const { report, reputation, stake } = enclaveReport;
      const weight = this.calculateWeight(reputation, stake);
      
      const currentVotes = verdictVotes.get(report.verdict) || 0;
      verdictVotes.set(report.verdict, currentVotes + weight);
      totalWeight += weight;

      console.log(
        `[Aggregator] Enclave ${enclaveReport.enclaveId}: ` +
        `verdict=${report.verdict}, weight=${weight.toFixed(2)}`
      );
    });

    // Determine winning verdict
    let winningVerdict: Verdict = "UNKNOWN";
    let maxVotes = 0;

    verdictVotes.forEach((votes, verdict) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        winningVerdict = verdict;
      }
    });

    // Calculate agreement rate
    const agreementRate = maxVotes / totalWeight;
    
    console.log(
      `[Aggregator] Consensus: verdict=${winningVerdict}, ` +
      `agreement=${(agreementRate * 100).toFixed(1)}%, ` +
      `threshold=${(this.consensusThreshold * 100)}%`
    );

    // Check if consensus threshold is met
    if (agreementRate < this.consensusThreshold) {
      console.warn(`[Aggregator] Consensus threshold not met (${agreementRate} < ${this.consensusThreshold})`);
      // In production, might trigger additional verification
    }

    // Calculate average confidence from reports with winning verdict
    const matchingReports = reports.filter(r => r.report.verdict === winningVerdict);
    const avgConfidence = matchingReports.reduce((sum, r) => sum + r.report.confidence, 0) / matchingReports.length;

    const consensus: ConsensusResult = {
      finalVerdict: winningVerdict,
      confidence: avgConfidence,
      agreementRate,
      reports,
      consensusTimestamp: new Date().toISOString(),
    };

    // Clean up
    this.pendingReports.delete(jobId);

    return consensus;
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

