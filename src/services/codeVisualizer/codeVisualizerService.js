const pythonTracer = require('./pythonTracer');
const javascriptTracer = require('./javascriptTracer');
const { validateCode } = require('./security');
const { enrichError, explainStep } = require('./errorAnalyzer');

const SUPPORTED_LANGUAGES = ['python', 'javascript'];

class CodeVisualizerService {
  async execute(code, language = 'python') {
    const lang = language.toLowerCase();
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      return {
        success: false,
        error: {
          type: 'UnsupportedLanguage',
          message: `Language "${language}" is not supported yet.`,
          line: 1,
          explanation: 'Only Python and JavaScript are supported currently.',
          suggestion: 'Select Python or JavaScript from the language dropdown.',
        },
      };
    }

    const validation = validateCode(code, lang);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          type: 'SecurityError',
          message: validation.error,
          line: 1,
          explanation: validation.error,
          suggestion: 'Remove blocked operations and try again.',
        },
      };
    }

    let result;
    if (lang === 'python') {
      result = await pythonTracer.trace(code);
    } else {
      result = javascriptTracer.trace(code);
    }

    if (result.error) {
      result.error = enrichError(result.error, lang);
    }

    result.memory = this.buildMemorySnapshot(
      result.steps?.length ? result.steps[result.steps.length - 1] : null
    );

    return result;
  }

  buildMemorySnapshot(lastStep) {
    if (!lastStep?.variables) {
      return { heap: [], stack: [] };
    }

    const heap = [];
    const stack = [];

    for (const [name, value] of Object.entries(lastStep.variables)) {
      const entry = {
        name,
        value,
        type: Array.isArray(value) ? 'array' : typeof value,
        address: `0x${name.length.toString(16).padStart(4, '0')}`,
      };
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        heap.push(entry);
      } else {
        stack.push(entry);
      }
    }

    return { heap, stack, callStack: lastStep.stack || [] };
  }

  async explainExecutionStep(code, language, stepIndex, steps, explainMode) {
    if (!explainMode || !steps?.[stepIndex]) {
      return { explanation: null };
    }

    const step = steps[stepIndex];
    const sourceLines = code.split('\n');
    const sourceLine = sourceLines[step.currentLine - 1];
    const explanation = await explainStep(step, code, language, sourceLine);
    return { explanation };
  }

  buildDryRunTable(steps) {
    if (!steps?.length) return { headers: [], rows: [] };

    const varNames = new Set();
    steps.forEach((s) => {
      Object.keys(s.variables || {}).forEach((k) => varNames.add(k));
    });
    const headers = ['Step', 'Line', ...Array.from(varNames)];

    const rows = steps.map((s) => {
      const row = {
        Step: s.step,
        Line: s.currentLine,
      };
      varNames.forEach((name) => {
        const val = s.variables?.[name];
        row[name] = val !== undefined ? JSON.stringify(val) : '—';
      });
      return row;
    });

    return { headers, rows };
  }

  buildFlowGraph(steps) {
    const nodes = [{ id: 'start', label: 'Start', type: 'start' }];
    const edges = [];
    let prevId = 'start';

    if (!steps?.length) {
      nodes.push({ id: 'end', label: 'End', type: 'end' });
      edges.push({ id: 'e-start-end', source: 'start', target: 'end' });
      return { nodes, edges };
    }

    const seen = new Set();
    steps.forEach((s, i) => {
      const id = `step-${i}`;
      const label = `L${s.currentLine}`;
      const type = s.loopInfo ? 'loop' : s.event === 'call' ? 'call' : 'line';
      if (!seen.has(id)) {
        nodes.push({ id, label, type });
        seen.add(id);
      }
      edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id });
      prevId = id;
    });

    nodes.push({ id: 'end', label: 'End', type: 'end' });
    edges.push({ id: `e-${prevId}-end`, source: prevId, target: 'end' });

    return { nodes, edges };
  }
}

module.exports = new CodeVisualizerService();
