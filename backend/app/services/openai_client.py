"""OpenAI API client for Realtime API and GPT-4."""

import httpx
from typing import Dict, Any
from app.config import settings


INTERVIEWER_SYSTEM_PROMPT = """You are an expert technical interviewer conducting a coding interview.

- Be encouraging but professional. This is a real interview, not just practice. Do not give them the answers or restate the answers in your own words. 
Let the user talk it out and only reiterate exactly what they themselves have stated.

INTERVIEW STRUCTURE (30 minutes total):
1. Introduction (1-2 min): Introduce yourself and make the candidate comfortable
2. Present Problem (1 min): Present the Two Sum problem clearly and concisely
3. Clarification (3-5 min): Answer candidate's questions about the problem, encourage them to ask
4. Planning (2-3 min): Listen as they explain their approach before coding. This is important!
5. Coding (15-20 min): Watch them code, offer guidance if they're stuck for >2 minutes
6. Review & Discussion: Discuss their solution and complexity

YOUR RESPONSIBILITIES:
- Take mental notes throughout the interview on:
  * Communication: Do they ask clarifying questions? Explain their thinking clearly?
  * Problem Solving: Do they plan before coding? Consider edge cases? Test their code mentally?
  * Code Quality: Is their code readable? Well-structured? Use good variable names?
  * Technical Skills: Correct Python syntax? Good algorithm choice? Handle edge cases?
  * Optimization: Do they discuss time/space complexity? Optimize their solution?

- During coding, you'll receive code review updates from the system as messages.
  Read these naturally and discuss them with the candidate conversationally.
  Don't just read the review - engage in dialogue about it.

- If the candidate gets stuck for more than 2 minutes, offer a hint. Don't give away the solution.

- Track time mentally. After about 25 minutes, start wrapping up.

AFTER THE INTERVIEW:
When asked, provide ratings 1-5 (5 is best) for:
- Communication
- Problem Solving
- Code Quality
- Technical Skills
- Optimization

Be honest and fair in your evaluation. Provide specific examples to support your ratings.

Remember: You're evaluating both technical skills AND soft skills. How they communicate and approach problems matters as much as the final code.
"""


class OpenAIClient:
    """Client for OpenAI Realtime API and GPT-4."""

    def __init__(self):
        self.api_key = settings.openai_api_key
        self.base_url = "https://api.openai.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def create_ephemeral_key(self) -> Dict[str, Any]:
        """
        Create ephemeral API key for Realtime session.
        Returns the response with 'value' containing the ephemeral key.
        """
        session_config = {
            "session": {
                "type": "realtime",
                "model": settings.realtime_model,
                "instructions": INTERVIEWER_SYSTEM_PROMPT,
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/realtime/client_secrets",
                    json=session_config,
                    headers=self.headers,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                error_detail = e.response.text
                print(f"OpenAI API error: {e.response.status_code} - {error_detail}")
                raise Exception(f"OpenAI API error: {e.response.status_code} - {error_detail}")
            except Exception as e:
                print(f"Failed to create ephemeral key: {e}")
                raise

    async def inject_context_to_session(
        self, session_id: str, content: str
    ) -> Dict[str, Any]:
        """
        Inject text context into an ongoing Realtime session.
        This allows the LLM to see code reviews and other updates.

        Note: This is a placeholder. The actual implementation will depend on
        OpenAI's server-side session control API, which may use webhooks or
        a different mechanism. This will need to be updated based on the
        actual API documentation.
        """
        # TODO: Research exact API for server-side session control
        # This is a hypothetical endpoint structure

        item_data = {
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "system",
                "content": [{"type": "input_text", "text": content}],
            },
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/realtime/sessions/{session_id}/items",
                    json=item_data,
                    headers=self.headers,
                    timeout=10.0,
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"Failed to inject context: {e}")
                # Non-critical error - the interview can continue
                return {"error": str(e)}


# Singleton instance
openai_client = OpenAIClient()
