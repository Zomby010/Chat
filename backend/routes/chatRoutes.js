const express = require('express');
const router = express.Router();
const {
  initializeChat,
  sendMessage,
  getChatHistory,
  getCrisisResources
} = require('../controllers/chatController');

// Input validation middleware
const validateChatInit = (req, res, next) => {
  const { userInfo } = req.body;
  
  // userInfo is optional, but if provided, validate it
  if (userInfo && typeof userInfo !== 'object') {
    return res.status(400).json({
      error: 'Invalid userInfo format',
      message: 'userInfo must be an object'
    });
  }
  
  next();
};

const validateMessage = (req, res, next) => {
  const { sessionId, message } = req.body;
  
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      error: 'Invalid or missing sessionId',
      message: 'sessionId is required and must be a string'
    });
  }
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid or missing message',
      message: 'message is required and must be a non-empty string'
    });
  }
  
  // Check message length (prevent extremely long messages)
  if (message.length > 1000) {
    return res.status(400).json({
      error: 'Message too long',
      message: 'Please keep your message under 1000 characters'
    });
  }
  
  next();
};

const validateSessionId = (req, res, next) => {
  const { sessionId } = req.params;
  
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      error: 'Invalid sessionId',
      message: 'sessionId parameter is required'
    });
  }
  
  next();
};

// Rate limiting middleware (basic implementation)
const createRateLimiter = () => {
  const requests = new Map();
  const WINDOW_MS = 60000; // 1 minute
  const MAX_REQUESTS = 30; // 30 requests per minute per IP
  
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(clientIP)) {
      requests.set(clientIP, []);
    }
    
    const clientRequests = requests.get(clientIP);
    
    // Remove old requests outside the window
    const recentRequests = clientRequests.filter(
      timestamp => now - timestamp < WINDOW_MS
    );
    
    if (recentRequests.length >= MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please wait a moment before sending another message',
        retryAfter: Math.ceil(WINDOW_MS / 1000)
      });
    }
    
    recentRequests.push(now);
    requests.set(clientIP, recentRequests);
    
    next();
  };
};

const rateLimiter = createRateLimiter();

// Chat Routes - IMPORTANT: Order matters! Specific routes before parameterized ones

/**
 * POST /api/chat/init
 * Initialize a new chat session
 * Body: { userInfo?: { name?, mood?, supportType? } }
 */
router.post('/init', rateLimiter, validateChatInit, initializeChat);

/**
 * POST /api/chat/message
 * Send a message in an existing chat session
 * Body: { sessionId: string, message: string }
 */
router.post('/message', rateLimiter, validateMessage, sendMessage);

/**
 * GET /api/chat/crisis/resources
 * Get crisis support resources
 * IMPORTANT: This must come BEFORE /:sessionId route
 */
router.get('/crisis/resources', getCrisisResources);

/**
 * GET /api/chat/health
 * Health check for chat service
 * IMPORTANT: This must come BEFORE /:sessionId route
 */
router.get('/health', (req, res) => {
  const { chatSessions } = require('../controllers/chatController');
  
  res.json({
    status: 'healthy',
    service: 'chat',
    timestamp: new Date().toISOString(),
    activeSessions: chatSessions.size,
    openaiConfigured: !!process.env.OPENAI_API_KEY
  });
});

/**
 * GET /api/chat/:sessionId
 * Get chat history for a session
 * Params: { sessionId: string }
 * IMPORTANT: This parameterized route must come AFTER specific routes
 */
router.get('/:sessionId', validateSessionId, getChatHistory);

// Error handling middleware for chat routes
router.use((error, req, res, next) => {
  console.error('Chat route error:', error);
  
  // OpenAI specific errors
  if (error.code === 'insufficient_quota') {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Our AI service is currently at capacity. Please try again in a few minutes.',
      type: 'quota_exceeded'
    });
  }
  
  if (error.code === 'rate_limit_exceeded') {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Please wait a moment before sending another message.',
      type: 'rate_limit'
    });
  }
  
  if (error.code === 'invalid_api_key') {
    return res.status(503).json({
      error: 'Service configuration error',
      message: 'There\'s a temporary issue with our service. Please try again later.',
      type: 'configuration_error'
    });
  }
  
  // Generic error response
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong. Please try again.',
    type: 'internal_error'
  });
});

module.exports = router;