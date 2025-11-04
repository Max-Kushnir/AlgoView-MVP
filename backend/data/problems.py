"""Hardcoded DSA problems for MVP."""

PROBLEMS = {
    "two-sum": {
        "id": "two-sum",
        "title": "Two Sum",
        "difficulty": "Easy",
        "description": """Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.""",
        "examples": [
            {
                "input": "nums = [2,7,11,15], target = 9",
                "output": "[0,1]",
                "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1].",
            },
            {
                "input": "nums = [3,2,4], target = 6",
                "output": "[1,2]",
                "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2].",
            },
            {
                "input": "nums = [3,3], target = 6",
                "output": "[0,1]",
                "explanation": "Because nums[0] + nums[1] == 6, we return [0, 1].",
            },
        ],
        "constraints": [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Only one valid answer exists.",
        ],
        "link": "https://leetcode.com/problems/two-sum/",
        "optimal_solution": """def twoSum(nums, target):
    # Hash map to store number and its index
    seen = {}

    for i, num in enumerate(nums):
        complement = target - num

        # Check if complement exists in hash map
        if complement in seen:
            return [seen[complement], i]

        # Store current number with its index
        seen[num] = i

    return []  # No solution found
""",
        "time_complexity": "O(n)",
        "space_complexity": "O(n)",
        "hints": [
            "A brute force approach would be to check every pair of numbers. Can you do better?",
            "Think about what data structure would allow you to quickly check if a number exists.",
            "Consider using a hash map to store numbers you've already seen.",
        ],
    }
}


def get_problem(problem_id: str):
    """Get problem by ID."""
    return PROBLEMS.get(problem_id)


def get_all_problems():
    """Get all problems."""
    return list(PROBLEMS.values())
