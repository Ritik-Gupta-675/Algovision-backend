const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const algorithmDetectionService = require('./algorithmDetectionService');

const MAX_STEPS = 5000;
const MAX_CODE_SIZE = 50 * 1024; // 50KB
const MAX_INPUT_SIZE = 10 * 1024; // 10KB

class ExecutionService {
  async executePython(code, inputData = {}) {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'algovision-'));
    const pythonFile = path.join(tempDir, 'solution.py');
    
    try {
      // Detect algorithm type before execution
      const algorithmType = algorithmDetectionService.detectAlgorithmType(code);
      
      const wrappedCode = this.createWrapper(code, inputData);
      await fs.writeFile(pythonFile, wrappedCode);
      
      const result = await this.executeWithTimeout(pythonFile);
      
      if (result.success) {
        return {
          steps: result.steps,
          algorithmType
        };
      } else {
        throw new Error(result.error);
      }
    } finally {
      await fs.remove(tempDir).catch(() => {});
    }
  }

  createWrapper(code, inputData) {
    // Safely inject input_data as JSON string
    const inputJson = JSON.stringify(inputData || {});
    
    return `import json
import sys
import traceback

steps = []
MAX_STEPS = ${MAX_STEPS}

def record_step(data):
    global steps
    if isinstance(data, dict):
        steps.append(data)
        if len(steps) > MAX_STEPS:
            raise Exception("Step limit exceeded")

input_data = ${inputJson}

try:
${code.split('\n').map(line => '    ' + line).join('\n')}

except Exception as e:
    print(json.dumps({
        "success": False,
        "error": str(e),
        "trace": traceback.format_exc()
    }))
    sys.exit(1)

print(json.dumps({
    "success": True,
    "steps": steps
}))`;
  }

  async executeWithTimeout(pythonFile, timeoutMs = 5000) {
    return new Promise((resolve) => {
      const process = spawn('python', [pythonFile]);
      let stdout = '';
      let stderr = '';
      
      const timer = setTimeout(() => {
        process.kill('SIGKILL');
        resolve({
          success: false,
          steps: [],
          error: 'Execution timed out'
        });
      }, timeoutMs);

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        clearTimeout(timer);
        
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            
            // Strict output validation
            if (!this.validateOutput(result)) {
              resolve({
                success: false,
                steps: [],
                error: 'Invalid output format from execution'
              });
              return;
            }
            
            if (result.success) {
              resolve({
                success: true,
                steps: result.steps
              });
            } else {
              resolve({
                success: false,
                steps: [],
                error: result.error || 'Execution failed'
              });
            }
          } catch (parseError) {
            resolve({
              success: false,
              steps: [],
              error: 'Invalid JSON output from execution'
            });
          }
        } else {
          resolve({
            success: false,
            steps: [],
            error: stderr.trim() || 'Execution failed'
          });
        }
      });

      process.on('error', (error) => {
        clearTimeout(timer);
        resolve({
          success: false,
          steps: [],
          error: error.message
        });
      });
    });
  }
  
  validateOutput(result) {
    // Check if result is an object
    if (typeof result !== 'object' || result === null) {
      return false;
    }
    
    // Check if success field exists and is boolean
    if (typeof result.success !== 'boolean') {
      return false;
    }
    
    // If success is true, validate steps
    if (result.success) {
      if (!Array.isArray(result.steps)) {
        return false;
      }
      
      if (result.steps.length > MAX_STEPS) {
        return false;
      }
    }
    
    // If success is false, validate error field
    if (!result.success) {
      if (typeof result.error !== 'string') {
        return false;
      }
    }
    
    return true;
  }

}

module.exports = new ExecutionService();
