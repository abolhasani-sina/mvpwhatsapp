// ─── WhatsApp Channel Renderer ─────────────────────────────────────
// Converts universal NabzChat flow → WhatsApp Cloud API message payloads.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
//
// Limits:
//   • Quick reply buttons: max 3
//   • List rows: max 10, row title max 24 chars
//   • Text body: max 4096 chars
//   • Button title: max 20 chars
// ────────────────────────────────────────────────────────────────────

import { truncate, makeId, stripEmoji, flattenInfoButtons, buildServiceMeta } from './base.js';

export const CHANNEL = 'whatsapp';

export const LIMITS = {
  QUICK_REPLY_MAX: 3,
  LIST_ROWS_MAX: 10,
  BUTTON_TITLE_MAX: 20,
  LIST_ROW_TITLE_MAX: 24,
  LIST_SECTION_TITLE_MAX: 24,
  TEXT_BODY_MAX: 4096,
  LIST_ROW_DESC_MAX: 72,
};

// ── 1. WELCOME ──

export function renderWelcome(welcomeMessage, rootButtons) {
  const to = '{{recipient}}';
  const actionable = rootButtons.filter(b => b.behavior);

  if (actionable.length === 0) return textMessage(to, welcomeMessage);

  if (actionable.length <= LIMITS.QUICK_REPLY_MAX) {
    return interactiveButtons(to, welcomeMessage, actionable.map(btn => ({
      type: 'reply',
      reply: {
        id: makeId('root', btn.id),
        title: truncate(stripEmoji(btn.label), LIMITS.BUTTON_TITLE_MAX),
      },
    })));
  }

  return interactiveList(to, welcomeMessage, 'Options', [{
    title: 'Menu',
    rows: actionable.slice(0, LIMITS.LIST_ROWS_MAX).map(btn => ({
      id: makeId('root', btn.id),
      title: truncate(stripEmoji(btn.label), LIMITS.LIST_ROW_TITLE_MAX),
    })),
  }]);
}

// ── 2. FLOW STEP ──

export function renderFlowStep(step, menuTree) {
  const to = '{{recipient}}';
  switch (step.type) {
    case 'text': return textMessage(to, step.question);
    case 'choice': return renderChoice(to, step);
    case 'choice_with_manual': return renderChoiceManual(to, step);
    case 'select_from_menu': return renderMenu(to, step, menuTree);
    default: return textMessage(to, step.question);
  }
}

function renderChoice(to, step) {
  const opts = step.options || [];
  if (opts.length <= LIMITS.QUICK_REPLY_MAX) {
    return interactiveButtons(to, step.question, opts.map(o => ({
      type: 'reply', reply: { id: makeId('choice', o.id), title: truncate(o.label, LIMITS.BUTTON_TITLE_MAX) },
    })));
  }
  return interactiveList(to, step.question, 'Select', [{
    title: truncate(step.label || 'Options', LIMITS.LIST_SECTION_TITLE_MAX),
    rows: opts.slice(0, LIMITS.LIST_ROWS_MAX).map(o => ({
      id: makeId('choice', o.id), title: truncate(o.label, LIMITS.LIST_ROW_TITLE_MAX),
    })),
  }]);
}

function renderChoiceManual(to, step) {
  const opts = step.options || [];
  const maxQuick = LIMITS.QUICK_REPLY_MAX - 1;
  if (opts.length <= maxQuick) {
    const buttons = opts.map(o => ({
      type: 'reply', reply: { id: makeId('choice', o.id), title: truncate(o.label, LIMITS.BUTTON_TITLE_MAX) },
    }));
    buttons.push({ type: 'reply', reply: { id: 'manual_input', title: 'Type manually' } });
    return interactiveButtons(to, step.question, buttons);
  }
  return interactiveList(to, `${step.question}\n\n_Or type your answer directly._`, 'Select', [{
    title: truncate(step.label || 'Options', LIMITS.LIST_SECTION_TITLE_MAX),
    rows: opts.slice(0, LIMITS.LIST_ROWS_MAX - 1).map(o => ({
      id: makeId('choice', o.id), title: truncate(o.label, LIMITS.LIST_ROW_TITLE_MAX),
    })).concat({ id: 'manual_input', title: 'Type manually ✍️', description: step.manualPlaceholder || 'Enter your own answer' }),
  }]);
}

// ── 3. MENU TREE ──

