# AI Execution Test Cases

## Test Request Examples

### 1️⃣ C++ Bubble Sort (AI Mode)
```json
POST /api/execute
{
  "code": "#include <iostream>\nusing namespace std;\n\nvoid bubbleSort(int arr[], int n) {\n    for (int i = 0; i < n-1; i++) {\n        for (int j = 0; j < n-i-1; j++) {\n            if (arr[j] > arr[j+1]) {\n                swap(arr[j], arr[j+1]);\n            }\n        }\n    }\n}",
  "useAI": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "algorithmType": "sorting",
  "steps": [
    {
      "type": "compare",
      "state": {
        "array": [5, 3, 2, 8],
        "activeNode": null
      },
      "meta": {
        "i": 0,
        "j": 0
      }
    },
    {
      "type": "swap",
      "state": {
        "array": [3, 5, 2, 8],
        "activeNode": null
      },
      "meta": {
        "i": 0,
        "j": 0
      }
    }
  ],
  "stats": {
    "totalSteps": 2
  }
}
```

### 2️⃣ Java BFS (AI Mode)
```json
POST /api/execute
{
  "code": "import java.util.*;\n\npublic class GraphBFS {\n    public void bfs(int start, Map<Integer, List<Integer>> graph) {\n        Queue<Integer> queue = new LinkedList<>();\n        Set<Integer> visited = new HashSet<>();\n        \n        queue.add(start);\n        visited.add(start);\n        \n        while (!queue.isEmpty()) {\n            int node = queue.poll();\n            for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {\n                if (!visited.contains(neighbor)) {\n                    visited.add(neighbor);\n                    queue.add(neighbor);\n                }\n            }\n        }\n    }\n}",
  "useAI": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "algorithmType": "bfs",
  "steps": [
    {
      "type": "visit",
      "state": {
        "array": null,
        "visitedNodes": [1],
        "activeNode": 1
      },
      "meta": {
        "i": null,
        "j": null
      }
    }
  ],
  "stats": {
    "totalSteps": 1
  }
}
```

### 3️⃣ Python DFS (AI Mode)
```json
POST /api/execute
{
  "code": "def dfs(node, graph, visited):\n    if node in visited:\n        return\n    visited.add(node)\n    for neighbor in graph.get(node, []):\n        dfs(neighbor, graph, visited)\n\ndef main():\n    graph = {1: [2, 3], 2: [4], 3: [4], 4: []}\n    visited = set()\n    dfs(1, graph, visited)",
  "useAI": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "algorithmType": "dfs",
  "steps": [
    {
      "type": "visit",
      "state": {
        "array": null,
        "visitedNodes": [1],
        "activeNode": 1
      },
      "meta": {
        "i": null,
        "j": null
      }
    },
    {
      "type": "backtrack",
      "state": {
        "array": null,
        "visitedNodes": [1, 2, 4],
        "activeNode": 1
      },
      "meta": {
        "i": null,
        "j": null
      }
    }
  ],
  "stats": {
    "totalSteps": 2
  }
}
```

### 4️⃣ Simple Loop (AI Mode)
```json
POST /api/execute
{
  "code": "for i in range(5):\n    print(i)",
  "useAI": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "algorithmType": "unknown",
  "steps": [
    {
      "type": "visit",
      "state": {
        "array": null,
        "visitedNodes": null,
        "activeNode": 0
      },
      "meta": {
        "i": 0,
        "j": null
      }
    }
  ],
  "stats": {
    "totalSteps": 1
  }
}
```

### 5️⃣ Traditional Python Execution (Non-AI)
```json
POST /api/execute
{
  "code": "arr = [5, 3, 2, 8]\nfor i in range(len(arr)):\n    record_step({'array': arr.copy(), 'i': i})",
  "inputData": {},
  "useAI": false
}
```

**Expected Response:**
```json
{
  "success": true,
  "algorithmType": "sorting",
  "steps": [
    {
      "array": [5, 3, 2, 8],
      "i": 0
    },
    {
      "array": [5, 3, 2, 8],
      "i": 1
    }
  ],
  "stats": {...}
}
```

### 6️⃣ AI Mode Not Configured (Fallback)
```json
POST /api/execute
{
  "code": "print('hello world')",
  "useAI": true
}
```

**Expected Response (if GEMINI_API_KEY not set):**
```json
{
  "success": false,
  "error": "Failed to execute code",
  "details": "AI execution failed: Gemini AI not configured. Please set GEMINI_API_KEY in environment variables."
}
```

## Testing Commands

### Using curl:
```bash
# Test AI mode with C++ code
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "void bubbleSort(int arr[], int n) {\n    for (int i = 0; i < n-1; i++) {\n        for (int j = 0; j < n-i-1; j++) {\n            if (arr[j] > arr[j+1]) {\n                swap(arr[j], arr[j+1]);\n            }\n        }\n    }\n}",
    "useAI": true
  }'

# Test AI mode with Java code
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "public void bfs(int start, Map<Integer, List<Integer>> graph) {\n    Queue<Integer> queue = new LinkedList<>();\n    Set<Integer> visited = new HashSet<>();\n    queue.add(start);\n    visited.add(start);\n    while (!queue.isEmpty()) {\n        int node = queue.poll();\n        for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {\n            if (!visited.contains(neighbor)) {\n                visited.add(neighbor);\n                queue.add(neighbor);\n            }\n        }\n    }\n}",
    "useAI": true
  }'

# Test traditional Python execution
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "arr = [5, 3, 2, 8]\nfor i in range(len(arr)):\n    record_step({\"array\": arr.copy(), \"i\": i})",
    "inputData": {},
    "useAI": false
  }'
```

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

# AI Configuration (NEW)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Install Dependencies:
```bash
npm install @google/generative-ai
```

## AI Mode Features

### ✅ **Supported Languages**
- Python
- JavaScript/TypeScript
- Java
- C++
- C#
- Any programming language

### ✅ **Algorithm Detection**
- Sorting algorithms
- BFS (Breadth-First Search)
- DFS (Depth-First Search)
- Graph algorithms
- Unknown (fallback)

### ✅ **Step Types**
- `compare` - Comparison operations
- `swap` - Element swapping
- `visit` - Node visiting
- `backtrack` - Backtracking operations

### ✅ **Safety Features**
- 30-second AI request timeout
- Maximum 200 steps limit
- JSON structure validation
- Fallback to Python execution if AI fails
- No code execution in AI mode (interpretation only)

### ✅ **Response Format**
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
    "totalSteps": number
  }
}
```

## Usage Instructions

1. **Set up Gemini API Key**: Get API key from Google AI Studio and add to `.env`
2. **Install dependency**: `npm install @google/generative-ai`
3. **Use AI mode**: Set `"useAI": true` in request body
4. **Fallback**: If AI fails, system falls back to Python execution
5. **Demo mode**: Perfect for fast demonstrations without writing Python code

## Benefits

- **Language Agnostic**: Works with any programming language
- **Fast Setup**: No need to write Python code with record_step()
- **Demo Ready**: Perfect for quick algorithm visualization
- **Safe**: No actual code execution, AI interpretation only
- **Backward Compatible**: Existing Python execution still works
