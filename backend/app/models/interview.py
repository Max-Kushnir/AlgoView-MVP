from pydantic import BaseModel
from typing import List, Optional


class CodeReview(BaseModel):
    """Code review feedback from GPT-4."""

    line_count: int
    feedback: str
    bugs: List[str] = []
    suggestions: List[str] = []
    is_final: bool = False
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None
    is_optimal: Optional[bool] = None


class LLMNotes(BaseModel):
    """Notes taken by the interviewer LLM."""

    clarifying_questions: List[str]
    technical_skills: List[str]
    soft_skills: List[str]
    concerns: List[str]


class FinalRatings(BaseModel):
    """Final interview ratings (1-5 scale)."""

    communication: int  # 1-5
    problem_solving: int  # 1-5
    code_quality: int  # 1-5
    technical_skills: int  # 1-5
    optimization: int  # 1-5
    overall_feedback: str
    would_hire: bool
