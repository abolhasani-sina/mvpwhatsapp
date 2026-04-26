// ─── Telegram Channel Renderer ─────────────────────────────────────
// Converts universal NabzChat flow → Telegram Bot API message payloads.
// Docs: https://core.telegram.org/bots/api#sendmessage
//
// Limits:
//   • Text body: max 4096 chars
//   • Inline keyboard: unlimited buttons
//   • Callback data: max 64 bytes
//   • Photo caption: max 1024 chars
// ────────────────────────────────────────────────────────────────────

import { truncate, makeId, stripEmoji, flattenInfoButtons, buildServiceMeta } from './base.js';

export const CHANNEL = 'telegram';

export const LIMITS = {
  TEXT_BODY_MAX: 4096,
  CAPTION_MAX: 1024,
  CALLBACK_DATA_MAX: 64,
  BUTTON_TEXT_MAX: 64,
  INLINE_PER_ROW: 2,
};

// ── 1. WELCOME ──

export function renderWelcome(welcomeMessage, rootButtons) {
  const chatId = '{{chat_id}}';
  const actionable = rootButtons.filter(b => b.behavior);

  if (actionable.length === 0) return textMessage(chatId, welcomeMessage);

  const keyboard = actionable.map(btn => [{
    text: stripEmoji(btn.label),
    callback_data: truncate(makeId('root', btn.id), LIMITS.CALLBACK_DATA_MAX),
  }]);

  return textMessage(chatId, welcomeMessage, keyboard);
}

// ── 2. FLOW STEP ──

export function renderFlowStep(step, menuTree) {
  const chatId = '{{chat_id}}';
  switch (step.type) {
    case 'text': return textMessage(chatId, step.question);
    case 'choice': return renderChoice(chatId, step);
    case 'choice_with_manual': return renderChoiceManual(chatId, step);
    case 'select_from_menu': return renderMenu(chatId, step, menuTree);
    default: return textMessage(chatId, step.question);
  }
}

function renderChoice(chatId, step) {
  const opts = step.options || [];
  const rows = [];
  for (let i = 0; i < opts.length; i += LIMITS.INLINE_PER_ROW) {
    rows.push(opts.slice(i, i + LIMITS.INLINE_PER_ROW).map(o => ({
      text: o.label,
      callback_data: truncate(makeId('choice', o.id), LIMITS.CALLBACK_DATA_MAX),
    })));
  }
  return textMessage(chatId, step.question, rows);
}

function renderChoiceManual(chatId, step) {
  const opts = step.options || [];
  const rows = [];
  for (let i = 0; i < opts.length; i += LIMITS.INLINE_PER_ROW) {
    rows.push(opts.slice(i, i + LIMITS.INLINE_PER_ROW).map(o => ({
      text: o.label,
      callback_data: truncate(makeId('choice', o.id), LIMITS.CALLBACK_DATA_MAX),
    })));
  }
  rows.push([{ text: '✍️ Type manually', callback_data: 'manual_input' }]);
  return textMessage(chatId, `${step.question}\n\n<i>Or type your answer directly.</i>`, rows);
}

// ── 3. MENU TREE ──

function renderMenu(chatId, step, menuTree) {
  if (!menuTree || menuTree.length === 0) return textMessage(chatId, `${step.question}\n\n<i>No services available.</i>`);

  let body = `<b>${step.question}</b>\n`;
  const keyboard = [];

  for (const cat of menuTree) {
    const children = cat.children || [];

    if (children.length === 0 && cat.behavior === 'info') {
      keyboard.push([{
        text: stripEmoji(cat.label),
        callback_data: truncate(makeId('service', cat.id), LIMITS.CALLBACK_DATA_MAX),
      }]);
      continue;
    }

    if (cat.behavior === 'menu' && children.length > 0) {
      body += `\n📁 <b>${stripEmoji(cat.label)}</b>`;
      for (const child of children) {
        if (child.behavior === 'info') {
          keyboard.push([{
            text: `${stripEmoji(cat.label)} → ${stripEmoji(child.label)}`,
            callback_data: truncate(makeId('service', child.id), LIMITS.CALLBACK_DATA_MAX),
          }]);
        } else if (child.behavior === 'menu' && child.children?.length > 0) {
          for (const gc of child.children) {
            keyboard.push([{
              text: `${stripEmoji(child.label)} → ${stripEmoji(gc.label)}`,
              callback_data: truncate(makeId('service', gc.id), LIMITS.CALLBACK_DATA_MAX),
            }]);
          }
        }
      }
    }
  }

  if (keyboard.length === 0) return textMessage(chatId, step.question);
  return textMessage(chatId, body, keyboard);
}

