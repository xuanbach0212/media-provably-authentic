import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { startBullProcessor, stopBullProcessor } from "./queue/bullProcessor";
import uploadRoutes from "./routes/upload";
import verifyRoutes from "./routes/verify";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "backend-api" });
});

// Routes
app.use("/api", uploadRoutes);
app.use("/api", verifyRoutes);

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
  console.log(`   - Upload: POST /api/upload`);
  console.log(`   - Job Status: GET /api/job/:jobId`);
  console.log(`   - Verify: POST /api/verify`);
  console.log(`   - Attestation: GET /api/attestation/:attestationId`);

  // Start Bull processor
  startBullProcessor();
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await stopBullProcessor();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await stopBullProcessor();
  process.exit(0);
});
