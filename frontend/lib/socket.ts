/**
 * Socket.IO Client Manager
 * Handles WebSocket connection for real-time progress updates
 */

import { io, Socket } from 'socket.io-client';

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

export interface SocketCallbacks {
  onProgress: (data: ProgressUpdate) => void;
  onError: (error: ErrorUpdate) => void;
  onComplete: (report: any) => void;
}

export class SocketClient {
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  /**
   * Connect to Socket.IO server with wallet authentication
   */
  connect(walletAddress?: string, signature?: string): void {
    if (this.socket?.connected) {
      console.log('[SocketClient] Already connected');
      return;
    }

    console.log('[SocketClient] Connecting to', this.serverUrl);

    this.socket = io(this.serverUrl, {
      auth: {
        walletAddress: walletAddress || 'anonymous',
        signature: signature || '',
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('[SocketClient] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketClient] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketClient] Connection error:', error);
    });
  }

  /**
   * Update authentication for existing connection
   */
  updateAuth(walletAddress: string, signature?: string): void {
    if (!this.socket) {
      console.warn('[SocketClient] Not connected, cannot update auth');
      return;
    }

    console.log('[SocketClient] 🔄 Updating auth with wallet:', walletAddress);
    
    // Disconnect and reconnect with new auth
    this.disconnect();
    this.connect(walletAddress, signature);
  }

  /**
   * Subscribe to a specific job's updates
   */
  subscribeToJob(jobId: string, callbacks: SocketCallbacks): void {
    if (!this.socket) {
      console.error('[SocketClient] ❌ Not connected. Call connect() first.');
      return;
    }

    console.log('[SocketClient] 📡 Subscribing to job:', jobId);
    console.log('[SocketClient] Socket connected:', this.socket.connected);
    console.log('[SocketClient] Socket ID:', this.socket.id);

    // Join job room
    this.socket.emit('subscribe', jobId);
    console.log('[SocketClient] ✅ Emitted subscribe event for room: job:' + jobId);

    // Register callbacks with logging wrappers
    this.socket.on('progress', (data) => {
      console.log('[SocketClient] 📊 Received progress event:', data);
      callbacks.onProgress(data);
    });
    this.socket.on('error', (data) => {
      console.error('[SocketClient] ❌ Received error event:', data);
      callbacks.onError(data);
    });
    this.socket.on('complete', (data) => {
      console.log('[SocketClient] ✅ Received complete event:', data);
      callbacks.onComplete(data);
    });
    
    console.log('[SocketClient] ✅ Callbacks registered for progress, error, complete');
  }

  /**
   * Unsubscribe from a job's updates
   */
  unsubscribeFromJob(jobId: string): void {
    if (!this.socket) return;

    console.log('[SocketClient] Unsubscribing from job:', jobId);

    this.socket.emit('unsubscribe', jobId);
    this.socket.off('progress');
    this.socket.off('error');
    this.socket.off('complete');
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[SocketClient] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketClient = new SocketClient();

