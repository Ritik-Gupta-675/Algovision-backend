/**
 * Chat Service — Gemini-powered assistant for AlgoVision
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_INSTRUCTION = `You are AlgoVision Assistant, a friendly AI helper on the AlgoVision website — an interactive algorithm visualization platform.

Help users with:
- Understanding algorithms (sorting, BFS, DFS, graphs, etc.)
- How to use AlgoVision (dashboard, code editor, timeline controls, visualizers)
- Writing or debugging algorithm code for visualization
- Time/space complexity and step-by-step logic

Keep answers clear and concise. Use short paragraphs or bullet lists when helpful.
If asked about unrelated topics, politely redirect to algorithms or AlgoVision.
Never reveal API keys, internal env vars, or backend implementation secrets.`;

// Lite model first — less likely to hit "high demand" 503 on free tier
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-flash',
];

const RETRIES_PER_MODEL = 2;

class ChatService {
  constructor() {
    this._genAI = null;
  }

  getGenAI() {
    if (!process.env.GEMINI_API_KEY?.trim()) return null;
    if (!this._genAI) {
      this._genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    }
    return this._genAI;
  }

  getModelChain() {
    const override = process.env.GEMINI_CHAT_MODEL?.trim();
    if (override) return [override, ...MODEL_FALLBACK_CHAIN.filter((m) => m !== override)];
    return MODEL_FALLBACK_CHAIN;
  }

  isConfigured() {
    return this.getGenAI() !== null;
  }

  sanitizeHistory(messages) {
    const formatted = [];
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      const text = (m.content || '').trim();
      if (!text) continue;

      if (formatted.length === 0 && role !== 'user') continue;
      if (formatted.length > 0 && formatted[formatted.length - 1].role === role) {
        formatted.pop();
      }
      formatted.push({ role, parts: [{ text }] });
    }
    return formatted;
  }

  isRetryableError(error) {
    const status = error.status ?? error.statusCode;
    const msg = (error.message || '').toLowerCase();
    return (
      status === 429 ||
      status === 503 ||
      msg.includes('high demand') ||
      msg.includes('overloaded') ||
      msg.includes('unavailable') ||
      msg.includes('resource exhausted')
    );
  }

  mapError(error) {
    const status = error.status ?? error.statusCode;
    const msg = error.message || '';

    if (status === 429 || msg.toLowerCase().includes('quota')) {
      return 'AI quota exceeded. Please try again in a minute or check your Gemini API key limits.';
    }
    if (status === 503 || msg.toLowerCase().includes('high demand')) {
      return 'All Gemini models are busy. Please wait 10–20 seconds and try again.';
    }
    if (msg.includes("First content should be with role 'user'")) {
      return 'Invalid chat history. Refresh the page and try again.';
    }
    if (process.env.NODE_ENV === 'development') {
      return `AI chat failed: ${msg}`;
    }
    return 'AI chat is temporarily unavailable. Please try again.';
  }

  buildContents(history, userMessage) {
    return [
      ...history,
      { role: 'user', parts: [{ text: userMessage.trim() }] },
    ];
  }

  async generateWithModel(genAI, modelName, contents) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
    const result = await model.generateContent({ contents });
    return result.response.text().trim();
  }

  async chat(messages, userMessage) {
    const genAI = this.getGenAI();
    if (!genAI) {
      return {
        success: false,
        error: 'AI chat is not configured. Please set GEMINI_API_KEY on the server.',
      };
    }

    const history = this.sanitizeHistory(messages);
    const contents = this.buildContents(history, userMessage);
    const models = this.getModelChain();
    let lastError;

    for (const modelName of models) {
      for (let attempt = 0; attempt < RETRIES_PER_MODEL; attempt++) {
        try {
          const reply = await this.generateWithModel(genAI, modelName, contents);
          if (attempt > 0 || modelName !== models[0]) {
            console.log(`Chat succeeded with model: ${modelName}`);
          }
          return { success: true, reply };
        } catch (error) {
          lastError = error;
          console.warn(
            `Chat attempt failed [${modelName}] attempt ${attempt + 1}:`,
            error.status || '',
            (error.message || '').slice(0, 120)
          );

          if (!this.isRetryableError(error)) break;

          if (attempt < RETRIES_PER_MODEL - 1) {
            await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
          }
        }
      }
    }

    console.error('Chat failed on all models:', lastError?.status || '', lastError?.message);
    return { success: false, error: this.mapError(lastError) };
  }
}

module.exports = new ChatService();
