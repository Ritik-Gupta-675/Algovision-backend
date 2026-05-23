const express = require('express');
const leetcodeAiController = require('../controllers/leetcodeAiController');
const {
  validateHint,
  validateApproach,
  validateSolution,
  validateRecommendations,
} = require('../middleware/leetcodeValidation');

const router = express.Router();

router.post('/hint', ...validateHint, leetcodeAiController.getHint);
router.post('/approach', ...validateApproach, leetcodeAiController.getApproach);
router.post('/solution', ...validateSolution, leetcodeAiController.getSolution);
router.post('/recommendations', validateRecommendations, leetcodeAiController.getRecommendations);

module.exports = router;
