/**
 * API client for backend HTTP endpoints
 */

import { Session, SessionResults } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async createSession(problemId: string = "two-sum"): Promise<Session> {
    const response = await fetch(
      `${this.baseUrl}/api/session/create?problem_id=${problemId}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return response.json();
  }

  async getSessionStatus(sessionId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/api/session/status/${sessionId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get session status: ${response.statusText}`);
    }

    return response.json();
  }

  async getSessionResults(sessionId: string): Promise<SessionResults> {
    const response = await fetch(
      `${this.baseUrl}/api/session/results/${sessionId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get session results: ${response.statusText}`);
    }

    return response.json();
  }

  async listProblems(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/session/problems`);

    if (!response.ok) {
      throw new Error(`Failed to list problems: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new APIClient();
