// ── Bot Engine ─────────────────────────────────────────────────────
// Server-side conversation flow engine. Mirrors the client-side
// createEngine/advanceFlow/handleSelect/handleSend logic.
//
// processIncoming() is called by channel handlers (Telegram, WhatsApp, etc.)
// It reads/writes conversation state in the DB and returns an array of
// response messages in a neutral internal format that the channel handler
// converts to platform-specific payloads.
// ───────────────────────────────────────────────────────────────────

import db from './db.js';
import { sendTelegramNotification } from './telegram.js';
import crypto from 'crypto';
import { createLogger } from './logger.js';
import { botProcessingDuration, submissionsCreated } from './metrics.js';

const log = createLogger('bot-engine');

// ── Session timeout (30 minutes) ──
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
// ── Dedup window (5 seconds) ──
const DEDUP_WINDOW_SEC = 5;

// Structured logger — now uses pino
function botLog(level, event, data = {}) {
  log[level]({ event, ...data }, event);
}

// ── Callback deduplication ──
function isDuplicateCallback(businessId, channel, customerId, input) {
  const raw = `${input.callbackData || ''}|${input.text || ''}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);

  const cutoff = new Date(Date.now() - DEDUP_WINDOW_SEC * 1000).toISOString().replace('T', ' ').slice(0, 19);
  const existing = db.prepare(
    'SELECT id FROM processed_callbacks WHERE business_id = ? AND channel = ? AND customer_id = ? AND callback_hash = ? AND processed_at > ?'
  ).get(businessId, channel, customerId, hash, cutoff);

  if (existing) {
    botLog('warn', 'duplicate_callback_blocked', { businessId, channel, customerId, hash });
    return true;
  }

  db.prepare(
    'INSERT INTO processed_callbacks (business_id, channel, customer_id, callback_hash) VALUES (?, ?, ?, ?)'
  ).run(businessId, channel, customerId, hash);
  return false;
}

// Cleanup old dedup records (called periodically)
export function cleanupDedupRecords() {
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  const result = db.prepare('DELETE FROM processed_callbacks WHERE processed_at < ?').run(cutoff);
  if (result.changes > 0) botLog('info', 'dedup_cleanup', { deleted: result.changes });
}

// ── Message deduplication by signature ──
function deduplicateMessages(messages) {
  const seen = new Set();
  const deduped = [];
  for (const msg of messages) {
    const sig = JSON.stringify({ type: msg.type, body: msg.body, buttons: msg.buttons, sections: msg.sections });
    if (seen.has(sig)) {
      botLog('warn', 'duplicate_message_removed', { type: msg.type, body: (msg.body || '').slice(0, 50) });
      continue;
    }
    seen.add(sig);
    deduped.push(msg);
  }
  return deduped;
}

// Cleanup stale sessions (conversations with last_activity > 30 min)
export function cleanupStaleSessions() {
  const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS).toISOString().replace('T', ' ').slice(0, 19);
  const result = db.prepare(
    "UPDATE conversations SET status = 'completed', updated_at = datetime('now') WHERE status = 'active' AND last_activity < ?"
  ).run(cutoff);
  if (result.changes > 0) botLog('info', 'stale_session_cleanup', { completed: result.changes });
}

// ═════════════════════════════════════════════════════════════════
// 1. DATA LOADING
// ═════════════════════════════════════════════════════════════════

function loadBuilderData(businessId) {
  const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
  if (!biz) return null;

  const config = db.prepare('SELECT * FROM bot_configs WHERE business_id = ?').get(businessId);
  const flow = db.prepare('SELECT * FROM flows WHERE business_id = ? LIMIT 1').get(businessId);

  let flowSteps = [];
  if (flow) {
    flowSteps = db.prepare('SELECT * FROM flow_steps WHERE flow_id = ? ORDER BY step_order').all(flow.id);
  }

  const allButtons = db.prepare('SELECT * FROM buttons WHERE business_id = ? ORDER BY sort_order').all(businessId);
  const allInfoPages = db.prepare(
    'SELECT ip.* FROM info_pages ip JOIN buttons b ON ip.button_id = b.id WHERE b.business_id = ?'
  ).all(businessId);
  const allActionButtons = db.prepare(
    'SELECT ab.* FROM action_buttons ab JOIN info_pages ip ON ab.info_page_id = ip.id JOIN buttons b ON ip.button_id = b.id WHERE b.business_id = ? ORDER BY ab.sort_order'
  ).all(businessId);
  const allExtraSteps = db.prepare(
    'SELECT es.* FROM extra_steps es JOIN buttons b ON es.button_id = b.id WHERE b.business_id = ? ORDER BY es.step_order'
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

  // Load button media
  const allMedia = db.prepare(
    'SELECT id, button_id, file_name, media_type, sort_order FROM button_media WHERE business_id = ? ORDER BY sort_order'
  ).all(businessId);
  const mediaByButton = new Map();
  for (const m of allMedia) {
    if (!mediaByButton.has(m.button_id)) mediaByButton.set(m.button_id, []);
    mediaByButton.get(m.button_id).push(m);
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

  // [ADDED: action_button_flow_steps] Helper exposed back to the caller so the
  // engine can resolve a per-action-button flow on the fly when the user enters
  // the 'flow' phase via a 'book_' callback.
  function loadActionButtonFlowSteps(actionBtnId) {
    const rows = db.prepare(
      'SELECT * FROM action_button_flow_steps WHERE action_button_id = ? ORDER BY step_order'
    ).all(actionBtnId);
    return rows.map(formatStep);
  }

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
            media: (mediaByButton.get(btn.id) || []).map(m => ({
              id: m.id, fileName: m.file_name, mediaType: m.media_type,
            })),
          };
        }
        return node;
      });
  }

  const buttonTree = buildTree(null);

  return {
    business: biz,
    welcomeMessage: config ? config.welcome_message : '',
    buttons: buttonTree,
    flow: flow ? { id: flow.id, name: flow.name, steps: formattedSteps } : null,
    // [ADDED: action_button_flow_steps] expose per-action-button step loader
    loadActionButtonFlowSteps,
  };
}

// ═════════════════════════════════════════════════════════════════
// 2. TREE HELPERS
// ═════════════════════════════════════════════════════════════════

function findInTree(tree, id) {
  for (const b of tree) {
    if (b.id === id) return b;
    if (b.children) {
      const found = findInTree(b.children, id);
      if (found) return found;
    }
  }
  return null;
}

// ═════════════════════════════════════════════════════════════════
// 3. INTERNAL MESSAGE BUILDERS (channel-neutral format)
// ═════════════════════════════════════════════════════════════════
// These return the same shape as the client-side engine:
//   { type: 'text'|'buttons'|'list', body, buttons?, sections? }

function stripEmoji(str) {
  return (str || '').replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
}

function buildWelcomeMsg(welcomeMessage, buttons) {
  const actionable = buttons.filter(b => b.behavior);
  if (actionable.length === 0) return { type: 'text', body: welcomeMessage };

  if (actionable.length <= 3) {
    return {
      type: 'buttons', body: welcomeMessage,
      buttons: actionable.map(b => ({ id: `root_${b.id}`, title: stripEmoji(b.label).slice(0, 20) })),
    };
  }
  return {
    type: 'list', body: welcomeMessage, buttonLabel: 'Options',
    sections: [{ title: 'Menu', rows: actionable.slice(0, 10).map(b => ({ id: `root_${b.id}`, title: stripEmoji(b.label).slice(0, 24) })) }],
  };
}

function buildChildrenList(children, question, buttonLabel, includeBack = false) {
  const rows = children.slice(0, includeBack ? 9 : 10).map(btn => {
    const row = { id: `service_${btn.id}`, title: stripEmoji(btn.label).slice(0, 24) };
    if (btn.infoPage) {
      const parts = [];
      if (btn.infoPage.amount && btn.infoPage.showPrice !== false)
        parts.push(`${btn.infoPage.currency || 'USD'}${btn.infoPage.amount}`);
      if (btn.infoPage.duration && btn.infoPage.showDuration !== false)
        parts.push(btn.infoPage.duration);
      if (parts.length) row.description = parts.join(' · ').slice(0, 72);
    } else if (btn.behavior === 'menu' && btn.children?.length) {
      row.description = `${btn.children.length} options`;
    }
    return row;
  });
  if (includeBack) {
    rows.push({ id: 'go_back_parent', title: '← Back', description: 'Return to previous menu' });
  }
  return { type: 'list', body: question || 'What are you looking for?', buttonLabel: buttonLabel || 'Browse', sections: [{ title: 'Available', rows }] };
}

function buildFlowStepMsg(step) {
  if (!step) return null;
  if (step.type === 'text') return { type: 'text', body: step.question };

  if (step.type === 'choice') {
    const opts = step.options || [];
    if (opts.length <= 3) {
      return { type: 'buttons', body: step.question, buttons: opts.map(o => ({ id: `choice_${o.id}`, title: o.label.slice(0, 20) })) };
    }
    return { type: 'list', body: step.question, buttonLabel: 'Select', sections: [{ title: step.label || 'Options', rows: opts.slice(0, 10).map(o => ({ id: `choice_${o.id}`, title: o.label.slice(0, 24) })) }] };
  }

  if (step.type === 'choice_with_manual') {
    const opts = step.options || [];
    if (opts.length <= 2) {
      return { type: 'buttons', body: step.question, buttons: [...opts.map(o => ({ id: `choice_${o.id}`, title: o.label.slice(0, 20) })), { id: 'manual_input', title: 'Type manually' }] };
    }
    return {
      type: 'list', body: step.question + '\n\nOr type your answer directly.', buttonLabel: 'Select',
      sections: [{ title: step.label || 'Options', rows: [...opts.slice(0, 9).map(o => ({ id: `choice_${o.id}`, title: o.label.slice(0, 24) })), { id: 'manual_input', title: 'Type manually ✍️', description: step.manualPlaceholder || 'Enter your own answer' }] }],
    };
  }

  if (step.type === 'select_from_menu') {
    return null; // Handled by caller who passes menu tree
  }

  return { type: 'text', body: step.question };
}

function buildInfoMessages(btn) {
  const info = btn.infoPage;
  if (!info) return [{ type: 'text', body: btn.label }];

  let body = `*${info.title}*\n`;
  if (info.description) body += `\n${info.description}\n`;
  const meta = [];
  if (info.amount && info.showPrice !== false)
    meta.push(`💰 ${info.currency || 'USD'} ${info.amount}`);
  if (info.duration && info.showDuration !== false)
    meta.push(`⏱️ ${info.duration}`);
  if (meta.length) body += `\n${meta.join('  ·  ')}`;

  const actions = (info.actionButtons || []).filter(a => a.behavior === 'start_flow' || a.behavior === 'go_back');
  const msgs = [];

  // Include images before the text/buttons message (no caption — details follow)
  for (const m of (info.media || []).filter(m => m.mediaType === 'image')) {
    msgs.push({ type: 'image', mediaId: m.id });
  }

  if (actions.length > 0 && actions.length <= 3) {
    msgs.push({ type: 'buttons', body, buttons: actions.map(a => {
      if (a.behavior === 'start_flow') return { id: `book_${a.id}`, title: a.label.slice(0, 20) };
      // go_back: use target-specific callback ID
      const backId = a.backTarget === 'home' ? 'go_back_home' : 'go_back_parent';
      return { id: backId, title: a.label.slice(0, 20) };
    }) });
  } else {
    msgs.push({ type: 'text', body });
  }
  return msgs;
}

function buildConfirmationMsg(answers, flowSteps, confirmationOverride) {
  // [ADDED: configurable-confirmation] Resolve per-action-button overrides with
  // safe fallbacks to the legacy hardcoded copy so untouched booking flows keep
  // their existing UX.
  const confirmationTitle = (confirmationOverride && confirmationOverride.title) || 'Booking Confirmed! ✅'; // [ADDED: configurable-confirmation]
  const confirmationMessage = (confirmationOverride && confirmationOverride.message) || 'We will be in touch shortly.'; // [ADDED: configurable-confirmation]
  const confirmationButtons = (confirmationOverride && Array.isArray(confirmationOverride.buttons) && confirmationOverride.buttons.length > 0) // [ADDED: configurable-confirmation]
    ? confirmationOverride.buttons // [ADDED: configurable-confirmation]
    : ['Main Menu 🏠']; // [ADDED: configurable-confirmation]

  let body = `✅ *${confirmationTitle}*\n\nHere\'s your summary:\n\n`; // [ADDED: configurable-confirmation]
  for (const step of flowSteps) {
    const v = answers[step.label] || answers[step.key];
    if (v) body += `• *${step.label}*: ${v}\n`;
  }
  const labels = new Set(flowSteps.map(s => s.label));
  const keys = new Set(flowSteps.map(s => s.key));
  for (const [k, v] of Object.entries(answers)) {
    if (!k.startsWith('_') && !labels.has(k) && !keys.has(k)) body += `• *${k}*: ${v}\n`;
  }
  body += `\n${confirmationMessage}`; // [ADDED: configurable-confirmation]
  // [ADDED: configurable-confirmation] Map button labels to existing callback IDs
  // (main_menu / new_booking) so the global shortcut handler keeps working.
  const buttonsOut = confirmationButtons.slice(0, 3).map((label) => { // [ADDED: configurable-confirmation]
    const lc = String(label).toLowerCase(); // [ADDED: configurable-confirmation]
    let id = 'main_menu'; // [ADDED: configurable-confirmation]
    if (lc.includes('new booking') || lc.includes('submit another')) id = 'new_booking'; // [ADDED: configurable-confirmation]
    return { id, title: String(label).slice(0, 20) }; // [ADDED: configurable-confirmation]
  }); // [ADDED: configurable-confirmation]
  return { type: 'buttons', body, buttons: buttonsOut }; // [ADDED: configurable-confirmation]
}

