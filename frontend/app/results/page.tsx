"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ResultsDisplay from "@/components/ResultsDisplay";
import { apiClient } from "@/lib/api";
import { SessionResults } from "@/lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [results, setResults] = useState<SessionResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    const fetchResults = async () => {
      try {
        const data = await apiClient.getSessionResults(sessionId);
        setResults(data);
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load results"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [sessionId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {error || "Failed to load interview results"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ResultsDisplay results={results} />

      {/* Action Buttons */}
      <div className="max-w-7xl mx-auto px-6 mt-8 flex justify-center space-x-4">
        <button
          onClick={() => router.push("/")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition"
        >
          Try Another Problem
        </button>

        <button
          onClick={() => window.print()}
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition"
        >
          Print Results
        </button>
      </div>
    </div>
  );
}
