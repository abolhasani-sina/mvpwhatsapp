const db = require('../../config/database');

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Load session by phone_number + business_id.
 * Returns null if not found.
 */
async function load(phoneNumber, businessId) {
  return db('sessions')
    .where({ phone_number: phoneNumber, business_id: businessId })
    .first();
}

/**
 * Create a new session at the root menu.
 */
async function create(phoneNumber, businessId) {
  const [session] = await db('sessions')
    .insert({
      phone_number: phoneNumber,
      business_id: businessId,
      current_menu_node_id: null,
      current_flow_id: null,
      current_flow_step: null,
      flow_data: null,
      mode: 'automated',
      last_activity: db.fn.now(),
    })
    .returning('*');
  return session;
}

/**
 * Load or create: returns existing session or creates a new one.
 */
async function loadOrCreate(phoneNumber, businessId) {
  let session = await load(phoneNumber, businessId);
  if (!session) {
    session = await create(phoneNumber, businessId);
  }
  return session;
}

/**
 * Update session fields and touch last_activity.
 */
async function update(sessionId, fields) {
  const updateData = { ...fields, last_activity: db.fn.now() };

  // Serialize flow_data if provided
  if (updateData.flow_data !== undefined && updateData.flow_data !== null) {
    updateData.flow_data = JSON.stringify(updateData.flow_data);
  }

  const [session] = await db('sessions')
    .where({ id: sessionId })
    .update(updateData)
    .returning('*');
  return session;
}

/**
 * Reset session to root menu (automated mode).
 */
async function reset(sessionId) {
  return update(sessionId, {
    current_menu_node_id: null,
    current_flow_id: null,
    current_flow_step: null,
    flow_data: null,
    mode: 'automated',
  });
}

/**
 * Check if session has timed out (30 min since last_activity).
 */
function isTimedOut(session) {
  if (!session.last_activity) return true;
  const lastActivity = new Date(session.last_activity).getTime();
  return Date.now() - lastActivity > SESSION_TIMEOUT_MS;
}

/**
 * Set session mode to human_takeover.
 */
async function takeover(sessionId) {
  return update(sessionId, { mode: 'human_takeover' });
}

/**
 * Release human takeover — reset to automated + root menu.
 */
async function release(sessionId) {
  return reset(sessionId);
}

/**
 * List active sessions for a business.
 */
async function listByBusiness(businessId) {
  return db('sessions')
    .where({ business_id: businessId })
    .orderBy('last_activity', 'desc');
}

/**
 * Get session by ID, scoped to business.
 */
async function getById(sessionId, businessId) {
  return db('sessions')
    .where({ id: sessionId, business_id: businessId })
    .first();
}

module.exports = {
  load,
  create,
  loadOrCreate,
  update,
  reset,
  isTimedOut,
  takeover,
  release,
  listByBusiness,
  getById,
};
