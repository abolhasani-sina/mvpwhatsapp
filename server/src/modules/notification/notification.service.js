const db = require('../../config/database');

const NOTIFICATION_TYPES = [
  'request_created',
  'request_assigned',
  'request_status_changed',
];

/**
 * List notifications for a tenant, most recent first.
 */
async function list(tenantId) {
  return db('notifications')
    .where({ business_id: tenantId })
    .select('*')
    .orderBy('created_at', 'desc');
}

/**
 * List unread notifications for a tenant.
 */
async function listUnread(tenantId) {
  return db('notifications')
    .where({ business_id: tenantId, is_read: false })
    .select('*')
    .orderBy('created_at', 'desc');
}

/**
 * Get a single notification by ID, scoped to tenant.
 */
async function getById(id, tenantId) {
  return db('notifications').where({ id, business_id: tenantId }).first();
}

/**
 * Mark a notification as read.
 */
async function markAsRead(id, tenantId) {
  const [notification] = await db('notifications')
    .where({ id, business_id: tenantId })
    .update({ is_read: true })
    .returning('*');
  return notification;
}

/**
 * Create a notification.
 */
async function create({ businessId, type, referenceId, referenceType, message }) {
  const [notification] = await db('notifications')
    .insert({
      business_id: businessId,
      type,
      reference_id: referenceId || null,
      reference_type: referenceType || null,
      message,
      is_read: false,
    })
    .returning('*');
  return notification;
}

module.exports = { NOTIFICATION_TYPES, list, listUnread, getById, markAsRead, create };
