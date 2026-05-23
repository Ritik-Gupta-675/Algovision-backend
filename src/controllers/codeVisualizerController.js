const codeVisualizerService = require('../services/codeVisualizer/codeVisualizerService');

async function execute(req, res) {
  try {
    const { code, language = 'python' } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Code is required', type: 'ValidationError', line: 1 },
      });
    }

    const result = await codeVisualizerService.execute(code, language);
    const dryRunTable = codeVisualizerService.buildDryRunTable(result.steps);
    const flowGraph = codeVisualizerService.buildFlowGraph(result.steps);

    return res.json({
      success: result.success,
      steps: result.steps || [],
      totalSteps: result.totalSteps || 0,
      language: result.language || language,
      error: result.error || null,
      sourceLines: result.sourceLines || code.split('\n'),
      memory: result.memory || null,
      dryRunTable,
      flowGraph,
    });
  } catch (err) {
    console.error('CodeVisualizer execute error:', err);
    return res.status(500).json({
      success: false,
      error: {
        type: 'ServerError',
        message: err.message,
        line: 1,
        explanation: 'An unexpected server error occurred.',
        suggestion: 'Try again or simplify your code.',
      },
    });
  }
}

async function explain(req, res) {
  try {
    const { code, language, stepIndex, steps, explainMode = true } = req.body;

    const { explanation } = await codeVisualizerService.explainExecutionStep(
      code,
      language,
      stepIndex,
      steps,
      explainMode
    );

    return res.json({ success: true, explanation });
  } catch (err) {
    console.error('CodeVisualizer explain error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { execute, explain };
