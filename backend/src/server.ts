import cors from "cors";
import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();
console.log("[ENV] SUI_PRIVATE_KEY loaded:", process.env.SUI_PRIVATE_KEY ? "✅ YES" : "❌ NO");

import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { startBullProcessor, stopBullProcessor } from "./queue/bullProcessor";
import { startMultiWorkerProcessor, stopMultiWorkerProcessor } from "./queue/multiWorkerProcessor";
import uploadRoutes from "./routes/upload";
import verifyRoutes from "./routes/verify";
import disputeRoutes from "./routes/dispute";
import retryRoutes from "./routes/retry";
import { SocketManager } from "./services/socketManager";

const app = express();
const PORT = process.env.PORT || 3001;
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const { walletAddress, signature } = socket.handshake.auth;
  
  // For now, allow all connections
  // TODO: Implement proper signature verification with Sui SDK
  if (!walletAddress) {
    console.warn("[Socket.IO] Connection without wallet address");
    // Still allow for development
  }
  
  console.log(`[Socket.IO] Client connecting with wallet: ${walletAddress || 'anonymous'}`);
  next();
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Handle job subscription
  socket.on("subscribe", (jobId: string) => {
    socket.join(`job:${jobId}`);
    console.log(`[Socket.IO] Socket ${socket.id} subscribed to job: ${jobId}`);
  });

  // Handle job unsubscription
  socket.on("unsubscribe", (jobId: string) => {
    socket.leave(`job:${jobId}`);
    console.log(`[Socket.IO] Socket ${socket.id} unsubscribed from job: ${jobId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Initialize SocketManager with io instance
SocketManager.initialize(io);

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
app.use("/api", retryRoutes);
app.use("/api/dispute", disputeRoutes);

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
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend API + WebSocket running on port ${PORT}`);
  console.log(`   - HTTP REST API: http://localhost:${PORT}`);
  console.log(`   - WebSocket: ws://localhost:${PORT}`);
  console.log(`   - Upload: POST /api/upload`);
  console.log(`   - Job Status: GET /api/job/:jobId`);
  console.log(`   - Verify: POST /api/verify`);
  console.log(`   - Attestation: GET /api/attestation/:attestationId`);

  // Start processors
  const useMultiWorker = process.env.USE_MULTI_WORKER === "true";
  
  if (useMultiWorker) {
    console.log("🔥 Starting Multi-Worker Processor (Production Mode)");
    startMultiWorkerProcessor();
  } else {
    console.log("⚡ Starting Single Processor (Development Mode)");
    startBullProcessor();
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  const useMultiWorker = process.env.USE_MULTI_WORKER === "true";
  if (useMultiWorker) {
    await stopMultiWorkerProcessor();
  } else {
    await stopBullProcessor();
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  const useMultiWorker = process.env.USE_MULTI_WORKER === "true";
  if (useMultiWorker) {
    await stopMultiWorkerProcessor();
  } else {
    await stopBullProcessor();
  }
  process.exit(0);
});
