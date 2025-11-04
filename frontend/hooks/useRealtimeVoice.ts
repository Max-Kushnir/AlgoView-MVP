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
    if (!ephemeralKey || isConnecting || isConnected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const client = new RealtimeClient({
        ephemeralKey,
        onConnect: () => {
          console.log("Realtime voice connected");
          setIsConnected(true);
          setIsConnecting(false);
        },
        onDisconnect: () => {
          console.log("Realtime voice disconnected");
          setIsConnected(false);
        },
        onError: (err) => {
          console.error("Realtime voice error:", err);
          setError(err);
          setIsConnected(false);
          setIsConnecting(false);
        },
      });

      await client.connect();
      clientRef.current = client;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Connection failed");
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
