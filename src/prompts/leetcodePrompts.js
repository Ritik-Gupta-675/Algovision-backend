/**
 * Prompt templates for LeetCode AI assistant (hints, approach, solution).
 */

const HINT_PROMPT = (problem, hintLevel, previousHints) => `You are a LeetCode tutor. Generate hint level ${hintLevel} of 3 for this problem.

STRICT RULES:
- NEVER reveal the full solution, algorithm name as final answer, or complete code.
- NEVER give the exact answer or final complexity as the only takeaway.
- Guide thinking: intuition, patterns, data structures to consider.
- Hint 1 = small clue (observation about input/output).
- Hint 2 = stronger clue (pattern family, e.g. "two pointers" without full steps).
- Hint 3 = almost approach (high-level steps) but still NO code and NO complete pseudocode.

Problem:
Title: ${problem.title || 'Unknown'}
Description:
${problem.description || problem.statement || 'No description provided'}

Previous hints given:
${previousHints.length ? previousHints.map((h, i) => `Hint ${i + 1}: ${h}`).join('\n') : 'None'}

Respond with JSON only:
{
  "hint": "your hint text",
  "hintLevel": ${hintLevel},
  "visualizationMeta": {
    "algorithmType": "string e.g. array, graph, dp",
    "dataStructure": "string e.g. hashmap, queue",
    "visualizable": true
  }
}`;

const APPROACH_PROMPT = (problem) => `You are an expert algorithms instructor. Explain the approach for this LeetCode problem in depth.

STRICT RULES:
- Do NOT include full working code.
- You may use tiny pseudocode fragments (max 3 lines) for illustration only.
- Cover: intuition, brute force, optimized approach, data structures, dry run on a small example, time and space complexity.

Problem:
Title: ${problem.title || 'Unknown'}
Description:
${problem.description || problem.statement || 'No description provided'}
${problem.constraints ? `Constraints:\n${problem.constraints}` : ''}
${problem.examples ? `Examples:\n${problem.examples}` : ''}

Respond with JSON only:
{
  "intuition": "markdown string",
  "bruteForce": "markdown string",
  "optimized": "markdown string",
  "dataStructures": "markdown string",
  "dryRun": "markdown string",
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "visualizationMeta": {
    "algorithmType": "string",
    "dataStructure": "string",
    "visualizable": true
  }
}`;

const SOLUTION_PROMPT = (problem, language) => `You are an interview coding coach. Provide an optimized ${language} solution for this LeetCode problem.

Requirements:
- Production-quality, readable code
- Optimal time/space for interview context
- Line-by-line explanation as array of { line, explanation }
- Include time and space complexity

Problem:
Title: ${problem.title || 'Unknown'}
Description:
${problem.description || problem.statement || 'No description provided'}

Respond with JSON only:
{
  "language": "${language}",
  "code": "full solution code as string with \\n for newlines",
  "explanations": [{ "line": 1, "text": "explanation" }],
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "visualizationMeta": {
    "algorithmType": "string",
    "dataStructure": "string",
    "visualizable": true
  }
}`;

const RECOMMENDATIONS_PROMPT = (profileSummary) => `Based on this LeetCode user profile summary, suggest personalized practice recommendations.

Profile:
${profileSummary}

Respond with JSON only:
{
  "weakTopics": [{ "topic": "string", "score": 0-100, "message": "string" }],
  "recommendedProblems": [{ "title": "string", "difficulty": "Easy|Medium|Hard", "topic": "string", "reason": "string" }],
  "dailyGoal": "string",
  "insights": ["string"]
}`;

module.exports = {
  HINT_PROMPT,
  APPROACH_PROMPT,
  SOLUTION_PROMPT,
  RECOMMENDATIONS_PROMPT,
};
