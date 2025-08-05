const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import middleware and routes
const chatRoutes = require('./routes/chatRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { cleanupSessions } = require('./controllers/chatController');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] // Replace with your actual frontend domain
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ 
  limit: '10mb', // Limit request size
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging middleware (optional)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/chat', chatRoutes);

// Legacy routes (maintain backward compatibility with your existing frontend)
app.post('/api/chat/init', (req, res) => {
  res.redirect(307, '/api/chat/init'); // Temporary redirect to new route
});

app.post('/api/chat/message', (req, res) => {
  res.redirect(307, '/api/chat/message'); // Temporary redirect to new route
});

app.get('/api/chat/:sessionId', (req, res) => {
  res.redirect(307, `/api/chat/${req.params.sessionId}`);
});

app.get('/api/crisis-resources', (req, res) => {
  res.redirect(307, '/api/chat/crisis/resources');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      database: 'in-memory', // Update if you add a real database
    },
    memory: process.memoryUsage(),
    pid: process.pid
  };

  res.json(healthStatus);
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  const apiDocs = {
    title: 'Mental Health Support Chatbot API',
    version: '1.0.0',
    description: 'API for mental health support chatbot with OpenAI integration',
    endpoints: {
      'POST /api/chat/init': {
        description: 'Initialize a new chat session',
        body: {
          userInfo: {
            name: 'string (optional)',
            mood: 'string (optional)',
            supportType: 'string (optional: general|crisis)'
          }
        },
        response: {
          sessionId: 'string',
          messages: 'array',
          requiresCrisisPanel: 'boolean',
          quickReplies: 'array'
        }
      },
      'POST /api/chat/message': {
        description: 'Send a message in existing session',
        body: {
          sessionId: 'string (required)',
          message: 'string (required, max 1000 chars)'
        },
        response: {
          messages: 'array (user message + bot response)',
          requiresCrisisPanel: 'boolean',
          quickReplies: 'array'
        }
      },
      'GET /api/chat/:sessionId': {
        description: 'Get chat history for session',
        params: {
          sessionId: 'string (required)'
        },
        response: {
          session: 'object (complete session data)'
        }
      },
      'GET /api/chat/crisis/resources': {
        description: 'Get crisis support resources',
        response: {
          resources: 'array of crisis resources'
        }
      }
    },
    rateLimits: {
      general: '30 requests per minute per IP',
      message: 'Included in general rate limit'
    },
    errors: {
      400: 'Bad Request - Invalid input data',
      404: 'Not Found - Session not found',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server issues',
      503: 'Service Unavailable - OpenAI service issues'
    }
  };

  res.json(apiDocs);
});

// Handle 404 for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  const server = app.listen(PORT, () => {
    console.log(`✅ Mental Health Support Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 OpenAI Integration: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing API Key'}`);
    
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables');
      console.warn('   The chatbot will use fallback responses only');
    }
  });

  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.log('❌ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start session cleanup interval
const cleanupInterval = setInterval(() => {
  cleanupSessions();
}, process.env.SESSION_CLEANUP_INTERVAL || 3600000); // 1 hour default

// Clear interval on shutdown
process.on('exit', () => {
  clearInterval(cleanupInterval);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Mental Health Support Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 OpenAI Integration: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing API Key'}`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables');
    console.warn('   Add your OpenAI API key to the .env file to enable AI responses');
    console.warn('   Example: OPENAI_API_KEY=sk-your-api-key-here');
  }
});

module.exports = app;