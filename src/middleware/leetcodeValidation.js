const Joi = require('joi');
const { extractUsername } = require('../utils/usernameExtractor');

const MAX_PROBLEM_TEXT = 50000;

const connectSchema = Joi.object({
  input: Joi.string().required().trim().min(1).max(200).messages({
    'any.required': 'LeetCode username or profile URL is required',
  }),
});

const problemSchema = Joi.object({
  title: Joi.string().trim().max(300).allow(''),
  description: Joi.string().trim().max(MAX_PROBLEM_TEXT).allow(''),
  statement: Joi.string().trim().max(MAX_PROBLEM_TEXT).allow(''),
  constraints: Joi.string().trim().max(10000).allow(''),
  examples: Joi.string().trim().max(20000).allow(''),
  url: Joi.string().trim().max(500).allow('', null),
}).or('description', 'statement', 'url', 'constraints', 'examples');

const hintSchema = problemSchema.keys({
  hintLevel: Joi.number().integer().min(1).max(3).default(1),
  previousHints: Joi.array().items(Joi.string().max(2000)).max(3).default([]),
});

const solutionSchema = problemSchema.keys({
  language: Joi.string()
    .valid('python', 'javascript', 'java', 'cpp')
    .default('python'),
});

const recommendationsSchema = Joi.object({
  profile: Joi.object().required(),
});

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    req.body = value;
    next();
  };
}

function validateConnect(req, res, next) {
  const { error, value } = connectSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }
  const extracted = extractUsername(value.input);
  if (!extracted.valid) {
    return res.status(400).json({ success: false, error: extracted.error });
  }
  req.username = extracted.username;
  next();
}

function validateUsernameParam(req, res, next) {
  const extracted = extractUsername(req.params.username || '');
  if (!extracted.valid) {
    return res.status(400).json({ success: false, error: extracted.error });
  }
  req.username = extracted.username;
  next();
}

function sanitizeProblemText(text) {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function sanitizeProblem(req, res, next) {
  ['title', 'description', 'statement', 'constraints', 'examples', 'url'].forEach((key) => {
    if (req.body[key]) req.body[key] = sanitizeProblemText(String(req.body[key]));
  });
  if (!req.body.description && req.body.statement) {
    req.body.description = req.body.statement;
  }
  if (!req.body.description && !req.body.statement && req.body.url) {
    req.body.description = `LeetCode problem URL: ${req.body.url}`;
  }
  if (!req.body.title && req.body.url) {
    const slugMatch = req.body.url.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
    if (slugMatch) {
      req.body.title = slugMatch[1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  next();
}

module.exports = {
  validateConnect,
  validateUsernameParam,
  validateConnectBody: validate(connectSchema),
  validateProblem: [validate(problemSchema), sanitizeProblem],
  validateHint: [validate(hintSchema), sanitizeProblem],
  validateApproach: [validate(problemSchema), sanitizeProblem],
  validateSolution: [validate(solutionSchema), sanitizeProblem],
  validateRecommendations: validate(recommendationsSchema),
};
