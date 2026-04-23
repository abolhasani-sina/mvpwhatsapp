// ── Phase 10: Platform Owner Routes ──
// All endpoints require role = 'platform_owner'
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import db from './db.js';
import { authenticate, requireOwner } from './middleware/auth.js';
import { encryptField } from './middleware/encryption.js';
import { createLogger } from './logger.js';
import { getReadableErrorLogs, getRawErrorLogs } from './log-insights.js';

const log = createLogger('owner');
const router = Router();

router.use(authenticate, requireOwner);

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      error: 'Validation failed',
      violations: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
    return true;
  }
  return false;
}

// ─────────────────────────────────────────
// TENANTS (businesses + owner accounts)
// ─────────────────────────────────────────
router.get('/tenants', (req, res) => {
  const rows = db.prepare(`
    SELECT b.id, b.name, b.phone, b.status, b.created_at,
           b.plan_id, p.name AS plan_name,
           u.id AS user_id, u.email AS owner_email, u.name AS owner_name, u.suspended,
           (SELECT COUNT(*) FROM submissions s WHERE s.business_id = b.id) AS submission_count,
           (SELECT COUNT(*) FROM staff st WHERE st.business_id = b.id) AS staff_count,
           (SELECT COUNT(*) FROM flows f WHERE f.business_id = b.id) AS flow_count
    FROM businesses b
    LEFT JOIN users u ON u.id = b.user_id
    LEFT JOIN plans p ON p.id = b.plan_id
    ORDER BY b.created_at DESC
  `).all();
  res.json({ data: rows });
});

router.get('/tenants/:id', (req, res) => {
  const id = Number(req.params.id);
  const biz = db.prepare(`
    SELECT b.*, p.name AS plan_name, u.email AS owner_email, u.name AS owner_name, u.suspended
    FROM businesses b
    LEFT JOIN users u ON u.id = b.user_id
    LEFT JOIN plans p ON p.id = b.plan_id
    WHERE b.id = ?
  `).get(id);
  if (!biz) return res.status(404).json({ error: 'Tenant not found' });

  const usage = {
    submissions_total: db.prepare('SELECT COUNT(*) AS c FROM submissions WHERE business_id = ?').get(id).c,
    submissions_30d: db.prepare(
      "SELECT COUNT(*) AS c FROM submissions WHERE business_id = ? AND created_at >= datetime('now','-30 days')"
    ).get(id).c,
    flows: db.prepare('SELECT COUNT(*) AS c FROM flows WHERE business_id = ?').get(id).c,
    staff: db.prepare('SELECT COUNT(*) AS c FROM staff WHERE business_id = ?').get(id).c,
  };

  const planHistory = db.prepare(`
    SELECT pa.id, pa.assigned_at, p.name AS plan_name, u.email AS assigned_by_email
    FROM plan_assignments pa
    LEFT JOIN plans p ON p.id = pa.plan_id
    LEFT JOIN users u ON u.id = pa.assigned_by
    WHERE pa.business_id = ?
    ORDER BY pa.assigned_at DESC
    LIMIT 20
  `).all(id);

  res.json({ data: { ...biz, usage, planHistory } });
});

router.post('/tenants/:id/suspend', (req, res) => {
  const id = Number(req.params.id);
  const biz = db.prepare('SELECT id, user_id FROM businesses WHERE id = ?').get(id);
  if (!biz) return res.status(404).json({ error: 'Tenant not found' });
  db.prepare("UPDATE businesses SET status = 'suspended' WHERE id = ?").run(id);
  db.prepare('UPDATE users SET suspended = 1 WHERE id = ?').run(biz.user_id);
  log.warn({ businessId: id, by: req.userId }, 'tenant suspended');
  res.json({ success: true });
});

router.post('/tenants/:id/reactivate', (req, res) => {
  const id = Number(req.params.id);
  const biz = db.prepare('SELECT id, user_id FROM businesses WHERE id = ?').get(id);
  if (!biz) return res.status(404).json({ error: 'Tenant not found' });
  db.prepare("UPDATE businesses SET status = 'active' WHERE id = ?").run(id);
  db.prepare('UPDATE users SET suspended = 0 WHERE id = ?').run(biz.user_id);
  log.info({ businessId: id, by: req.userId }, 'tenant reactivated');
  res.json({ success: true });
});

router.put('/tenants/:id/plan',
  body('planId').isInt({ min: 1 }).withMessage('planId required'),
  (req, res) => {
    if (handleValidation(req, res)) return;
    const id = Number(req.params.id);
    const planId = Number(req.body.planId);

    const biz = db.prepare('SELECT id FROM businesses WHERE id = ?').get(id);
    if (!biz) return res.status(404).json({ error: 'Tenant not found' });
    const plan = db.prepare('SELECT id FROM plans WHERE id = ?').get(planId);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    db.prepare('UPDATE businesses SET plan_id = ? WHERE id = ?').run(planId, id);
    db.prepare(
      'INSERT INTO plan_assignments (business_id, plan_id, assigned_by) VALUES (?, ?, ?)'
    ).run(id, planId, req.userId);
    log.info({ businessId: id, planId, by: req.userId }, 'plan assigned');
    res.json({ success: true });
  });