function renderMenu(to, step, menuTree) {
  if (!menuTree || menuTree.length === 0) return textMessage(to, step.question + '\n\n_No services available._');

  const sections = [];
  let total = 0;

  for (const cat of menuTree) {
    if (total >= LIMITS.LIST_ROWS_MAX) break;
    const children = cat.children || [];

    if (children.length === 0 && cat.behavior === 'info') {
      let misc = sections.find(s => s.title === 'Services');
      if (!misc) { misc = { title: 'Services', rows: [] }; sections.push(misc); }
      if (total < LIMITS.LIST_ROWS_MAX) {
        misc.rows.push({ id: makeId('service', cat.id), title: truncate(stripEmoji(cat.label), LIMITS.LIST_ROW_TITLE_MAX) });
        total++;
      }
      continue;
    }

    if (cat.behavior === 'menu' && children.length > 0) {
      const section = { title: truncate(stripEmoji(cat.label), LIMITS.LIST_SECTION_TITLE_MAX), rows: [] };
      for (const child of children) {
        if (total >= LIMITS.LIST_ROWS_MAX) break;
        if (child.behavior === 'info') {
          section.rows.push({
            id: makeId('service', child.id),
            title: truncate(stripEmoji(child.label), LIMITS.LIST_ROW_TITLE_MAX),
            description: buildWaServiceDesc(child),
          });
          total++;
        } else if (child.behavior === 'menu' && child.children?.length > 0) {
          for (const gc of child.children) {
            if (total >= LIMITS.LIST_ROWS_MAX) break;
            section.rows.push({
              id: makeId('service', gc.id),
              title: truncate(stripEmoji(gc.label), LIMITS.LIST_ROW_TITLE_MAX),
              description: truncate(stripEmoji(child.label), LIMITS.LIST_ROW_DESC_MAX),
            });
            total++;
          }
        }
      }
      if (section.rows.length > 0) sections.push(section);
    }
  }

  if (sections.length === 0) return textMessage(to, step.question);
  return interactiveList(to, step.question, 'View Services', sections);
}

function buildWaServiceDesc(btn) {
  if (!btn.infoPage) return undefined;
  const parts = buildServiceMeta(btn.infoPage);
  return parts.length ? truncate(parts.join(' · '), LIMITS.LIST_ROW_DESC_MAX) : undefined;
}

// ── 4. INFO PAGE ──

export function renderInfoPage(button) {
  const to = '{{recipient}}';
  const info = button.infoPage;
  if (!info) return [textMessage(to, button.label)];

  let body = `*${info.title}*\n`;
  if (info.description) body += `\n${info.description}\n`;
  const meta = buildServiceMeta(info);
  if (meta.length > 0) body += `\n${meta.map((m, i) => i === 0 ? `💰 ${m}` : `⏱️ ${m}`).join('  ·  ')}`;

  const actions = (info.actionButtons || []).filter(a => a.behavior === 'start_flow' || a.behavior === 'go_back');
  const messages = [];
  for (const m of (info.media || []).filter(m => m.mediaType === 'image')) {
    messages.push(imageMessage(to, `{{media_base_url}}/${m.id}`));
  }

  if (actions.length === 0) {
    messages.push(textMessage(to, body));
  } else if (actions.length <= LIMITS.QUICK_REPLY_MAX) {
    messages.push(interactiveButtons(to, body, actions.map(a => ({
      type: 'reply', reply: { id: a.behavior === 'start_flow' ? makeId('book', a.id) : (a.backTarget === 'home' ? 'go_back_home' : 'go_back_parent'), title: truncate(a.label, LIMITS.BUTTON_TITLE_MAX) },
    }))));
  } else {
    messages.push(interactiveList(to, body, 'Actions', [{
      title: 'Choose',
      rows: actions.slice(0, LIMITS.LIST_ROWS_MAX).map(a => ({
        id: a.behavior === 'start_flow' ? makeId('book', a.id) : (a.backTarget === 'home' ? 'go_back_home' : 'go_back_parent'), title: truncate(a.label, LIMITS.LIST_ROW_TITLE_MAX),
      })),
    }]));
  }
  return messages;
}

// ── 5. CONFIRMATION ──

export function renderConfirmation(answers, flowSteps) {
  const to = '{{recipient}}';
  let body = '✅ *Booking Confirmed!*\n\nHere\'s your summary:\n\n';
  for (const step of flowSteps) {
    const v = answers[step.label] || answers[step.key];
    if (v) body += `• *${step.label}*: ${v}\n`;
  }
  const labels = new Set(flowSteps.map(s => s.label));
  const keys = new Set(flowSteps.map(s => s.key));
  for (const [k, v] of Object.entries(answers)) {
    if (!k.startsWith('_') && !labels.has(k) && !keys.has(k)) body += `• *${k}*: ${v}\n`;
  }
  body += '\nWe\'ll get back to you shortly! 🙏';
  return interactiveButtons(to, body, [
    { type: 'reply', reply: { id: 'new_booking', title: 'New Booking' } },
    { type: 'reply', reply: { id: 'main_menu', title: 'Main Menu' } },
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
// WhatsApp Cloud API message builders
// ═══════════════════════════════════════════════════════════════

function textMessage(to, body) {
  return { messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { body: truncate(body, LIMITS.TEXT_BODY_MAX) } };
}

function imageMessage(to, link) {
  return { messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'image', image: { link } };
}

function interactiveButtons(to, bodyText, buttons, header) {
  const interactive = { type: 'button', body: { text: truncate(bodyText, LIMITS.TEXT_BODY_MAX) }, action: { buttons: buttons.slice(0, LIMITS.QUICK_REPLY_MAX) } };
  if (header) interactive.header = header;
  return { messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'interactive', interactive };
}

function interactiveList(to, bodyText, buttonLabel, sections) {
  return {
    messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'interactive',
    interactive: { type: 'list', body: { text: truncate(bodyText, LIMITS.TEXT_BODY_MAX) }, action: { button: truncate(buttonLabel, LIMITS.BUTTON_TITLE_MAX), sections } },
  };
}

export { LIMITS as WA_LIMITS };
