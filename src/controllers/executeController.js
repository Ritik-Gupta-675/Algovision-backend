const executionService = require('../services/executionService');
const aiExecutionService = require('../services/aiExecutionService');
const stepTrackerService = require('../services/stepTrackerService');
const statsService = require('../services/statsService');

const executeController = {
  async execute(req, res) {
    console.log('Incoming request body:', req.body);
    try {
      const { code } = req.body;
      console.log('Received code:', code?.substring(0, 100) + (code?.length > 100 ? '...' : ''));
      
      const aiResult = await aiExecutionService.generateAlgorithmSteps(code);
      
      if (aiResult.success) {
        // Transform AI service response to match frontend expectations
        const transformedSteps = aiResult.steps.map(step => ({
          operation: step.type,
          i: step.meta?.i || null,
          j: step.meta?.j || null,
          array: step.state.array,
          visited: step.state.visitedNodes || [],
          visiting: [],
          current: step.state.activeNode
        }));
        
        res.json({
          success: true,
          algorithmType: aiResult.algorithmType,
          steps: transformedSteps,
          stats: {
            totalSteps: transformedSteps.length,
            comparisons: transformedSteps.filter(s => s.operation === 'compare').length,
            swaps: transformedSteps.filter(s => s.operation === 'swap').length
          }
        });
      } else {
        console.error('AI Service Error:', aiResult.error);
        res.status(400).json({
          success: false,
          error: aiResult.error
        });
      }
    } catch (error) {
      console.error('Execution error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = executeController;
