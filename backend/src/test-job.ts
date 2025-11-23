/**
 * Backend Job Processing Test Script
 * Tests Bull queue, processor, and socket emissions
 */

import { VerificationJob, JobStatus } from "@media-auth/shared";
import { jobQueue, verificationQueue } from "./queue/bullQueue";
import { SocketManager } from "./services/socketManager";

const TEST_JOB_ID = `test_job_${Date.now()}`;

async function testJobProcessing() {
  console.log("=".repeat(80));
  console.log("BACKEND JOB PROCESSING TEST");
  console.log("=".repeat(80));

  try {
    // Step 1: Check Redis connection
    console.log("\n[Step 1] Checking Redis connection...");
    const isReady = await verificationQueue.isReady();
    console.log(`✅ Redis connection: ${isReady ? "CONNECTED" : "DISCONNECTED"}`);

    if (!isReady) {
      console.error("❌ Redis is not connected! Start Redis with: redis-server");
      process.exit(1);
    }

    // Step 2: Check queue status
    console.log("\n[Step 2] Checking queue status...");
    const waiting = await verificationQueue.getWaitingCount();
    const active = await verificationQueue.getActiveCount();
    const completed = await verificationQueue.getCompletedCount();
    const failed = await verificationQueue.getFailedCount();
    
    console.log(`  - Waiting jobs: ${waiting}`);
    console.log(`  - Active jobs: ${active}`);
    console.log(`  - Completed jobs: ${completed}`);
    console.log(`  - Failed jobs: ${failed}`);

    // Step 3: Check if processor is registered
    console.log("\n[Step 3] Checking processor registration...");
    // @ts-ignore - accessing internal Bull property
    const hasProcessor = verificationQueue._events && verificationQueue._events.process;
    console.log(`  - Processor registered: ${hasProcessor ? "YES" : "NO"}`);
    
    if (!hasProcessor) {
      console.warn("⚠️  WARNING: No processor registered! Jobs will not be processed.");
      console.warn("   Make sure server.ts calls startMultiWorkerProcessor() or startBullProcessor()");
    }

    // Step 4: Create test job
    console.log("\n[Step 4] Creating test job...");
    const testJob: VerificationJob = {
      jobId: TEST_JOB_ID,
      userId: "test_user",
      mediaHash: "test_hash_" + Math.random().toString(36).substring(7),
      mediaCID: "test_cid_" + Math.random().toString(36).substring(7),
      pHash: "test_phash",
      encryptionMeta: {
        policyId: "test_policy",
        keyId: "test_key",
        algorithm: "AES-256-GCM",
        iv: "test_iv",
      },
      status: "PENDING" as JobStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log(`  - Job ID: ${testJob.jobId}`);
    console.log(`  - Media Hash: ${testJob.mediaHash}`);
    console.log(`  - Media CID: ${testJob.mediaCID}`);

    // Step 5: Add job to queue
    console.log("\n[Step 5] Adding job to queue...");
    await jobQueue.addJob(testJob);
    console.log("✅ Job added to queue");

    // Step 6: Monitor job status
    console.log("\n[Step 6] Monitoring job status (30 seconds)...");
    console.log("  (Watch for processor pickup and socket emissions)");
    
    let lastState = "";
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const job = await verificationQueue.getJob(TEST_JOB_ID);
      if (job) {
        const state = await job.getState();
        const progress = job.progress();
        
        if (state !== lastState) {
          console.log(`  [${i}s] State: ${state.toUpperCase()}, Progress: ${progress}%`);
          lastState = state;
        }

        if (state === "completed") {
          console.log("✅ Job completed successfully!");
          const result = job.returnvalue;
          console.log("  Result:", JSON.stringify(result, null, 2));
          break;
        }

        if (state === "failed") {
          console.error("❌ Job failed!");
          console.error("  Error:", job.failedReason);
          break;
        }
      } else {
        console.log(`  [${i}s] Job not found in queue`);
      }
    }

    // Step 7: Check final status
    console.log("\n[Step 7] Final status check...");
    const finalJob = await jobQueue.getJob(TEST_JOB_ID);
    if (finalJob) {
      console.log(`  - Status: ${finalJob.status}`);
      console.log(`  - Updated: ${finalJob.updatedAt}`);
    }

    const report = await jobQueue.getReport(TEST_JOB_ID);
    if (report) {
      console.log("✅ Report stored successfully!");
      console.log("  Report keys:", Object.keys(report));
    } else {
      console.warn("⚠️  No report found in store");
    }

    console.log("\n" + "=".repeat(80));
    console.log("TEST COMPLETE");
    console.log("=".repeat(80));

  } catch (error: any) {
    console.error("\n❌ TEST FAILED:");
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
console.log("\nStarting backend job processing test...");
console.log("Make sure:");
console.log("  1. Redis is running (redis-server)");
console.log("  2. Backend server is running (npm run dev)");
console.log("  3. AI service is running (port 8000)");
console.log("");

testJobProcessing()
  .then(() => {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Test failed:", err);
    process.exit(1);
  });

