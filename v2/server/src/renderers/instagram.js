// ─── Instagram Channel Renderer ────────────────────────────────────
// Converts universal NabzChat flow → Instagram Messaging API payloads.
// Docs: https://developers.facebook.com/docs/messenger-platform/instagram
//
// Limits:
//   • Quick replies: max 13
//   • Generic template buttons: max 3
//   • Text body: max 2000 chars
//   • Quick reply title: max 20 chars
//   • Button title: max 20 chars
// ────────────────────────────────────────────────────────────────────

import { truncate, makeId, stripEmoji, flattenInfoButtons, buildServiceMeta } from './base.js';

export const CHANNEL = 'instagram';

export const LIMITS = {
  TEXT_MAX: 2000,
  QUICK_REPLY_MAX: 13,
  QUICK_REPLY_TITLE_MAX: 20,
  TEMPLATE_BUTTON_MAX: 3,
  BUTTON_TITLE_MAX: 20,
};

// ── 1. WELCOME ──

export function renderWelcome(welcomeMessage, rootButtons) {
  const recipient = '{{recipient_id}}';
  const actionable = rootButtons.filter(b => b.behavior);

  if (actionable.length === 0) return textMessage(recipient, welcomeMessage);

  if (actionable.length <= LIMITS.QUICK_REPLY_MAX) {
    return quickReplyMessage(recipient, welcomeMessage, actionable.map(btn => ({
      content_type: 'text',
      title: truncate(stripEmoji(btn.label), LIMITS.QUICK_REPLY_TITLE_MAX),
      payload: makeId('root', btn.id),
    })));
  }

  // Fall back to numbered text list for very large menus
  let body = `${welcomeMessage}\n\n`;
  actionable.forEach((btn, i) => { body += `${i + 1}. ${btn.label}\n`; });
  body += '\nReply with the number of your choice.';
  return textMessage(recipient, body);
}

// ── 2. FLOW STEP ──

export function renderFlowStep(step, menuTree) {
  const recipient = '{{recipient_id}}';
  switch (step.type) {
    case 'text': return textMessage(recipient, step.question);
    case 'choice': return renderChoice(recipient, step);
    case 'choice_with_manual': return renderChoiceManual(recipient, step);
    case 'select_from_menu': return renderMenu(recipient, step, menuTree);
    default: return textMessage(recipient, step.question);
  }
}

function renderChoice(recipient, step) {
  const opts = step.options || [];
  if (opts.length <= LIMITS.QUICK_REPLY_MAX) {
    return quickReplyMessage(recipient, step.question, opts.map(o => ({
      content_type: 'text',
      title: truncate(o.label, LIMITS.QUICK_REPLY_TITLE_MAX),
      payload: makeId('choice', o.id),
    })));
  }
  let body = `${step.question}\n\n`;
  opts.forEach((o, i) => { body += `${i + 1}. ${o.label}\n`; });
  body += '\nReply with the number.';
  return textMessage(recipient, body);
}

function renderChoiceManual(recipient, step) {
  const opts = step.options || [];
  const qr = opts.slice(0, LIMITS.QUICK_REPLY_MAX - 1).map(o => ({
    content_type: 'text',
    title: truncate(o.label, LIMITS.QUICK_REPLY_TITLE_MAX),
    payload: makeId('choice', o.id),
  }));
  qr.push({ content_type: 'text', title: 'Type manually', payload: 'manual_input' });
  return quickReplyMessage(recipient, `${step.question}\n\nOr type your answer directly.`, qr);
}

// ── 3. MENU TREE ──

function renderMenu(recipient, step, menuTree) {
  if (!menuTree || menuTree.length === 0) return textMessage(recipient, `${step.question}\n\nNo services available.`);

  const items = [];
  for (const cat of menuTree) {
    const children = cat.children || [];
    if (children.length === 0 && cat.behavior === 'info') {
      items.push({ label: stripEmoji(cat.label), id: cat.id });
      continue;
    }
    if (cat.behavior === 'menu' && children.length > 0) {
      for (const child of children) {
        if (child.behavior === 'info') {
          items.push({ label: `${stripEmoji(cat.label)} > ${stripEmoji(child.label)}`, id: child.id });
        } else if (child.behavior === 'menu' && child.children?.length > 0) {
          for (const gc of child.children) {
            items.push({ label: `${stripEmoji(child.label)} > ${stripEmoji(gc.label)}`, id: gc.id });
          }
        }
      }
    }
  }

  if (items.length === 0) return textMessage(recipient, step.question);

  if (items.length <= LIMITS.QUICK_REPLY_MAX) {
    return quickReplyMessage(recipient, step.question, items.map(it => ({
      content_type: 'text',
      title: truncate(it.label, LIMITS.QUICK_REPLY_TITLE_MAX),
      payload: makeId('service', it.id),
    })));
  }

  let body = `${step.question}\n\n`;
  items.forEach((it, i) => { body += `${i + 1}. ${it.label}\n`; });
  body += '\nReply with the number.';
  return textMessage(recipient, body);
}

