const MAX_CODE_SIZE = 50 * 1024;
const MAX_STEPS = 3000;
const EXECUTION_TIMEOUT_MS = 8000;

const PYTHON_BLOCKED = [
  /\bimport\s+os\b/i,
  /\bimport\s+sys\b/i,
  /\bfrom\s+os\b/i,
  /\bfrom\s+subprocess\b/i,
  /\bimport\s+subprocess\b/i,
  /\bimport\s+socket\b/i,
  /\bimport\s+requests\b/i,
  /\bimport\s+urllib\b/i,
  /\bimport\s+shutil\b/i,
  /\bimport\s+pickle\b/i,
  /\b__import__\s*\(/,
  /\bopen\s*\(/,
  /\beval\s*\(/,
  /\bexec\s*\(/,
  /\bcompile\s*\(/,
  /\bgetattr\s*\(\s*__/,
  /\bsetattr\s*\(\s*__/,
  /\bbuiltins\b/,
  /\bctypes\b/,
  /\bmultiprocessing\b/,
];

const JS_BLOCKED = [
  /\brequire\s*\(/,
  /\bimport\s+/,
  /\bprocess\b/,
  /\bchild_process\b/,
  /\bfs\b/,
  /\beval\s*\(/,
  /\bFunction\s*\(/,
  /\b__proto__\b/,
  /\bconstructor\s*\[\s*['"]constructor/,
  /\bwhile\s*\(\s*true\s*\)/,
];

function validateCode(code, language) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Code is required' };
  }
  if (code.length > MAX_CODE_SIZE) {
    return { valid: false, error: `Code exceeds maximum size of ${MAX_CODE_SIZE / 1024}KB` };
  }

  const patterns = language === 'python' ? PYTHON_BLOCKED : JS_BLOCKED;
  for (const pattern of patterns) {
    if (pattern.test(code)) {
      return {
        valid: false,
        error: `Blocked operation detected: ${pattern.source}. Code execution is sandboxed for safety.`,
      };
    }
  }

  return { valid: true };
}

module.exports = {
  MAX_CODE_SIZE,
  MAX_STEPS,
  EXECUTION_TIMEOUT_MS,
  validateCode,
};
