# AlgoVision Backend API

## Overview

Clean synchronous Python execution API for algorithm visualization with AI-powered simulation mode.

## API Endpoint

### POST /api/execute

Execute Python code or use AI simulation for algorithm visualization.

#### Request Body (Traditional Mode)

```json
{
  "code": "python code",
  "inputData": {},
  "useAI": false
}
```

#### Request Body (AI Simulation Mode)

```json
{
  "code": "algorithm code in any language",
  "useAI": true
}
```

#### Response

```json
{
  "success": true,
  "algorithmType": "sorting|bfs|dfs|graph|unknown",
  "steps": [
    {
      "type": "compare|swap|visit|backtrack",
      "state": {
        "array": [...],
        "visitedNodes": [...],
        "activeNode": number
      },
      "meta": {
        "i": number,
        "j": number
      }
    }
  ],
  "stats": {
    "totalSteps": number,
    "comparisons": number,
    "swaps": number
  }
}
```

## Execution Modes

### 🤖 AI Simulation Mode (Recommended for Demo)

**Features:**
- Works with any programming language (Python, Java, C++, JavaScript, etc.)
- No need to write `record_step()` calls
- AI interprets code and generates visualization steps
- Perfect for fast demonstrations

**Usage:**
```json
{
  "code": "Your algorithm in any language",
  "useAI": true
}
```

**Setup:**
1. Get Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `.env`: `GEMINI_API_KEY=your_key_here`
3. Install dependency: `npm install @google/generative-ai`

### 🐍 Traditional Python Mode

**Features:**
- Actual Python code execution
- Precise step tracking with `record_step()`
- Full control over visualization data

**Code Requirements:**
- **Language**: Python only
- **Code must**: Use `record_step()` function
- **Timeout**: 5 seconds maximum execution time
- **Security**: No system modules, file operations, or dynamic execution

**Step Tracking:**
```python
def record_step(data):
    if isinstance(data, dict):
        steps.append(data)

# Example usage
record_step({"array": [5, 3, 2, 8], "i": 0})
record_step({"compare": [5, 3], "swap": True})
```

## Supported Algorithm Types

### AI Mode Detection:
- **Sorting** - Bubble sort, selection sort, insertion sort, etc.
- **BFS** - Breadth-First Search algorithms
- **DFS** - Depth-First Search algorithms  
- **Graph** - General graph algorithms
- **Unknown** - Fallback for other algorithms

### Step Types:
- `compare` - Comparison operations
- `swap` - Element swapping
- `visit` - Node visiting
- `backtrack` - Backtracking operations

## Environment Setup

### .env file structure:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:8080,http://localhost:8081

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# AI Configuration (Optional)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Installation:
```bash
# Install dependencies
npm install

# Install AI dependency (optional)
npm install @google/generative-ai

# Start development server
npm run dev
```

## Security

### Traditional Mode Validation:
Blocks dangerous patterns:
- `import os`
- `import sys`
- `import subprocess`
- `open(`
- `eval(`
- `exec(`

### AI Mode Safety:
- No actual code execution
- AI interpretation only
- 30-second timeout
- Maximum 200 steps limit
- JSON structure validation

## Error Handling

- **400**: Validation errors or dangerous code
- **500**: Execution failures or AI errors

## Architecture

```
POST /api/execute
↓
validationMiddleware
↓
executeController
↓
[AI Mode] aiExecutionService OR [Traditional] executionService
↓
stepTrackerService
↓
statsService
↓
Return JSON
```

Each service handles its specific responsibility:
- **Controller**: Request/response handling and mode selection
- **AI Execution**: Gemini AI integration for algorithm interpretation
- **Execution**: Python code execution with timeout
- **Step Tracker**: Step validation and formatting
- **Stats**: Generate statistics from steps

## Examples

### AI Mode - C++ Bubble Sort:
```json
{
  "code": "void bubbleSort(int arr[], int n) {\n    for (int i = 0; i < n-1; i++) {\n        for (int j = 0; j < n-i-1; j++) {\n            if (arr[j] > arr[j+1]) {\n                swap(arr[j], arr[j+1]);\n            }\n        }\n    }\n}",
  "useAI": true
}
```

### Traditional Mode - Python:
```json
{
  "code": "arr = [5, 3, 2, 8]\nfor i in range(len(arr)):\n    record_step({'array': arr.copy(), 'i': i})",
  "inputData": {},
  "useAI": false
}
```

## Benefits

### AI Mode:
- **Language Agnostic**: Works with any programming language
- **Fast Setup**: No need to write Python code with record_step()
- **Demo Ready**: Perfect for quick algorithm visualization
- **Safe**: No actual code execution, AI interpretation only

### Traditional Mode:
- **Precise Control**: Exact step data you define
- **Real Execution**: Actual Python code runs
- **Custom Steps**: Any step structure you want
- **Backward Compatible**: Existing implementations continue to work
