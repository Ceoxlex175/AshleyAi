// routes/chat.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Anthropic = require('@anthropic-ai/sdk');
const {
  getSession,
  getOrCreateSession,
  appendToSession,
  deleteSession,
} = require('./sessionStore');

const router = express.Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_SYSTEM_PROMPT =
  process.env.ASHLEY_SYSTEM_PROMPT ||
  'You are Ashley, a friendly, concise, and helpful AI assistant named AshleyAi.';

const DEFAULT_MODEL = process.env.ASHLEY_MODEL || 'claude-sonnet-4-6';

// POST /api/chat
router.post('/chat', async (req, res) => {
  try {
    const {
      message,
      sessionId: incomingSessionId,
      history: explicitHistory,
      systemPrompt,
      model,
      maxTokens,
    } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'InvalidRequest',
        details: '"message" is required and must be a non-empty string.',
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: 'ServerMisconfigured',
        details: 'ANTHROPIC_API_KEY is not set on the server.',
      });
    }

    let sessionId = incomingSessionId;
    let historyMessages;

    if (sessionId) {
      // Stateful mode: load/append to stored session
      const session = getOrCreateSession(sessionId);
      historyMessages = session.history;
    } else if (Array.isArray(explicitHistory)) {
      // Stateless mode: caller manages history themselves
      sessionId = uuidv4();
      historyMessages = explicitHistory;
    } else {
      // Brand new conversation
      sessionId = uuidv4();
      getOrCreateSession(sessionId);
      historyMessages = [];
    }

    const userMessage = { role: 'user', content: message };
    const messagesForModel = [...historyMessages, userMessage];

    const response = await anthropic.messages.create({
      model: model || DEFAULT_MODEL,
      max_tokens: maxTokens || 1024,
      system: systemPrompt || DEFAULT_SYSTEM_PROMPT,
      messages: messagesForModel,
    });

    const replyText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    const assistantMessage = { role: 'assistant', content: replyText };

    // Persist to the stored session (only meaningful if using sessionId mode)
    appendToSession(sessionId, userMessage);
    appendToSession(sessionId, assistantMessage);

    const updatedSession = getSession(sessionId);

    return res.status(200).json({
      sessionId,
      reply: replyText,
      history: updatedSession ? updatedSession.history : messagesForModel.concat(assistantMessage),
      usage: {
        inputTokens: response.usage?.input_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
      },
    });
  } catch (err) {
    console.error('Error in /api/chat:', err);
    return res.status(500).json({
      error: 'AIProviderError',
      details: err.message || 'Unknown error contacting AI provider.',
    });
  }
});

// GET /api/sessions/:sessionId
router.get('/sessions/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({
      error: 'NotFound',
      details: `No session found for id ${req.params.sessionId}`,
    });
  }
  return res.status(200).json(session);
});

// DELETE /api/sessions/:sessionId
router.delete('/sessions/:sessionId', (req, res) => {
  const deleted = deleteSession(req.params.sessionId);
  if (!deleted) {
    return res.status(404).json({
      error: 'NotFound',
      details: `No session found for id ${req.params.sessionId}`,
    });
  }
  return res.status(204).send();
});

module.exports = router;
