"""In-memory session management."""

import uuid
from typing import Dict, Optional
from app.models import InterviewSession


class SessionManager:
    """Manage interview sessions in memory."""

    def __init__(self):
        self._sessions: Dict[str, InterviewSession] = {}

    def create_session(self, problem_id: str) -> InterviewSession:
        """Create a new interview session."""
        import time

        session_id = str(uuid.uuid4())
        session = InterviewSession(
            session_id=session_id,
            problem_id=problem_id,
            start_time=time.time(),
        )
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[InterviewSession]:
        """Get session by ID."""
        return self._sessions.get(session_id)

    def update_session(self, session_id: str, **kwargs) -> Optional[InterviewSession]:
        """Update session fields."""
        session = self._sessions.get(session_id)
        if session:
            for key, value in kwargs.items():
                if hasattr(session, key):
                    setattr(session, key, value)
        return session

    def delete_session(self, session_id: str) -> bool:
        """Delete session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def get_all_sessions(self) -> list[InterviewSession]:
        """Get all active sessions."""
        return list(self._sessions.values())


# Singleton instance
session_manager = SessionManager()
