/**
 * Test Seal KMS Service
 * Tests encryption and decryption with AES-256-GCM
 */

import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

import { SealService } from "./backend/src/services/seal.js";

async function testSealService() {
  console.log("🔐 Testing Seal KMS Service...\n");

  const seal = new SealService();

  try {
    // Test 1: Create Policy
    console.log("1️⃣  Creating encryption policy...");
    const policyId = await seal.createPolicy(["enclave_1", "enclave_2", "enclave_3"]);
    console.log(`✅ Policy created: ${policyId}\n`);

    // Test 2: Encrypt Data
    console.log("2️⃣  Encrypting test data...");
    const testData = Buffer.from("This is secret test data for Seal KMS encryption! 🔒");
    console.log(`   Original size: ${testData.length} bytes`);
    
    const encryptResult = await seal.encryptData(testData, policyId);
    console.log(`✅ Encrypted size: ${encryptResult.encrypted.length} bytes`);
    console.log(`   Key ID: ${encryptResult.keyId}`);
    console.log(`   Algorithm: ${encryptResult.metadata.algorithm}\n`);

    // Test 3: Decrypt Data
    console.log("3️⃣  Decrypting data...");
    const decrypted = await seal.decryptData(
      encryptResult.encrypted,
      encryptResult.metadata,
      "enclave_1"
    );
    console.log(`✅ Decrypted size: ${decrypted.length} bytes\n`);

    // Test 4: Verify Correctness
    console.log("4️⃣  Verifying data integrity...");
    const originalStr = testData.toString("utf-8");
    const decryptedStr = decrypted.toString("utf-8");
    
    if (originalStr === decryptedStr) {
      console.log(`✅ SUCCESS! Data matches perfectly`);
      console.log(`   Original:  "${originalStr}"`);
      console.log(`   Decrypted: "${decryptedStr}"\n`);
    } else {
      console.error(`❌ FAILED! Data mismatch`);
      console.error(`   Original:  "${originalStr}"`);
      console.error(`   Decrypted: "${decryptedStr}"\n`);
      process.exit(1);
    }

    // Test 5: Test with Binary Data
    console.log("5️⃣  Testing with binary data...");
    const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]);
    const encryptResult2 = await seal.encryptData(binaryData, policyId);
    const decrypted2 = await seal.decryptData(
      encryptResult2.encrypted,
      encryptResult2.metadata,
      "enclave_2"
    );
    
    if (binaryData.equals(decrypted2)) {
      console.log(`✅ Binary data encrypted/decrypted correctly\n`);
    } else {
      console.error(`❌ Binary data mismatch\n`);
      process.exit(1);
    }

    // Test 6: Get Policy
    console.log("6️⃣  Retrieving policy info...");
    const policy = await seal.getPolicy(policyId);
    if (policy) {
      console.log(`✅ Policy found:`);
      console.log(`   ID: ${policy.policyId}`);
      console.log(`   Allowed Enclaves: ${policy.allowedEnclaves.join(", ")}`);
      console.log(`   Algorithm: ${policy.algorithm}\n`);
    }

    console.log("=" .repeat(60));
    console.log("🎉 All Seal KMS tests PASSED!");
    console.log("=" .repeat(60));

  } catch (error: any) {
    console.error("\n❌ Test FAILED:");
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testSealService();

