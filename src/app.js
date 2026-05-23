const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const executeRoutes = require('./routes/executeRoutes');
const chatRoutes = require('./routes/chatRoutes');
const leetcodeRoutes = require('./routes/leetcodeRoutes');
const aiRoutes = require('./routes/aiRoutes');
const codeVisualizerRoutes = require('./routes/codeVisualizerRoutes');

const app = express();

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:8080', 'http://localhost:8081'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/execute', executeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leetcode', leetcodeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/codevisualizer', codeVisualizerRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'AlgoVision Backend API',
    version: '1.0.0',
    endpoints: {
      execute: 'POST /api/execute - Execute Python code',
      chat: 'POST /api/chat - AI assistant chat',
      leetcode: {
        connect: 'POST /api/leetcode/connect',
        profile: 'GET /api/leetcode/profile/:username',
        stats: 'GET /api/leetcode/stats/:username',
        problem: 'POST /api/leetcode/problem',
      },
      ai: {
        hint: 'POST /api/ai/hint',
        approach: 'POST /api/ai/approach',
        solution: 'POST /api/ai/solution',
        recommendations: 'POST /api/ai/recommendations',
      },
      health: 'GET /health - Health check',
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Temporary debug route for environment testing
app.get('/env-test', (req, res) => {
  res.json({ 
    keyExists: !!process.env.GEMINI_API_KEY,
    keyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
