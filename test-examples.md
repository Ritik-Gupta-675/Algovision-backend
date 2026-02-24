# Test Scenarios for Upgraded Backend Execution System

## Test Request Examples

### 1️⃣ Normal Sorting with inputData
```json
POST /api/execute
{
  "code": "arr = input_data['array']\nfor i in range(len(arr)):\n    record_step({'array': arr.copy(), 'i': i})\n    for j in range(0, len(arr)-i-1):\n        if arr[j] > arr[j+1]:\n            arr[j], arr[j+1] = arr[j+1], arr[j]\nrecord_step({'sorted_array': arr, 'complete': True})",
  "inputData": {
    "array": [5, 3, 2, 8],
    "graph": {"nodes": 5, "edges": 4}
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "steps": [
    {"array": [5, 3, 2, 8], "i": 0},
    {"array": [5, 3, 2, 8], "i": 1},
    {"array": [5, 3, 2, 8], "i": 2},
    {"array": [5, 3, 2, 8], "i": 3},
    {"sorted_array": [2, 3, 5, 8], "complete": true}
  ],
  "stats": {...}
}
```

### 2️⃣ Infinite Loop Attempt
```json
POST /api/execute
{
  "code": "while True:\n    record_step({'loop': 'infinite'})",
  "inputData": {}
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Execution timed out"
}
```

### 3️⃣ Step Overflow Attempt
```json
POST /api/execute
{
  "code": "for i in range(6000):\n    record_step({'step': i})",
  "inputData": {}
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Step limit exceeded"
}
```

### 4️⃣ Invalid inputData Attempt
```json
POST /api/execute
{
  "code": "print(input_data)",
  "inputData": "invalid_string"
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "inputData must be an object"
}
```

### 5️⃣ Dangerous Code Attempt
```json
POST /api/execute
{
  "code": "import os\nos.system('rm -rf /')",
  "inputData": {}
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Code contains potentially dangerous operations"
}
```

### 6️⃣ Large Code Attempt
```json
POST /api/execute
{
  "code": "print('a' * 60000)",
  "inputData": {}
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Code is too long (max 51200 characters)"
}
```

### 7️⃣ Large inputData Attempt
```json
POST /api/execute
{
  "code": "print(input_data)",
  "inputData": {
    "large_data": "x".repeat(12000)
  }
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Input data is too large (max 10240 characters)"
}
```

### 8️⃣ Empty Code Attempt
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

### 9️⃣ Missing Code Attempt
```json
POST /api/execute
{
  "inputData": {"test": "data"}
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Code is required"
}
```

### 🔟 Valid JSON Injection Test
```json
POST /api/execute
{
  "code": "print(input_data['nested']['value'])\nrecord_step({'received': input_data['nested']['value']})",
  "inputData": {
    "nested": {
      "value": "test_value",
      "array": [1, 2, 3]
    },
    "simple": "data"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "steps": [
    {"received": "test_value"}
  ],
  "stats": {...}
}
```

## Testing Commands

### Using curl:
```bash
# Test normal execution
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "arr = input_data[\"array\"]\nfor i in range(len(arr)):\n    record_step({\"array\": arr.copy(), \"i\": i})",
    "inputData": {"array": [5, 3, 2, 8]}
  }'

# Test timeout
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "while True:\n    record_step({\"loop\": \"infinite\"})",
    "inputData": {}
  }'

# Test step limit
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "for i in range(6000):\n    record_step({\"step\": i})",
    "inputData": {}
  }'
```

## Key Features Tested

✅ **Structured Input Injection**: inputData safely injected as JSON string
✅ **Step Limit Protection**: MAX_STEPS = 5000 enforced
✅ **Improved Timeout Handling**: Clean "Execution timed out" error
✅ **Strict Output Validation**: JSON structure validated
✅ **Enhanced Validation**: Code size, input size, dangerous patterns
✅ **Safe Execution**: No code injection through inputData
✅ **Modular Architecture**: Clean separation of concerns
✅ **API Compatibility**: Response format unchanged