// ─────────────────────────────────────────
// PLANS catalog (CRUD)
// ─────────────────────────────────────────
router.get('/plans', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM businesses b WHERE b.plan_id = p.id) AS tenant_count
    FROM plans p
    ORDER BY p.monthly_price ASC, p.id ASC
  `).all();
  res.json({ data: rows });
});

const planRules = [
  body('name').isString().trim().isLength({ min: 1, max: 50 }),
  body('monthly_price').isInt({ min: 0 }),
  body('max_flows').isInt({ min: 0 }),
  body('max_staff').isInt({ min: 0 }),
  body('max_submissions_per_month').isInt({ min: 0 }),
  body('allow_whatsapp').isInt({ min: 0, max: 1 }),
  body('allow_telegram').isInt({ min: 0, max: 1 }),
  body('allow_instagram').isInt({ min: 0, max: 1 }),
  body('contact_sales').isInt({ min: 0, max: 1 }).optional(),
];

router.post('/plans', planRules, (req, res) => {
  if (handleValidation(req, res)) return;
  const p = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO plans (name, monthly_price, max_flows, max_staff, max_submissions_per_month,
        allow_whatsapp, allow_telegram, allow_instagram, is_default, contact_sales)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(p.name, p.monthly_price, p.max_flows, p.max_staff, p.max_submissions_per_month,
      p.allow_whatsapp ? 1 : 0, p.allow_telegram ? 1 : 0, p.allow_instagram ? 1 : 0,
      p.contact_sales ? 1 : 0); // [ADDED: contact-sales-column]
    res.status(201).json({ data: { id: Number(result.lastInsertRowid) } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Plan name already exists' });
    throw err;
  }
});

router.put('/plans/:id', planRules, (req, res) => {
  if (handleValidation(req, res)) return;
  const id = Number(req.params.id);
  const exists = db.prepare('SELECT id FROM plans WHERE id = ?').get(id);
  if (!exists) return res.status(404).json({ error: 'Plan not found' });
  const p = req.body;
  db.prepare(`
    UPDATE plans SET name=?, monthly_price=?, max_flows=?, max_staff=?, max_submissions_per_month=?,
      allow_whatsapp=?, allow_telegram=?, allow_instagram=?, contact_sales=?, updated_at=datetime('now')
    WHERE id=?
  `).run(p.name, p.monthly_price, p.max_flows, p.max_staff, p.max_submissions_per_month,
    p.allow_whatsapp ? 1 : 0, p.allow_telegram ? 1 : 0, p.allow_instagram ? 1 : 0,
    p.contact_sales ? 1 : 0, id); // [ADDED: contact-sales-column]
  res.json({ success: true });
});

router.delete('/plans/:id', (req, res) => {
  const id = Number(req.params.id);
  const plan = db.prepare('SELECT id, is_default FROM plans WHERE id = ?').get(id);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  if (plan.is_default) return res.status(400).json({ error: 'Cannot delete default plan' });
  const inUse = db.prepare('SELECT COUNT(*) AS c FROM businesses WHERE plan_id = ?').get(id).c;
  if (inUse > 0) return res.status(409).json({ error: `Plan is assigned to ${inUse} tenant(s)` });
  db.prepare('DELETE FROM plans WHERE id = ?').run(id);
  res.json({ success: true });
});

// ─────────────────────────────────────────
// CHANNEL CHANGE REQUESTS
// ─────────────────────────────────────────
router.get('/channel-requests', (req, res) => {
  const status = req.query.status || 'pending';
  const rows = db.prepare(`
    SELECT r.id, r.business_id, r.channel, r.requested_value_masked, r.reason, r.status,
           r.created_at, r.decided_at, r.decision_note,
           b.name AS business_name,
           u.email AS requested_by_email
    FROM channel_change_requests r
    LEFT JOIN businesses b ON b.id = r.business_id
    LEFT JOIN users u ON u.id = r.requested_by
    WHERE r.status = ?
    ORDER BY r.created_at DESC
  `).all(status);
  res.json({ data: rows });
});

router.post('/channel-requests/:id/approve',
  body('note').optional().isString().isLength({ max: 500 }),
  (req, res) => {
    if (handleValidation(req, res)) return;
    const id = Number(req.params.id);
    const note = (req.body.note || '').trim();
    const reqRow = db.prepare('SELECT * FROM channel_change_requests WHERE id = ?').get(id);
    if (!reqRow) return res.status(404).json({ error: 'Request not found' });
    if (reqRow.status !== 'pending') return res.status(409).json({ error: 'Request already decided' });

    const tx = db.transaction(() => {
      // Apply the requested value (encrypt telegram tokens) and re-lock
      const setAtCol = `${reqRow.channel}_set_at`;
      const lockCol = `${reqRow.channel}_locked`;
      let valueColumn;
      let storedValue = reqRow.requested_value;
      if (reqRow.channel === 'telegram') {
        valueColumn = 'telegram_bot_token';
        storedValue = encryptField(reqRow.requested_value);
      } else if (reqRow.channel === 'whatsapp') {
        valueColumn = 'whatsapp_number';
      } else {
        valueColumn = 'instagram_page_id';
      }

      // Ensure settings row exists
      const existing = db.prepare('SELECT id FROM settings WHERE business_id = ?').get(reqRow.business_id);
      if (!existing) {
        db.prepare(
          'INSERT INTO settings (business_id, telegram_bot_token, telegram_chat_id, business_email, whatsapp_number) VALUES (?, ?, ?, ?, ?)'
        ).run(reqRow.business_id, '', '', '', '');
      }

      db.prepare(
        `UPDATE settings SET ${valueColumn} = ?, ${setAtCol} = datetime('now'), ${lockCol} = 1 WHERE business_id = ?`
      ).run(storedValue, reqRow.business_id);

      db.prepare(`
        UPDATE channel_change_requests
        SET status='approved', decided_by=?, decided_at=datetime('now'), decision_note=?
        WHERE id=?
      `).run(req.userId, note, id);
    });

    tx();
    log.info({ requestId: id, by: req.userId }, 'channel change approved');
    res.json({ success: true });
  });

router.post('/channel-requests/:id/reject',
  body('note').optional().isString().isLength({ max: 500 }),
  (req, res) => {
    if (handleValidation(req, res)) return;
    const id = Number(req.params.id);
    const note = (req.body.note || '').trim();
    const reqRow = db.prepare('SELECT id, status FROM channel_change_requests WHERE id = ?').get(id);
    if (!reqRow) return res.status(404).json({ error: 'Request not found' });
    if (reqRow.status !== 'pending') return res.status(409).json({ error: 'Request already decided' });
    db.prepare(`
      UPDATE channel_change_requests
      SET status='rejected', decided_by=?, decided_at=datetime('now'), decision_note=?
      WHERE id=?
    `).run(req.userId, note, id);
    log.info({ requestId: id, by: req.userId }, 'channel change rejected');
    res.json({ success: true });
  });

// ─────────────────────────────────────────
// STATS / OVERVIEW
// ─────────────────────────────────────────
router.get('/stats', (req, res) => {
  const tenantsActive = db.prepare("SELECT COUNT(*) AS c FROM businesses WHERE status = 'active'").get().c;
  const tenantsSuspended = db.prepare("SELECT COUNT(*) AS c FROM businesses WHERE status = 'suspended'").get().c;
  const tenants30d = db.prepare(
    "SELECT COUNT(*) AS c FROM businesses WHERE created_at >= datetime('now','-30 days')"
  ).get().c;
  const submissions30d = db.prepare(
    "SELECT COUNT(*) AS c FROM submissions WHERE created_at >= datetime('now','-30 days')"
  ).get().c;
  const pendingChannelRequests = db.prepare(
    "SELECT COUNT(*) AS c FROM channel_change_requests WHERE status = 'pending'"
  ).get().c;

  // MRR = sum of monthly_price across active tenants' assigned plans
  const mrrRow = db.prepare(`
    SELECT COALESCE(SUM(p.monthly_price), 0) AS mrr
    FROM businesses b JOIN plans p ON p.id = b.plan_id
    WHERE b.status = 'active'
  `).get();

  const planBreakdown = db.prepare(`
    SELECT p.name, p.monthly_price, COUNT(b.id) AS tenants
    FROM plans p LEFT JOIN businesses b ON b.plan_id = p.id AND b.status = 'active'
    GROUP BY p.id ORDER BY p.monthly_price ASC
  `).all();

  res.json({
    data: {
      tenants_active: tenantsActive,
      tenants_suspended: tenantsSuspended,
      tenants_new_30d: tenants30d,
      submissions_30d: submissions30d,
      pending_channel_requests: pendingChannelRequests,
      mrr_usd: Number(mrrRow.mrr || 0),
      plan_breakdown: planBreakdown,
    },
  });
});

// ─────────────────────────────────────────
// SYSTEM LOGS (moved from business panel)
// ─────────────────────────────────────────


router.get('/logs/errors/readable', (req, res) => {
  try {
    const limit = Number(req.query.limit || 30);
    res.json({ data: getReadableErrorLogs(limit) });
  } catch (err) {
    log.error({ err: err.message }, 'failed to read readable error logs');
    res.status(500).json({ error: 'Failed to read error logs' });
  }
});

router.get('/logs/errors/raw', (req, res) => {
  const limit = Number(req.query.limit || 100);
  res.json({ data: getRawErrorLogs(limit) });
});

export default router;
