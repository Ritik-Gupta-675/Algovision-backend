const express = require('express');
const { validateExecutionRequest, sanitizeCode, validateInputData } = require('../middleware/validationMiddleware');
const executeController = require('../controllers/executeController');

const router = express.Router();

router.post('/', /* validateExecutionRequest, sanitizeCode, validateInputData, */ executeController.execute);

module.exports = router;