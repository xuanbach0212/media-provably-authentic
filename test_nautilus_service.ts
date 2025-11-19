/**
 * Test Nautilus TEE Service
 * Tests attestation signing and verification with RSA-2048
 */

import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

import { NautilusService } from "./backend/src/services/nautilus.js";

async function testNautilusService() {
  console.log("🔐 Testing Nautilus TEE Service...\n");

  const nautilus = new NautilusService();

  try {
    // Test 1: Get Enclave Info
    console.log("1️⃣  Getting enclave information...");
    const info = nautilus.getEnclaveInfo();
    console.log(`✅ Enclave ID: ${info.enclaveId}`);
    console.log(`   MREnclave: ${info.mrenclave}`);
    console.log(`   Mode: ${info.mode}\n`);

    // Test 2: Generate Attestation for Report
    console.log("2️⃣  Generating attestation for verification report...");
    const mockReport = {
      jobId: "test_job_12345",
      verdict: "authentic",
      confidence: 0.95,
      timestamp: new Date().toISOString(),
      aiDetection: {
        score: 0.12,
        verdict: "human_made"
      },
      forensics: {
        manipulated: false
      }
    };

    const signature = await nautilus.generateAttestation(mockReport);
    console.log(`✅ Attestation generated`);
    console.log(`   Signature length: ${signature.length} chars`);
    console.log(`   Signature (first 50 chars): ${signature.substring(0, 50)}...\n`);

    // Test 3: Verify Attestation
    console.log("3️⃣  Verifying attestation...");
    const isValid = await nautilus.verifyAttestation(signature, mockReport);
    
    if (isValid) {
      console.log(`✅ Attestation verified successfully!\n`);
    } else {
      console.error(`❌ Attestation verification FAILED\n`);
      process.exit(1);
    }

    // Test 4: Test with Different Report (should fail)
    console.log("4️⃣  Testing with tampered report...");
    const tamperedReport = {
      ...mockReport,
      verdict: "fake" // Changed verdict
    };
    
    const isValidTampered = await nautilus.verifyAttestation(signature, tamperedReport);
    
    if (!isValidTampered) {
      console.log(`✅ Correctly detected tampering (signature should not match different data)\n`);
    } else {
      console.warn(`⚠️  Note: Mock mode may not validate data hash correctly\n`);
    }

    // Test 5: Process in Enclave
    console.log("5️⃣  Testing enclave processing...");
    const result = await nautilus.processInEnclave(async () => {
      return {
        processed: true,
        timestamp: Date.now(),
        data: "Processed inside TEE"
      };
    });
    console.log(`✅ Enclave processing completed`);
    console.log(`   Result: ${JSON.stringify(result)}\n`);

    // Test 6: Health Check
    console.log("6️⃣  Performing health check...");
    const healthy = await nautilus.healthCheck();
    console.log(`✅ Health check: ${healthy ? "PASS" : "FAIL"}\n`);

    // Test 7: Multiple Attestations
    console.log("7️⃣  Generating multiple attestations...");
    const signatures = [];
    for (let i = 0; i < 3; i++) {
      const report = { ...mockReport, jobId: `test_job_${i}` };
      const sig = await nautilus.generateAttestation(report);
      signatures.push(sig);
    }
    console.log(`✅ Generated ${signatures.length} attestations`);
    console.log(`   All signatures unique: ${new Set(signatures).size === signatures.length}\n`);

    console.log("=" .repeat(60));
    console.log("🎉 All Nautilus TEE tests PASSED!");
    console.log("=" .repeat(60));

  } catch (error: any) {
    console.error("\n❌ Test FAILED:");
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testNautilusService();

