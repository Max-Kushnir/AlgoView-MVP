/**
 * Hook for managing overall interview state
 */

import { useState, useEffect, useCallback } from "react";
import { InterviewPhase, CodeReview } from "@/lib/types";

interface UseInterviewOptions {
  duration: number; // in seconds
  onTimeExpired?: () => void;
}

export function useInterview(options: UseInterviewOptions) {
  const { duration, onTimeExpired } = options;

  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>(
    InterviewPhase.INTRODUCTION
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(duration);
  const [code, setCode] = useState("");
  const [lineCount, setLineCount] = useState(0);
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [isInterviewActive, setIsInterviewActive] = useState(true);

  // Timer
  useEffect(() => {
    if (!isInterviewActive) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isInterviewActive]);

  // Update remaining time based on elapsed time
  useEffect(() => {
    const newRemaining = Math.max(0, duration - elapsedTime);
    setRemainingTime(newRemaining);

    if (newRemaining === 0 && isInterviewActive) {
      onTimeExpired?.();
      setIsInterviewActive(false);
    }
  }, [elapsedTime, duration, isInterviewActive, onTimeExpired]);

  const updateCode = useCallback((newCode: string) => {
    setCode(newCode);
    const lines = newCode.split("\n").length;
    setLineCount(lines);
  }, []);

  const addReview = useCallback((review: CodeReview) => {
    setReviews((prev) => [...prev, review]);
  }, []);

  const updatePhase = useCallback((phase: InterviewPhase) => {
    setCurrentPhase(phase);
  }, []);

  const endInterview = useCallback(() => {
    setIsInterviewActive(false);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    currentPhase,
    elapsedTime,
    remainingTime,
    code,
    lineCount,
    reviews,
    isInterviewActive,
    updateCode,
    addReview,
    updatePhase,
    endInterview,
    formatTime,
  };
}
