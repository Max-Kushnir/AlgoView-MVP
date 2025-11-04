/**
 * Hook for managing OpenAI Realtime API voice connection
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { RealtimeClient } from "@/lib/realtime-client";

export function useRealtimeVoice(ephemeralKey: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);

  const connect = useCallback(async () => {
    if (!ephemeralKey) {
      console.log("No ephemeral key, cannot connect");
      return;
    }

    if (isConnecting || isConnected) {
      console.log("Already connecting or connected, skipping");
      return;
    }

    console.log("Starting Realtime voice connection...");
    setIsConnecting(true);
    setError(null);

    try {
      const client = new RealtimeClient({
        ephemeralKey,
        onConnect: () => {
          console.log("✅ Realtime voice CONNECTED - You should hear the AI now");
          setIsConnected(true);
          setIsConnecting(false);
        },
        onDisconnect: () => {
          console.log("❌ Realtime voice DISCONNECTED");
          setIsConnected(false);
        },
        onError: (err) => {
          console.error("❌ Realtime voice ERROR:", err);
          setError(err);
          setIsConnected(false);
          setIsConnecting(false);
        },
      });

      await client.connect();
      clientRef.current = client;
      console.log("Realtime client created, waiting for connection state...");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Connection failed");
      console.error("❌ Failed to create Realtime client:", error);
      setError(error);
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, [ephemeralKey, isConnecting, isConnected]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Auto-connect when ephemeral key is available
  useEffect(() => {
    if (ephemeralKey && !isConnected && !isConnecting) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [ephemeralKey]); // Only depend on ephemeralKey

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    client: clientRef.current,
  };
}
