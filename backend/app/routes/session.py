"""Session management endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.services import session_manager, openai_client
from data.problems import get_problem, get_all_problems

router = APIRouter(prefix="/api/session", tags=["session"])


class CreateSessionResponse(BaseModel):
    """Response for session creation."""

    session_id: str
    ephemeral_key: str
    problem: Dict[str, Any]


class SessionStatusResponse(BaseModel):
    """Response for session status."""

    session_id: str
    problem_id: str
    current_phase: str
    elapsed_time: float
    remaining_time: float
    line_count: int
    is_active: bool


@router.post("/create", response_model=CreateSessionResponse)
async def create_session(problem_id: str = "two-sum"):
    """
    Create a new interview session.

    Returns:
        - session_id: Session identifier
        - ephemeral_key: Temporary API key for frontend to connect to Realtime API
        - problem: Problem details
    """
    # Get problem
    problem = get_problem(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Create session
    session = session_manager.create_session(problem_id)

    # Generate ephemeral key for Realtime API
    try:
        ephemeral_response = await openai_client.create_ephemeral_key()
        ephemeral_key = ephemeral_response.get("value")

        if not ephemeral_key:
            raise HTTPException(
                status_code=500, detail="Failed to generate ephemeral key"
            )

        # Store realtime session reference (if available in response)
        if "session_id" in ephemeral_response:
            session.realtime_session_id = ephemeral_response["session_id"]

    except Exception as e:
        # Clean up session if ephemeral key creation fails
        session_manager.delete_session(session.session_id)
        raise HTTPException(
            status_code=500, detail=f"Failed to create session: {str(e)}"
        )

    return CreateSessionResponse(
        session_id=session.session_id, ephemeral_key=ephemeral_key, problem=problem
    )


@router.get("/status/{session_id}", response_model=SessionStatusResponse)
async def get_session_status(session_id: str):
    """Get current session status."""
    from app.services import interview_orchestrator

    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    elapsed = interview_orchestrator.get_elapsed_time(session_id)
    remaining = interview_orchestrator.get_remaining_time(session_id)

    return SessionStatusResponse(
        session_id=session.session_id,
        problem_id=session.problem_id,
        current_phase=session.current_phase,
        elapsed_time=elapsed,
        remaining_time=remaining,
        line_count=session.line_count,
        is_active=session.is_active,
    )


@router.get("/results/{session_id}")
async def get_session_results(session_id: str):
    """Get final interview results."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    problem = get_problem(session.problem_id)

    # Get the final review from code_reviews
    final_review = None
    for review in session.code_reviews:
        if review.get("is_final"):
            final_review = review
            break

    return {
        "session_id": session.session_id,
        "problem": problem,
        "candidate_code": session.code,
        "final_review": final_review,
        "llm_notes": session.llm_notes,
        "final_ratings": session.final_ratings,
    }


@router.get("/problems")
async def list_problems():
    """List all available problems."""
    return {"problems": get_all_problems()}
