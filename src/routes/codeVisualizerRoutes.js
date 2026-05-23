const express = require('express');
const Joi = require('joi');
const { execute, explain } = require('../controllers/codeVisualizerController');

const router = express.Router();

const executeSchema = Joi.object({
  code: Joi.string().max(51200).required(),
  language: Joi.string().valid('python', 'javascript').default('python'),
});

const explainSchema = Joi.object({
  code: Joi.string().max(51200).required(),
  language: Joi.string().valid('python', 'javascript').required(),
  stepIndex: Joi.number().integer().min(0).required(),
  steps: Joi.array().required(),
  explainMode: Joi.boolean().default(true),
});

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message, type: 'ValidationError', line: 1 },
      });
    }
    next();
  };
}

router.post('/execute', validate(executeSchema), execute);
router.post('/explain', validate(explainSchema), explain);

module.exports = router;
