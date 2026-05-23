const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { MAX_STEPS, EXECUTION_TIMEOUT_MS } = require('./security');

const RUNNER_SCRIPT = (maxSteps) => `import sys
import json
import traceback
import copy

MAX_STEPS = ${maxSteps}
steps = []
call_stack = []
output_buffer = []
loop_counters = {}
prev_vars = {}

def safe_value(val, depth=0):
    if depth > 3:
        return "..."
    try:
        if isinstance(val, (int, float, bool, str, type(None))):
            if isinstance(val, str) and len(val) > 200:
                return val[:200] + "..."
            return val
        if isinstance(val, (list, tuple)):
            return [safe_value(x, depth + 1) for x in list(val)[:50]]
        if isinstance(val, dict):
            return {str(k): safe_value(v, depth + 1) for k, v in list(val.items())[:30]}
        return repr(val)[:200]
    except Exception:
        return "<unreadable>"

def get_variables(frame):
    merged = {}
    try:
        for d in (frame.f_locals, frame.f_globals):
            for k, v in d.items():
                if k.startswith("_") and k not in ("__name__",):
                    continue
                if callable(v) and not isinstance(v, type):
                    continue
                merged[k] = safe_value(v)
    except Exception:
        pass
    return merged

def detect_loop(lineno):
    key = str(lineno)
    loop_counters[key] = loop_counters.get(key, 0) + 1
    return loop_counters[key]

def trace(frame, event, arg):
    if len(steps) >= MAX_STEPS:
        raise RuntimeError("Maximum execution steps exceeded")

    filename = frame.f_code.co_filename
    if not filename.endswith("user_code.py"):
        return trace

    if event == "call":
        name = frame.f_code.co_name
        if name not in ("<module>",):
            call_stack.append(name)
        return trace

    if event == "return":
        if call_stack:
            call_stack.pop()
        return trace

    if event == "line":
        lineno = frame.f_lineno
        variables = get_variables(frame)
        changed = []
        for k, v in variables.items():
            if k in prev_vars and prev_vars[k] != v:
                changed.append(k)
            prev_vars[k] = v

        iteration = detect_loop(lineno)
        steps.append({
            "step": len(steps) + 1,
            "currentLine": lineno,
            "variables": variables,
            "changedVariables": changed,
            "stack": list(call_stack) if call_stack else ["main"],
            "output": list(output_buffer),
            "event": "line",
            "iteration": iteration if iteration > 1 else None,
            "loopInfo": {"count": iteration} if iteration > 1 else None,
        })
    return trace

class OutputCapture:
    def write(self, text):
        if text and str(text).strip():
            output_buffer.append(str(text).rstrip("\\n"))
    def flush(self):
        pass

_real_stdout = sys.stdout
sys.stdout = OutputCapture()

with open("user_code.py", "r", encoding="utf-8") as f:
    source = f.read()
source_lines = source.splitlines()

error_result = None
sys.settrace(trace)
try:
    code_obj = compile(source, "user_code.py", "exec")
    exec(code_obj, {"__name__": "__main__"})
except SyntaxError as e:
    error_result = {
        "type": "SyntaxError",
        "message": str(e.msg or e),
        "line": e.lineno or 1,
        "explanation": "Python could not parse your code. Check colons, parentheses, and indentation.",
        "suggestion": "Review the highlighted line for syntax mistakes.",
    }
except Exception as e:
    err_line = 1
    for frame in traceback.extract_tb(e.__traceback__):
        if frame.filename.endswith("user_code.py"):
            err_line = frame.lineno
    error_result = {
        "type": type(e).__name__,
        "message": str(e),
        "line": err_line,
        "explanation": f"Runtime error: {type(e).__name__} — {str(e)}",
        "suggestion": "Inspect variables and loop boundaries near the failing line.",
    }
finally:
    sys.settrace(None)

_real_stdout.write(json.dumps({
    "success": error_result is None,
    "steps": steps,
    "totalSteps": len(steps),
    "language": "python",
    "error": error_result,
    "sourceLines": source_lines,
}))
_real_stdout.write("\\n")
_real_stdout.flush()
`;

class PythonTracer {
  async trace(code) {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-py-'));
    const runnerFile = path.join(tempDir, 'tracer_runner.py');
    const userFile = path.join(tempDir, 'user_code.py');

    await fs.writeFile(userFile, code, 'utf-8');
    await fs.writeFile(runnerFile, RUNNER_SCRIPT(MAX_STEPS), 'utf-8');

    return this.runProcess(runnerFile, tempDir);
  }

  runProcess(scriptPath, tempDir) {
    return new Promise((resolve) => {
      const proc = spawn('python', [scriptPath], { cwd: tempDir });
      let stdout = '';
      let stderr = '';

      const timer = setTimeout(() => {
        proc.kill('SIGKILL');
        fs.remove(tempDir).catch(() => {});
        resolve({
          success: false,
          steps: [],
          error: {
            type: 'TimeoutError',
            message: 'Execution timed out',
            line: 1,
            explanation: 'Your code took too long to execute.',
            suggestion: 'Check for infinite loops or reduce complexity.',
          },
        });
      }, EXECUTION_TIMEOUT_MS);

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', async () => {
        clearTimeout(timer);
        await fs.remove(tempDir).catch(() => {});

        const lines = stdout.trim().split('\n');
        const jsonLine = lines[lines.length - 1] || '{}';
        try {
          resolve(JSON.parse(jsonLine));
        } catch {
          resolve({
            success: false,
            steps: [],
            error: {
              type: 'ExecutionError',
              message: stderr.trim() || 'Failed to execute Python code',
              line: 1,
              explanation: stderr.trim() || 'Python interpreter failed. Ensure Python 3 is installed.',
              suggestion: 'Verify Python 3 is available on the server.',
            },
          });
        }
      });
    });
  }
}

module.exports = new PythonTracer();
