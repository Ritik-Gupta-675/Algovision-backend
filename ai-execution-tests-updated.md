# AI Execution Test Cases - Updated

## Test Request Examples

### 1️⃣ C++ Bubble Sort Test
```json
POST /api/execute
{
  "code": "void bubbleSort(int arr[], int n) {\n    for (int i = 0; i < n-1; i++) {\n        for (int j = 0; j < n-i-1; j++) {\n            if (arr[j] > arr[j+1]) {\n                swap(arr[j], arr[j+1]);\n            }\n        }\n    }\n}"
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
        "visitedNodes": [],
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
        "visitedNodes": [],
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

### 2️⃣ Java BFS Test
```json
POST /api/execute
{
  "code": "import java.util.*;\n\npublic class GraphBFS {\n    public void bfs(int start, Map<Integer, List<Integer>> graph) {\n        Queue<Integer> queue = new LinkedList<>();\n        Set<Integer> visited = new HashSet<>();\n        \n        queue.add(start);\n        visited.add(start);\n        \n        while (!queue.isEmpty()) {\n            int node = queue.poll();\n            for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {\n                if (!visited.contains(neighbor)) {\n                    visited.add(neighbor);\n                    queue.add(neighbor);\n                }\n            }\n        }\n    }\n}"
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
        "array": [],
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

### 3️⃣ Python DFS Test
```json
POST /api/execute
{
  "code": "def dfs(node, graph, visited):\n    if node in visited:\n        return\n    visited.add(node)\n    for neighbor in graph.get(node, []):\n        dfs(neighbor, graph, visited)\n\ndef main():\n    graph = {1: [2, 3], 2: [4], 3: [4], 4: []}\n    visited = set()\n    dfs(1, graph, visited)"
}
```

### 4️⃣ Simple For Loop Test
```json
POST /api/execute
{
  "code": "for i in range(5):\n    print(i)"
}
```

## Testing Commands

### Using curl:
```bash
# Test C++ bubble sort
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "void bubbleSort(int arr[], int n) {\n    for (int i = 0; i < n-1; i++) {\n        for (int j = 0; j < n-i-1; j++) {\n            if (arr[j] > arr[j+1]) {\n                swap(arr[j], arr[j+1]);\n            }\n        }\n    }\n}"
  }'

# Test Java BFS
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import java.util.*;\n\npublic class GraphBFS {\n    public void bfs(int start, Map<Integer, List<Integer>> graph) {\n        Queue<Integer> queue = new LinkedList<>();\n        Set<Integer> visited = new HashSet<>();\n        queue.add(start);\n        visited.add(start);\n        while (!queue.isEmpty()) {\n            int node = queue.poll();\n            for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {\n                if (!visited.contains(neighbor)) {\n                    visited.add(neighbor);\n                    queue.add(neighbor);\n                }\n            }\n        }\n    }\n}"
  }'

# Test Python DFS
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def dfs(node, graph, visited):\n    if node in visited:\n        return\n    visited.add(node)\n    for neighbor in graph.get(node, []):\n        dfs(neighbor, graph, visited)\n\ndef main():\n    graph = {1: [2, 3], 2: [4], 3: [4], 4: []}\n    visited = set()\n    dfs(1, graph, visited)"
  }'
```

## Environment Setup

### .env file structure:
```env
# AI Configuration (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Installation:
```bash
# Install AI dependency
npm install @google/generative-ai

# Start development server
npm run dev
```

## Features

### ✅ **Language Support**
- C++
- Java
- Python
- JavaScript
- Any programming language

### ✅ **Algorithm Detection**
- Sorting algorithms
- BFS (Breadth-First Search)
- DFS (Depth-First Search)
- Graph algorithms
- Unknown (fallback)

### ✅ **Safety Features**
- Maximum 150 steps limit
- Strict JSON structure validation
- No actual code execution
- AI interpretation only
