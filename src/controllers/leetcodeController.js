const leetcodeService = require('../services/leetcodeService');

const getProfile = async (req, res) => {
  try {
    const username = req.username || req.params.username;
    const result = await leetcodeService.fetchProfile(username);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json({ success: true, profile: result.profile, warning: result.warning });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch LeetCode profile' });
  }
};

const getStats = async (req, res) => {
  try {
    const username = req.username || req.params.username;
    const result = await leetcodeService.fetchStats(username);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch LeetCode stats' });
  }
};

const connectAccount = async (req, res) => {
  try {
    const result = await leetcodeService.fetchProfile(req.username);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json({
      success: true,
      profile: result.profile,
      warning: result.warning,
    });
  } catch (error) {
    console.error('connectAccount error:', error);
    res.status(500).json({ success: false, error: 'Failed to connect LeetCode account' });
  }
};

const parseProblem = async (req, res) => {
  try {
    const problem = leetcodeService.parseProblemInput(req.body);
    res.json({ success: true, problem });
  } catch (error) {
    console.error('parseProblem error:', error);
    res.status(500).json({ success: false, error: 'Failed to parse problem' });
  }
};

module.exports = { getProfile, getStats, connectAccount, parseProblem };
