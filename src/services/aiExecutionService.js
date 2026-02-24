/**
 * AI Execution Service
 * Uses Gemini AI to generate algorithm visualization steps
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIExecutionService {
  constructor() {
    // Add debug logging temporarily
    console.log('Gemini Key Loaded:', process.env.GEMINI_API_KEY ? '***' + process.env.GEMINI_API_KEY.slice(-4) : 'undefined');
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      console.warn('GEMINI_API_KEY not found or empty in environment variables');
    }
    
    this.genAI = process.env.GEMINI_API_KEY 
      ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      : null;
    
    this.model = this.genAI ? this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) : null;
    this.maxSteps = 150;
  }

  async generateAlgorithmSteps(code) {
    if (!this.model) {
      return {
        success: false,
        error: 'Gemini API key missing in environment variables. Please set GEMINI_API_KEY in .env file.'
      };
    }

    try {
      const prompt = this.buildPrompt(code);
      const response = await this.model.generateContent(prompt);
      const text = response.response.text();
      const parsed = this.parseAndValidateResponse(text);
      
      return {
        success: true,
        algorithmType: parsed.algorithmType,
        graphStructure: parsed.graphStructure,
        steps: parsed.steps
      };
    } catch (error) {
      console.error('AI execution error:', error.message);
      
      // Handle quota exceeded specifically
      if (error.status === 429) {
        return {
          success: false,
          error: 'AI service quota exceeded. Please try again later or check your billing details.'
        };
      }
      
      return {
        success: false,
        error: 'AI service temporarily unavailable'
      };
    }
  }

  buildPrompt(code) {
    return `You are an algorithm interpreter.

Analyze the following algorithm written in any programming language.

Your job:

Identify algorithm type (sorting, bfs, dfs, graph, unknown).

Simulate algorithm step-by-step logically.

Additionally, extract graph structure from the code.
Return graphStructure with:
- nodes array
- edges array (pairs of connected nodes)
Only include this for graph-based algorithms.

Return ONLY valid JSON.

Do not include markdown.

Do not include explanation text.

Limit maximum steps to 150.

Each step must follow this exact structure:

{
"type": "compare | swap | visit | backtrack",
"state": {
"array": [],
"visitedNodes": [],
"activeNode": null
},
"meta": {
"i": null,
"j": null
}
}

Final JSON must be:

{
"algorithmType": "",
"graphStructure": null OR { "nodes":[], "edges":[] },
"steps": []
}

For sorting algorithms, graphStructure must be null.
For graph-based algorithms (bfs, dfs, graph), extract the actual graph structure from the code.

Now analyze this code:

${code}
--------------------`;
  }


  parseAndValidateResponse(aiResponse) {
    try {
      // Clean the response - remove any markdown formatting
      let cleanResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      const parsed = JSON.parse(cleanResponse);

      // Validate structure
      if (!parsed.algorithmType || typeof parsed.algorithmType !== 'string') {
        throw new Error('Missing or invalid algorithmType in AI response');
      }

      if (!Array.isArray(parsed.steps)) {
        throw new Error('Steps must be an array in AI response');
      }

      // Validate graphStructure for graph-based algorithms
      const graphAlgorithms = ['bfs', 'dfs', 'graph'];
      if (graphAlgorithms.includes(parsed.algorithmType)) {
        if (!parsed.graphStructure) {
          throw new Error('Graph algorithms must include graphStructure in AI response');
        }
        
        if (!parsed.graphStructure.nodes || !Array.isArray(parsed.graphStructure.nodes)) {
          throw new Error('graphStructure.nodes must be an array in AI response');
        }
        
        if (!parsed.graphStructure.edges || !Array.isArray(parsed.graphStructure.edges)) {
          throw new Error('graphStructure.edges must be an array in AI response');
        }
      } else {
        // For non-graph algorithms, graphStructure should be null
        if (parsed.graphStructure !== null && parsed.graphStructure !== undefined) {
          // Not a critical error, but log warning
          console.warn('Non-graph algorithm returned graphStructure, ignoring it');
        }
      }

      if (parsed.steps.length > this.maxSteps) {
        throw new Error(`AI returned too many steps (${parsed.steps.length} > ${this.maxSteps})`);
      }

      // Validate each step
      parsed.steps.forEach((step, index) => {
        if (!step.type || typeof step.type !== 'string') {
          throw new Error(`Step ${index} missing or invalid type`);
        }
        
        if (!step.state || typeof step.state !== 'object') {
          throw new Error(`Step ${index} missing or invalid state`);
        }
        
        // Validate state structure
        if (!step.state.hasOwnProperty('array') || !Array.isArray(step.state.array)) {
          throw new Error(`Step ${index} missing or invalid state.array`);
        }
        
        if (!step.state.hasOwnProperty('visitedNodes') || !Array.isArray(step.state.visitedNodes)) {
          throw new Error(`Step ${index} missing or invalid state.visitedNodes`);
        }
        
        if (!step.state.hasOwnProperty('activeNode') || step.state.activeNode === null || typeof step.state.activeNode !== 'number') {
          // activeNode can be null or number
          if (step.state.activeNode !== null) {
            throw new Error(`Step ${index} invalid state.activeNode`);
          }
        }
        
        // meta is optional but if present, must be object
        if (step.meta && typeof step.meta !== 'object') {
          throw new Error(`Step ${index} invalid meta`);
        }
        
        // Validate meta structure if present
        if (step.meta) {
          if (step.meta.i !== null && typeof step.meta.i !== 'number') {
            throw new Error(`Step ${index} invalid meta.i`);
          }
          if (step.meta.j !== null && typeof step.meta.j !== 'number') {
            throw new Error(`Step ${index} invalid meta.j`);
          }
        }
      });

      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('AI response is not valid JSON');
      }
      throw error;
    }
  }

  isConfigured() {
    return this.model !== null;
  }
}

module.exports = new AIExecutionService();