// ── 4. INFO PAGE ──

export function renderInfoPage(button) {
  const recipient = '{{recipient_id}}';
  const info = button.infoPage;
  if (!info) return [textMessage(recipient, button.label)];

  let body = `${info.title}\n`;
  if (info.description) body += `\n${info.description}\n`;
  const meta = buildServiceMeta(info);
  if (meta.length > 0) body += `\n💰 ${meta[0]}${meta[1] ? ` · ⏱️ ${meta[1]}` : ''}`;

  const actions = (info.actionButtons || []).filter(a => a.behavior === 'start_flow' || a.behavior === 'go_back');
  const messages = [];

  for (const m of (info.media || []).filter(m => m.mediaType === 'image')) {
    messages.push(imageMessage(recipient, `{{media_base_url}}/${m.id}`));
  }

  if (actions.length === 0) {
    messages.push(textMessage(recipient, body));
  } else if (actions.length <= LIMITS.TEMPLATE_BUTTON_MAX) {
    messages.push(genericTemplate(recipient, info.title, info.description || '', actions.map(a => ({
      type: 'postback',
      title: truncate(a.label, LIMITS.BUTTON_TITLE_MAX),
      payload: a.behavior === 'start_flow' ? makeId('book', a.id) : (a.backTarget === 'home' ? 'go_back_home' : 'go_back_parent'),
    }))));
  } else {
    messages.push(quickReplyMessage(recipient, body, actions.map(a => ({
      content_type: 'text',
      title: truncate(a.label, LIMITS.QUICK_REPLY_TITLE_MAX),
      payload: a.behavior === 'start_flow' ? makeId('book', a.id) : (a.backTarget === 'home' ? 'go_back_home' : 'go_back_parent'),
    }))));
  }
  return messages;
}

// ── 5. CONFIRMATION ──

export function renderConfirmation(answers, flowSteps) {
  const recipient = '{{recipient_id}}';
  let body = '✅ Booking Confirmed!\n\nHere\'s your summary:\n\n';
  for (const step of flowSteps) {
    const v = answers[step.label] || answers[step.key];
    if (v) body += `• ${step.label}: ${v}\n`;
  }
  const labels = new Set(flowSteps.map(s => s.label));
  const keys = new Set(flowSteps.map(s => s.key));
  for (const [k, v] of Object.entries(answers)) {
    if (!k.startsWith('_') && !labels.has(k) && !keys.has(k)) body += `• ${k}: ${v}\n`;
  }
  body += '\nWe\'ll get back to you shortly! 🙏';
  return quickReplyMessage(recipient, body, [
    { content_type: 'text', title: 'New Booking', payload: 'new_booking' },
    { content_type: 'text', title: 'Main Menu', payload: 'main_menu' },
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
// Instagram Send API message builders
// ═══════════════════════════════════════════════════════════════

function textMessage(recipientId, text) {
  return {
    recipient: { id: recipientId },
    message: { text: truncate(text, LIMITS.TEXT_MAX) },
  };
}

function quickReplyMessage(recipientId, text, quickReplies) {
  return {
    recipient: { id: recipientId },
    message: {
      text: truncate(text, LIMITS.TEXT_MAX),
      quick_replies: quickReplies.slice(0, LIMITS.QUICK_REPLY_MAX),
    },
  };
}

function genericTemplate(recipientId, title, subtitle, buttons) {
  return {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title: truncate(title, 80),
            subtitle: truncate(subtitle, 80),
            buttons: buttons.slice(0, LIMITS.TEMPLATE_BUTTON_MAX),
          }],
        },
      },
    },
  };
}

function imageMessage(recipientId, url) {
  return {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: 'image',
        payload: { url, is_reusable: true },
      },
    },
  };
}
