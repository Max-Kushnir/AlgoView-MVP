/**
 * TypeScript type definitions for AlgoView
 */

export interface Problem {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  examples: Example[];
  constraints: string[];
  link: string;
  optimal_solution: string;
  time_complexity: string;
  space_complexity: string;
  hints?: string[];
}

export interface Example {
  input: string;
  output: string;
  explanation: string;
}

export interface Session {
  session_id: string;
  ephemeral_key: string;
  problem: Problem;
}

export enum InterviewPhase {
  INTRODUCTION = "introduction",
  PROBLEM_PRESENTATION = "problem_presentation",
  CLARIFICATION = "clarification",
  PLANNING = "planning",
  CODING = "coding",
  TESTING = "testing",
  EVALUATION = "evaluation",
  COMPLETE = "complete",
}

export interface CodeReview {
  line_count: number;
  feedback: string;
  bugs: string[];
  suggestions: string[];
  is_final?: boolean;
  time_complexity?: string;
  space_complexity?: string;
  is_optimal?: boolean;
}

export interface FinalRatings {
  communication: number;
  problem_solving: number;
  code_quality: number;
  technical_skills: number;
  optimization: number;
  overall_feedback: string;
  would_hire: boolean;
}

export interface SessionResults {
  session_id: string;
  problem: Problem;
  candidate_code: string;
  final_review: CodeReview | null;
  llm_notes: {
    clarifying_questions: string[];
    technical_skills: string[];
    soft_skills: string[];
    concerns: string[];
  };
  final_ratings: FinalRatings | null;
}

// WebSocket message types
export type WSMessage =
  | { type: "connected"; session_id: string; phase: string }
  | { type: "review_triggered"; line_count: number; review: CodeReview }
  | { type: "final_review"; review: CodeReview }
  | { type: "phase_updated"; phase: string }
  | { type: "pong"; remaining_time: number }
  | { type: "error"; message: string };

export interface RealtimeConfig {
  ephemeralKey: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}
