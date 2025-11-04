/**
 * WebSocket client for backend communication
 * Handles code updates and state synchronization
 */

import { WSMessage } from "./types";

export type MessageHandler = (message: WSMessage) => void;

export class BackendWSClient {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  connect(backendUrl: string = "ws://localhost:8000"): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${backendUrl}/ws/${this.sessionId}`);

        this.ws.onopen = () => {
          console.log("Backend WebSocket connected");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.messageHandlers.forEach((handler) => handler(message));
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("Backend WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("Backend WebSocket closed");
          this.attemptReconnect(backendUrl);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(backendUrl: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;

      console.log(
        `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect(backendUrl).catch((error) => {
          console.error("Reconnection failed:", error);
        });
      }, delay);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  offMessage(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  sendCodeUpdate(code: string, lineCount: number): void {
    this.send({
      type: "code_update",
      code,
      line_count: lineCount,
    });
  }

  sendCodeComplete(): void {
    this.send({
      type: "code_complete",
    });
  }

  sendPhaseTransition(phase: string): void {
    this.send({
      type: "phase_transition",
      phase,
    });
  }

  sendPing(): void {
    this.send({
      type: "ping",
    });
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not open. Message not sent:", data);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
