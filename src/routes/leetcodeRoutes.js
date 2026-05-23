const express = require('express');
const leetcodeController = require('../controllers/leetcodeController');
const {
  validateConnect,
  validateUsernameParam,
  validateProblem,
} = require('../middleware/leetcodeValidation');

const router = express.Router();

router.post('/connect', validateConnect, leetcodeController.connectAccount);
router.get('/profile/:username', validateUsernameParam, leetcodeController.getProfile);
router.get('/stats/:username', validateUsernameParam, leetcodeController.getStats);
router.post('/problem', ...validateProblem, leetcodeController.parseProblem);

module.exports = router;
