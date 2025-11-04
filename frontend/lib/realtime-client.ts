/**
 * OpenAI Realtime API WebRTC client
 * Handles voice-to-voice communication
 */

import { RealtimeConfig } from "./types";

export class RealtimeClient {
  private peerConnection: RTCPeerConnection | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private dataChannel: RTCDataChannel | null = null;
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

      // CRITICAL: Create data channel for sending/receiving events to OpenAI
      // This is required for session configuration and back-and-forth conversation
      this.dataChannel = this.peerConnection.createDataChannel("oai-events");
      console.log("📡 Data channel created:", this.dataChannel.label);

      // Handle data channel events
      this.dataChannel.onopen = () => {
        console.log("✅ Data channel OPEN - Sending session configuration...");
        this.sendSessionUpdate();
      };

      this.dataChannel.onclose = () => {
        console.warn("⚠️ Data channel CLOSED");
      };

      this.dataChannel.onerror = (error) => {
        console.error("❌ Data channel ERROR:", error);
      };

      this.dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("📩 Received from OpenAI:", message.type, message);

          // Handle different event types from OpenAI
          if (message.type === "error") {
            console.error("❌ OpenAI error:", message.error);
          } else if (message.type === "session.updated") {
            console.log("✅ Session configuration updated successfully");
          } else if (message.type === "response.done") {
            console.log("🎤 AI finished speaking, waiting for user input");
          } else if (message.type === "input_audio_buffer.speech_started") {
            console.log("👂 AI detected user started speaking");
          } else if (message.type === "input_audio_buffer.speech_stopped") {
            console.log("🔇 AI detected user stopped speaking");
          }
        } catch (e) {
          console.log("📩 Non-JSON message from OpenAI:", event.data);
        }
      };

      // Get user's microphone
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      console.log("🎤 Microphone access granted");
      console.log("Audio tracks:", mediaStream.getAudioTracks().map(t => ({
        label: t.label,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState
      })));

      // Add microphone track to peer connection
      mediaStream.getTracks().forEach((track) => {
        console.log("Adding audio track to peer connection:", track.label);
        this.peerConnection?.addTrack(track, mediaStream);
      });

      // Create audio element for playback
      this.audioElement = document.createElement("audio");
      this.audioElement.autoplay = true;

      // Set attributes to prevent interruption (especially on mobile)
      this.audioElement.setAttribute("playsinline", "true");
      this.audioElement.setAttribute("webkit-playsinline", "true");

      // CRITICAL: Add audio element to DOM so it can play
      // Hide it visually but keep it in the DOM
      this.audioElement.style.display = "none";
      document.body.appendChild(this.audioElement);

      console.log("📻 Audio element created and added to DOM");

      // Handle incoming audio from OpenAI
      this.peerConnection.ontrack = (event) => {
        console.log("🎵 Received audio track from OpenAI");
        const stream = event.streams[0];

        // Listen for stream/track ending
        stream.getTracks().forEach(track => {
          track.onended = () => {
            const now = new Date().toISOString();
            console.error(`🚫 [${now}] Media track ENDED - Connection closed by server`);
            console.log("Track state:", track.readyState);
          };
        });

        console.log("Stream info:", {
          id: stream.id,
          active: stream.active,
          tracks: stream.getTracks().length
        });

        if (this.audioElement) {
          this.audioElement.srcObject = stream;

          // Force play and handle errors gracefully
          this.audioElement.play().then(() => {
            console.log("✅ Audio playback started successfully");
          }).catch((e) => {
            console.error("❌ Failed to play audio:", e);
            // Try again after user interaction
            document.addEventListener("click", () => {
              this.audioElement?.play().catch(console.error);
            }, { once: true });
          });
        }
      };

      // Monitor audio element state
      this.audioElement.onplay = () => {
        const now = new Date().toISOString();
        console.log(`▶️ [${now}] Audio element playing`);
      };

      this.audioElement.onpause = () => {
        const now = new Date().toISOString();
        console.warn(`⏸️ [${now}] Audio element PAUSED - attempting to resume`);
        console.trace("Pause stack trace");
        // Try to resume if it gets paused unexpectedly
        this.audioElement?.play().catch(console.error);
      };

      this.audioElement.onended = () => {
        const now = new Date().toISOString();
        console.warn(`⏹️ [${now}] Audio element ENDED - Stream finished`);
        console.log("Audio readyState:", this.audioElement?.readyState);
        console.log("Stream active:", (this.audioElement?.srcObject as MediaStream)?.active);
      };

      this.audioElement.onerror = (e) => {
        const now = new Date().toISOString();
        console.error(`❌ [${now}] Audio element ERROR:`, e);
        console.log("Error details:", this.audioElement?.error);
      };


      // Prevent page visibility changes from stopping audio
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && this.audioElement) {
          console.log("👁️ Page visible again, ensuring audio plays");
          this.audioElement.play().catch(console.error);
        }
      });

      // Ensure audio continues after clicks (helps with autoplay policies)
      // NOTE: Only using click, NOT keyboard, to avoid interfering with typing in editor
      const ensureAudioPlaying = () => {
        if (this.audioElement && this.audioElement.srcObject) {
          this.audioElement.play().catch(console.error);
        }
      };

      // Only add click listener on initial user interaction to unlock autoplay
      let clickHandlerAdded = false;
      const oneTimeClick = () => {
        if (!clickHandlerAdded) {
          ensureAudioPlaying();
          clickHandlerAdded = true;
        }
      };
      document.addEventListener("click", oneTimeClick, { once: true });

      console.log("✅ Realtime client setup complete");

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        console.log("🔌 WebRTC connection state:", state);

        if (state === "connected") {
          this.onConnect?.();
        } else if (state === "disconnected" || state === "failed") {
          console.error("❌ Connection lost:", state);
          this.onDisconnect?.();
        } else if (state === "connecting") {
          console.log("⏳ Connecting...");
        }
      };

      // Monitor ICE connection state
      this.peerConnection.oniceconnectionstatechange = () => {
        const iceState = this.peerConnection?.iceConnectionState;
        console.log("🧊 ICE connection state:", iceState);

        if (iceState === "failed" || iceState === "disconnected") {
          console.error("❌ ICE connection issue:", iceState);
        }
      };

      // Monitor signaling state
      this.peerConnection.onsignalingstatechange = () => {
        const signalingState = this.peerConnection?.signalingState;
        console.log("📡 Signaling state:", signalingState);
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

  /**
   * Send session configuration to OpenAI Realtime API
   * This configures turn detection for back-and-forth conversation
   */
  private sendSessionUpdate(): void {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      console.error("❌ Cannot send session update - data channel not open");
      return;
    }

    const sessionConfig = {
      type: "session.update",
      session: {
        // Enable turn detection for back-and-forth conversation
        turn_detection: {
          type: "server_vad", // Server-side voice activity detection
          threshold: 0.3, // Lower threshold = less sensitive to pauses (0.0-1.0)
          prefix_padding_ms: 300, // Include 300ms before speech starts
          silence_duration_ms: 2500, // Wait 2.5 seconds of silence before ending turn (increased to prevent interruption)
          create_response: true, // Automatically create AI response after user speaks
        },
        // Audio settings
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
        },
        // Voice selection
        voice: "echo", // Options: alloy, echo, shimmer
        // Enable both text and audio modalities
        modalities: ["text", "audio"],
        // Temperature for response generation
        temperature: 0.8,
        // Max response tokens
        max_response_output_tokens: 4096,
      },
    };

    console.log("📤 Sending session.update:", sessionConfig);
    this.dataChannel.send(JSON.stringify(sessionConfig));
  }

  disconnect(): void {
    console.log("🔌 Disconnecting Realtime client");

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
      // Remove from DOM
      if (this.audioElement.parentNode) {
        this.audioElement.parentNode.removeChild(this.audioElement);
      }
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
