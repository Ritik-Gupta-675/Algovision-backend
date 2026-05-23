const chatService = require('../services/chatService');

const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!chatService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'AI chat is not configured. Please set GEMINI_API_KEY on the server.',
      });
    }

    const result = await chatService.chat(history, message);

    if (!result.success) {
      let status = 500;
      if (result.error?.includes('quota')) status = 429;
      else if (result.error?.includes('busy')) status = 503;
      else if (result.error?.includes('not configured')) status = 503;
      return res.status(status).json({ success: false, error: result.error });
    }

    res.json({ success: true, reply: result.reply });
  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({ success: false, error: 'Failed to process chat message' });
  }
};

module.exports = { chat };
