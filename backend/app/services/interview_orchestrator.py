"""Interview orchestration and state management."""

import time
from typing import Optional
from app.models import InterviewSession, InterviewPhase, CodeReview
from app.services.session_manager import session_manager
from app.services.code_reviewer import code_reviewer
from app.services.openai_client import openai_client
from app.config import settings
from data.problems import get_problem


class InterviewOrchestrator:
    """Orchestrate interview flow and state transitions."""

    def __init__(self):
        self.review_threshold = settings.code_review_line_threshold

    async def handle_code_update(
        self, session_id: str, code: str, line_count: int
    ) -> Optional[CodeReview]:
        """
        Handle code update from frontend.
        Trigger review if line count crosses threshold.

        Returns:
            CodeReview if review was triggered, None otherwise
        """
        session = session_manager.get_session(session_id)
        if not session:
            return None

        # Update session with new code
        session.code = code
        session.line_count = line_count

        # Check if we should trigger a review
        lines_since_review = line_count - session.last_review_line

        if lines_since_review >= self.review_threshold:
            # Trigger incremental review
            problem = get_problem(session.problem_id)
            review = await code_reviewer.review_code(
                code=code, problem=problem, is_final=False
            )

            # Store review
            session.code_reviews.append(
                {
                    "line_count": line_count,
                    "feedback": review.feedback,
                    "bugs": review.bugs,
                    "suggestions": review.suggestions,
                    "timestamp": time.time(),
                }
            )
            session.last_review_line = line_count

            # Inject review into Realtime conversation
            if session.realtime_session_id:
                context = self._format_review_for_llm(review)
                await openai_client.inject_context_to_session(
                    session.realtime_session_id, context
                )

            return review

        return None

    async def handle_code_completion(self, session_id: str) -> Optional[CodeReview]:
        """
        Handle when user marks code as complete.
        Trigger final comprehensive review.
        """
        session = session_manager.get_session(session_id)
        if not session:
            return None

        problem = get_problem(session.problem_id)

        # Final comprehensive review
        final_review = await code_reviewer.review_code(
            code=session.code, problem=problem, is_final=True
        )

        # Store final review
        session.code_reviews.append(
            {
                "line_count": session.line_count,
                "feedback": final_review.feedback,
                "bugs": final_review.bugs,
                "suggestions": final_review.suggestions,
                "time_complexity": final_review.time_complexity,
                "space_complexity": final_review.space_complexity,
                "is_optimal": final_review.is_optimal,
                "is_final": True,
                "timestamp": time.time(),
            }
        )

        # Inject final review into Realtime conversation
        if session.realtime_session_id:
            context = self._format_final_review_for_llm(final_review)
            await openai_client.inject_context_to_session(
                session.realtime_session_id, context
            )

        # Update phase
        session.current_phase = InterviewPhase.EVALUATION

        return final_review

    def _format_review_for_llm(self, review: CodeReview) -> str:
        """Format incremental review for injection into Realtime conversation."""
        context = f"[CODE REVIEW UPDATE - Line {review.line_count}]\n\n"
        context += f"{review.feedback}\n\n"

        if review.bugs:
            context += "Bugs found:\n"
            for bug in review.bugs:
                context += f"- {bug}\n"
            context += "\n"

        if review.suggestions:
            context += "Suggestions:\n"
            for suggestion in review.suggestions:
                context += f"- {suggestion}\n"

        context += "\n[Please discuss this review with the candidate naturally. Don't just read it - engage in conversation about their approach.]"

        return context

    def _format_final_review_for_llm(self, review: CodeReview) -> str:
        """Format final review for injection into Realtime conversation."""
        context = "[FINAL CODE REVIEW]\n\n"
        context += f"{review.feedback}\n\n"

        if review.bugs:
            context += "Bugs found:\n"
            for bug in review.bugs:
                context += f"- {bug}\n"
            context += "\n"

        context += f"Time Complexity: {review.time_complexity}\n"
        context += f"Space Complexity: {review.space_complexity}\n"
        context += f"Is Optimal: {'Yes' if review.is_optimal else 'No'}\n\n"

        if not review.is_optimal and review.suggestions:
            context += "Optimization suggestions:\n"
            for suggestion in review.suggestions:
                context += f"- {suggestion}\n"
            context += "\n"

        context += "[Discuss this final review with the candidate. "
        if review.is_optimal:
            context += "Congratulate them on the optimal solution and move to final evaluation and ratings.]"
        else:
            context += "If there's time remaining, you may offer them a chance to optimize. Otherwise, move to final evaluation and ratings.]"

        return context

    def get_elapsed_time(self, session_id: str) -> Optional[float]:
        """Get elapsed time in seconds for a session."""
        session = session_manager.get_session(session_id)
        if not session:
            return None
        return time.time() - session.start_time

    def get_remaining_time(self, session_id: str) -> Optional[float]:
        """Get remaining time in seconds for a session."""
        elapsed = self.get_elapsed_time(session_id)
        if elapsed is None:
            return None
        return max(0, settings.interview_duration_seconds - elapsed)

    def is_time_expired(self, session_id: str) -> bool:
        """Check if interview time has expired."""
        remaining = self.get_remaining_time(session_id)
        return remaining is not None and remaining <= 0


# Singleton instance
interview_orchestrator = InterviewOrchestrator()
