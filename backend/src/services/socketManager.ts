/**
 * Socket Manager Service
 * Singleton service for managing Socket.IO real-time communication
 * Emits progress updates and errors to connected clients
 */

import { Server as SocketIOServer } from "socket.io";

export interface ProgressUpdate {
  stage: number;
  stageName: string;
  substep: string;
  progress: number;
  timestamp: string;
  metadata?: {
    enclaveId?: string;
    modelName?: string;
    uploadProgress?: number;
  };
}

export interface ErrorUpdate {
  stage: number;
  message: string;
  retryable: boolean;
  timestamp: string;
  details?: any;
}

export class SocketManager {
  private static io: SocketIOServer | null = null;

  /**
   * Initialize the Socket Manager with Socket.IO server instance
   */
  static initialize(io: SocketIOServer): void {
    this.io = io;
    console.log("[SocketManager] Initialized");
  }

  /**
   * Emit progress update for a specific job
   */
  static emitProgress(jobId: string, data: ProgressUpdate): void {
    if (!this.io) {
      console.warn("[SocketManager] Not initialized, cannot emit progress");
      return;
    }

    this.io.to(`job:${jobId}`).emit("progress", data);
    console.log(
      `[SocketManager] Progress emitted for job ${jobId}: ${data.progress}% - ${data.stageName} - ${data.substep}`
    );
  }

  /**
   * Emit error for a specific job
   */
  static emitError(jobId: string, error: ErrorUpdate): void {
    if (!this.io) {
      console.warn("[SocketManager] Not initialized, cannot emit error");
      return;
    }

    this.io.to(`job:${jobId}`).emit("error", error);
    console.log(
      `[SocketManager] Error emitted for job ${jobId}: ${error.message} (retryable: ${error.retryable})`
    );
  }

  /**
   * Emit completion event with final report
   */
  static emitComplete(jobId: string, report: any): void {
    if (!this.io) {
      console.warn("[SocketManager] Not initialized, cannot emit complete");
      return;
    }

    this.io.to(`job:${jobId}`).emit("complete", report);
    console.log(`[SocketManager] Completion emitted for job ${jobId}`);
  }

  /**
   * Check if Socket Manager is initialized
   */
  static isInitialized(): boolean {
    return this.io !== null;
  }

  /**
   * Get connected clients count for a job
   */
  static getJobSubscribersCount(jobId: string): number {
    if (!this.io) return 0;
    const room = this.io.sockets.adapter.rooms.get(`job:${jobId}`);
    return room ? room.size : 0;
  }
}

export default SocketManager;

