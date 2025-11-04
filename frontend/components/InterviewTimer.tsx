"use client";

import React from "react";

interface InterviewTimerProps {
  remainingTime: number;
  totalTime: number;
  formatTime: (seconds: number) => string;
}

export default function InterviewTimer({
  remainingTime,
  totalTime,
  formatTime,
}: InterviewTimerProps) {
  const percentage = (remainingTime / totalTime) * 100;
  const isLowTime = remainingTime < 300; // Less than 5 minutes

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Time Remaining</span>
        <span
          className={`text-xl font-bold ${
            isLowTime ? "text-red-500" : "text-green-500"
          }`}
        >
          {formatTime(remainingTime)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isLowTime ? "bg-red-500" : "bg-green-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isLowTime && (
        <p className="mt-2 text-xs text-red-500">Running out of time!</p>
      )}
    </div>
  );
}
