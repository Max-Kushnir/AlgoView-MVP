"""GPT-4 code review service."""

import openai
from typing import Dict, Any
from app.config import settings
from app.models import CodeReview


class CodeReviewer:
    """Review code using GPT-4."""

    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.gpt4_model

    async def review_code(
        self, code: str, problem: Dict[str, Any], is_final: bool = False
    ) -> CodeReview:
        """
        Review code using GPT-4.

        Args:
            code: The Python code to review
            problem: The problem dictionary with description, examples, etc.
            is_final: If True, include time/space complexity and optimization analysis

        Returns:
            CodeReview object with feedback
        """
        if is_final:
            prompt = self._create_final_review_prompt(code, problem)
        else:
            prompt = self._create_incremental_review_prompt(code, problem)

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert code reviewer for technical interviews. Provide constructive, specific feedback.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,  # More deterministic
            )

            content = response.choices[0].message.content
            return self._parse_review_response(content, is_final)

        except Exception as e:
            print(f"Code review error: {e}")
            return CodeReview(
                line_count=len(code.split("\n")),
                feedback=f"Unable to review code: {str(e)}",
                is_final=is_final,
            )

    def _create_incremental_review_prompt(
        self, code: str, problem: Dict[str, Any]
    ) -> str:
        """Create prompt for incremental code review (every 5 lines)."""
        return f"""You are reviewing code for the following problem:

**Problem**: {problem['title']}
{problem['description']}

**Current Code** (in progress):
```python
{code}
```

Provide a BRIEF review (2-3 sentences max) focusing on:
1. Any obvious bugs or syntax errors
2. If they're on the right track
3. One quick suggestion if needed

Be encouraging! This is work in progress. Format your response as:

FEEDBACK: [your brief feedback]
BUGS: [list any bugs, one per line, or "None"]
SUGGESTIONS: [one suggestion, or "None"]
"""

    def _create_final_review_prompt(self, code: str, problem: Dict[str, Any]) -> str:
        """Create prompt for final code review."""
        return f"""You are reviewing the FINAL solution for the following problem:

**Problem**: {problem['title']}
{problem['description']}

**Optimal Solution** (for reference):
```python
{problem['optimal_solution']}
```
Time: {problem['time_complexity']}, Space: {problem['space_complexity']}

**Candidate's Solution**:
```python
{code}
```

Provide a comprehensive review:
1. Does the solution work correctly?
2. Any bugs or edge cases missed?
3. Time and space complexity analysis
4. Is this optimal? If not, what's better?
5. Code quality feedback

Format your response as:

FEEDBACK: [detailed feedback paragraph]
BUGS: [list bugs, one per line, or "None"]
SUGGESTIONS: [list suggestions, one per line, or "None"]
TIME_COMPLEXITY: [e.g., O(n)]
SPACE_COMPLEXITY: [e.g., O(1)]
IS_OPTIMAL: [Yes or No]
"""

    def _parse_review_response(self, content: str, is_final: bool) -> CodeReview:
        """Parse GPT-4 response into CodeReview object."""
        lines = content.strip().split("\n")

        feedback = ""
        bugs = []
        suggestions = []
        time_complexity = None
        space_complexity = None
        is_optimal = None

        current_section = None

        for line in lines:
            line = line.strip()
            if line.startswith("FEEDBACK:"):
                current_section = "feedback"
                feedback = line.replace("FEEDBACK:", "").strip()
            elif line.startswith("BUGS:"):
                current_section = "bugs"
                bug_text = line.replace("BUGS:", "").strip()
                if bug_text and bug_text.lower() != "none":
                    bugs.append(bug_text)
            elif line.startswith("SUGGESTIONS:"):
                current_section = "suggestions"
                sug_text = line.replace("SUGGESTIONS:", "").strip()
                if sug_text and sug_text.lower() != "none":
                    suggestions.append(sug_text)
            elif line.startswith("TIME_COMPLEXITY:"):
                time_complexity = line.replace("TIME_COMPLEXITY:", "").strip()
            elif line.startswith("SPACE_COMPLEXITY:"):
                space_complexity = line.replace("SPACE_COMPLEXITY:", "").strip()
            elif line.startswith("IS_OPTIMAL:"):
                optimal_text = line.replace("IS_OPTIMAL:", "").strip().lower()
                is_optimal = "yes" in optimal_text
            elif line and current_section == "feedback":
                feedback += " " + line
            elif line and current_section == "bugs" and line.lower() != "none":
                if not line.startswith("SUGGESTIONS:"):
                    bugs.append(line)
            elif line and current_section == "suggestions" and line.lower() != "none":
                suggestions.append(line)

        return CodeReview(
            line_count=len(content.split("\n")),
            feedback=feedback,
            bugs=bugs,
            suggestions=suggestions,
            is_final=is_final,
            time_complexity=time_complexity,
            space_complexity=space_complexity,
            is_optimal=is_optimal,
        )


# Singleton instance
code_reviewer = CodeReviewer()
