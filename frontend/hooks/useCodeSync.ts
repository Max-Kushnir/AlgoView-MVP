/**
 * Hook for syncing code with backend via WebSocket
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { BackendWSClient, MessageHandler } from "@/lib/backend-ws-client";
import { WSMessage, CodeReview } from "@/lib/types";

interface UsCodeSyncOptions {
  sessionId: string;
  onReviewTriggered?: (review: CodeReview) => void;
  onFinalReview?: (review: CodeReview) => void;
  onPhaseUpdate?: (phase: string) => void;
  onTimeUpdate?: (remainingTime: number) => void;
}

export function useCodeSync(options: UsCodeSyncOptions) {
  const { sessionId, onReviewTriggered, onFinalReview, onPhaseUpdate, onTimeUpdate } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<BackendWSClient | null>(null);

  // Store callbacks in refs to avoid reconnection loops
  const callbacksRef = useRef({
    onReviewTriggered,
    onFinalReview,
    onPhaseUpdate,
    onTimeUpdate,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onReviewTriggered,
      onFinalReview,
      onPhaseUpdate,
      onTimeUpdate,
    };
  }, [onReviewTriggered, onFinalReview, onPhaseUpdate, onTimeUpdate]);

  // Stable message handler that uses refs
  const messageHandler = useCallback<MessageHandler>((message: WSMessage) => {
    console.log("WebSocket message:", message);

    switch (message.type) {
      case "connected":
        setIsConnected(true);
        break;

      case "review_triggered":
        callbacksRef.current.onReviewTriggered?.(message.review);
        break;

      case "final_review":
        callbacksRef.current.onFinalReview?.(message.review);
        break;

      case "phase_updated":
        callbacksRef.current.onPhaseUpdate?.(message.phase);
        break;

      case "pong":
        callbacksRef.current.onTimeUpdate?.(message.remaining_time);
        break;

      case "error":
        console.error("WebSocket error:", message.message);
        setError(new Error(message.message));
        break;
    }
  }, []); // No dependencies - uses refs instead

  // Connect to backend WebSocket
  useEffect(() => {
    // Don't connect if sessionId is empty
    if (!sessionId) {
      console.log("No session ID, skipping WebSocket connection");
      return;
    }

    console.log("Creating WebSocket connection for session:", sessionId);
    const client = new BackendWSClient(sessionId);
    clientRef.current = client;

    client.onMessage(messageHandler);

    client
      .connect()
      .then(() => {
        console.log("✅ Code sync WebSocket connected successfully");
        setIsConnected(true);
      })
      .catch((err) => {
        console.error("❌ Failed to connect code sync WebSocket:", err);
        setError(err);
      });

    // Cleanup on unmount
    return () => {
      console.log("Disconnecting WebSocket for session:", sessionId);
      client.disconnect();
    };
  }, [sessionId, messageHandler]); // Only reconnect if sessionId changes

  // Send code update
  const sendCodeUpdate = useCallback((code: string, lineCount: number) => {
    clientRef.current?.sendCodeUpdate(code, lineCount);
  }, []);

  // Send code complete
  const sendCodeComplete = useCallback(() => {
    clientRef.current?.sendCodeComplete();
  }, []);

  // Send phase transition
  const sendPhaseTransition = useCallback((phase: string) => {
    clientRef.current?.sendPhaseTransition(phase);
  }, []);

  return {
    isConnected,
    error,
    sendCodeUpdate,
    sendCodeComplete,
    sendPhaseTransition,
  };
}
