"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import MonacoEditor from "@/components/MonacoEditor";
import RealtimeVoiceClient from "@/components/RealtimeVoiceClient";
import InterviewTimer from "@/components/InterviewTimer";
import PhaseIndicator from "@/components/PhaseIndicator";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { useCodeSync } from "@/hooks/useCodeSync";
import { useInterview } from "@/hooks/useInterview";
import { Session, InterviewPhase, CodeReview } from "@/lib/types";

const INTERVIEW_DURATION = 1800; // 30 minutes in seconds

export default function InterviewPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [showCompleteButton, setShowCompleteButton] = useState(false);

  // Load session from sessionStorage
  useEffect(() => {
    const sessionData = sessionStorage.getItem("interview_session");
    if (sessionData) {
      const parsedSession: Session = JSON.parse(sessionData);
      setSession(parsedSession);
    } else {
      // No session found, redirect to home
      router.push("/");
    }
  }, [router]);

  // Stable reference for time expiry handler
  const handleTimeExpired = useCallback(() => {
    alert("Time's up! The interview has ended.");
  }, []);

  // Interview state management
  const interview = useInterview({
    duration: INTERVIEW_DURATION,
    onTimeExpired: handleTimeExpired,
  });

  // When interview becomes inactive, redirect to results
  useEffect(() => {
    if (!interview.isInterviewActive && session && interview.elapsedTime > 0) {
      // Small delay to allow user to see the alert
      setTimeout(() => {
        router.push(`/results?session_id=${session.session_id}`);
      }, 1000);
    }
  }, [interview.isInterviewActive, session, interview.elapsedTime, router]);

  // Realtime voice connection
  const voice = useRealtimeVoice(session?.ephemeral_key || null);

  // Stable callbacks for code sync
  const handleReviewTriggered = useCallback((review: CodeReview) => {
    console.log("Code review triggered:", review);
    interview.addReview(review);
  }, [interview.addReview]);

  const handleFinalReview = useCallback((review: CodeReview) => {
    console.log("Final review received:", review);
    interview.addReview(review);
    setShowCompleteButton(false);
  }, [interview.addReview]);

  const handlePhaseUpdate = useCallback((phase: string) => {
    console.log("Phase updated:", phase);
    interview.updatePhase(phase as InterviewPhase);
  }, [interview.updatePhase]);

  const handleTimeUpdate = useCallback((remainingTime: number) => {
    console.log("Time update from backend:", remainingTime);
  }, []);

  // Code sync with backend
  const codeSync = useCodeSync({
    sessionId: session?.session_id || "",
    onReviewTriggered: handleReviewTriggered,
    onFinalReview: handleFinalReview,
    onPhaseUpdate: handlePhaseUpdate,
    onTimeUpdate: handleTimeUpdate,
  });

  // Debounce timer for code sync
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Handle code changes
  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const code = value || "";

      // Update local state immediately for smooth typing
      interview.updateCode(code);

      // Debounce backend sync to avoid too many messages while typing
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        // Send code update to backend after user stops typing for 1 second
        const lineCount = code.split("\n").length;
        codeSync.sendCodeUpdate(code, lineCount);
      }, 1000); // 1 second debounce
    },
    [interview.updateCode, codeSync.sendCodeUpdate]
  );

  // Handle "I'm Done" button
  const handleCodeComplete = useCallback(() => {
    console.log("Submitting code for final review...");
    codeSync.sendCodeComplete();
    setShowCompleteButton(false);
  }, [codeSync.sendCodeComplete]);

  // Handle end interview
  const handleEndInterview = useCallback(() => {
    console.log("Ending interview...");
    interview.endInterview();
    voice.disconnect();
    codeSync.sendPhaseTransition("complete");

    // Navigate to results page
    if (session) {
      router.push(`/results?session_id=${session.session_id}`);
    }
  }, [interview.endInterview, voice.disconnect, codeSync.sendPhaseTransition, session, router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading interview...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {session.problem.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {session.problem.difficulty} • Python
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <InterviewTimer
            remainingTime={interview.remainingTime}
            totalTime={INTERVIEW_DURATION}
            formatTime={interview.formatTime}
          />

          <button
            onClick={handleEndInterview}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Sidebar */}
        <div className="col-span-3 space-y-4 overflow-y-auto">
          {/* Problem Description */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="font-semibold mb-2">Problem</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {session.problem.description}
            </p>

            {session.problem.examples && session.problem.examples.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2">Examples</h4>
                {session.problem.examples.slice(0, 2).map((example, i) => (
                  <div key={i} className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded mb-2">
                    <p><strong>Input:</strong> {example.input}</p>
                    <p><strong>Output:</strong> {example.output}</p>
                  </div>
                ))}
              </div>
            )}

            <a
              href={session.problem.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-blue-500 hover:underline text-sm"
            >
              View on LeetCode →
            </a>
          </div>

          {/* Phase Indicator */}
          <PhaseIndicator currentPhase={interview.currentPhase} />

          {/* Code Stats */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="font-semibold mb-2 text-sm">Code Stats</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Lines: {interview.lineCount}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Reviews: {interview.reviews.length}
            </p>
          </div>
        </div>

        {/* Center - Code Editor */}
        <div className="col-span-6 flex flex-col space-y-4">
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="h-full">
              <MonacoEditor
                value={interview.code}
                onChange={handleCodeChange}
                readOnly={!interview.isInterviewActive}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Code updates automatically sync every 5 lines
            </div>

            <button
              onClick={handleCodeComplete}
              disabled={!interview.isInterviewActive || interview.code.trim().length === 0}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                interview.isInterviewActive && interview.code.trim().length > 0
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-300 cursor-not-allowed text-gray-500"
              }`}
            >
              I&apos;m Done - Submit for Review
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-3 space-y-4 overflow-y-auto">
          {/* Voice Interface */}
          <RealtimeVoiceClient
            isConnected={voice.isConnected}
            isConnecting={voice.isConnecting}
            error={voice.error}
          />

          {/* Recent Reviews */}
          {interview.reviews.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="font-semibold mb-2">Recent Feedback</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {interview.reviews.slice(-3).reverse().map((review, i) => (
                  <div
                    key={i}
                    className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded"
                  >
                    <p className="text-gray-700 dark:text-gray-300">
                      {review.feedback}
                    </p>
                    {review.is_final && (
                      <p className="mt-1 font-semibold text-blue-600">
                        Final Review
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
