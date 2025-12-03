/**
 * Walrus Diagnostic Script
 * Tests Walrus SDK connectivity and identifies failure points
 * 
 * Usage:
 *   npm run test-walrus
 * 
 * Or in Docker:
 *   docker exec media-auth-backend npm run test-walrus
 */

import * as dns from "dns/promises";
import * as https from "https";
import { WalrusProvider } from "../services/storage/WalrusProvider";

const WALRUS_DOMAINS = [
  "publisher.walrus-testnet.walrus.space",
  "aggregator.walrus-testnet.walrus.space",
];

async function testDNSResolution(): Promise<void> {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 1: DNS Resolution");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  for (const domain of WALRUS_DOMAINS) {
    try {
      const addresses = await dns.resolve4(domain);
      console.log(`✓ ${domain}`);
      console.log(`  IPv4: ${addresses.join(", ")}`);
      
      try {
        const addresses6 = await dns.resolve6(domain);
        console.log(`  IPv6: ${addresses6.join(", ")}`);
      } catch {
        console.log(`  IPv6: Not available`);
      }
    } catch (error: any) {
      console.log(`✗ ${domain}`);
      console.log(`  Error: ${error.message}`);
    }
    console.log();
  }
}

async function testDirectFetch(): Promise<void> {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 2: Direct HTTPS Fetch");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const testUrls = [
    "https://publisher.walrus-testnet.walrus.space/v1/status",
    "https://aggregator.walrus-testnet.walrus.space/v1/status",
  ];

  for (const url of testUrls) {
    const startTime = Date.now();
    
    try {
      await new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 10000 }, (res) => {
          const duration = Date.now() - startTime;
          console.log(`✓ ${url}`);
          console.log(`  Status: ${res.statusCode}`);
          console.log(`  Duration: ${duration}ms`);
          console.log();
          resolve(res);
        });

        req.on("error", (error) => {
          const duration = Date.now() - startTime;
          console.log(`✗ ${url}`);
          console.log(`  Error: ${error.message}`);
          console.log(`  Duration: ${duration}ms`);
          console.log();
          reject(error);
        });

        req.on("timeout", () => {
          req.destroy();
          const duration = Date.now() - startTime;
          console.log(`✗ ${url}`);
          console.log(`  Error: Timeout after ${duration}ms`);
          console.log();
          reject(new Error("Timeout"));
        });
      });
    } catch (error) {
      // Error already logged
    }
  }
}

async function testWalrusSDK(): Promise<void> {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 3: Walrus SDK Initialization");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const provider = new WalrusProvider();
    console.log("✓ WalrusProvider initialized");
    console.log(`  Provider name: ${provider.getName()}`);
    
    // Test health check
    console.log("\nTesting health check...");
    const isHealthy = await provider.healthCheck();
    console.log(`  Health check: ${isHealthy ? "✓ PASS" : "✗ FAIL"}`);
    
    // Test store (if we have a keypair)
    if (process.env.SUI_PRIVATE_KEY) {
      console.log("\nTesting store operation...");
      const testData = Buffer.from("Hello Walrus!");
      
      try {
        const startTime = Date.now();
        const blob = await provider.storeBlob(testData, { test: true });
        const duration = Date.now() - startTime;
        
        console.log(`✓ Store successful`);
        console.log(`  Blob ID: ${blob.blobId}`);
        console.log(`  Duration: ${duration}ms`);
        
        // Test retrieve
        console.log("\nTesting retrieve operation...");
        try {
          const startTime2 = Date.now();
          const retrieved = await provider.retrieveBlob(blob.blobId);
          const duration2 = Date.now() - startTime2;
          
          console.log(`✓ Retrieve successful`);
          console.log(`  Data: ${retrieved.toString()}`);
          console.log(`  Duration: ${duration2}ms`);
        } catch (error: any) {
          console.log(`✗ Retrieve failed`);
          console.log(`  Error: ${error.message}`);
        }
      } catch (error: any) {
        console.log(`✗ Store failed`);
        console.log(`  Error: ${error.message}`);
        console.log(`  Error type: ${error.name}`);
      }
    } else {
      console.log("\n⚠ Skipping store/retrieve tests (no SUI_PRIVATE_KEY)");
    }
  } catch (error: any) {
    console.log("✗ WalrusProvider initialization failed");
    console.log(`  Error: ${error.message}`);
    console.log(`  Stack: ${error.stack?.split("\n").slice(0, 3).join("\n")}`);
  }
}

async function printEnvironment(): Promise<void> {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("ENVIRONMENT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  console.log(`Node version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  console.log(`SUI_NETWORK: ${process.env.SUI_NETWORK || "not set"}`);
  console.log(`SUI_PRIVATE_KEY: ${process.env.SUI_PRIVATE_KEY ? "set" : "not set"}`);
  console.log(`STORAGE_PROVIDER: ${process.env.STORAGE_PROVIDER || "not set"}`);
  console.log(`WALRUS_TIMEOUT: ${process.env.WALRUS_TIMEOUT || "not set"}`);
  console.log(`NODE_OPTIONS: ${process.env.NODE_OPTIONS || "not set"}`);
}

async function main(): Promise<void> {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║         WALRUS DIAGNOSTIC SCRIPT                             ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  await printEnvironment();
  await testDNSResolution();
  await testDirectFetch();
  await testWalrusSDK();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("DIAGNOSTIC COMPLETE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// Run diagnostics
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

