const notificationService = require('./notification.service');

/**
 * GET /api/v1/notifications
 */
async function listNotifications(req, res, next) {
  try {
    const notifications = await notificationService.list(req.tenantId);
    res.json({ data: notifications });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/notifications/unread
 */
async function listUnread(req, res, next) {
  try {
    const notifications = await notificationService.listUnread(req.tenantId);
    res.json({ data: notifications });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/notifications/:id/read
 */
async function markAsRead(req, res, next) {
  try {
    const existing = await notificationService.getById(req.params.id, req.tenantId);
    if (!existing) {
      return res.status(404).json({
        error: { status: 404, message: 'Notification not found' },
      });
    }

    const notification = await notificationService.markAsRead(req.params.id, req.tenantId);
    res.json({ data: notification });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, listUnread, markAsRead };
