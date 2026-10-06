'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { createRequireAuth } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimit');
const { createRequestLogger } = require('./middleware/requestLogger');
const { notFoundHandler, createErrorHandler } = require('./middleware/errorHandler');
const { createRouter } = require('./routes');
const { createControllers } = require('./controllers');
const crisis = require('./services/crisis.service');
const { createProfileService } = require('./services/profile.service');
const { createMoodService } = require('./services/mood.service');
const { createActivityService } = require('./services/activity.service');
const { createPlanService } = require('./services/plan.service');
const { createChatService } = require('./services/chat.service');
const { createInsightsService } = require('./services/insights.service');
const { createContentService } = require('./services/content.service');

/**
 * Builds the Express app from its dependencies. Nothing here reads
 * process.env or touches the network, which keeps it fully testable.
 *
 * @param {object} deps
 * @param {object} deps.config        result of loadConfig()
 * @param {object} deps.repo          data repository (firestore or memory)
 * @param {object} deps.ai            AI provider
 * @param {Function} deps.verifyToken (idToken) => decoded token
 * @param {Function} deps.deleteAuthUser (uid) => Promise
 * @param {object} deps.logger
 */
function createApp({ config, repo, ai, verifyToken, deleteAuthUser, logger, status = {} }) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin / server-to-server requests (no Origin header) and the allow-list.
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    })
  );
  app.use(express.json({ limit: '32kb' }));
  app.use(createRequestLogger(logger));

  const profile = createProfileService({ repo });
  const mood = createMoodService({ repo });
  const services = {
    profile,
    mood,
    activity: createActivityService({ repo }),
    plan: createPlanService({ repo }),
    chat: createChatService({ repo, ai, profileService: profile, moodService: mood, defaultRegion: config.defaultRegion, logger }),
    insights: createInsightsService({ repo, profileService: profile }),
    content: createContentService({ repo, profileService: profile }),
    crisis,
    deleteAuthUser,
  };

  app.get('/api/health', async (_req, res) => {
    let database = 'ok';
    try {
      await repo.ping();
    } catch {
      database = 'unreachable';
    }
    res.status(database === 'ok' ? 200 : 503).json({
      ok: database === 'ok',
      data: {
        status: database === 'ok' ? 'healthy' : 'degraded',
        dataStore: repo.kind,
        database,
        ai: { provider: ai.name, configured: ai.name !== 'none' },
        auth: status.auth || 'firebase',
        time: new Date().toISOString(),
      },
    });
  });

  app.use('/api', apiLimiter(), createRouter({ controllers: createControllers(services), requireAuth: createRequireAuth(verifyToken) }));
  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));
  return app;
}

module.exports = { createApp };
