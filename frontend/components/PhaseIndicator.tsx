"use client";

import React from "react";
import { InterviewPhase } from "@/lib/types";

interface PhaseIndicatorProps {
  currentPhase: InterviewPhase;
}

const PHASE_LABELS: Record<InterviewPhase, string> = {
  [InterviewPhase.INTRODUCTION]: "Introduction",
  [InterviewPhase.PROBLEM_PRESENTATION]: "Problem Presentation",
  [InterviewPhase.CLARIFICATION]: "Clarification",
  [InterviewPhase.PLANNING]: "Planning",
  [InterviewPhase.CODING]: "Coding",
  [InterviewPhase.TESTING]: "Testing",
  [InterviewPhase.EVALUATION]: "Evaluation",
  [InterviewPhase.COMPLETE]: "Complete",
};

const PHASE_ORDER = [
  InterviewPhase.INTRODUCTION,
  InterviewPhase.PROBLEM_PRESENTATION,
  InterviewPhase.CLARIFICATION,
  InterviewPhase.PLANNING,
  InterviewPhase.CODING,
  InterviewPhase.EVALUATION,
  InterviewPhase.COMPLETE,
];

export default function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold mb-3">Interview Phase</h3>

      <div className="space-y-2">
        {PHASE_ORDER.map((phase, index) => {
          const isActive = phase === currentPhase;
          const isCompleted = index < currentIndex;

          return (
            <div
              key={phase}
              className={`flex items-center space-x-2 text-sm ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : isCompleted
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-600"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isActive
                    ? "bg-blue-500 text-white"
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              <span>{PHASE_LABELS[phase]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
