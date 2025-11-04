from pydantic import BaseModel
from typing import List, Optional, Dict
from enum import Enum
from datetime import datetime


class InterviewPhase(str, Enum):
    """Interview phases."""

    INTRODUCTION = "introduction"
    PROBLEM_PRESENTATION = "problem_presentation"
    CLARIFICATION = "clarification"
    PLANNING = "planning"
    CODING = "coding"
    TESTING = "testing"
    EVALUATION = "evaluation"
    COMPLETE = "complete"


class InterviewSession(BaseModel):
    """Interview session data model."""

    session_id: str
    problem_id: str
    start_time: float
    current_phase: InterviewPhase = InterviewPhase.INTRODUCTION
    code: str = ""
    line_count: int = 0
    last_review_line: int = 0
    llm_notes: Dict[str, List[str]] = {
        "clarifying_questions": [],
        "technical_skills": [],
        "soft_skills": [],
        "concerns": [],
    }
    code_reviews: List[Dict] = []
    final_ratings: Optional[Dict] = None
    realtime_session_id: Optional[str] = None
    is_active: bool = True

    class Config:
        use_enum_values = True
