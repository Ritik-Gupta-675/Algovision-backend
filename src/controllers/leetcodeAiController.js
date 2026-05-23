const leetcodeAiService = require('../services/leetcodeAiService');

const useAiOrMock = async (aiFn, mockFn) => {
  if (!leetcodeAiService.isConfigured()) {
    if (mockFn) return mockFn();
    return {
      success: false,
      error: 'AI is not configured. Set GEMINI_API_KEY on the server.',
    };
  }
  const result = await aiFn();
  if (result.success) return result;
  if (mockFn) {
    console.warn('AI failed, returning mock:', result.error);
    return mockFn();
  }
  return result;
};

const getHint = async (req, res) => {
  try {
    const { hintLevel, previousHints, ...problem } = req.body;
    const result = await useAiOrMock(
      () => leetcodeAiService.generateHint(problem, hintLevel, previousHints),
      () => leetcodeAiService.getMockHint(problem, hintLevel)
    );
    if (!result.success) {
      return res.status(503).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('getHint error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate hint' });
  }
};

const getApproach = async (req, res) => {
  try {
    const problem = req.body;
    const result = await useAiOrMock(
      () => leetcodeAiService.generateApproach(problem),
      () => leetcodeAiService.getMockApproach()
    );
    if (!result.success) {
      return res.status(503).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('getApproach error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate approach' });
  }
};

const getSolution = async (req, res) => {
  try {
    const { language, ...problem } = req.body;
    const result = await useAiOrMock(
      () => leetcodeAiService.generateSolution(problem, language),
      () => leetcodeAiService.getMockSolution(language)
    );
    if (!result.success) {
      return res.status(503).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('getSolution error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate solution' });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const { profile } = req.body;
    const result = await useAiOrMock(
      () => leetcodeAiService.generateRecommendations(profile),
      () => ({
        success: true,
        recommendations: {
          weakTopics: [
            { topic: 'Dynamic Programming', score: 35, message: 'You solve fewer DP problems than array/graph topics.' },
            { topic: 'Graph BFS/DFS', score: 42, message: 'Practice more multi-source BFS patterns.' },
          ],
          recommendedProblems: [
            { title: 'Climbing Stairs', difficulty: 'Easy', topic: 'DP', reason: 'Foundational 1D DP' },
            { title: 'Number of Islands', difficulty: 'Medium', topic: 'Graph', reason: 'Core grid DFS/BFS' },
          ],
          dailyGoal: 'Solve 1 medium problem focusing on DP or graphs.',
          insights: ['Your array skills are strong — leverage them when learning DP.'],
        },
        mock: true,
      })
    );
    if (!result.success) {
      return res.status(503).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('getRecommendations error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
};

module.exports = { getHint, getApproach, getSolution, getRecommendations };
