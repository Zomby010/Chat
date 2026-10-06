'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { chatLimiter } = require('../middleware/rateLimit');
const v = require('../validation/schemas');

const idParam = z.object({ id: z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/, 'Invalid id.') });

/**
 * Route table. Every route below `requireAuth` is scoped to the signed-in
 * user; there is no way to address another user's data.
 */
function createRouter({ controllers: c, requireAuth }) {
  const r = express.Router();
  // Express 5 forwards rejected promises to the error handler automatically.

  // ---- Public ----
  r.get('/crisis/regions', c.crisis.regions);
  r.get('/crisis/resources', c.crisis.resources);

  // ---- Authenticated ----
  r.use(requireAuth);

  r.post('/crisis/assess', validate(z.object({ text: z.string().max(2000) })), c.crisis.assess);

  r.get('/me', c.profile.get);
  r.patch('/me', validate(v.profileUpdate), c.profile.update);
  r.get('/me/export', c.profile.exportData);
  r.delete('/me/data', c.profile.deleteData);
  r.delete('/me', c.profile.deleteAccount);

  r.get('/dashboard', validate(v.rangeQuery, 'query'), c.dashboard.get);
  r.get('/content/daily', c.content.daily);

  r.get('/moods', validate(v.rangeQuery, 'query'), c.moods.list);
  r.post('/moods', validate(v.moodCreate), c.moods.create);
  r.delete('/moods/:id', validate(idParam, 'params'), c.moods.remove);

  r.get('/activities', validate(v.rangeQuery, 'query'), c.activities.list);
  r.post('/activities', validate(v.activityCreate), c.activities.create);
  r.delete('/activities/:id', validate(idParam, 'params'), c.activities.remove);

  r.get('/plans', validate(v.rangeQuery, 'query'), c.plans.list);
  r.post('/plans', validate(v.planCreate), c.plans.create);
  r.patch('/plans/:id', validate(idParam, 'params'), validate(v.planUpdate), c.plans.update);
  r.delete('/plans/:id', validate(idParam, 'params'), c.plans.remove);

  r.get('/chat/sessions', c.chat.listSessions);
  r.post('/chat/sessions', validate(v.chatSessionCreate), c.chat.createSession);
  r.delete('/chat/sessions', c.chat.deleteAll);
  r.get('/chat/sessions/:id', validate(idParam, 'params'), c.chat.getSession);
  r.delete('/chat/sessions/:id', validate(idParam, 'params'), c.chat.deleteSession);
  r.post('/chat/sessions/:id/messages', validate(idParam, 'params'), chatLimiter(), validate(v.chatMessage), c.chat.sendMessage);

  return r;
}

module.exports = { createRouter };
