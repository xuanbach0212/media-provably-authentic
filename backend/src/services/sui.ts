/**
 * Sui Blockchain Testnet Integration
 * For immutable attestation storage
 */

import { BlockchainAttestation } from "@media-auth/shared";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

export class SuiService {
  private client: SuiClient;
  private keypair: Ed25519Keypair | null;
  private packageId: string | null;
  private network: "testnet" | "devnet" | "mainnet";

  constructor() {
    // Read env vars in constructor (after dotenv.config())
    this.network =
      (process.env.SUI_NETWORK as "testnet" | "devnet" | "mainnet") ||
      "testnet";
    const privateKey = process.env.SUI_PRIVATE_KEY || "";
    this.packageId = process.env.SUI_PACKAGE_ID || null;

    this.client = new SuiClient({ url: getFullnodeUrl(this.network) });

    // Initialize keypair
    if (!privateKey) {
      console.error(
        "[Sui] ❌ No private key configured! Set SUI_PRIVATE_KEY in .env"
      );
      this.keypair = null;
    } else {
      try {
        // Handle bech32 format (suiprivkey1...)
        if (privateKey.startsWith("suiprivkey")) {
          const { secretKey } = decodeSuiPrivateKey(privateKey);
          this.keypair = Ed25519Keypair.fromSecretKey(secretKey);
        } else {
          // Handle hex format
          this.keypair = Ed25519Keypair.fromSecretKey(
            Buffer.from(privateKey, "hex")
          );
        }
        const address = this.keypair.toSuiAddress();
        console.log(`[Sui] ✅ Connected to ${this.network}`);
        console.log(
          `[Sui] Address: ${address.substring(0, 10)}...${address.substring(
            address.length - 6
          )}`
        );
      } catch (error: any) {
        console.error("[Sui] ❌ Failed to load private key:", error.message);
        this.keypair = null;
      }
    }

    if (!this.packageId) {
      console.warn(
        "[Sui] ⚠️  No package ID configured. Deploy contract first."
      );
    } else {
      console.log(`[Sui] Package: ${this.packageId.substring(0, 10)}...`);
    }
  }

  async submitAttestation(
    jobId: string,
    mediaHash: string,
    reportCID: string,
    enclaveSignature: string,
    enclaveId?: string
  ): Promise<BlockchainAttestation> {
    // Require real keys and contract
    if (!this.keypair || !this.packageId) {
      throw new Error(`[Sui] ❌ Missing configuration! keypair: ${!!this.keypair}, packageId: ${!!this.packageId}`);
    }

    console.log(`[Sui] Submitting attestation for job ${jobId} from enclave ${enclaveId || 'unknown'}...`);

    try {
      const tx = new Transaction();

      // Contract expects: job_id, media_hash, report_cid, verdict, enclave_signature, clock
      tx.moveCall({
        target: `${this.packageId}::attestation::submit_attestation`,
        arguments: [
          tx.pure.string(jobId),
          tx.pure.string(mediaHash),
          tx.pure.string(reportCID),
          tx.pure.string("verified"), // verdict - using "verified" as default
          tx.pure.string(enclaveSignature),
          tx.object("0x6"), // Clock object (shared object at 0x6)
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: this.keypair,
        transaction: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      if (result.effects?.status?.status !== "success") {
        throw new Error(`Transaction failed: ${result.effects?.status?.error}`);
      }

      const createdObject = result.objectChanges?.find(
        (obj: any) => obj.type === "created"
      ) as any;
      const attestationId = createdObject?.objectId || `att_${result.digest}`;

      console.log(
        `[Sui] ✓ Attestation recorded: ${result.digest.substring(0, 20)}...`
      );

      return {
        attestationId,
        txHash: result.digest,
        transactionHash: result.digest,
        blockNumber: 0,
        timestamp: new Date().toISOString(),
        reportCID: reportCID,
        enclaveId: enclaveId || "unknown",
      };
    } catch (error: any) {
      console.error(`[Sui] ❌ Failed to submit attestation:`, error.message);
      console.error(`[Sui] Error details:`, error);
      
      // No mock fallback - throw the error
      throw new Error(`Failed to submit Sui attestation: ${error.message}`);
    }
  }

  async getAttestation(
    attestationId: string
  ): Promise<BlockchainAttestation | null> {
    if (!this.packageId) {
      throw new Error("Contract not deployed");
    }

    try {
      const object = await this.client.getObject({
        id: attestationId,
        options: {
          showContent: true,
        },
      });

      if (!object.data) {
        return null;
      }

      // Parse object content
      const content: any = object.data.content;

      return {
        attestationId,
        txHash: content.fields?.tx_hash || "",
        blockNumber: 0,
        timestamp: content.fields?.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[Sui] Error getting attestation:`, error);
      return null;
    }
  }

  async getAttestationsByJobId(
    jobId: string
  ): Promise<BlockchainAttestation[]> {
    // Query events emitted by our contract
    try {
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: `${this.packageId}::attestation::AttestationCreated`,
        },
        limit: 50,
      });

      return events.data
        .filter((event: any) => event.parsedJson?.job_id === jobId)
        .map((event: any) => ({
          attestationId: event.parsedJson?.attestation_id || "",
          txHash: event.id.txDigest,
          blockNumber: 0,
          timestamp: new Date(parseInt(event.timestampMs)).toISOString(),
        }));
    } catch (error) {
      console.error(`[Sui] Error querying attestations:`, error);
      return [];
    }
  }

  async getBalance(): Promise<number> {
    if (!this.keypair) {
      throw new Error("No keypair configured");
    }

    const address = this.keypair.toSuiAddress();
    const balance = await this.client.getBalance({
      owner: address,
    });

    return parseInt(balance.totalBalance) / 1_000_000_000; // Convert MIST to SUI
  }
}
