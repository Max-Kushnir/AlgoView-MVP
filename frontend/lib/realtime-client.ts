/**
 * OpenAI Realtime API WebRTC client
 * Handles voice-to-voice communication
 */

import { RealtimeConfig } from "./types";

export class RealtimeClient {
  private peerConnection: RTCPeerConnection | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private ephemeralKey: string;
  private onConnect?: () => void;
  private onDisconnect?: () => void;
  private onError?: (error: Error) => void;

  constructor(config: RealtimeConfig) {
    this.ephemeralKey = config.ephemeralKey;
    this.onConnect = config.onConnect;
    this.onDisconnect = config.onDisconnect;
    this.onError = config.onError;
  }

  async connect(): Promise<void> {
    try {
      // Create RTCPeerConnection
      this.peerConnection = new RTCPeerConnection();

      // Get user's microphone
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Add microphone track to peer connection
      mediaStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, mediaStream);
      });

      // Create audio element for playback
      this.audioElement = document.createElement("audio");
      this.audioElement.autoplay = true;

      // Handle incoming audio from OpenAI
      this.peerConnection.ontrack = (event) => {
        if (this.audioElement) {
          this.audioElement.srcObject = event.streams[0];
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        console.log("WebRTC connection state:", state);

        if (state === "connected") {
          this.onConnect?.();
        } else if (state === "disconnected" || state === "failed") {
          this.onDisconnect?.();
        }
      };

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Exchange SDP with OpenAI Realtime API
      const baseUrl = "https://api.openai.com/v1/realtime/calls";
      const response = await fetch(baseUrl, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${this.ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.statusText}`);
      }

      const answerSdp = await response.text();
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: answerSdp,
      };

      await this.peerConnection.setRemoteDescription(answer);

      console.log("Realtime API connected successfully");
    } catch (error) {
      console.error("Failed to connect to Realtime API:", error);
      this.onError?.(
        error instanceof Error ? error : new Error("Connection failed")
      );
      throw error;
    }
  }

  disconnect(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }

    this.onDisconnect?.();
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState ?? null;
  }

  isConnected(): boolean {
    return this.peerConnection?.connectionState === "connected";
  }
}

/**
 * Initialize Realtime API connection
 */
export async function initializeRealtimeConnection(
  ephemeralKey: string
): Promise<RealtimeClient> {
  const client = new RealtimeClient({
    ephemeralKey,
    onConnect: () => console.log("Realtime connected"),
    onDisconnect: () => console.log("Realtime disconnected"),
    onError: (error) => console.error("Realtime error:", error),
  });

  await client.connect();
  return client;
}
