// ── API Routes ──
// All business CRUD + template loading + submissions

import { Router } from 'express';
import db from './db.js';
import { sendTelegramNotification, sendTelegramToChat } from './telegram.js';
import { seedBusiness } from './seed.js';
import * as whatsappRenderer from './renderers/whatsapp.js';
import * as telegramRenderer from './renderers/telegram.js';
import * as instagramRenderer from './renderers/instagram.js';
import { startPolling, stopPolling, getPollingStatus, handleWebhook } from './telegram-bot.js';
import { authenticate } from './middleware/auth.js';
import { tenantScope, tenantScopeResource, tenantScopeFlow } from './middleware/tenant.js';
import { encryptField, decryptField } from './middleware/encryption.js';
import {
  validate,
  createBusinessRules, updateBusinessRules,
  saveBuilderRules, applyTemplateRules,
  createStaffRules, updateStaffRules,
  updateStatusRules, updateSettingsRules,
  addDestinationRules, updateDestinationsRules,
  updateConfigRules, uploadMediaRules,
} from './middleware/validators.js';
import { createLogger } from './logger.js';
import { getReadableErrorLogs, getRawErrorLogs } from './log-insights.js';

const log = createLogger('routes');

const RENDERERS = { whatsapp: whatsappRenderer, telegram: telegramRenderer, instagram: instagramRenderer };
const { renderWelcome, renderFlowStep, renderInfoPage, renderConfirmation, renderFullFlow } = whatsappRenderer;

const router = Router();

// Apply authentication to all API routes
router.use(authenticate);

// ──────────────────────────────────────────────
// ERROR LOGS (Owner-friendly, authenticated)
// ──────────────────────────────────────────────
router.get('/logs/errors/readable', (req, res) => {
  try {
    const limit = Number(req.query.limit || 30);
    const result = getReadableErrorLogs(limit);
    res.json({ data: result });
  } catch (err) {
    log.error({ err }, 'Failed to read error logs');
    res.status(500).json({ error: 'Failed to read error logs' });
  }
});

router.get('/logs/errors/raw', (req, res) => {
  const limit = Number(req.query.limit || 100);
  res.json({ data: getRawErrorLogs(limit) });
});

// ──────────────────────────────────────────────
// BUSINESS
// ──────────────────────────────────────────────

// Get business for authenticated user
router.get('/business', (req, res) => {
  const biz = db.prepare(
    'SELECT * FROM businesses WHERE user_id = ? ORDER BY id DESC LIMIT 1'
  ).get(req.userId);
  if (!biz) return res.json({ data: null });
  res.json({ data: biz });
});

// Get specific business
router.get('/business/:id', tenantScope, (req, res) => {
  const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id);
  if (!biz) return res.status(404).json({ error: 'Business not found' });
  res.json({ data: biz });
});

// Create business from template
router.post('/business', createBusinessRules, validate, (req, res) => {
  const { templateKey, businessName, templateData } = req.body;
  const businessId = seedBusiness(req.userId, businessName || 'My Business', templateKey, templateData);
  const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
  res.json({ data: biz });
});

// Update business name/phone
router.put('/business/:id', tenantScope, updateBusinessRules, validate, (req, res) => {
  const { name, phone } = req.body;
  const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id);
  if (!biz) return res.status(404).json({ error: 'Business not found' });
  db.prepare('UPDATE businesses SET name = ?, phone = ? WHERE id = ?').run(
    name || biz.name,
    phone || biz.phone,
    req.params.id
  );
  res.json({ data: db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id) });
});

