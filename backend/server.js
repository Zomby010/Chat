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

// CORS Configuration - Fixed
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : false)
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

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
  res.setHeader('X-Powered-By', 'Mental Health Support API');
  next();
});

// Request logging middleware (enhanced for debugging)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
      headers: req.headers,
      body: req.method === 'POST' ? req.body : undefined,
      query: req.query
    });
    next();
  });
}

// API Routes - Primary routes
app.use('/api/chat', chatRoutes);

// Health check endpoint - Enhanced
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0', // Hardcoded since package.json might not exist
    services: {
      gemini: !!process.env.GEMINI_API_KEY,
      database: 'in-memory',
      cors: 'enabled'
    },
    memory: process.memoryUsage(),
    pid: process.pid,
    activeSessions: require('./controllers/chatController').chatSessions.size
  };

  res.json(healthStatus);
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working correctly',
    origin: req.get('Origin'),
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint - Enhanced
app.get('/api/docs', (req, res) => {
  const apiDocs = {
    title: 'Mental Health Support Chatbot API',
    version: '1.0.0',
    description: 'API for mental health support chatbot with Gemini AI integration',
    baseUrl: `${req.protocol}://${req.get('host')}`,
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
        },
        example: {
          request: {
            userInfo: {
              mood: 'anxious',
              supportType: 'general'
            }
          },
          response: {
            sessionId: 'uuid-string',
            messages: [{
              id: 'msg-id',
              text: 'Hello! How can I help you today?',
              sender: 'bot',
              timestamp: '2025-01-01T00:00:00.000Z'
            }],
            requiresCrisisPanel: false,
            quickReplies: ['I need help', 'Tell me more']
          }
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
        },
        example: {
          request: {
            sessionId: 'uuid-string',
            message: 'I am feeling anxious'
          },
          response: {
            messages: [
              {
                id: 'user-msg-id',
                text: 'I am feeling anxious',
                sender: 'user',
                timestamp: '2025-01-01T00:00:00.000Z'
              },
              {
                id: 'bot-msg-id',
                text: 'I understand you\'re feeling anxious. Can you tell me more about what\'s causing this feeling?',
                sender: 'bot',
                timestamp: '2025-01-01T00:00:00.000Z'
              }
            ],
            requiresCrisisPanel: false,
            quickReplies: ['Work stress', 'Relationships', 'Health concerns']
          }
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
      },
      'GET /api/health': {
        description: 'API health check',
        response: {
          status: 'string',
          services: 'object',
          uptime: 'number'
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
      502: 'Bad Gateway - Gemini service issues',
      503: 'Service Unavailable - Gemini service issues'
    },
    cors: {
      enabled: true,
      origins: process.env.NODE_ENV === 'production' 
        ? (process.env.FRONTEND_URL || 'Not configured')
        : 'All origins (development mode)'
    },
    aiProvider: 'Google Gemini API'
  };

  res.json(apiDocs);
});

// Handle 404 for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    clearInterval(cleanupInterval);
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
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start session cleanup interval
const cleanupInterval = setInterval(() => {
  cleanupSessions();
}, process.env.SESSION_CLEANUP_INTERVAL || 3600000); // 1 hour default

// Start server
const server = app.listen(PORT, () => {
  console.log('\n🚀 ==========================================');
  console.log(`✅ Mental Health Support Server RUNNING`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 CORS Test: http://localhost:${PORT}/api/cors-test`);
  console.log(`🤖 Gemini AI Integration: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing API Key'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS Origins: ${process.env.NODE_ENV === 'production' ? (process.env.FRONTEND_URL || 'Not configured') : 'All (development)'}`);
  console.log('==========================================\n');
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY not found in environment variables');
    console.warn('   Add your Gemini API key to the .env file to enable AI responses');
    console.warn('   Example: GEMINI_API_KEY=your-gemini-api-key-here\n');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    console.warn('⚠️  WARNING: FRONTEND_URL not set for production');
    console.warn('   Set FRONTEND_URL environment variable to restrict CORS origins\n');
  }
});

module.exports = app;