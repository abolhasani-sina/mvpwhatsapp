const sessionService = require('./session.service');
const db = require('../../config/database');

/**
 * GET /api/v1/sessions
 */
async function listSessions(req, res, next) {
  try {
    const sessions = await sessionService.listByBusiness(req.tenantId);
    res.json({ data: sessions });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/sessions/:id/takeover
 */
async function activateTakeover(req, res, next) {
  try {
    const session = await sessionService.getById(req.params.id, req.tenantId);
    if (!session) {
      return res.status(404).json({ error: { status: 404, message: 'Session not found' } });
    }

    const updated = await sessionService.takeover(session.id);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/sessions/:id/release
 */
async function releaseTakeover(req, res, next) {
  try {
    const session = await sessionService.getById(req.params.id, req.tenantId);
    if (!session) {
      return res.status(404).json({ error: { status: 404, message: 'Session not found' } });
    }

    const updated = await sessionService.release(session.id);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/sessions/publish — Mark business as published + clear sessions
 */
async function publishBot(req, res, next) {
  try {
    await db('businesses').where({ id: req.tenantId }).update({ published_at: db.fn.now() });
    await db('sessions').where({ business_id: req.tenantId }).del();
    res.json({ ok: true, published_at: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/sessions/reset — Reset simulator sessions for this business
 */
async function resetSessions(req, res, next) {
  try {
    const { phone } = req.body || {};
    if (phone) {
      await db('sessions').where({ phone_number: phone, business_id: req.tenantId }).del();
    } else {
      await db('sessions').where({ business_id: req.tenantId }).del();
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSessions, activateTakeover, releaseTakeover, publishBot, resetSessions };
