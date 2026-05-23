const vm = require('vm');
const acorn = require('acorn');
const { MAX_STEPS, EXECUTION_TIMEOUT_MS } = require('./security');

function shouldSkipLine(trimmed) {
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return true;
  if (/^(import|export)\s/.test(trimmed)) return true;
  if (/^(function|async function|class)\s/.test(trimmed)) return true;
  if (/^(const|let|var)\s+\w+\s*=\s*(async\s+)?function/.test(trimmed)) return true;
  if (/^[\}\{]\s*$/.test(trimmed)) return true;
  if (/^(else|catch|finally)\b/.test(trimmed)) return true;
  return false;
}

function instrumentCode(code) {
  const lines = code.split('\n');
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    if (!shouldSkipLine(trimmed)) {
      out.push(`__track(${lineNum});`);
    }
    out.push(line);
  }

  return out.join('\n');
}

function safeValue(val, depth = 0) {
  if (depth > 3) return '...';
  if (val === null || val === undefined) return val;
  const t = typeof val;
  if (t === 'number' || t === 'boolean' || t === 'string') {
    return t === 'string' && val.length > 200 ? val.slice(0, 200) + '...' : val;
  }
  if (Array.isArray(val)) return val.slice(0, 50).map((x) => safeValue(x, depth + 1));
  if (t === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val).slice(0, 30)) {
      if (typeof v !== 'function') out[k] = safeValue(v, depth + 1);
    }
    return out;
  }
  return String(val).slice(0, 200);
}

function collectVariables(context) {
  const variables = {};
  for (const key of Object.keys(context)) {
    if (key.startsWith('__') || key === 'console') continue;
    const val = context[key];
    if (typeof val === 'function') continue;
    variables[key] = safeValue(val);
  }
  return variables;
}

class JavascriptTracer {
  trace(code) {
    const sourceLines = code.split('\n');
    const steps = [];
    const outputBuffer = [];
    const callStack = ['main'];
    const prevVars = {};
    const loopCounters = {};
    let stepCount = 0;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
    }, EXECUTION_TIMEOUT_MS);

    const context = {
      console: {
        log: (...args) => {
          outputBuffer.push(args.map((a) => safeValue(a)).join(' '));
        },
      },
    };

    context.__track = (lineNum) => {
      if (timedOut) throw new Error('Execution timed out');
      if (stepCount >= MAX_STEPS) throw new Error('Maximum execution steps exceeded');

      const variables = collectVariables(context);
      const changed = [];
      for (const [k, v] of Object.entries(variables)) {
        const prev = prevVars[k];
        if (prev !== undefined && JSON.stringify(prev) !== JSON.stringify(v)) {
          changed.push(k);
        }
        prevVars[k] = v;
      }

      const key = String(lineNum);
      loopCounters[key] = (loopCounters[key] || 0) + 1;
      const iteration = loopCounters[key];

      stepCount += 1;
      steps.push({
        step: stepCount,
        currentLine: lineNum,
        variables,
        changedVariables: changed,
        stack: [...callStack],
        output: [...outputBuffer],
        event: 'line',
        iteration: iteration > 1 ? iteration : null,
        loopInfo: iteration > 1 ? { count: iteration } : null,
      });
    };

    const instrumented = instrumentCode(code);
    let errorResult = null;

    try {
      acorn.parse(code, { ecmaVersion: 2022, sourceType: 'script' });
      vm.createContext(context);
      vm.runInContext(instrumented, context, {
        timeout: EXECUTION_TIMEOUT_MS,
        filename: 'user_code.js',
      });
    } catch (err) {
      if (timedOut) {
        errorResult = {
          type: 'TimeoutError',
          message: 'Execution timed out',
          line: steps.length ? steps[steps.length - 1].currentLine : 1,
          explanation: 'Your code took too long to execute.',
          suggestion: 'Check for infinite loops.',
        };
      } else if (err.message?.includes('Maximum execution steps')) {
        errorResult = {
          type: 'StepLimitError',
          message: err.message,
          line: steps.length ? steps[steps.length - 1].currentLine : 1,
          explanation: 'Too many execution steps were recorded.',
          suggestion: 'Simplify loops or reduce iterations.',
        };
      } else if (err.name === 'SyntaxError' || err instanceof SyntaxError) {
        const match = err.message.match(/\((\d+):/);
        errorResult = {
          type: 'SyntaxError',
          message: err.message,
          line: match ? parseInt(match[1], 10) : 1,
          explanation: 'JavaScript could not parse your code.',
          suggestion: 'Review brackets, quotes, and semicolons.',
        };
      } else {
        errorResult = {
          type: err.name || 'RuntimeError',
          message: err.message,
          line: steps.length ? steps[steps.length - 1].currentLine : 1,
          explanation: `Runtime error: ${err.message}`,
          suggestion: 'Inspect variables and indices near the failing step.',
        };
      }
    } finally {
      clearTimeout(timer);
    }

    return {
      success: !errorResult,
      steps,
      totalSteps: steps.length,
      language: 'javascript',
      error: errorResult,
      sourceLines,
    };
  }
}

module.exports = new JavascriptTracer();
