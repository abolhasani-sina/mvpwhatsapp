const sessionService = require('./session.service');

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

module.exports = { listSessions, activateTakeover, releaseTakeover };
