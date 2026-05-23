const chatService = require('../chatService');

const ERROR_HINTS = {
  IndexError: {
    explanation: 'You are accessing an index that does not exist in the list or array.',
    suggestion: 'Check loop boundaries and ensure index < array.length.',
  },
  KeyError: {
    explanation: 'You are accessing a dictionary key that does not exist.',
    suggestion: 'Verify the key exists or use .get(key, default).',
  },
  TypeError: {
    explanation: 'An operation was applied to a value of the wrong type.',
    suggestion: 'Check types before operations (e.g. int + str).',
  },
  ZeroDivisionError: {
    explanation: 'Division by zero occurred.',
    suggestion: 'Add a guard: if divisor != 0 before dividing.',
  },
  ReferenceError: {
    explanation: 'A variable was used before it was defined.',
    suggestion: 'Declare variables with let/const before use.',
  },
  RangeError: {
    explanation: 'A numeric value is outside its allowed range.',
    suggestion: 'Check array length and index bounds.',
  },
  SyntaxError: {
    explanation: 'The code has invalid syntax and cannot be parsed.',
    suggestion: 'Review brackets, quotes, colons, and semicolons.',
  },
};

function enrichError(error, language) {
  if (!error) return null;
  const hint = ERROR_HINTS[error.type] || {};
  return {
    ...error,
    explanation: error.explanation || hint.explanation || `An error occurred: ${error.message}`,
    suggestion: error.suggestion || hint.suggestion || 'Review the code around the failing line.',
    language,
  };
}

async function explainStep(step, code, language, sourceLine) {
  if (!chatService.isConfigured()) {
    return generateLocalExplanation(step, sourceLine);
  }

  const prompt = `You are a coding tutor. Explain this execution step in 1-2 simple sentences for a beginner.

Language: ${language}
Current line (${step.currentLine}): ${sourceLine || 'N/A'}
Variables: ${JSON.stringify(step.variables || {})}
Event: ${step.event || 'line'}
${step.iteration ? `Loop iteration: #${step.iteration}` : ''}

Be concise. Focus on what this line does to the program state.`;

  try {
    const result = await chatService.chat([], prompt);
    if (result.success && result.reply) return result.reply.trim();
  } catch {
    /* fall through */
  }
  return generateLocalExplanation(step, sourceLine);
}

function generateLocalExplanation(step, sourceLine) {
  const line = (sourceLine || '').trim();
  if (!line) return `Executing step ${step.step} at line ${step.currentLine}.`;

  if (step.changedVariables?.length) {
    const vars = step.changedVariables.join(', ');
    return `Line ${step.currentLine} updates variable(s): ${vars}.`;
  }
  if (step.iteration) {
    return `Loop iteration #${step.iteration} at line ${step.currentLine}.`;
  }
  if (line.includes('print') || line.includes('console.log')) {
    return `Line ${step.currentLine} outputs text to the console.`;
  }
  if (line.startsWith('def ') || line.startsWith('function ')) {
    return `Defines a function at line ${step.currentLine}.`;
  }
  if (line.includes('return')) {
    return `Returns from the current function at line ${step.currentLine}.`;
  }
  return `Executes line ${step.currentLine}: ${line.slice(0, 60)}${line.length > 60 ? '...' : ''}`;
}

module.exports = { enrichError, explainStep, generateLocalExplanation };
