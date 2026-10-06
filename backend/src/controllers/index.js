'use strict';

/**
 * HTTP controllers: translate requests into service calls and service
 * results into the standard response envelope { ok: true, data }.
 * No business logic lives here.
 */
const ok = (res, data, status = 200) => res.status(status).json({ ok: true, data });

function createControllers(s) {
  return {
    profile: {
      get: async (req, res) => ok(res, await s.profile.getOrCreate(req.user)),
      update: async (req, res) => ok(res, await s.profile.update(req.user, req.body)),
      exportData: async (req, res) => {
        const data = await s.profile.exportAll(req.user);
        res.setHeader('Content-Disposition', `attachment; filename="mindmate-export-${data.exportedAt.slice(0, 10)}.json"`);
        return ok(res, data);
      },
      deleteData: async (req, res) => {
        await s.profile.deleteAllData(req.user, { keepProfile: true });
        return ok(res, { deleted: true });
      },
      deleteAccount: async (req, res) => {
        await s.profile.deleteAllData(req.user);
        await s.deleteAuthUser(req.user.uid);
        return ok(res, { deleted: true });
      },
    },

    moods: {
      create: async (req, res) => ok(res, await s.mood.create(req.user.uid, req.body), 201),
      list: async (req, res) => ok(res, await s.mood.list(req.user.uid, req.validatedQuery)),
      remove: async (req, res) => {
        await s.mood.remove(req.user.uid, req.params.id);
        return ok(res, { deleted: true });
      },
    },

    activities: {
      create: async (req, res) => ok(res, await s.activity.create(req.user.uid, req.body), 201),
      list: async (req, res) => ok(res, await s.activity.list(req.user.uid, req.validatedQuery)),
      remove: async (req, res) => {
        await s.activity.remove(req.user.uid, req.params.id);
        return ok(res, { deleted: true });
      },
    },

    plans: {
      create: async (req, res) => ok(res, await s.plan.create(req.user.uid, req.body), 201),
      list: async (req, res) => ok(res, await s.plan.list(req.user.uid, req.validatedQuery)),
      update: async (req, res) => ok(res, await s.plan.update(req.user.uid, req.params.id, req.body)),
      remove: async (req, res) => {
        await s.plan.remove(req.user.uid, req.params.id);
        return ok(res, { deleted: true });
      },
    },

    chat: {
      createSession: async (req, res) => ok(res, await s.chat.createSession(req.user.uid, req.body), 201),
      listSessions: async (req, res) => ok(res, await s.chat.listSessions(req.user.uid)),
      getSession: async (req, res) => ok(res, await s.chat.getSession(req.user.uid, req.params.id)),
      deleteSession: async (req, res) => {
        await s.chat.deleteSession(req.user.uid, req.params.id);
        return ok(res, { deleted: true });
      },
      deleteAll: async (req, res) => ok(res, { deleted: await s.chat.deleteAll(req.user.uid) }),
      sendMessage: async (req, res) => ok(res, await s.chat.sendMessage(req.user, req.params.id, req.body.text), 201),
    },

    dashboard: {
      get: async (req, res) => ok(res, await s.insights.dashboard(req.user, req.validatedQuery)),
    },

    content: {
      daily: async (req, res) => {
        const q = req.query;
        const refresh = {};
        for (const k of ['quote', 'joke', 'encouragement', 'suggestion']) {
          const n = Number(q[`r_${k}`]);
          if (Number.isInteger(n) && n >= 0 && n < 1000) refresh[k] = n;
        }
        const tzOffset = Math.max(-840, Math.min(840, Number(q.tzOffset) || 0));
        return ok(res, await s.content.daily(req.user, { tzOffset, refresh }));
      },
    },

    crisis: {
      resources: async (req, res) => ok(res, s.crisis.getResources(req.query.region)),
      regions: async (_req, res) => ok(res, s.crisis.listRegions()),
      assess: async (req, res) => ok(res, s.crisis.assessRisk(req.body.text)),
    },
  };
}

module.exports = { createControllers };
