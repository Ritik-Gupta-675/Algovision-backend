/**
 * Algorithm Detection Service
 * Uses heuristic analysis to detect algorithm types from Python code
 */

class AlgorithmDetectionService {
  detectAlgorithmType(code) {
    if (!code || typeof code !== 'string') {
      return 'unknown';
    }

    const lowerCode = code.toLowerCase();
    
    // Check for sorting algorithms
    if (this.isSortingAlgorithm(lowerCode)) {
      return 'sorting';
    }
    
    // Check for BFS algorithms
    if (this.isBFSAlgorithm(lowerCode)) {
      return 'bfs';
    }
    
    // Check for DFS algorithms
    if (this.isDFSAlgorithm(lowerCode)) {
      return 'dfs';
    }
    
    // Check for graph algorithms (general)
    if (this.isGraphAlgorithm(lowerCode)) {
      return 'graph';
    }
    
    return 'unknown';
  }

  isSortingAlgorithm(code) {
    const sortingIndicators = [
      // Swap logic
      /arr\[i\], arr\[j\]/,
      /arr\[j\], arr\[i\]/,
      /arr\[i\], arr\[i\+1\]/,
      /arr\[i\+1\], arr\[i\]/,
      
      // Array indexing patterns
      /arr\[i\]/,
      /arr\[j\]/,
      
      // Nested loops (common in sorting)
      /for\s+.*\s+in\s+range.*\s*:\s*\n\s*for\s+/,
      
      // Comparison operations
      /if\s+.*[<>]=?\s+.*:/,
      
      // Common sorting variable names
      /swap/,
      /bubble/,
      /selection/,
      /insertion/,
      /quick/,
      /merge/,
      
      // record_step patterns for sorting
      /record_step.*["']compare["']/,
      /record_step.*["']swap["']/,
      /record_step.*["']array["']/,
      /record_step.*["']sorted["']/
    ];

    return sortingIndicators.some(pattern => pattern.test(code));
  }

  isBFSAlgorithm(code) {
    const bfsIndicators = [
      // Queue/deque usage
      /deque/,
      /queue/,
      /collections\.deque/,
      /from\s+collections\s+import\s+deque/,
      
      // Queue operations
      /popleft/,
      /append\(/,
      /\.pop\(0\)/,
      
      // BFS specific patterns
      /visited/,
      /bfs/,
      /breadth/,
      /level/,
      
      // record_step patterns for BFS
      /record_step.*["']queue["']/,
      /record_step.*["']visitednodes["']/,
      /record_step.*["']level["']/,
      /record_step.*["']frontier["']/
    ];

    return bfsIndicators.some(pattern => pattern.test(code));
  }

  isDFSAlgorithm(code) {
    const dfsIndicators = [
      // Recursive patterns
      /def\s+\w+\s*\([^)]*\)\s*:.*\n\s*def\s+\1\s*\(/,
      /def\s+\w+\s*\([^)]*\)\s*:.*\n.*\1\s*\(/,
      
      // Stack usage
      /stack/,
      /\.push\(/,
      /\.pop\(\s*\)/,
      /append\(/,
      
      // DFS specific patterns
      /dfs/,
      /depth/,
      /backtrack/,
      /recursive/,
      
      // Common DFS patterns
      /visited/,
      /explore/,
      /traverse/,
      
      // record_step patterns for DFS
      /record_step.*["']stack["']/,
      /record_step.*["']backtrack["']/,
      /record_step.*["']depth["']/,
      /record_step.*["']path["']/
    ];

    return dfsIndicators.some(pattern => pattern.test(code));
  }

  isGraphAlgorithm(code) {
    const graphIndicators = [
      // Graph data structures
      /graph/,
      /adjacency/,
      /matrix/,
      /node/,
      /edge/,
      /vertex/,
      /vertices/,
      
      // Graph traversal patterns
      /neighbors/,
      /adjacent/,
      /connected/,
      
      // Graph representations
      /\{\s*\d+:\s*\[/,  // adjacency list
      /\[\s*\[.*\],\s*\[.*\]/,  // adjacency matrix
      
      // Common graph algorithms
      /dijkstra/,
      /floyd/,
      /warshall/,
      /kruskal/,
      /prim/,
      /topological/
    ];

    return graphIndicators.some(pattern => pattern.test(code));
  }
}

module.exports = new AlgorithmDetectionService();