// ═════════════════════════════════════════════════════════════════
// 4. CUSTOMER + CONVERSATION STATE MANAGEMENT
// ═════════════════════════════════════════════════════════════════

function getOrCreateCustomer(businessId, channel, channelUserId, name) {
  let customer = db.prepare(
    'SELECT * FROM customers WHERE business_id = ? AND channel = ? AND channel_user_id = ?'
  ).get(businessId, channel, channelUserId);

  if (!customer) {
    const result = db.prepare(
      'INSERT INTO customers (business_id, channel, channel_user_id, name) VALUES (?, ?, ?, ?)'
    ).run(businessId, channel, channelUserId, name || '');
    customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
  } else if (name && name !== customer.name) {
    db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(name, customer.id);
    customer.name = name;
  }

  return customer;
}

function getActiveConversation(customerId, businessId, channel) {
  return db.prepare(
    "SELECT * FROM conversations WHERE customer_id = ? AND business_id = ? AND channel = ? AND status = 'active' ORDER BY id DESC LIMIT 1"
  ).get(customerId, businessId, channel);
}

function createConversation(customerId, businessId, channel) {
  const state = JSON.stringify({ phase: 'welcome', flowStep: 0, answers: {}, menuPath: [] });
  const result = db.prepare(
    'INSERT INTO conversations (customer_id, business_id, channel, state) VALUES (?, ?, ?, ?)'
  ).run(customerId, businessId, channel, state);
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(result.lastInsertRowid);
}

