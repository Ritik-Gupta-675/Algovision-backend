# Algorithm Detection Test Cases

## Test Request Examples

### 1️⃣ Sorting Algorithm Detection
```json
POST /api/execute
{
  "code": "arr = input_data['array']\nfor i in range(len(arr)):\n    for j in range(0, len(arr)-i-1):\n        if arr[j] > arr[j+1]:\n            arr[j], arr[j+1] = arr[j+1], arr[j]\n            record_step({'compare': [arr[j], arr[j+1]], 'swap': True})",
  "inputData": {
    "array": [5, 3, 2, 8]
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "algorithmType": "sorting",
  "steps": [...],
  "stats": {...}
}
```

### 2️⃣ BFS Algorithm Detection
```json
POST /api/execute
{
  "code": "from collections import deque\ngraph = input_data['graph']\nvisited = set()\nqueue = deque([input_data['start']])\nwhile queue:\n    node = queue.popleft()\n    if node not in visited:\n        visited.add(node)\n        record_step({'queue': list(queue), 'visitedNodes': len(visited)})\n        for neighbor in graph.get(node, []):\n            if neighbor not in visited:\n                queue.append(neighbor)",
  "inputData": {
    "graph": {"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []},
    "start": "A"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "algorithmType": "bfs",
  "steps": [...],
  "stats": {...}
}
```

### 3️⃣ DFS Algorithm Detection
```json
POST /api/execute
{
  "code": "graph = input_data['graph']\nvisited = set()\nstack = [input_data['start']]\n\ndef dfs(node):\n    if node in visited:\n        return\n    visited.add(node)\n    record_step({'stack': stack, 'depth': len(visited)})\n    for neighbor in graph.get(node, []):\n        if neighbor not in visited:\n            stack.append(neighbor)\n            dfs(neighbor)\n            stack.pop()\n            record_step({'backtrack': True})\n\ndfs(input_data['start'])",
  "inputData": {
    "graph": {"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []},
    "start": "A"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "algorithmType": "dfs",
  "steps": [...],
  "stats": {...}
}
```

### 4️⃣ Recursive DFS Detection
```json
POST /api/execute
{
  "code": "graph = input_data['graph']\nvisited = set()\n\ndef dfs(node):\n    if node in visited:\n        return\n    visited.add(node)\n    record_step({'path': list(visited)})\n    for neighbor in graph.get(node, []):\n        if neighbor not in visited:\n            dfs(neighbor)\n\ndfs(input_data['start'])",
  "inputData": {
    "graph": {"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []},
    "start": "A"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "algorithmType": "dfs",
  "steps": [...],
  "stats": {...}
}
```

### 5️⃣ Graph Algorithm Detection (General)
```json
POST /api/execute
{
  "code": "adjacency = input_data['adjacency']\nnodes = len(adjacency)\nfor i in range(nodes):\n    for j in range(nodes):\n        if adjacency[i][j] == 1:\n            record_step({'edge': f'{i}-{j}'})",
  "inputData": {
    "adjacency": [[0, 1, 0], [1, 0, 1], [0, 1, 0]]
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "algorithmType": "graph",
  "steps": [...],
  "stats": {...}
}
```

### 6️⃣ Unknown Algorithm Detection
```json
POST /api/execute
{
  "code": "x = input_data['value']\ny = x * 2\nz = y + 5\nrecord_step({'result': z})",
  "inputData": {
    "value": 10
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "algorithmType": "unknown",
  "steps": [...],
  "stats": {...}
}
```

### 7️⃣ Edge Case - Empty Code
```json
POST /api/execute
{
  "code": "",
  "inputData": {}
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Code cannot be empty"
}
```

### 8️⃣ Edge Case - Mixed Indicators (Sorting takes precedence)
```json
POST /api/execute
{
  "code": "arr = input_data['array']\ngraph = input_data['graph']\nfor i in range(len(arr)):\n    for j in range(len(arr)-1):\n        if arr[j] > arr[j+1]:\n            arr[j], arr[j+1] = arr[j+1], arr[j]\n            record_step({'swap': True, 'node': graph.get(j, [])})",
  "inputData": {
    "array": [5, 3, 2, 8],
    "graph": {"0": ["1"], "1": ["2"], "2": ["3"], "3": []}
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "algorithmType": "sorting",
  "steps": [...],
  "stats": {...}
}
```

## Detection Logic Priority

The detection follows this priority order:
1. **Sorting** - swap logic, array indexing, nested loops, compare/swap record_step
2. **BFS** - deque/queue, popleft, queue/visitedNodes record_step
3. **DFS** - recursive patterns, stack usage, stack/backtrack record_step
4. **Graph** - graph terminology, adjacency structures
5. **Unknown** - no patterns detected

## Testing Commands

### Using curl:
```bash
# Test sorting detection
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "arr = [5,3,2,8]\nfor i in range(len(arr)):\n    for j in range(len(arr)-1):\n        if arr[j] > arr[j+1]:\n            arr[j], arr[j+1] = arr[j+1], arr[j]\n            record_step({\"swap\": true})",
    "inputData": {}
  }'

# Test BFS detection
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "from collections import deque\nqueue = deque([1])\nwhile queue:\n    node = queue.popleft()\n    record_step({\"queue\": list(queue)})",
    "inputData": {}
  }'

# Test DFS detection
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def dfs(node):\n    if node in visited:\n        return\n    visited.add(node)\n    record_step({\"stack\": stack})\n    for neighbor in graph[node]:\n        dfs(neighbor)",
    "inputData": {}
  }'

# Test unknown detection
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "x = 5\ny = x * 2\nrecord_step({\"result\": y})",
    "inputData": {}
  }'
```

## Detection Patterns Explained

### Sorting Patterns:
- Array swap operations: `arr[i], arr[j] = arr[j], arr[i]`
- Nested loops with array indexing
- record_step with "compare", "swap", "array", "sorted"
- Common sorting keywords: swap, bubble, selection, insertion

### BFS Patterns:
- Queue/deque imports and usage
- `popleft()` operations
- record_step with "queue", "visitedNodes", "level", "frontier"
- BFS keywords: bfs, breadth, level, visited

### DFS Patterns:
- Recursive function calls to self
- Stack operations (push/pop)
- record_step with "stack", "backtrack", "depth", "path"
- DFS keywords: dfs, depth, backtrack, recursive

### Graph Patterns:
- Graph terminology: graph, adjacency, matrix, node, edge, vertex
- Graph data structures: adjacency lists, matrices
- Graph algorithm names: dijkstra, floyd, kruskal, prim

## Performance Considerations

- Detection is O(n) where n is code length
- Uses simple regex patterns for fast matching
- No external dependencies or AI models
- Deterministic and explainable results
- Minimal overhead (< 1ms for typical code sizes)
