"""WebSocket endpoint for code updates and real-time communication."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any
import json

from app.services import session_manager, interview_orchestrator

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time code updates and state synchronization.

    Client sends:
        - type: "code_update", code: str, line_count: int
        - type: "code_complete"
        - type: "phase_transition", phase: str

    Server sends:
        - type: "review_triggered", review: CodeReview
        - type: "phase_updated", phase: str
        - type: "time_update", remaining: float
        - type: "error", message: str
    """
    await websocket.accept()

    # Verify session exists
    session = session_manager.get_session(session_id)
    if not session:
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return

    try:
        # Send initial connection success
        await websocket.send_json(
            {
                "type": "connected",
                "session_id": session_id,
                "phase": session.current_phase,
            }
        )

        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message: Dict[str, Any] = json.loads(data)

            message_type = message.get("type")

            if message_type == "code_update":
                # Handle code update
                code = message.get("code", "")
                line_count = message.get("line_count", 0)

                review = await interview_orchestrator.handle_code_update(
                    session_id, code, line_count
                )

                if review:
                    # Review was triggered
                    await websocket.send_json(
                        {
                            "type": "review_triggered",
                            "line_count": line_count,
                            "review": {
                                "feedback": review.feedback,
                                "bugs": review.bugs,
                                "suggestions": review.suggestions,
                            },
                        }
                    )

            elif message_type == "code_complete":
                # Handle code completion
                final_review = await interview_orchestrator.handle_code_completion(
                    session_id
                )

                if final_review:
                    await websocket.send_json(
                        {
                            "type": "final_review",
                            "review": {
                                "feedback": final_review.feedback,
                                "bugs": final_review.bugs,
                                "suggestions": final_review.suggestions,
                                "time_complexity": final_review.time_complexity,
                                "space_complexity": final_review.space_complexity,
                                "is_optimal": final_review.is_optimal,
                            },
                        }
                    )

                    # Update phase
                    await websocket.send_json(
                        {"type": "phase_updated", "phase": "evaluation"}
                    )

            elif message_type == "phase_transition":
                # Handle phase transition
                new_phase = message.get("phase")
                session.current_phase = new_phase

                await websocket.send_json(
                    {"type": "phase_updated", "phase": new_phase}
                )

            elif message_type == "ping":
                # Heartbeat
                remaining = interview_orchestrator.get_remaining_time(session_id)
                await websocket.send_json(
                    {"type": "pong", "remaining_time": remaining}
                )

            else:
                await websocket.send_json(
                    {"type": "error", "message": f"Unknown message type: {message_type}"}
                )

    except WebSocketDisconnect:
        print(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        print(f"WebSocket error for session {session_id}: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        # Clean up could go here if needed
        pass
