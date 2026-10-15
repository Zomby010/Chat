'use strict';

const AppError = require('../utils/AppError');
const { assessRisk, maxLevel, buildCrisisMessage, getResources } = require('./crisis.service');
const { buildSystemPrompt } = require('./ai/prompt');
const { guardOutput } = require('./ai/outputGuard');
const { AIProviderError } = require('./ai/errors');
const { compact } = require('../utils/dates');

const HISTORY_LIMIT = 20; // messages of context sent to the AI
const DEFAULT_TITLE = 'New conversation';

/**
 * Chat flow for one message:
 *   1. Deterministic crisis assessment of the user's text.
 *   2. Imminent risk: fixed crisis response, no AI call.
 *   3. Otherwise: AI reply with safety-aware system prompt, then output guard.
 *   4. If the AI fails on a risky message, fall back to the crisis response so
 *      the person is never left without help. If it fails on an ordinary
 *      message, nothing is saved and the client can retry.
 */
function createChatService({ repo, ai, profileService, moodService, defaultRegion, logger }) {
  const sessions = ['chatSessions'];
  const messagesPath = (sid) => ['chatSessions', sid, 'messages'];

  async function requireSession(uid, sid) {
    const s = await repo.get(uid, sessions, sid);
    if (!s) throw AppError.notFound('That conversation no longer exists.');
    return s;
  }

  async function buildContext(user, profile, level) {
    const prefs = profile.preferences;
    const ctx = { level };
    if (prefs.shareNameWithAI && profile.displayName) ctx.displayName = profile.displayName.split(' ')[0];
    if (prefs.shareMoodWithAI) {
      const latest = await moodService.latest(user.uid);
      if (latest) {
        const days = Math.floor((Date.now() - new Date(latest.createdAt).getTime()) / 86400000);
        if (days <= 7) ctx.recentMood = { label: latest.label, daysAgo: days };
      }
    }
    const region = getResources(profile.region || defaultRegion);
    if (region.code !== 'INTL') ctx.regionName = region.name;
    return ctx;
  }

  return {
    async createSession(uid, { title } = {}) {
      const now = new Date().toISOString();
      return repo.create(uid, sessions, {
        title: title || DEFAULT_TITLE,
        createdAt: now,
        updatedAt: now,
        messageCount: 0,
        highestSafetyLevel: 'none',
      });
    },

    async listSessions(uid) {
      return repo.list(uid, sessions, { orderBy: 'updatedAt', limit: 50 });
    },

    async getSession(uid, sid) {
      const session = await requireSession(uid, sid);
      const messages = await repo.list(uid, messagesPath(sid), { direction: 'asc', limit: 500 });
      return { session, messages };
    },

    async deleteSession(uid, sid) {
      await requireSession(uid, sid);
      await repo.remove(uid, sessions, sid);
    },

    async deleteAll(uid) {
      const all = await repo.list(uid, sessions, { orderBy: 'updatedAt', limit: 1000 });
      await Promise.all(all.map((s) => repo.remove(uid, sessions, s.id)));
      return all.length;
    },

    async sendMessage(user, sid, text) {
      const uid = user.uid;
      const session = await requireSession(uid, sid);
      const profile = await profileService.getOrCreate(user);
      const regionCode = profile.region || defaultRegion;
      const risk = assessRisk(text);

      let reply;
      let source;
      let aiError = null;

      if (risk.level === 'imminent') {
        reply = buildCrisisMessage('imminent', regionCode);
        source = 'safety';
      } else {
        const history = await repo.list(uid, messagesPath(sid), { limit: HISTORY_LIMIT });
        const messages = history
          .reverse()
          .map((m) => ({ role: m.role, content: m.content }))
          .concat({ role: 'user', content: text });
        try {
          const ctx = await buildContext(user, profile, risk.level);
          const result = await ai.generate({ system: buildSystemPrompt(ctx), messages });
          const guarded = guardOutput(result.text);
          if (guarded.violations.length) logger.warn('ai_output_guarded', { violations: guarded.violations });
          reply = guarded.text;
          source = guarded.violations.length ? 'guarded' : 'ai';
        } catch (err) {
          if (!(err instanceof AIProviderError) || risk.level === 'none') throw err;
          aiError = { code: err.code, message: err.message };
          reply = risk.level === 'high' ? buildCrisisMessage('high', regionCode) : buildConcernFallback();
          source = 'safety-fallback';
        }
      }

      const now = Date.now();
      const userMessage = await repo.create(uid, messagesPath(sid), {
        role: 'user',
        content: text,
        createdAt: new Date(now).toISOString(),
        safety: { level: risk.level, categories: risk.categories },
      });
      const assistantMessage = await repo.create(uid, messagesPath(sid), compact({
        role: 'assistant',
        content: reply,
        createdAt: new Date(now + 1).toISOString(),
        source,
        model: source === 'ai' || source === 'guarded' ? ai.model : undefined,
      }));

      const isFirst = session.messageCount === 0 && session.title === DEFAULT_TITLE;
      await repo.update(uid, sessions, sid, {
        updatedAt: assistantMessage.createdAt,
        messageCount: (session.messageCount || 0) + 2,
        highestSafetyLevel: maxLevel(session.highestSafetyLevel || 'none', risk.level),
        ...(isFirst && { title: makeTitle(text, risk.level) }),
      });

      const showResources = risk.level !== 'none';
      return {
        userMessage,
        assistantMessage,
        safety: {
          level: risk.level,
          showResources,
          ...(showResources && { resources: getResources(regionCode) }),
        },
        ...(aiError && { aiError }),
      };
    },
  };
}

function buildConcernFallback() {
  return "I'm having trouble connecting to my AI right now, but I don't want to leave you without a reply. It sounds like things feel really hard. If you're not safe, please use the support contacts below. Otherwise, a few slow breaths or the grounding exercise might help while I reconnect, and you can try sending your message again.";
}

function makeTitle(text, level) {
  if (level === 'high' || level === 'imminent') return 'Support conversation';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 42 ? `${clean.slice(0, 40).trimEnd()}…` : clean;
}

module.exports = { createChatService, DEFAULT_TITLE };