// Delete business (for re-selecting template)
router.delete('/business/:id', tenantScope, (req, res) => {
  db.prepare('DELETE FROM businesses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Apply template to existing business (preserves staff, settings, submissions)
router.post('/business/:id/apply-template', tenantScope, applyTemplateRules, validate, (req, res) => {
  const businessId = Number(req.params.id);
  const { templateKey, templateData } = req.body;

  const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  const { welcomeMessage, buttons } = templateData;

  const txn = db.transaction(() => {
    // Update business template_key
    db.prepare('UPDATE businesses SET template_key = ? WHERE id = ?').run(templateKey, businessId);

    // Upsert welcome message
    const config = db.prepare('SELECT id FROM bot_configs WHERE business_id = ?').get(businessId);
    if (config) {
      db.prepare('UPDATE bot_configs SET welcome_message = ? WHERE business_id = ?').run(welcomeMessage || '', businessId);
    } else {
      db.prepare('INSERT INTO bot_configs (business_id, welcome_message) VALUES (?, ?)').run(businessId, welcomeMessage || '');
    }

    // Delete only builder data (buttons cascade to info_pages, action_buttons, extra_steps, button_media)
    db.prepare('DELETE FROM buttons WHERE business_id = ?').run(businessId);

    // Reuse existing flow or create new
    let existingFlow = db.prepare('SELECT id FROM flows WHERE business_id = ?').get(businessId);
    let flowId;
    if (existingFlow) {
      flowId = existingFlow.id;
      // flow_destinations reference flows(id), not flow_steps — they survive this delete
      db.prepare('DELETE FROM flow_steps WHERE flow_id = ?').run(flowId);
    } else {
      const flowRow = db.prepare('INSERT INTO flows (business_id, name) VALUES (?, ?)').run(businessId, 'Booking Flow');
      flowId = Number(flowRow.lastInsertRowid);
    }

    // Insert template buttons (same logic as seed)
    const insertBtn = db.prepare('INSERT INTO buttons (business_id, parent_id, label, behavior, sort_order) VALUES (?, ?, ?, ?, ?)');
    const insertInfo = db.prepare('INSERT INTO info_pages (button_id, title, description, amount, currency, duration, style, show_price, show_duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertActionBtn = db.prepare('INSERT INTO action_buttons (info_page_id, label, behavior, prefill_service, sort_order) VALUES (?, ?, ?, ?, ?)');
    const insertExtraStep = db.prepare('INSERT INTO extra_steps (button_id, type, question, key, summary_label, options, step_order, manual_placeholder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const insertFlowStep = db.prepare('INSERT INTO flow_steps (flow_id, type, question, key, summary_label, options, step_order, menu_root_button_id, manual_placeholder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

    const oldToNew = new Map();
    let baseFlowSteps = null;

    function insertButtons(btns, parentDbId) {
      for (let i = 0; i < btns.length; i++) {
        const btn = btns[i];
        const result = insertBtn.run(businessId, parentDbId, btn.label, btn.behavior || null, i);
        const newId = Number(result.lastInsertRowid);
        oldToNew.set(btn.id, newId);

        if (btn.behavior === 'info' && btn.infoPage) {
          const ip = btn.infoPage;
          const ipResult = insertInfo.run(newId, ip.title || '', ip.description || '', ip.amount || '', ip.currency || 'USD', ip.duration || '', ip.style || 'clean', ip.showPrice ? 1 : 0, ip.showDuration ? 1 : 0);
          const infoPageId = Number(ipResult.lastInsertRowid);

          if (ip.extraSteps && ip.extraSteps.length > 0) {
            for (let s = 0; s < ip.extraSteps.length; s++) {
              const step = ip.extraSteps[s];
              insertExtraStep.run(newId, step.type, step.question || '', step.key || '', step.label || '', JSON.stringify(step.options || []), s, step.manualPlaceholder || '');
            }
          }

          if (ip.actionButtons && ip.actionButtons.length > 0) {
            for (let a = 0; a < ip.actionButtons.length; a++) {
              const ab = ip.actionButtons[a];
              insertActionBtn.run(infoPageId, ab.label || '', ab.behavior || 'go_back', ab.prefillService || '', a);
              if (ab.behavior === 'start_flow' && ab.flowSteps && !baseFlowSteps) {
                baseFlowSteps = ab.flowSteps;
              }
            }
          }
        }

        if (btn.children && btn.children.length > 0) insertButtons(btn.children, newId);
      }
    }

    insertButtons(buttons || [], null);

    if (baseFlowSteps) {
      for (let s = 0; s < baseFlowSteps.length; s++) {
        const step = baseFlowSteps[s];
        const remappedMenuRoot = step.menuRoot ? (oldToNew.get(step.menuRoot) || null) : null;
        insertFlowStep.run(flowId, step.type, step.question || '', step.key || '', step.label || '', JSON.stringify(step.options || []), s, remappedMenuRoot, step.manualPlaceholder || '');
      }
    }

    // Ensure settings row exists
    const settings = db.prepare('SELECT id FROM settings WHERE business_id = ?').get(businessId);
    if (!settings) {
      db.prepare('INSERT INTO settings (business_id, telegram_bot_token, telegram_chat_id, business_email, whatsapp_number) VALUES (?, ?, ?, ?, ?)').run(businessId, '', '', '', '');
    }
  });

  try {
    txn();
    res.json({ success: true });
  } catch (err) {
    log.error({ err }, 'failed to apply template');
    res.status(500).json({ error: 'Failed to apply template' });
  }
});

// ──────────────────────────────────────────────
// BOT CONFIG (welcome message)
// ──────────────────────────────────────────────

router.get('/business/:id/config', tenantScope, (req, res) => {
  const config = db.prepare(
    'SELECT * FROM bot_configs WHERE business_id = ?'
  ).get(req.params.id);
  res.json({ data: config || null });
});

router.put('/business/:id/config', tenantScope, updateConfigRules, validate, (req, res) => {
  const { welcomeMessage } = req.body;
  const existing = db.prepare('SELECT id FROM bot_configs WHERE business_id = ?').get(req.params.id);
  if (existing) {
    db.prepare('UPDATE bot_configs SET welcome_message = ? WHERE business_id = ?').run(welcomeMessage, req.params.id);
  } else {
    db.prepare('INSERT INTO bot_configs (business_id, welcome_message) VALUES (?, ?)').run(req.params.id, welcomeMessage || '');
  }
  res.json({ success: true });
});

// ──────────────────────────────────────────────
// FULL BUILDER LOAD — returns the complete data
// tree shaped exactly like the frontend expects
// ──────────────────────────────────────────────

router.get('/business/:id/builder', tenantScope, (req, res) => {
  const businessId = req.params.id;

  const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  const config = db.prepare(
    'SELECT * FROM bot_configs WHERE business_id = ?'
  ).get(businessId);

  // Get the flow
  const flow = db.prepare(
    'SELECT * FROM flows WHERE business_id = ? LIMIT 1'
  ).get(businessId);

  let flowSteps = [];
  if (flow) {
    flowSteps = db.prepare(
      'SELECT * FROM flow_steps WHERE flow_id = ? ORDER BY step_order'
    ).all(flow.id);
  }

  // Get ALL buttons for this business
  const allButtons = db.prepare(
    'SELECT * FROM buttons WHERE business_id = ? ORDER BY sort_order'
  ).all(businessId);

  // Get all info pages
  const allInfoPages = db.prepare(
    `SELECT ip.* FROM info_pages ip
     JOIN buttons b ON ip.button_id = b.id
     WHERE b.business_id = ?`
  ).all(businessId);

  // Get all action buttons
  const allActionButtons = db.prepare(
    `SELECT ab.* FROM action_buttons ab
     JOIN info_pages ip ON ab.info_page_id = ip.id
     JOIN buttons b ON ip.button_id = b.id
     WHERE b.business_id = ?
     ORDER BY ab.sort_order`
  ).all(businessId);

  // Get all extra steps
  const allExtraSteps = db.prepare(
    `SELECT es.* FROM extra_steps es
     JOIN buttons b ON es.button_id = b.id
     WHERE b.business_id = ?
     ORDER BY es.step_order`
  ).all(businessId);

  // Index info pages by button_id
  const infoByButton = new Map();
  for (const ip of allInfoPages) infoByButton.set(ip.button_id, ip);

  // Index action buttons by info_page_id
  const actionsByInfoPage = new Map();
  for (const ab of allActionButtons) {
    if (!actionsByInfoPage.has(ab.info_page_id)) actionsByInfoPage.set(ab.info_page_id, []);
    actionsByInfoPage.get(ab.info_page_id).push(ab);
  }

  // Index extra steps by button_id
  const extrasByButton = new Map();
  for (const es of allExtraSteps) {
    if (!extrasByButton.has(es.button_id)) extrasByButton.set(es.button_id, []);
    extrasByButton.get(es.button_id).push(es);
  }

  // Get all button media (without data blob for tree building)
  const allMedia = db.prepare(
    'SELECT id, button_id, file_name, media_type, sort_order FROM button_media WHERE business_id = ? ORDER BY sort_order'
  ).all(businessId);

  // Index media by button_id
  const mediaByButton = new Map();
  for (const m of allMedia) {
    if (!mediaByButton.has(m.button_id)) mediaByButton.set(m.button_id, []);
    mediaByButton.get(m.button_id).push(m);
  }

  // Format flow steps for frontend
  function formatFlowStep(step) {
    return {
      id: step.id,
      question: step.question,
      type: step.type,
      key: step.key,
      label: step.summary_label,
      options: JSON.parse(step.options || '[]'),
      ...(step.menu_root_button_id ? { menuRoot: step.menu_root_button_id } : {}),
      ...(step.manual_placeholder ? { manualPlaceholder: step.manual_placeholder } : {}),
    };
  }

  const formattedFlowSteps = flowSteps.map(formatFlowStep);

  // Build button tree
  const buttonMap = new Map();
  for (const btn of allButtons) buttonMap.set(btn.id, btn);

  function buildButtonTree(parentId) {
    const children = allButtons
      .filter((b) => b.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order);

    return children.map((btn) => {
      const node = {
        id: btn.id,
        label: btn.label,
        behavior: btn.behavior || null,
        children: buildButtonTree(btn.id),
      };

      // Attach info page
      const ip = infoByButton.get(btn.id);
      if (ip) {
        const actions = (actionsByInfoPage.get(ip.id) || []).map((ab) => {
          const actionNode = {
            id: ab.id,
            label: ab.label,
            behavior: ab.behavior,
            deliveryMethod: ab.delivery_method || 'none',
            deliveryStaffId: ab.delivery_staff_id || null,
          };
          if (ab.behavior === 'start_flow') {
            actionNode.flowSteps = formattedFlowSteps;
            if (ab.prefill_service) actionNode.prefillService = ab.prefill_service;
          }
          return actionNode;
        });

        const extras = (extrasByButton.get(btn.id) || []).map((es) => ({
          id: es.id,
          question: es.question,
          type: es.type,
          key: es.key,
          label: es.summary_label,
          options: JSON.parse(es.options || '[]'),
          ...(es.manual_placeholder ? { manualPlaceholder: es.manual_placeholder } : {}),
        }));

        node.infoPage = {
          title: ip.title,
          description: ip.description,
          amount: ip.amount,
          currency: ip.currency,
          duration: ip.duration,
          style: ip.style,
          showPrice: !!ip.show_price,
          showDuration: !!ip.show_duration,
          extraSteps: extras,
          actionButtons: actions,
          media: (mediaByButton.get(btn.id) || []).map((m) => ({
            id: m.id,
            fileName: m.file_name,
            mediaType: m.media_type,
            sortOrder: m.sort_order,
          })),
        };
      }

      return node;
    });
  }

  const buttonTree = buildButtonTree(null);

  res.json({
    data: {
      business: biz,
      welcomeMessage: config ? config.welcome_message : '',
      buttons: buttonTree,
      flow: flow ? { id: flow.id, name: flow.name, steps: formattedFlowSteps } : null,
    },
  });
});

// ──────────────────────────────────────────────
// FULL BUILDER SAVE — accepts the complete tree
// and replaces everything in the DB
// ──────────────────────────────────────────────

router.put('/business/:id/builder', tenantScope, saveBuilderRules, validate, (req, res) => {
  const businessId = Number(req.params.id);
  const { welcomeMessage, buttons } = req.body;

  // Validate: buttons with children must have menu behavior
  function validateButtons(btns) {
    for (const btn of btns) {
      const hasChildren = btn.children && btn.children.length > 0;
      if (hasChildren && btn.behavior !== 'menu') {
        return `"${btn.label}" has sub-options. Remove sub-options before changing behavior.`;
      }
      if (btn.children && btn.children.length > 0) {
        const childError = validateButtons(btn.children);
        if (childError) return childError;
      }
    }
    return null;
  }

  const error = validateButtons(buttons);
  if (error) return res.status(400).json({ error });

  const txn = db.transaction(() => {
    // Update welcome message
    db.prepare(
      'UPDATE bot_configs SET welcome_message = ? WHERE business_id = ?'
    ).run(welcomeMessage, businessId);

    // Save existing media before cascade delete (keyed by old button_id)
    const savedMedia = db.prepare(
      'SELECT id, button_id, file_name, media_type, data, sort_order FROM button_media WHERE business_id = ?'
    ).all(businessId);

    // Delete all existing buttons (cascading deletes info_pages, extra_steps, action_buttons, button_media)
    db.prepare('DELETE FROM buttons WHERE business_id = ?').run(businessId);

    // Reuse existing flow (preserve flow_destinations) or create new one
    let existingFlow = db.prepare('SELECT id FROM flows WHERE business_id = ?').get(businessId);
    let flowId;
    if (existingFlow) {
      flowId = existingFlow.id;
      db.prepare('DELETE FROM flow_steps WHERE flow_id = ?').run(flowId);
    } else {
      const flowRow = db.prepare(
        'INSERT INTO flows (business_id, name) VALUES (?, ?)'
      ).run(businessId, 'Booking Flow');
      flowId = Number(flowRow.lastInsertRowid);
    }

    // Prepared statements
    const insertBtn = db.prepare(
      'INSERT INTO buttons (business_id, parent_id, label, behavior, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    const insertInfo = db.prepare(
      `INSERT INTO info_pages (button_id, title, description, amount, currency, duration, style, show_price, show_duration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertActionBtn = db.prepare(
      'INSERT INTO action_buttons (info_page_id, label, behavior, prefill_service, sort_order, delivery_method, delivery_staff_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const insertExtraStep = db.prepare(
      `INSERT INTO extra_steps (button_id, type, question, key, summary_label, options, step_order, manual_placeholder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertFlowStep = db.prepare(
      `INSERT INTO flow_steps (flow_id, type, question, key, summary_label, options, step_order, menu_root_button_id, manual_placeholder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    // Map from old frontend IDs → new DB IDs
    const oldToNew = new Map();
    let baseFlowSteps = null;

    function insertButtons(btns, parentDbId) {
      for (let i = 0; i < btns.length; i++) {
        const btn = btns[i];
        const result = insertBtn.run(
          businessId,
          parentDbId,
          btn.label,
          btn.behavior || null,
          i
        );
        const newId = Number(result.lastInsertRowid);
        oldToNew.set(btn.id, newId);

        // Info page
        if (btn.behavior === 'info' && btn.infoPage) {
          const ip = btn.infoPage;
          const ipResult = insertInfo.run(
            newId,
            ip.title || '',
            ip.description || '',
            ip.amount || '',
            ip.currency || 'USD',
            ip.duration || '',
            ip.style || 'clean',
            ip.showPrice ? 1 : 0,
            ip.showDuration ? 1 : 0
          );
          const infoPageId = Number(ipResult.lastInsertRowid);

          // Extra steps
          if (ip.extraSteps && ip.extraSteps.length > 0) {
            for (let s = 0; s < ip.extraSteps.length; s++) {
              const step = ip.extraSteps[s];
              insertExtraStep.run(
                newId,
                step.type,
                step.question || '',
                step.key || '',
                step.label || '',
                JSON.stringify(step.options || []),
                s,
                step.manualPlaceholder || ''
              );
            }
          }

          // Action buttons
          if (ip.actionButtons && ip.actionButtons.length > 0) {
            for (let a = 0; a < ip.actionButtons.length; a++) {
              const ab = ip.actionButtons[a];
              insertActionBtn.run(
                infoPageId,
                ab.label || '',
                ab.behavior || 'go_back',
                ab.prefillService || '',
                a,
                ab.deliveryMethod || 'none',
                ab.deliveryStaffId || null
              );
              if (ab.behavior === 'start_flow' && ab.flowSteps && !baseFlowSteps) {
                baseFlowSteps = ab.flowSteps;
              }
            }
          }
        }

        // Recurse
        if (btn.children && btn.children.length > 0) {
          insertButtons(btn.children, newId);
        }
      }
    }

    insertButtons(buttons, null);

    // Re-insert saved media with remapped button IDs
    const insertMedia = db.prepare(
      'INSERT INTO button_media (button_id, business_id, file_name, media_type, data, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const m of savedMedia) {
      const newBtnId = oldToNew.get(m.button_id);
      if (newBtnId) {
        insertMedia.run(newBtnId, businessId, m.file_name, m.media_type, m.data, m.sort_order);
      }
    }

    // Insert base flow steps with remapped menuRoot
    if (baseFlowSteps) {
      for (let s = 0; s < baseFlowSteps.length; s++) {
        const step = baseFlowSteps[s];
        const remappedMenuRoot = step.menuRoot
          ? (oldToNew.get(step.menuRoot) || null)
          : null;
        insertFlowStep.run(
          flowId,
          step.type,
          step.question || '',
          step.key || '',
          step.label || '',
          JSON.stringify(step.options || []),
          s,
          remappedMenuRoot,
          step.manualPlaceholder || ''
        );
      }
    }

    return flowId;
  });

  try {
    txn();
    res.json({ success: true });
  } catch (err) {
    log.error({ err }, 'failed to save builder');
    res.status(500).json({ error: 'Failed to save builder data' });
  }
});

// ──────────────────────────────────────────────
// BUTTONS CRUD (individual)
// ──────────────────────────────────────────────

router.get('/business/:id/buttons', tenantScope, (req, res) => {
  const btns = db.prepare(
    'SELECT * FROM buttons WHERE business_id = ? ORDER BY sort_order'
  ).all(req.params.id);
  res.json({ data: btns });
});

router.post('/business/:id/buttons', tenantScope, (req, res) => {
  const { parentId, label, behavior } = req.body;
  const maxOrder = db.prepare(
    'SELECT MAX(sort_order) as mx FROM buttons WHERE business_id = ? AND parent_id IS ?'
  ).get(req.params.id, parentId || null);
  const order = (maxOrder?.mx ?? -1) + 1;
  const result = db.prepare(
    'INSERT INTO buttons (business_id, parent_id, label, behavior, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, parentId || null, label || 'New button', behavior || null, order);
  res.json({ data: { id: Number(result.lastInsertRowid) } });
});

router.put('/buttons/:id', tenantScopeResource('buttons'), (req, res) => {
  const { label, behavior } = req.body;
  const btn = db.prepare('SELECT * FROM buttons WHERE id = ?').get(req.params.id);
  if (!btn) return res.status(404).json({ error: 'Button not found' });
  db.prepare('UPDATE buttons SET label = ?, behavior = ? WHERE id = ?').run(
    label ?? btn.label,
    behavior ?? btn.behavior,
    req.params.id
  );
  res.json({ success: true });
});

router.delete('/buttons/:id', tenantScopeResource('buttons'), (req, res) => {
  db.prepare('DELETE FROM buttons WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ──────────────────────────────────────────────
// FLOWS
// ──────────────────────────────────────────────

router.get('/business/:id/flows', tenantScope, (req, res) => {
  const flows = db.prepare(
    'SELECT * FROM flows WHERE business_id = ?'
  ).all(req.params.id);
  res.json({ data: flows });
});

// ──────────────────────────────────────────────
// ANALYTICS / DASHBOARD
// ──────────────────────────────────────────────

router.get('/business/:id/analytics', tenantScope, (req, res) => {
  const businessId = req.params.id;

  const totalSubs = db.prepare(
    'SELECT COUNT(*) as count FROM submissions WHERE business_id = ?'
  ).get(businessId)?.count || 0;

  const newCount = db.prepare(
    "SELECT COUNT(*) as count FROM submissions WHERE business_id = ? AND status = 'new'"
  ).get(businessId)?.count || 0;

  const inProgress = db.prepare(
    "SELECT COUNT(*) as count FROM submissions WHERE business_id = ? AND status = 'in_progress'"
  ).get(businessId)?.count || 0;

  const doneCount = db.prepare(
    "SELECT COUNT(*) as count FROM submissions WHERE business_id = ? AND status = 'done'"
  ).get(businessId)?.count || 0;

  const staffCount = db.prepare(
    'SELECT COUNT(*) as count FROM staff WHERE business_id = ? AND active = 1'
  ).get(businessId)?.count || 0;

  // Recent submissions (last 10)
  const recent = db.prepare(
    `SELECT s.id, s.data, s.status, s.created_at, st.name as assigned_name, f.name as flow_name
     FROM submissions s
     LEFT JOIN staff st ON s.assigned_to = st.id
     LEFT JOIN flows f ON s.flow_id = f.id
     WHERE s.business_id = ?
     ORDER BY s.created_at DESC LIMIT 10`
  ).all(businessId).map((s) => ({ ...s, data: JSON.parse(s.data || '{}') }));

  // Submissions per day (last 7 days)
  const dailyCounts = db.prepare(
    `SELECT date(created_at) as date, COUNT(*) as count
     FROM submissions WHERE business_id = ?
     AND created_at >= date('now', '-7 days')
     GROUP BY date(created_at) ORDER BY date`
  ).all(businessId);

  res.json({
    data: {
      totalSubmissions: totalSubs,
      newCount,
      inProgress,
      doneCount,
      staffCount,
      recentSubmissions: recent,
      dailyCounts,
    },
  });
});

// ──────────────────────────────────────────────
// SUBMISSIONS
// ──────────────────────────────────────────────

router.post('/business/:id/submissions', tenantScope, (req, res) => {
  try {
    const { data, flowId, deliveryMethod, deliveryStaffId } = req.body;
    const result = db.prepare(
      'INSERT INTO submissions (business_id, data, status, flow_id) VALUES (?, ?, ?, ?)'
    ).run(req.params.id, JSON.stringify(data || {}), 'new', flowId || null);
    const subId = Number(result.lastInsertRowid);

    const biz = db.prepare('SELECT name FROM businesses WHERE id = ?').get(req.params.id);

    // Build summary in flow step order when possible
    let summary;
    if (flowId) {
      const steps = db.prepare(
        'SELECT key, summary_label FROM flow_steps WHERE flow_id = ? ORDER BY step_order'
      ).all(flowId);
      // Also get extra steps that may be in the data
      const stepKeys = new Set(steps.map(s => s.summary_label));
      const ordered = steps
        .filter(s => data && data[s.summary_label])
        .map(s => `${s.summary_label}: ${data[s.summary_label]}`);
      // Append any extra fields not in base flow steps (e.g. from extraSteps)
      const extras = Object.entries(data || {})
        .filter(([k]) => !k.startsWith('_') && !stepKeys.has(k))
        .map(([k, v]) => `${k}: ${v}`);
      summary = [...ordered, ...extras].join('\n');
    } else {
      summary = Object.entries(data || {})
        .filter(([k]) => !k.startsWith('_'))
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    }
    const msg = `📋 New Booking #${subId}\n${biz ? biz.name : 'Business'}\n\n${summary}`;

    // Track which chat IDs we've already sent to (prevent duplicates)
    const sentChatIds = new Set();

    // Track whether any staff-level delivery succeeded
    let staffDelivered = false;

    // Per-button delivery (from action_buttons delivery config)
    if (deliveryMethod && deliveryMethod !== 'none' && deliveryStaffId) {
      const staffMember = db.prepare('SELECT * FROM staff WHERE id = ?').get(deliveryStaffId);
      if (staffMember) {
        // Auto-assign the submission to this staff
        db.prepare('UPDATE submissions SET assigned_to = ? WHERE id = ?').run(staffMember.id, subId);

        if (deliveryMethod === 'telegram' && staffMember.telegram_chat_id) {
          sendTelegramToChat(req.params.id, staffMember.telegram_chat_id, msg);
          sentChatIds.add(staffMember.telegram_chat_id);
          staffDelivered = true;
        } else if (deliveryMethod === 'telegram' && !staffMember.telegram_chat_id) {
          log.warn({ staffId: staffMember.id, staffName: staffMember.name }, 'staff has no telegram_chat_id — falling back to owner');
        }
        if (deliveryMethod === 'email' && staffMember.email) {
          log.info({ email: staffMember.email, submissionId: subId }, 'email notification sent');
          staffDelivered = true;
        }
      }
    }

    // Per-flow delivery (flow_destinations table)
    if (flowId) {
      const destinations = db.prepare(
        `SELECT fd.channel, s.name as staff_name, s.email, s.telegram_chat_id
         FROM flow_destinations fd
         JOIN staff s ON fd.staff_id = s.id
         WHERE fd.flow_id = ?`
      ).all(flowId);

      for (const dest of destinations) {
        if (dest.channel === 'telegram' && dest.telegram_chat_id && !sentChatIds.has(dest.telegram_chat_id)) {
          sendTelegramToChat(req.params.id, dest.telegram_chat_id, msg);
          sentChatIds.add(dest.telegram_chat_id);
          staffDelivered = true;
        }
        if (dest.channel === 'email' && dest.email) {
          log.info({ email: dest.email, submissionId: subId }, 'email notification queued');
          staffDelivered = true;
        }
      }
    }

    // Global fallback — only send to owner if no staff delivery happened
    if (!staffDelivered) {
      const settings = db.prepare(
        'SELECT telegram_chat_id FROM settings WHERE business_id = ?'
      ).get(req.params.id);
      if (settings?.telegram_chat_id && !sentChatIds.has(settings.telegram_chat_id)) {
        sendTelegramNotification(req.params.id, msg);
      }
    }

    res.json({ data: { id: subId, status: 'new' } });
  } catch (err) {
    log.error({ err }, 'failed to create submission');
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

router.get('/business/:id/submissions', tenantScope, (req, res) => {
  const subs = db.prepare(
    `SELECT s.*, st.name as assigned_name
     FROM submissions s
     LEFT JOIN staff st ON s.assigned_to = st.id
     WHERE s.business_id = ?
     ORDER BY s.created_at DESC`
  ).all(req.params.id);
  res.json({
    data: subs.map((s) => ({ ...s, data: JSON.parse(s.data || '{}') })),
  });
});

router.put('/submissions/:id/status', tenantScopeResource('submissions'), updateStatusRules, validate, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

router.put('/submissions/:id/assign', tenantScopeResource('submissions'), (req, res) => {
  const { staffId } = req.body;
  db.prepare('UPDATE submissions SET assigned_to = ? WHERE id = ?').run(
    staffId || null,
    req.params.id
  );
  // Auto-set status to in_progress when assigning
  if (staffId) {
    db.prepare(
      "UPDATE submissions SET status = 'in_progress' WHERE id = ? AND status = 'new'"
    ).run(req.params.id);
  }
  res.json({ success: true });
});

// ──────────────────────────────────────────────
// STAFF
// ──────────────────────────────────────────────

router.get('/business/:id/staff', tenantScope, (req, res) => {
  const staff = db.prepare(
    'SELECT * FROM staff WHERE business_id = ? AND active = 1 ORDER BY name'
  ).all(req.params.id);
  res.json({ data: staff });
});

router.post('/business/:id/staff', tenantScope, createStaffRules, validate, (req, res) => {
  const { name, role, email, telegram_chat_id } = req.body;
  const result = db.prepare(
    'INSERT INTO staff (business_id, name, role, email, telegram_chat_id) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, name.trim(), role || '', email || '', telegram_chat_id || '');
  res.json({ data: { id: Number(result.lastInsertRowid) } });
});

router.put('/staff/:id', tenantScopeResource('staff'), updateStaffRules, validate, (req, res) => {
  const { name, role, email, telegram_chat_id } = req.body;
  const existing = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Staff not found' });
  db.prepare('UPDATE staff SET name = ?, role = ?, email = ?, telegram_chat_id = ? WHERE id = ?').run(
    name ?? existing.name, role ?? existing.role, email ?? existing.email, telegram_chat_id ?? existing.telegram_chat_id, req.params.id
  );
  res.json({ success: true });
});

router.delete('/staff/:id', tenantScopeResource('staff'), (req, res) => {
  db.prepare('UPDATE staff SET active = 0 WHERE id = ?').run(req.params.id);
  db.prepare('UPDATE submissions SET assigned_to = NULL WHERE assigned_to = ?').run(req.params.id);
  res.json({ success: true });
});

// ──────────────────────────────────────────────
// SETTINGS (Telegram config)
// ──────────────────────────────────────────────

router.get('/business/:id/settings', tenantScope, (req, res) => {
  const settings = db.prepare(
    'SELECT * FROM settings WHERE business_id = ?'
  ).get(req.params.id);
  if (settings) {
    // Decrypt sensitive fields before returning
    settings.telegram_bot_token = decryptField(settings.telegram_bot_token);
  }
  res.json({ data: settings || { telegram_bot_token: '', telegram_chat_id: '', business_email: '', whatsapp_number: '' } });
});

router.put('/business/:id/settings', tenantScope, updateSettingsRules, validate, (req, res) => {
  const { telegramBotToken, telegramChatId, businessEmail, whatsappNumber } = req.body;
  // Encrypt sensitive fields before storing
  const encryptedToken = telegramBotToken ? encryptField(telegramBotToken) : '';
  const existing = db.prepare(
    'SELECT id FROM settings WHERE business_id = ?'
  ).get(req.params.id);
  if (existing) {
    db.prepare(
      'UPDATE settings SET telegram_bot_token = ?, telegram_chat_id = ?, business_email = ?, whatsapp_number = ? WHERE business_id = ?'
    ).run(encryptedToken, telegramChatId || '', businessEmail || '', whatsappNumber || '', req.params.id);
  } else {
    db.prepare(
      'INSERT INTO settings (business_id, telegram_bot_token, telegram_chat_id, business_email, whatsapp_number) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.id, encryptedToken, telegramChatId || '', businessEmail || '', whatsappNumber || '');
  }
  res.json({ success: true });
});

// ──────────────────────────────────────────────
// FLOW DESTINATIONS
// ──────────────────────────────────────────────

router.get('/flows/:id/destinations', tenantScopeFlow, (req, res) => {
  const dests = db.prepare(
    `SELECT fd.*, s.name as staff_name, s.email, s.telegram_chat_id
     FROM flow_destinations fd
     JOIN staff s ON fd.staff_id = s.id
     WHERE fd.flow_id = ?`
  ).all(req.params.id);
  res.json({ data: dests });
});

router.post('/flows/:id/destinations', tenantScopeFlow, addDestinationRules, validate, (req, res) => {
  const { channel, staffId } = req.body;
  const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(staffId);
  if (!staff) return res.status(404).json({ error: 'Staff not found' });
  if (channel === 'email' && !staff.email) {
    return res.status(400).json({ error: 'This staff member has no email configured' });
  }
  if (channel === 'telegram' && !staff.telegram_chat_id) {
    return res.status(400).json({ error: 'This staff member has no Telegram chat ID configured' });
  }
  // Prevent duplicate
  const existing = db.prepare(
    'SELECT id FROM flow_destinations WHERE flow_id = ? AND channel = ? AND staff_id = ?'
  ).get(req.params.id, channel, staffId);
  if (existing) {
    return res.status(400).json({ error: 'This destination already exists' });
  }
  const result = db.prepare(
    'INSERT INTO flow_destinations (flow_id, channel, staff_id) VALUES (?, ?, ?)'
  ).run(req.params.id, channel, staffId);
  res.json({ data: { id: Number(result.lastInsertRowid) } });
});

router.put('/flows/:id/destinations', tenantScopeFlow, updateDestinationsRules, validate, (req, res) => {
  const { destinations } = req.body;
  // Validate all destinations before saving
  for (const dest of destinations) {
    const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(dest.staffId);
    if (!staff) return res.status(400).json({ error: `Staff ${dest.staffId} not found` });
    if (dest.channel === 'email' && !staff.email) {
      return res.status(400).json({ error: `${staff.name} has no email configured` });
    }
    if (dest.channel === 'telegram' && !staff.telegram_chat_id) {
      return res.status(400).json({ error: `${staff.name} has no Telegram chat ID configured` });
    }
  }
  const txn = db.transaction(() => {
    db.prepare('DELETE FROM flow_destinations WHERE flow_id = ?').run(req.params.id);
    const ins = db.prepare('INSERT INTO flow_destinations (flow_id, channel, staff_id) VALUES (?, ?, ?)');
    for (const dest of destinations) {
      ins.run(req.params.id, dest.channel, dest.staffId);
    }
  });
  txn();
  res.json({ success: true });
});

router.delete('/flows/:id/destinations/:destId', tenantScopeFlow, (req, res) => {
  db.prepare('DELETE FROM flow_destinations WHERE id = ? AND flow_id = ?').run(
    req.params.destId, req.params.id
  );
  res.json({ success: true });
});

// ──────────────────────────────────────────────
// WHATSAPP PREVIEW — renders complete business
// flow as WhatsApp Cloud API message payloads
// ──────────────────────────────────────────────

router.get('/business/:id/whatsapp-preview', tenantScope, (req, res) => {
  const businessId = Number(req.params.id);

  const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  const config = db.prepare('SELECT * FROM bot_configs WHERE business_id = ?').get(businessId);
  const flow = db.prepare('SELECT * FROM flows WHERE business_id = ? LIMIT 1').get(businessId);

  let flowSteps = [];
  if (flow) {
    flowSteps = db.prepare('SELECT * FROM flow_steps WHERE flow_id = ? ORDER BY step_order').all(flow.id);
  }

  const allButtons = db.prepare('SELECT * FROM buttons WHERE business_id = ? ORDER BY sort_order').all(businessId);
  const allInfoPages = db.prepare(
    `SELECT ip.* FROM info_pages ip JOIN buttons b ON ip.button_id = b.id WHERE b.business_id = ?`
  ).all(businessId);
  const allActionButtons = db.prepare(
    `SELECT ab.* FROM action_buttons ab JOIN info_pages ip ON ab.info_page_id = ip.id JOIN buttons b ON ip.button_id = b.id WHERE b.business_id = ? ORDER BY ab.sort_order`
  ).all(businessId);
  const allExtraSteps = db.prepare(
    `SELECT es.* FROM extra_steps es JOIN buttons b ON es.button_id = b.id WHERE b.business_id = ? ORDER BY es.step_order`
  ).all(businessId);

  const infoByButton = new Map();
  for (const ip of allInfoPages) infoByButton.set(ip.button_id, ip);

  const actionsByInfoPage = new Map();
  for (const ab of allActionButtons) {
    if (!actionsByInfoPage.has(ab.info_page_id)) actionsByInfoPage.set(ab.info_page_id, []);
    actionsByInfoPage.get(ab.info_page_id).push(ab);
  }

  const extrasByButton = new Map();
  for (const es of allExtraSteps) {
    if (!extrasByButton.has(es.button_id)) extrasByButton.set(es.button_id, []);
    extrasByButton.get(es.button_id).push(es);
  }

  // Load media for buttons
  const allMediaPreview = db.prepare(
    'SELECT id, button_id, file_name, media_type, sort_order FROM button_media WHERE business_id = ? ORDER BY sort_order'
  ).all(businessId);
  const mediaByButtonPreview = new Map();
  for (const m of allMediaPreview) {
    if (!mediaByButtonPreview.has(m.button_id)) mediaByButtonPreview.set(m.button_id, []);
    mediaByButtonPreview.get(m.button_id).push(m);
  }

  function formatStep(step) {
    return {
      id: step.id, question: step.question, type: step.type, key: step.key,
      label: step.summary_label, options: JSON.parse(step.options || '[]'),
      ...(step.menu_root_button_id ? { menuRoot: step.menu_root_button_id } : {}),
      ...(step.manual_placeholder ? { manualPlaceholder: step.manual_placeholder } : {}),
    };
  }

  const formattedSteps = flowSteps.map(formatStep);

  function buildTree(parentId) {
    return allButtons
      .filter(b => b.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(btn => {
        const node = { id: btn.id, label: btn.label, behavior: btn.behavior || null, children: buildTree(btn.id) };
        const ip = infoByButton.get(btn.id);
        if (ip) {
          const actions = (actionsByInfoPage.get(ip.id) || []).map(ab => ({
            id: ab.id, label: ab.label, behavior: ab.behavior,
            deliveryMethod: ab.delivery_method || 'none',
            deliveryStaffId: ab.delivery_staff_id || null,
            ...(ab.behavior === 'start_flow' ? { flowSteps: formattedSteps, ...(ab.prefill_service ? { prefillService: ab.prefill_service } : {}) } : {}),
          }));
          const extras = (extrasByButton.get(btn.id) || []).map(es => ({
            id: es.id, question: es.question, type: es.type, key: es.key,
            label: es.summary_label, options: JSON.parse(es.options || '[]'),
            ...(es.manual_placeholder ? { manualPlaceholder: es.manual_placeholder } : {}),
          }));
          node.infoPage = {
            title: ip.title, description: ip.description, amount: ip.amount,
            currency: ip.currency, duration: ip.duration, style: ip.style,
            showPrice: !!ip.show_price, showDuration: !!ip.show_duration,
            extraSteps: extras, actionButtons: actions,
            media: (mediaByButtonPreview.get(btn.id) || []).map(m => ({
              id: m.id, fileName: m.file_name, mediaType: m.media_type, sortOrder: m.sort_order,
            })),
          };
        }
        return node;
      });
  }

  const buttonTree = buildTree(null);
  const welcomeMessage = config ? config.welcome_message : '';

  // Channel-aware: ?channel=whatsapp|telegram|instagram (default: whatsapp)
  const channelKey = (req.query.channel || 'whatsapp').toLowerCase();
  const renderer = RENDERERS[channelKey];
  if (!renderer) return res.status(400).json({ error: `Unknown channel: ${channelKey}. Supported: whatsapp, telegram, instagram` });

  const businessPayload = {
    business: biz,
    welcomeMessage,
    buttons: buttonTree,
    flow: flow ? { id: flow.id, name: flow.name, steps: formattedSteps } : null,
  };
  const preview = renderer.renderFullFlow(businessPayload);

  res.json({ data: preview, channel: channelKey });
});

// ──────────────────────────────────────────────
// BUTTON MEDIA
// ──────────────────────────────────────────────

const ALLOWED_MEDIA_TYPES = ['image', 'video', 'document', 'audio'];
const MAX_FILE_SIZES = { image: 5 * 1024 * 1024, video: 16 * 1024 * 1024, document: 100 * 1024 * 1024, audio: 16 * 1024 * 1024 };

// Upload media to a button (base64)
router.post('/business/:id/buttons/:buttonId/media', tenantScope, uploadMediaRules, validate, (req, res) => {
  const businessId = Number(req.params.id);
  const buttonId = Number(req.params.buttonId);
  const { fileName, mediaType, data } = req.body;

  // Tenant isolation: verify button belongs to this business
  const btn = db.prepare('SELECT id FROM buttons WHERE id = ? AND business_id = ?').get(buttonId, businessId);
  if (!btn) return res.status(404).json({ error: 'Button not found for this business' });

  // Check file size (base64 is ~33% larger than raw)
  const rawSize = Math.ceil(data.length * 3 / 4);
  if (rawSize > MAX_FILE_SIZES[mediaType]) {
    return res.status(400).json({ error: `File too large. Max ${MAX_FILE_SIZES[mediaType] / 1024 / 1024}MB for ${mediaType}` });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM button_media WHERE button_id = ?').get(buttonId);
  const sortOrder = (maxOrder?.m ?? -1) + 1;

  const result = db.prepare(
    'INSERT INTO button_media (button_id, business_id, file_name, media_type, data, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(buttonId, businessId, fileName, mediaType, data, sortOrder);

  res.json({ id: Number(result.lastInsertRowid), fileName, mediaType, sortOrder });
});

// Delete media
router.delete('/business/:id/media/:mediaId', tenantScope, (req, res) => {
  const businessId = Number(req.params.id);
  const mediaId = Number(req.params.mediaId);

  // Tenant isolation
  const media = db.prepare('SELECT id FROM button_media WHERE id = ? AND business_id = ?').get(mediaId, businessId);
  if (!media) return res.status(404).json({ error: 'Media not found' });

  db.prepare('DELETE FROM button_media WHERE id = ?').run(mediaId);
  res.json({ success: true });
});

// Get media for a button
router.get('/business/:id/buttons/:buttonId/media', tenantScope, (req, res) => {
  const businessId = Number(req.params.id);
  const buttonId = Number(req.params.buttonId);

  const media = db.prepare(
    'SELECT id, file_name, media_type, sort_order FROM button_media WHERE button_id = ? AND business_id = ? ORDER BY sort_order'
  ).all(buttonId, businessId);

  res.json({ data: media });
});

// Get media data (actual file content) by ID
router.get('/business/:id/media/:mediaId', tenantScope, (req, res) => {
  const businessId = Number(req.params.id);
  const mediaId = Number(req.params.mediaId);

  const media = db.prepare(
    'SELECT * FROM button_media WHERE id = ? AND business_id = ?'
  ).get(mediaId, businessId);

  if (!media) return res.status(404).json({ error: 'Media not found' });
  res.json({ data: media });
});

// ──────────────────────────────────────────────
// TELEGRAM BOT (auto-reply engine)
// ──────────────────────────────────────────────

// Start polling for a business
router.post('/business/:id/telegram-bot/start', tenantScope, (req, res) => {
  const result = startPolling(Number(req.params.id));
  res.json(result);
});

// Stop polling for a business
router.post('/business/:id/telegram-bot/stop', tenantScope, (req, res) => {
  const result = stopPolling(Number(req.params.id));
  res.json(result);
});

// Get polling status
router.get('/business/:id/telegram-bot/status', tenantScope, (req, res) => {
  const result = getPollingStatus(Number(req.params.id));
  res.json(result);
});

export default router;
