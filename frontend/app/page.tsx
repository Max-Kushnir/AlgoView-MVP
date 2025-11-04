"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startInterview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await apiClient.createSession("two-sum");

      // Store session data in sessionStorage for the interview page
      sessionStorage.setItem("interview_session", JSON.stringify(session));

      // Navigate to interview page
      router.push("/interview");
    } catch (err) {
      console.error("Failed to create session:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create interview session"
      );
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AlgoView
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            AI-Powered Coding Interview Platform
          </p>
        </div>

        {/* Problem Card */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Two Sum</h2>
            <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-sm font-semibold">
              Easy
            </span>
          </div>

          <p className="text-blue-50 mb-4">
            Given an array of integers and a target, return indices of two numbers
            that add up to the target.
          </p>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>30 minutes</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Python</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg
                className="w-5 h-5"
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
              <span>Voice Interview</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            What to expect:
          </h3>
          <FeatureItem
            icon="🎤"
            text="Real-time voice conversation with AI interviewer"
          />
          <FeatureItem
            icon="💻"
            text="Code in a live Python editor with instant feedback"
          />
          <FeatureItem
            icon="📊"
            text="Get detailed performance ratings and code review"
          />
          <FeatureItem
            icon="⏱️"
            text="30-minute timed interview simulation"
          />
        </div>

        {/* Start Button */}
        <button
          onClick={startInterview}
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          }`}
        >
          {isLoading ? "Setting up interview..." : "Start Interview"}
        </button>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Tip:</strong> Make sure your microphone is enabled and you&apos;re in
            a quiet environment for the best experience.
          </p>
        </div>
      </div>
    </main>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center space-x-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-700 dark:text-gray-300">{text}</span>
    </div>
  );
}
