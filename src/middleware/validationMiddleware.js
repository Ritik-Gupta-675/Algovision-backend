const Joi = require('joi');

const MAX_CODE_SIZE = 50 * 1024; // 50KB
const MAX_INPUT_SIZE = 10 * 1024; // 10KB

const executionRequestSchema = Joi.object({
  code: Joi.string().required().min(1).max(MAX_CODE_SIZE).messages({
    'string.empty': 'Code cannot be empty',
    'string.min': 'Code cannot be empty',
    'string.max': `Code is too long (max ${MAX_CODE_SIZE} characters)`,
    'any.required': 'Code is required'
  }),
  language: Joi.string().optional().valid('python', 'javascript', 'java', 'cpp').default('python'),
  useAI: Joi.boolean().optional().default(true),
  inputData: Joi.object().optional()
});

const validateExecutionRequest = (req, res, next) => {
  console.log('Incoming request body:', req.body);
  
  const { error, value } = executionRequestSchema.validate(req.body);
  
  if (error) {
    console.log('Validation failed:', error.details[0].message);
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Update req.body with validated and defaulted values
  req.body = value;
  console.log('Validation passed, proceeding to next middleware');
  next();
};

const sanitizeCode = (req, res, next) => {
  // Skip code sanitization for AI mode since AI is interpreting, not executing
  if (req.body.useAI) {
    return next();
  }
  
  if (req.body.code) {
    const dangerousPatterns = [
      /\bos\b/gi,
      /\bsubprocess\b/gi,
      /\bopen\s*\(/gi,
      /\beval\s*\(/gi,
      /\bexec\s*\(/gi,
      /\bimport\b/gi,
      /\bsys\.exit/gi
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(req.body.code)) {
        console.log('Validation failed: Dangerous keyword detected');
        return res.status(400).json({
          success: false,
          error: 'Unsafe code detected'
        });
      }
    }
  }

  next();
};

const validateInputData = (req, res, next) => {
  // inputData is now optional and already set to {} if missing in validateExecutionRequest
  if (req.body.inputData) {
    try {
      // Ensure inputData is a valid object
      if (typeof req.body.inputData !== 'object' || Array.isArray(req.body.inputData)) {
        return res.status(400).json({
          success: false,
          error: 'inputData must be an object'
        });
      }
      
      // Check serialized size
      const serializedSize = JSON.stringify(req.body.inputData).length;
      if (serializedSize > MAX_INPUT_SIZE) {
        return res.status(400).json({
          success: false,
          error: `Input data is too large (max ${MAX_INPUT_SIZE} characters)`
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid inputData format'
      });
    }
  }

  next();
};

module.exports = {
  validateExecutionRequest,
  sanitizeCode,
  validateInputData
};
