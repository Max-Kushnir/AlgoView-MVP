"use client";

import React from "react";

interface RealtimeVoiceClientProps {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
}

export default function RealtimeVoiceClient({
  isConnected,
  isConnecting,
  error,
}: RealtimeVoiceClientProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Voice Interview</h3>

      <div className="flex items-center space-x-4">
        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected
                ? "bg-green-500 animate-pulse"
                : isConnecting
                ? "bg-yellow-500 animate-pulse"
                : "bg-red-500"
            }`}
          />
          <span className="text-sm">
            {isConnected
              ? "Connected"
              : isConnecting
              ? "Connecting..."
              : "Disconnected"}
          </span>
        </div>

        {/* Microphone icon */}
        {isConnected && (
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <div className="absolute inset-0 w-16 h-16 bg-blue-500 rounded-full animate-ping opacity-20" />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
          <p className="text-sm">Error: {error.message}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>
          {isConnected
            ? "Speak naturally - the AI interviewer is listening and will respond."
            : isConnecting
            ? "Setting up voice connection..."
            : "Voice connection unavailable"}
        </p>
      </div>
    </div>
  );
}
