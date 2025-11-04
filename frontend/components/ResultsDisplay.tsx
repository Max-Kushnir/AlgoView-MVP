"use client";

import React from "react";
import { SessionResults } from "@/lib/types";
import MonacoEditor from "./MonacoEditor";

interface ResultsDisplayProps {
  results: SessionResults;
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const { problem, candidate_code, final_review, final_ratings } = results;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-2">Interview Results</h1>
        <h2 className="text-xl text-gray-600 dark:text-gray-400">
          {problem.title}
        </h2>
      </div>

      {/* Ratings */}
      {final_ratings && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold mb-4">Your Ratings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <RatingItem
              label="Communication"
              score={final_ratings.communication}
            />
            <RatingItem
              label="Problem Solving"
              score={final_ratings.problem_solving}
            />
            <RatingItem
              label="Code Quality"
              score={final_ratings.code_quality}
            />
            <RatingItem
              label="Technical Skills"
              score={final_ratings.technical_skills}
            />
            <RatingItem
              label="Optimization"
              score={final_ratings.optimization}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Overall Feedback</h4>
            <p className="text-gray-700 dark:text-gray-300">
              {final_ratings.overall_feedback}
            </p>
          </div>

          <div className="mt-4">
            <span
              className={`inline-block px-4 py-2 rounded-full text-white font-semibold ${
                final_ratings.would_hire ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {final_ratings.would_hire
                ? "Recommended for hire"
                : "Not recommended"}
            </span>
          </div>
        </div>
      )}

      {/* Code Review */}
      {final_review && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold mb-4">Code Review</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Feedback</h4>
              <p className="text-gray-700 dark:text-gray-300">
                {final_review.feedback}
              </p>
            </div>

            {final_review.time_complexity && (
              <div>
                <span className="font-semibold">Time Complexity: </span>
                <span className="text-blue-600 dark:text-blue-400">
                  {final_review.time_complexity}
                </span>
              </div>
            )}

            {final_review.space_complexity && (
              <div>
                <span className="font-semibold">Space Complexity: </span>
                <span className="text-blue-600 dark:text-blue-400">
                  {final_review.space_complexity}
                </span>
              </div>
            )}

            {final_review.is_optimal !== undefined && (
              <div>
                <span className="font-semibold">Is Optimal: </span>
                <span
                  className={
                    final_review.is_optimal ? "text-green-600" : "text-red-600"
                  }
                >
                  {final_review.is_optimal ? "Yes" : "No"}
                </span>
              </div>
            )}

            {final_review.bugs && final_review.bugs.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Bugs Found</h4>
                <ul className="list-disc list-inside space-y-1">
                  {final_review.bugs.map((bug, i) => (
                    <li key={i} className="text-red-600">
                      {bug}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {final_review.suggestions && final_review.suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Suggestions</h4>
                <ul className="list-disc list-inside space-y-1">
                  {final_review.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-gray-700 dark:text-gray-300">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Your Solution</h3>
          <div className="h-96">
            <MonacoEditor
              value={candidate_code}
              onChange={() => {}}
              readOnly={true}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Optimal Solution</h3>
          <div className="h-96">
            <MonacoEditor
              value={problem.optimal_solution}
              onChange={() => {}}
              readOnly={true}
            />
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p>Time: {problem.time_complexity}</p>
            <p>Space: {problem.space_complexity}</p>
          </div>
        </div>
      </div>

      {/* Problem Link */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
        <a
          href={problem.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          View Problem on LeetCode
        </a>
      </div>
    </div>
  );
}

function RatingItem({ label, score }: { label: string; score: number }) {
  const percentage = (score / 5) * 100;
  const color =
    score >= 4 ? "bg-green-500" : score >= 3 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-medium">{label}</span>
        <span className="font-bold">
          {score} / 5
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
