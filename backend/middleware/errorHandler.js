// Global error handling middleware

const errorHandler = (err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // OpenAI API specific errors
  if (err.type === 'openai_error') {
    switch (err.code) {
      case 'insufficient_quota':
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Our AI service is currently at capacity. Please try again in a few minutes.',
          code: 'QUOTA_EXCEEDED',
          retryAfter: 300 // 5 minutes
        });

      case 'rate_limit_exceeded':
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Please wait a moment before sending another message.',
          code: 'RATE_LIMITED',
          retryAfter: 60 // 1 minute
        });

      case 'invalid_api_key':
        return res.status(503).json({
          error: 'Service configuration error',
          message: 'There\'s a temporary issue with our service. Please try again later.',
          code: 'CONFIG_ERROR'
        });

      case 'model_overloaded':
        return res.status(503).json({
          error: 'Service overloaded',
          message: 'Our AI service is experiencing high demand. Please try again in a moment.',
          code: 'SERVICE_OVERLOADED',
          retryAfter: 120 // 2 minutes
        });

      case 'context_length_exceeded':
        return res.status(400).json({
          error: 'Conversation too long',
          message: 'This conversation has become too long. Please start a new session.',
          code: 'CONTEXT_TOO_LONG'
        });

      default:
        return res.status(502).json({
          error: 'AI service error',
          message: 'There was an issue with our AI service. Please try again.',
          code: 'AI_SERVICE_ERROR'
        });
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Database/Storage errors
  if (err.name === 'DatabaseError') {
    return res.status(500).json({
      error: 'Storage error',
      message: 'There was an issue saving your data. Please try again.',
      code: 'STORAGE_ERROR'
    });
  }

  // Network/timeout errors
  if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      error: 'Network error',
      message: 'Unable to connect to external services. Please try again.',
      code: 'NETWORK_ERROR'
    });
  }

  // Session errors
  if (err.name === 'SessionNotFoundError') {
    return res.status(404).json({
      error: 'Session not found',
      message: 'Your chat session has expired. Please start a new conversation.',
      code: 'SESSION_EXPIRED'
    });
  }

  // Authentication errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }

  // Request size errors
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request too large',
      message: 'Your message is too long. Please try a shorter message.',
      code: 'MESSAGE_TOO_LARGE'
    });
  }

  // JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'The request contains invalid JSON data.',
      code: 'INVALID_JSON'
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal server error' : 'Request error',
    message: isDevelopment ? err.message : 'Something went wrong. Please try again.',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack })
  });
};

// 404 handler for unmatched routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested endpoint ${req.method} ${req.path} was not found.`,
    code: 'ROUTE_NOT_FOUND'
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};