function updateConversationState(conversationId, state) {
  db.prepare(
    "UPDATE conversations SET state = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(JSON.stringify(state), conversationId);
}

function completeConversation(conversationId) {
  db.prepare(
    "UPDATE conversations SET status = 'completed', updated_at = datetime('now') WHERE id = ?"
  ).run(conversationId);
}

// ═════════════════════════════════════════════════════════════════
// 5. MAIN ENTRY POINT
// ═════════════════════════════════════════════════════════════════

/**
 * Process an incoming message from any channel.
 *
 * @param {number}  businessId     - Which business this bot belongs to
 * @param {string}  channelUserId  - Platform user ID (e.g. Telegram chat ID)
 * @param {string}  channel        - 'telegram' | 'whatsapp' | 'instagram'
 * @param {string}  userName       - User's display name (for customer record)
 * @param {object}  input          - { text?: string, callbackData?: string }
 * @returns {Array} Array of internal messages to send back
 */
export function processIncoming(businessId, channelUserId, channel, userName, input) {
  const endTimer = botProcessingDuration.startTimer({ channel });
  try {
    return _processIncoming(businessId, channelUserId, channel, userName, input);
  } finally {
    endTimer();
  }
}

function _processIncoming(businessId, channelUserId, channel, userName, input) {
  botLog('info', 'process_start', { businessId, channel, channelUserId, input: { text: input.text, cb: input.callbackData } });

  const data = loadBuilderData(businessId);
  if (!data) return [{ type: 'text', body: 'Sorry, this bot is not configured yet.' }];

  const { welcomeMessage, buttons, flow, loadActionButtonFlowSteps } = data;
  const baseSteps = flow?.steps || [];

  const customer = getOrCreateCustomer(businessId, channel, channelUserId, userName);

  // ── Callback deduplication (skip for reset commands) ──
  const isResetCommand = input.text === '/start' || input.text === '/menu' || input.callbackData === 'main_menu' || input.callbackData === 'new_booking';
  if (!isResetCommand && isDuplicateCallback(businessId, channel, customer.id, input)) {
    return []; // silently skip duplicate
  }

  let conversation = getActiveConversation(customer.id, businessId, channel);

  // ── Session timeout check ──
  let sessionExpired = false;
  if (conversation && conversation.last_activity) {
    const lastActive = new Date(conversation.last_activity + 'Z').getTime();
    if (Date.now() - lastActive > SESSION_TIMEOUT_MS) {
      botLog('info', 'session_timeout', { conversationId: conversation.id, customerId: customer.id });
      completeConversation(conversation.id);
      conversation = null;
      sessionExpired = true;
    }
  }

  // Update last_activity for active conversations
  if (conversation) {
    db.prepare("UPDATE conversations SET last_activity = datetime('now') WHERE id = ?").run(conversation.id);
  }

  // If no active conversation or user sends /start, create fresh
  if (!conversation || input.text === '/start') {
    if (conversation) completeConversation(conversation.id);
    conversation = createConversation(customer.id, businessId, channel);
    const welcome = buildWelcomeMsg(welcomeMessage, buttons);
    const responses = sessionExpired
      ? [{ type: 'text', body: '⏰ Your session expired. Starting fresh!' }, welcome]
      : [welcome];
    botLog('info', 'process_end', { businessId, responseCount: responses.length, phase: 'welcome_new' });
    return deduplicateMessages(responses);
  }

  const state = JSON.parse(conversation.state || '{}');
  const { phase } = state;

  // Determine user action from input
  const callbackId = input.callbackData || null;
  const text = input.text || '';

  // ── Global shortcuts ──
  if (callbackId === 'main_menu' || callbackId === 'new_booking' || text === '/menu') {
    completeConversation(conversation.id);
    const newConv = createConversation(customer.id, businessId, channel);
    return [buildWelcomeMsg(welcomeMessage, buttons)];
  }

  if (callbackId === 'go_back' || callbackId === 'go_back_parent') {
    // Go back one level in the menu path
    state.currentInfoId = null;
    if (state.menuPath && state.menuPath.length > 0) {
      state.menuPath.pop();
      if (state.menuPath.length > 0) {
        // Still inside a sub-menu — show parent's children
        const parentId = state.menuPath[state.menuPath.length - 1];
        const parentBtn = findInTree(buttons, parentId);
        state.phase = 'browsing_menu';
        updateConversationState(conversation.id, state);
        if (parentBtn && parentBtn.children?.length) {
          const cleanLabel = stripEmoji(parentBtn.label);
          return [buildChildrenList(parentBtn.children, `Here's what we offer in *${cleanLabel}* 👇`, 'Browse', true)];
        }
      }
      // Popped back to root
      state.phase = 'welcome';
      state.menuPath = [];
      updateConversationState(conversation.id, state);
      return [buildWelcomeMsg(welcomeMessage, buttons)];
    }
    // Already at root — show welcome
    state.phase = 'welcome';
    state.menuPath = [];
    updateConversationState(conversation.id, state);
    return [buildWelcomeMsg(welcomeMessage, buttons)];
  }

  if (callbackId === 'go_back_home') {
    state.phase = 'welcome';
    state.menuPath = [];
    state.currentInfoId = null;
    updateConversationState(conversation.id, state);
    return [buildWelcomeMsg(welcomeMessage, buttons)];
  }

  // ── Phase-specific handlers ──
  const responses = [];

  if (phase === 'welcome') {
    if (callbackId && callbackId.startsWith('root_')) {
      const btnId = Number(callbackId.replace('root_', ''));
      const btn = findInTree(buttons, btnId);
      if (!btn) return [{ type: 'text', body: 'Sorry, that option is no longer available.' }];

      if (btn.behavior === 'menu') {
        state.phase = 'browsing_menu';
        state.menuPath = [btnId];
        updateConversationState(conversation.id, state);
        return [buildChildrenList(btn.children || [], 'Here are our service categories — pick one to explore! ✨', 'Browse Services', true)];
      }

      if (btn.behavior === 'info') {
        state.phase = 'viewing_info';
        state.currentInfoId = btnId;
        updateConversationState(conversation.id, state);
        return buildInfoMessages(btn);
      }
    }
    // Unrecognized input at welcome — re-show welcome
    return [buildWelcomeMsg(welcomeMessage, buttons)];
  }

  if (phase === 'browsing_menu') {
    if (callbackId && callbackId.startsWith('service_')) {
      const btnId = Number(callbackId.replace('service_', ''));
      const btn = findInTree(buttons, btnId);
      if (!btn) return [{ type: 'text', body: 'Sorry, that option is no longer available.' }];

      if (btn.behavior === 'menu' && btn.children?.length) {
        state.menuPath.push(btnId);
        updateConversationState(conversation.id, state);
        const cleanLabel = stripEmoji(btn.label);
        return [buildChildrenList(btn.children, `Great choice! Here's what we offer in *${cleanLabel}* 👇`, 'Browse', true)];
      }

      if (btn.behavior === 'info') {
        state.phase = 'viewing_info';
        state.currentInfoId = btnId;
        updateConversationState(conversation.id, state);
        return buildInfoMessages(btn);
      }
    }
    // Unrecognized — re-show current menu level
    const lastMenuId = state.menuPath[state.menuPath.length - 1];
    const menuBtn = lastMenuId ? findInTree(buttons, lastMenuId) : null;
    if (menuBtn && menuBtn.children?.length) {
      return [buildChildrenList(menuBtn.children, 'Please select from the options:', 'Browse', true)];
    }
    return [buildWelcomeMsg(welcomeMessage, buttons)];
  }

  if (phase === 'viewing_info') {
    if (callbackId && callbackId.startsWith('book_')) {
      const actionBtnId = Number(callbackId.replace('book_', ''));
      const infoBtn = state.currentInfoId ? findInTree(buttons, state.currentInfoId) : null;
      const actionBtn = infoBtn?.infoPage?.actionButtons?.find(a => a.id === actionBtnId);

      // [ADDED: action_button_flow_steps] Prefer this action button's custom flow.
      // Falls back to the business-wide main flow when the action button has no
      // custom steps configured — preserves existing behavior for templates.
      const customSteps = loadActionButtonFlowSteps(actionBtnId);
      const flowStepsForAction = customSteps.length > 0 ? customSteps : baseSteps;

      state.phase = 'flow';
      state.answers = {};
      state.deliveryMethod = actionBtn?.deliveryMethod || 'none';
      state.deliveryStaffId = actionBtn?.deliveryStaffId || null;
      // [ADDED: action_button_flow_steps] Remember which action button drove this flow
      // so subsequent turns load the same custom steps and the submission can be
      // attributed to it.
      state.actionButtonId = actionBtnId;
      state.usingCustomFlow = customSteps.length > 0;

      // If first step is select_from_menu, prefill with service name
      if (flowStepsForAction.length > 0 && flowStepsForAction[0].type === 'select_from_menu' && infoBtn) {
        state.answers[flowStepsForAction[0].label || flowStepsForAction[0].key] = infoBtn.label;
        state.flowStep = 1;
        updateConversationState(conversation.id, state);
        const msg = buildFlowStepMsg(flowStepsForAction[1]);
        if (!msg) {
          // Only had 1 step → submit
          return submitAndConfirm(conversation, state, data, businessId);
        }
        return [msg];
      }

      state.flowStep = 0;
      updateConversationState(conversation.id, state);

      // Handle select_from_menu at step 0
      if (flowStepsForAction[0]?.type === 'select_from_menu') {
        const menuRoot = buttons.find(b => b.behavior === 'menu' && b.children?.length);
        if (menuRoot) {
          return [buildChildrenList(menuRoot.children, flowStepsForAction[0].question, 'View Services')];
        }
      }

      const msg = buildFlowStepMsg(flowStepsForAction[0]);
      return msg ? [msg] : [{ type: 'text', body: 'No booking flow configured.' }];
    }
    // Unrecognized in viewing_info — re-show info
    const infoBtn = state.currentInfoId ? findInTree(buttons, state.currentInfoId) : null;
    if (infoBtn) return buildInfoMessages(infoBtn);
    return [buildWelcomeMsg(welcomeMessage, buttons)];
  }

  if (phase === 'flow') {
    // [ADDED: action_button_flow_steps] Resolve which step list to drive this turn:
    // the action button's custom flow if any, else the business-wide main flow.
    const customForFlow = state.actionButtonId ? loadActionButtonFlowSteps(state.actionButtonId) : [];
    const steps = customForFlow.length > 0 ? customForFlow : baseSteps;

    const currentStep = steps[state.flowStep];
    if (!currentStep) return submitAndConfirm(conversation, state, data, businessId);

    // Handle select_from_menu: user picks from inline buttons
    if (currentStep.type === 'select_from_menu' && callbackId && callbackId.startsWith('service_')) {
      const btnId = Number(callbackId.replace('service_', ''));
      const btn = findInTree(buttons, btnId);
      if (btn) {
        state.answers[currentStep.label || currentStep.key] = btn.label;
        state.flowStep++;
        updateConversationState(conversation.id, state);
        if (state.flowStep >= steps.length) return submitAndConfirm(conversation, state, data, businessId);
        const nextMsg = getNextStepMsg(steps, state.flowStep, buttons);
        return nextMsg ? [nextMsg] : submitAndConfirm(conversation, state, data, businessId);
      }
    }

    // Handle choice / choice_with_manual callbacks
    if (callbackId && callbackId.startsWith('choice_')) {
      const choiceId = callbackId.replace('choice_', '');
      const opts = currentStep.options || [];
      const chosen = opts.find(o => String(o.id) === choiceId);
      state.answers[currentStep.label || currentStep.key] = chosen ? chosen.label : choiceId;
      state.flowStep++;
      updateConversationState(conversation.id, state);
      if (state.flowStep >= steps.length) return submitAndConfirm(conversation, state, data, businessId);
      const nextMsg = getNextStepMsg(steps, state.flowStep, buttons);
      return nextMsg ? [nextMsg] : submitAndConfirm(conversation, state, data, businessId);
    }

    if (callbackId === 'manual_input') {
      state.waitingForManual = true;
      updateConversationState(conversation.id, state);
      return [{ type: 'text', body: currentStep.manualPlaceholder || 'Please type your answer:' }];
    }

    // Handle text input (for text steps OR manual input mode)
    if (text && (currentStep.type === 'text' || currentStep.type === 'choice_with_manual' || state.waitingForManual)) {
      state.answers[currentStep.label || currentStep.key] = text;
      state.flowStep++;
      state.waitingForManual = false;
      updateConversationState(conversation.id, state);
      if (state.flowStep >= steps.length) return submitAndConfirm(conversation, state, data, businessId);
      const nextMsg = getNextStepMsg(steps, state.flowStep, buttons);
      return nextMsg ? [nextMsg] : submitAndConfirm(conversation, state, data, businessId);
    }

    // Unrecognized input — re-show current step
    const reMsg = getNextStepMsg(steps, state.flowStep, buttons);
    return reMsg ? [reMsg] : [{ type: 'text', body: 'Please answer the current question.' }];
  }

  if (phase === 'confirmed') {
    // After confirmation, any message restarts
    completeConversation(conversation.id);
    const newConv = createConversation(customer.id, businessId, channel);
    return [buildWelcomeMsg(welcomeMessage, buttons)];
  }

  // Fallback — restart
  return [buildWelcomeMsg(welcomeMessage, buttons)];
}

// ═════════════════════════════════════════════════════════════════
// 6. HELPERS
// ═════════════════════════════════════════════════════════════════

function getNextStepMsg(steps, idx, buttons) {
  const step = steps[idx];
  if (!step) return null;
  if (step.type === 'select_from_menu') {
    const menuRoot = buttons.find(b => b.behavior === 'menu' && b.children?.length);
    if (menuRoot) return buildChildrenList(menuRoot.children, step.question, 'View Services');
    return { type: 'text', body: step.question };
  }
  return buildFlowStepMsg(step);
}

function submitAndConfirm(conversation, state, data, businessId) {
  const { flow, loadActionButtonFlowSteps } = data;
  // [ADDED: action_button_flow_steps] Use the same step list the user actually
  // answered against (custom action-button flow when present, else main flow).
  const customForFlow = state.actionButtonId && loadActionButtonFlowSteps
    ? loadActionButtonFlowSteps(state.actionButtonId)
    : [];
  const steps = customForFlow.length > 0 ? customForFlow : (flow?.steps || []);

  // Wrap submission + state update in a transaction for atomicity
  const txn = db.transaction(() => {
    // Create submission
    // [ADDED: action_button_flow_steps] Persist action_button_id so submissions
    // can be attributed back to the specific action button (NULL for main-flow
    // submissions — preserves legacy behavior).
    // Get next business_submission_number for this business // [ADDED: business-submission-number]
    const lastNum = db.prepare('SELECT MAX(business_submission_number) as n FROM submissions WHERE business_id = ?').get(businessId);
    const nextNum = (lastNum?.n || 0) + 1;
    const result = db.prepare(
      'INSERT INTO submissions (business_id, data, status, flow_id, action_button_id, business_submission_number, conversation_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(businessId, JSON.stringify(state.answers), 'new', flow?.id || null, state.actionButtonId || null, nextNum, conversation.id || null); // [ADDED: conversation-id-in-submissions]
    const subId = Number(result.lastInsertRowid);
    // Update customer name from submission answers if available // [ADDED: customer-name-from-answers]
    const submissionNameKeys = ['step_name', 'name', 'your_name', 'customer_name', 'full_name', 'first_name'];
    const answeredName = submissionNameKeys.map(k => state.answers?.[k]).find(v => v && String(v).trim().length > 0);
    if (answeredName && conversation?.id) {
      const conv = db.prepare('SELECT customer_id FROM conversations WHERE id = ?').get(conversation.id);
      if (conv?.customer_id) {
        db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(String(answeredName).trim(), conv.customer_id);
      }
    }
    // Update customer name from submission answers if available // [ADDED: customer-name-from-answers]
    if (answeredName && conversation?.id) {
      const conv = db.prepare('SELECT customer_id FROM conversations WHERE id = ?').get(conversation.id);
      if (conv?.customer_id) {
        db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(String(answeredName).trim(), conv.customer_id);
      }
    }

    // Update state to confirmed
    state.phase = 'confirmed';
    updateConversationState(conversation.id, state);

    return subId;
  });

  let subId;
  try {
    subId = txn();
  } catch (err) {
    botLog('error', 'submit_failed', { businessId, conversationId: conversation.id, error: err.message });
    return [{ type: 'text', body: 'Sorry, something went wrong. Please try again.' }];
  }

  botLog('info', 'submission_created', { businessId, submissionId: subId, conversationId: conversation.id });
  submissionsCreated.inc();

  // Handle delivery (fire-and-forget, outside transaction)
  const biz = db.prepare('SELECT name FROM businesses WHERE id = ?').get(businessId);
  const summary = Object.entries(state.answers)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  const msg = `📋 New Booking #${subId}\n${biz ? biz.name : 'Business'}\n\n${summary}`;

  try {
    sendTelegramNotification(businessId, msg);
  } catch {
    botLog('warn', 'telegram_notify_failed', { businessId, submissionId: subId });
  }

  // [ADDED: configurable-confirmation] Look up this action button's confirmation
  // overrides (title/message/buttons). better-sqlite3 is synchronous, so no await.
  // When state.actionButtonId is null (legacy main-flow submission) we skip the
  // query and buildConfirmationMsg falls back to the hardcoded copy.
  let confirmationOverride = null; // [ADDED: configurable-confirmation]
  if (state.actionButtonId) { // [ADDED: configurable-confirmation]
    const actionBtn = db.prepare( // [ADDED: configurable-confirmation]
      'SELECT confirmation_title, confirmation_message, confirmation_buttons FROM action_buttons WHERE id = ?' // [ADDED: configurable-confirmation]
    ).get(state.actionButtonId); // [ADDED: configurable-confirmation]
    if (actionBtn) { // [ADDED: configurable-confirmation]
      let parsedButtons = null; // [ADDED: configurable-confirmation]
      if (actionBtn.confirmation_buttons) { // [ADDED: configurable-confirmation]
        try { parsedButtons = JSON.parse(actionBtn.confirmation_buttons); } // [ADDED: configurable-confirmation]
        catch { parsedButtons = ['Main Menu 🏠']; } // [ADDED: configurable-confirmation]
      } // [ADDED: configurable-confirmation]
      confirmationOverride = { // [ADDED: configurable-confirmation]
        title: actionBtn.confirmation_title || null, // [ADDED: configurable-confirmation]
        message: actionBtn.confirmation_message || null, // [ADDED: configurable-confirmation]
        buttons: Array.isArray(parsedButtons) && parsedButtons.length > 0 ? parsedButtons : null, // [ADDED: configurable-confirmation]
      }; // [ADDED: configurable-confirmation]
    } // [ADDED: configurable-confirmation]
  } // [ADDED: configurable-confirmation]

  return deduplicateMessages([buildConfirmationMsg(state.answers, steps, confirmationOverride)]); // [ADDED: configurable-confirmation]
}
