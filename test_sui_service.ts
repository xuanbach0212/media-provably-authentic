/**
 * Test Sui Blockchain Service
 * Tests attestation submission and querying on Sui testnet
 */

import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

import { SuiService } from "./backend/src/services/sui.js";

async function testSuiService() {
  console.log("⛓️  Testing Sui Blockchain Service...\n");

  const sui = new SuiService();

  try {
    // Test 1: Check Balance
    console.log("1️⃣  Checking SUI balance...");
    const balance = await sui.getBalance();
    console.log(`✅ Balance: ${balance.toFixed(4)} SUI\n`);

    if (balance < 0.01) {
      console.warn(`⚠️  Low balance! You may need more SUI from faucet\n`);
    }

    // Test 2: Submit Attestation
    console.log("2️⃣  Submitting attestation to blockchain...");
    const jobId = `test_job_${Date.now()}`;
    const mediaHash = "0x" + "a".repeat(64); // Mock hash
    const reportCID = "mock_walrus_cid_12345";
    const verdict = "authentic";
    const enclaveSignature = "mock_signature_from_nautilus";

    console.log(`   Job ID: ${jobId}`);
    console.log(`   Verdict: ${verdict}`);
    
    const attestation = await sui.submitAttestation(
      jobId,
      mediaHash,
      reportCID,
      verdict,
      enclaveSignature
    );

    console.log(`✅ Attestation submitted!`);
    console.log(`   TX Hash: ${attestation.txHash.substring(0, 20)}...`);
    console.log(`   Attestation ID: ${attestation.attestationId.substring(0, 20)}...\n`);

    // Test 3: Get Attestation
    console.log("3️⃣  Retrieving attestation from blockchain...");
    const retrieved = await sui.getAttestation(attestation.attestationId);
    
    if (retrieved) {
      console.log(`✅ Attestation retrieved successfully`);
      console.log(`   TX Hash: ${retrieved.txHash.substring(0, 20)}...`);
      console.log(`   Timestamp: ${retrieved.timestamp}\n`);
    } else {
      console.log(`⚠️  Could not retrieve attestation (may take a moment to finalize)\n`);
    }

    // Test 4: Query by Job ID
    console.log("4️⃣  Querying attestations by job ID...");
    const attestationsByJob = await sui.getAttestationsByJobId(jobId);
    console.log(`✅ Found ${attestationsByJob.length} attestation(s) for job ${jobId}\n`);

    // Test 5: Submit Multiple Attestations
    console.log("5️⃣  Testing multiple attestations...");
    const testJobId2 = `test_job_${Date.now()}_2`;
    
    const attestation2 = await sui.submitAttestation(
      testJobId2,
      "0x" + "b".repeat(64),
      "mock_cid_67890",
      "fake",
      "mock_sig_2"
    );

    console.log(`✅ Second attestation submitted`);
    console.log(`   TX Hash: ${attestation2.txHash.substring(0, 20)}...\n`);

    // Test 6: Check Final Balance
    console.log("6️⃣  Checking final balance...");
    const finalBalance = await sui.getBalance();
    const gasCost = balance - finalBalance;
    console.log(`✅ Final balance: ${finalBalance.toFixed(4)} SUI`);
    console.log(`   Gas cost for 2 attestations: ${gasCost.toFixed(4)} SUI\n`);

    console.log("=" .repeat(60));
    console.log("🎉 All Sui Blockchain tests PASSED!");
    console.log("=" .repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   - Attestations submitted: 2`);
    console.log(`   - Total gas cost: ${gasCost.toFixed(4)} SUI`);
    console.log(`   - Remaining balance: ${finalBalance.toFixed(4)} SUI`);
    console.log(`\n🔗 View transactions on Sui Explorer:`);
    console.log(`   https://testnet.suivision.xyz/txblock/${attestation.txHash}`);
    console.log(`   https://testnet.suivision.xyz/txblock/${attestation2.txHash}\n`);

  } catch (error: any) {
    console.error("\n❌ Test FAILED:");
    console.error(error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testSuiService();

