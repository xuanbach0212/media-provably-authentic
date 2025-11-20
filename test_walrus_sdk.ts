/**
 * Test Walrus SDK Integration
 */

import dotenv from "dotenv";
import path from "path";

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, "backend", ".env") });

console.log("[DEBUG] SUI_PRIVATE_KEY loaded:", process.env.SUI_PRIVATE_KEY ? "YES" : "NO");

import { WalrusService } from "./backend/src/services/walrus.js";

async function testWalrusSDK() {
  console.log("🔵 Testing Walrus SDK Integration...\n");

  const walrus = new WalrusService();

  try {
    // Test 1: Health Check
    console.log("1️⃣  Health check...");
    const healthy = await walrus.healthCheck();
    console.log(`✅ Health: ${healthy ? "OK" : "FAILED"}\n`);

    if (!healthy) {
      console.error("❌ Walrus not configured properly");
      process.exit(1);
    }

    // Test 2: Store small blob
    console.log("2️⃣  Storing test blob...");
    const testData = Buffer.from("Hello from Walrus SDK! 🚀 This is a test blob.");
    console.log(`   Data size: ${testData.length} bytes`);
    
    const { blobId, size } = await walrus.storeBlob(testData, {
      test: true,
      timestamp: Date.now(),
    });

    console.log(`✅ Stored successfully!`);
    console.log(`   Blob ID: ${blobId}`);
    console.log(`   Size: ${size} bytes\n`);

    // Test 3: Retrieve blob
    console.log("3️⃣  Retrieving blob...");
    const retrieved = await walrus.retrieveBlob(blobId);
    console.log(`✅ Retrieved ${retrieved.length} bytes\n`);

    // Test 4: Verify data integrity
    console.log("4️⃣  Verifying data integrity...");
    const original = testData.toString("utf-8");
    const decoded = retrieved.toString("utf-8");

    if (original === decoded) {
      console.log(`✅ Data integrity verified!`);
      console.log(`   Original:  "${original}"`);
      console.log(`   Retrieved: "${decoded}"\n`);
    } else {
      console.error(`❌ Data mismatch!`);
      process.exit(1);
    }

    // Test 5: Storage cost estimate
    console.log("5️⃣  Storage cost estimate...");
    const cost = walrus.getStorageCostEstimate(testData.length, 5);
    console.log(`✅ Estimated cost: ${cost}\n`);

    console.log("=" .repeat(60));
    console.log("🎉 All Walrus SDK tests PASSED!");
    console.log("=" .repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   - Blob stored: ${blobId.substring(0, 30)}...`);
    console.log(`   - Size: ${size} bytes`);
    console.log(`   - Upload relay: testnet`);
    console.log(`   - Epochs: 5 (~10 days)\n`);

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
testWalrusSDK();

