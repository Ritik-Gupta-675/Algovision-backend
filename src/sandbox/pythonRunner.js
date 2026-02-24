const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const stepTrackerService = require('../services/stepTrackerService');

class PythonRunner {
  constructor() {
    this.timeout = parseInt(process.env.PYTHON_TIMEOUT) || 30000;
  }

  async run(pythonFile, input, executionId) {
    return new Promise((resolve, reject) => {
      const tracker = stepTrackerService.createTracker(executionId, fs.readFileSync(pythonFile, 'utf8'));
      
      stepTrackerService.addStep(executionId, {
        type: 'start',
        description: 'Starting Python execution',
        line: 0
      });

      const pythonProcess = spawn('python', [pythonFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(pythonFile)
      });

      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const timeoutId = setTimeout(() => {
        isTimedOut = true;
        pythonProcess.kill('SIGKILL');
        stepTrackerService.addErrorStep(executionId, 'Execution timeout', 0);
        resolve({
          success: false,
          output: null,
          error: 'Execution timeout',
          steps: stepTrackerService.getSteps(executionId)
        });
      }, this.timeout);

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        stepTrackerService.addOutputStep(executionId, output.trim());
      });

      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        stepTrackerService.addErrorStep(executionId, error.trim());
      });

      pythonProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        
        if (isTimedOut) return;

        stepTrackerService.addStep(executionId, {
          type: 'end',
          description: `Python execution finished with exit code ${code}`,
          line: -1
        });

        const steps = stepTrackerService.getSteps(executionId);
        stepTrackerService.clearTracker(executionId);

        if (code === 0) {
          resolve({
            success: true,
            output: stdout.trim(),
            error: null,
            steps
          });
        } else {
          resolve({
            success: false,
            output: stdout.trim(),
            error: stderr.trim() || `Process exited with code ${code}`,
            steps
          });
        }
      });

      pythonProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        stepTrackerService.addErrorStep(executionId, error.message);
        resolve({
          success: false,
          output: null,
          error: error.message,
          steps: stepTrackerService.getSteps(executionId)
        });
      });

      if (input) {
        pythonProcess.stdin.write(input);
        pythonProcess.stdin.end();
      }
    });
  }

  async runTest(code, testCase, executionId) {
    const tempDir = path.join(process.cwd(), 'temp', executionId);
    await fs.ensureDir(tempDir);
    
    const testFile = path.join(tempDir, 'test_solution.py');
    
    const testCode = `
import sys
import io
from contextlib import redirect_stdout

# Original code
${code}

# Test execution
def run_test():
    try:
        # Capture stdout
        old_stdout = sys.stdout
        sys.stdout = captured_output = io.StringIO()
        
        # Call main function with test input
        input_data = ${JSON.stringify(testCase.input)}
        result = main(input_data)
        
        # Restore stdout
        sys.stdout = old_stdout
        output = captured_output.getvalue()
        
        # Return both function result and captured output
        if result is not None:
            print(result, end='')
        else:
            print(output, end='')
            
    except Exception as e:
        print(f"Error: {e}", end='')

if __name__ == "__main__":
    run_test()
    `;

    await fs.writeFile(testFile, testCode);

    try {
      const result = await this.run(testFile, null, executionId);
      return {
        success: result.success,
        output: result.output,
        error: result.error
      };
    } finally {
      await fs.remove(testFile);
    }
  }

  async runWithStepTracking(code, input, executionId) {
    const tempDir = path.join(process.cwd(), 'temp', executionId);
    await fs.ensureDir(tempDir);
    
    const trackedFile = path.join(tempDir, 'tracked_solution.py');
    
    const trackedCode = `
import sys
import inspect

# Step tracking wrapper
class StepTracker:
    def __init__(self, execution_id):
        self.execution_id = execution_id
        self.current_line = 0
    
    def track_step(self, line, description="", variables=None):
        self.current_line = line
        # In a real implementation, this would send data to the backend
        print(f"STEP:{line}:{description}", file=sys.stderr)
        
tracker = StepTracker('${executionId}')

# Instrument the original code
${this.instrumentCode(code)}

# Execute main function if it exists
if __name__ == "__main__":
    try:
        input_data = ${JSON.stringify(input || '')}
        if 'main' in globals():
            result = main(input_data)
            if result is not None:
                print(result)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    `;

    await fs.writeFile(trackedFile, trackedCode);

    try {
      return await this.run(trackedFile, input, executionId);
    } finally {
      await fs.remove(trackedFile);
    }
  }

  instrumentCode(code) {
    const lines = code.split('\n');
    const instrumentedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // Skip empty lines, comments, and function definitions
      if (line.trim() === '' || 
          line.trim().startsWith('#') || 
          line.trim().startsWith('def ') ||
          line.trim().startswith('class ') ||
          line.trim().startsWith('import ') ||
          line.trim().startsWith('from ')) {
        instrumentedLines.push(line);
        continue;
      }
      
      // Add step tracking before the line
      instrumentedLines.push(`tracker.track_step(${lineNumber}, "${line.trim().replace(/"/g, '\\"')}")`);
      instrumentedLines.push(line);
    }
    
    return instrumentedLines.join('\n');
  }
}

module.exports = new PythonRunner();