// ── 4. INFO PAGE ──

export function renderInfoPage(button) {
  const chatId = '{{chat_id}}';
  const info = button.infoPage;
  if (!info) return [textMessage(chatId, `<b>${button.label}</b>`)];

  let body = `<b>${info.title}</b>\n`;
  if (info.description) body += `\n${info.description}\n`;
  const meta = buildServiceMeta(info);
  if (meta.length > 0) body += `\n💰 ${meta[0]}${meta[1] ? `  ·  ⏱️ ${meta[1]}` : ''}`;

  const actions = (info.actionButtons || []).filter(a => a.behavior === 'start_flow' || a.behavior === 'go_back');
  const messages = [];

  for (const m of (info.media || []).filter(m => m.mediaType === 'image')) {
    messages.push(photoMessage(chatId, `{{media_base_url}}/${m.id}`, info.title));
  }

  if (actions.length === 0) {
    messages.push(textMessage(chatId, body));
  } else {
    const keyboard = actions.map(a => [{
      text: a.label,
      callback_data: a.behavior === 'start_flow' ? truncate(makeId('book', a.id), LIMITS.CALLBACK_DATA_MAX) : (a.backTarget === 'home' ? 'go_back_home' : 'go_back_parent'),
    }]);
    messages.push(textMessage(chatId, body, keyboard));
  }
  return messages;
}

// ── 5. CONFIRMATION ──

export function renderConfirmation(answers, flowSteps) {
  const chatId = '{{chat_id}}';
  let body = '✅ <b>Booking Confirmed!</b>\n\nHere\'s your summary:\n\n';
  for (const step of flowSteps) {
    const v = answers[step.label] || answers[step.key];
    if (v) body += `• <b>${step.label}</b>: ${v}\n`;
  }
  const labels = new Set(flowSteps.map(s => s.label));
  const keys = new Set(flowSteps.map(s => s.key));
  for (const [k, v] of Object.entries(answers)) {
    if (!k.startsWith('_') && !labels.has(k) && !keys.has(k)) body += `• <b>${k}</b>: ${v}\n`;
  }
  body += '\nWe\'ll get back to you shortly! 🙏';
  return textMessage(chatId, body, [
    [{ text: '📝 New Booking', callback_data: 'new_booking' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ]);
}

// ── 6. FULL FLOW ──

export function renderFullFlow(businessData) {
  const { welcomeMessage, buttons, flow } = businessData;
  const msgs = [];
  msgs.push({ step: 'welcome', ...renderWelcome(welcomeMessage, buttons) });

  const menuRoot = buttons.find(b => b.behavior === 'menu' && b.children?.length > 0);
  if (flow?.steps) {
    for (const step of flow.steps) {
      const tree = step.type === 'select_from_menu' && menuRoot ? menuRoot.children || [] : null;
      msgs.push({ step: step.key, stepType: step.type, ...renderFlowStep(step, tree) });
    }
  }

  for (const btn of flattenInfoButtons(buttons)) {
    const infoMsgs = renderInfoPage(btn);
    infoMsgs.forEach((m, i) => msgs.push({ step: `info_${btn.id}`, context: i < infoMsgs.length - 1 ? 'media' : 'service_detail', ...m }));
  }

  msgs.push({ step: 'confirmation', ...renderConfirmation({}, flow?.steps || []) });
  return msgs;
}

// ═══════════════════════════════════════════════════════════════
// Telegram Bot API message builders
// ═══════════════════════════════════════════════════════════════

function textMessage(chatId, text, inlineKeyboard) {
  const msg = {
    method: 'sendMessage',
    chat_id: chatId,
    text: truncate(text, LIMITS.TEXT_BODY_MAX),
    parse_mode: 'HTML',
  };
  if (inlineKeyboard && inlineKeyboard.length > 0) {
    msg.reply_markup = { inline_keyboard: inlineKeyboard };
  }
  return msg;
}

function photoMessage(chatId, photoUrl, caption) {
  return {
    method: 'sendPhoto',
    chat_id: chatId,
    photo: photoUrl,
    caption: caption ? truncate(caption, LIMITS.CAPTION_MAX) : undefined,
    parse_mode: 'HTML',
  };
}
