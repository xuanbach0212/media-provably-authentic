/**
 * Create Seal Policy Object
 */

import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

const PACKAGE_ID = "0x69a1dbaa1ccc28aa0764462750cb539d344b6ce3298adf8c8214541477aca731";

async function createPolicy() {
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });
  
  const privateKey = process.env.SUI_PRIVATE_KEY!;
  const { secretKey } = decodeSuiPrivateKey(privateKey);
  const keypair = Ed25519Keypair.fromSecretKey(secretKey);

  console.log("Creating Seal policy object...\n");

  // Create transaction
  const tx = new Transaction();
  
  // Call create_policy with enclave IDs
  const [policy] = tx.moveCall({
    target: `${PACKAGE_ID}::enclave_policy::create_policy`,
    arguments: [
      tx.pure.vector("vector<u8>", [
        Array.from(Buffer.from("enclave_1", "utf-8")),
        Array.from(Buffer.from("enclave_2", "utf-8")),
        Array.from(Buffer.from("enclave_3", "utf-8")),
      ]),
    ],
  });

  // Transfer policy to sender
  tx.transferObjects([policy], keypair.toSuiAddress());

  // Execute
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  if (result.effects?.status?.status !== "success") {
    throw new Error(`Transaction failed: ${result.effects?.status?.error}`);
  }

  // Find the created policy object
  const createdObjects = result.objectChanges?.filter(
    (obj: any) => obj.type === "created"
  );

  const policyObject = createdObjects?.find((obj: any) =>
    obj.objectType?.includes("EnclavePolicy")
  );

  console.log("✅ Policy created successfully!\n");
  console.log("Transaction:", result.digest);
  console.log("\nPolicy Object ID:", policyObject?.objectId);
  console.log("\nAdd to .env:");
  console.log(`SEAL_POLICY_PACKAGE=${PACKAGE_ID}`);
  console.log(`SEAL_POLICY_OBJECT=${policyObject?.objectId}`);
}

createPolicy().catch(console.error);

