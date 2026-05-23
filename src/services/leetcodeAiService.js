/**
 * LeetCode AI — hints, approach, solution via Gemini with structured JSON output.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  HINT_PROMPT,
  APPROACH_PROMPT,
  SOLUTION_PROMPT,
  RECOMMENDATIONS_PROMPT,
} = require('../prompts/leetcodePrompts');

const MODEL_CHAIN = [
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-flash',
];

function extractJson(text) {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in AI response');
  return JSON.parse(raw.slice(start, end + 1));
}

class LeetcodeAiService {
  constructor() {
    this._genAI = null;
  }

  getGenAI() {
    if (!process.env.GEMINI_API_KEY?.trim()) return null;
    if (!this._genAI) {
      this._genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    }
    return this._genAI;
  }

  isConfigured() {
    return this.getGenAI() !== null;
  }

  async generateJson(prompt) {
    const genAI = this.getGenAI();
    if (!genAI) {
      return { success: false, error: 'AI is not configured. Set GEMINI_API_KEY on the server.' };
    }

    let lastError;
    for (const modelName of MODEL_CHAIN) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const data = extractJson(text);
        return { success: true, data };
      } catch (error) {
        lastError = error;
        console.warn(`LeetCode AI [${modelName}]:`, (error.message || '').slice(0, 120));
      }
    }

    return {
      success: false,
      error: lastError?.message || 'AI generation failed',
    };
  }

  async generateHint(problem, hintLevel, previousHints = []) {
    const level = Math.min(3, Math.max(1, hintLevel));
    const result = await this.generateJson(
      HINT_PROMPT(problem, level, previousHints)
    );
    if (!result.success) return result;
    return {
      success: true,
      hint: result.data.hint,
      hintLevel: result.data.hintLevel ?? level,
      visualizationMeta: result.data.visualizationMeta || null,
    };
  }

  async generateApproach(problem) {
    const result = await this.generateJson(APPROACH_PROMPT(problem));
    if (!result.success) return result;
    return { success: true, approach: result.data };
  }

  async generateSolution(problem, language = 'python') {
    const langMap = {
      python: 'Python',
      javascript: 'JavaScript',
      java: 'Java',
      cpp: 'C++',
    };
    const lang = langMap[language] || language;
    const result = await this.generateJson(SOLUTION_PROMPT(problem, lang));
    if (!result.success) return result;
    return { success: true, solution: result.data };
  }

  async generateRecommendations(profile) {
    const summary = JSON.stringify({
      username: profile.username,
      stats: profile.stats,
      topics: profile.topicPerformance?.slice(0, 10),
      streak: { current: profile.currentStreak, max: profile.maxStreak },
    });
    const result = await this.generateJson(RECOMMENDATIONS_PROMPT(summary));
    if (!result.success) return result;
    return { success: true, recommendations: result.data };
  }

  getMockHint(problem, hintLevel) {
    const hints = [
      'Look at what you need to return versus what you are given — is there a one-to-one mapping?',
      'Consider storing seen values in a hash map for O(1) lookups while scanning once.',
      'Iterate with two pointers or a single pass: for each element, check if (target - element) exists in your map.',
    ];
    return {
      success: true,
      hint: hints[hintLevel - 1] || hints[2],
      hintLevel,
      visualizationMeta: { algorithmType: 'array', dataStructure: 'hashmap', visualizable: true },
      mock: true,
    };
  }

  getMockApproach() {
    return {
      success: true,
      approach: {
        intuition: 'Many array problems reduce to tracking complements or frequencies.',
        bruteForce: 'Check all pairs — O(n²) time, O(1) space.',
        optimized: 'One pass with a hash map storing value → index.',
        dataStructures: 'Hash map for O(1) lookup.',
        dryRun: 'nums=[2,7,11], target=9 → see 2, need 7, map empty; store 2→0; at 7, 9-7=2 in map → return [0,1].',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        visualizationMeta: { algorithmType: 'array', dataStructure: 'hashmap', visualizable: true },
      },
      mock: true,
    };
  }

  getMockSolution(language) {
    const codes = {
      python: 'def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return []',
      javascript: 'function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int need = target - nums[i];\n            if (seen.containsKey(need)) return new int[]{seen.get(need), i};\n            seen.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int,int> seen;\n        for (int i = 0; i < nums.size(); i++) {\n            int need = target - nums[i];\n            if (seen.count(need)) return {seen[need], i};\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};',
    };
    return {
      success: true,
      solution: {
        language,
        code: codes[language] || codes.python,
        explanations: [
          { line: 1, text: 'Initialize a hash map to store value → index.' },
          { line: 2, text: 'For each element, check if complement exists in map.' },
          { line: 3, text: 'If found, return indices; else store current value.' },
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        visualizationMeta: { algorithmType: 'array', dataStructure: 'hashmap', visualizable: true },
      },
      mock: true,
    };
  }
}

module.exports = new LeetcodeAiService();
