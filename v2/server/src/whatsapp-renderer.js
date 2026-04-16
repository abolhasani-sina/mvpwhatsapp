// ─── WhatsApp Output Renderer ───────────────────────────────────────
// Converts internal BotDesk flow structures → WhatsApp Cloud API messages.
// Pure output adapter — does NOT change any internal data or logic.
//
// WhatsApp limits:
//   • Interactive buttons (quick reply): max 3 buttons
//   • Interactive list: max 10 rows, each row max 24 chars title
//   • Text body: max 4096 chars
//   • Button title: max 20 chars
//   • List row title: max 24 chars
//   • List section title: max 24 chars
// ────────────────────────────────────────────────────────────────────

const WA_LIMITS = {
  QUICK_REPLY_MAX: 3,
  LIST_ROWS_MAX: 10,
  BUTTON_TITLE_MAX: 20,
  LIST_ROW_TITLE_MAX: 24,
  LIST_SECTION_TITLE_MAX: 24,
  TEXT_BODY_MAX: 4096,
  LIST_ROW_DESC_MAX: 72,
};

// ── Helpers ──

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function makeId(prefix, num) {
  return `${prefix}_${num}`;
}

// ── 1. WELCOME MESSAGE ──────────────────────────────────────────────
// Renders the root welcome screen with up to 3 quick reply buttons
// or a list message if more than 3 root buttons exist.

export function renderWelcome(welcomeMessage, rootButtons) {
  const phoneNumber = '{{recipient}}'; // placeholder

  // Filter out null-behavior buttons that do nothing
  const actionable = rootButtons.filter(b => b.behavior);

  if (actionable.length === 0) {
    return textMessage(phoneNumber, welcomeMessage);
  }

  if (actionable.length <= WA_LIMITS.QUICK_REPLY_MAX) {
    return interactiveButtons(phoneNumber, welcomeMessage, actionable.map((btn, i) => ({
      type: 'reply',
      reply: {
        id: makeId('root', btn.id),
        title: truncate(btn.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim(), WA_LIMITS.BUTTON_TITLE_MAX),
      },
    })));
  }

  // More than 3 → list message
  return interactiveList(phoneNumber, welcomeMessage, 'Options', [{
    title: 'Menu',
    rows: actionable.slice(0, WA_LIMITS.LIST_ROWS_MAX).map((btn, i) => ({
      id: makeId('root', btn.id),
      title: truncate(btn.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim(), WA_LIMITS.LIST_ROW_TITLE_MAX),
    })),
  }]);
}

// ── 2. FLOW STEP RENDERER ───────────────────────────────────────────

export function renderFlowStep(step, menuTree) {
  const phoneNumber = '{{recipient}}';

  switch (step.type) {
    case 'text':
      return textMessage(phoneNumber, step.question);

    case 'choice':
      return renderChoiceStep(phoneNumber, step);

    case 'choice_with_manual':
      return renderChoiceWithManualStep(phoneNumber, step);

    case 'select_from_menu':
      return renderMenuStep(phoneNumber, step, menuTree);

    default:
      return textMessage(phoneNumber, step.question);
  }
}

function renderChoiceStep(to, step) {
  const options = step.options || [];

  if (options.length <= WA_LIMITS.QUICK_REPLY_MAX) {
    return interactiveButtons(to, step.question, options.map(opt => ({
      type: 'reply',
      reply: {
        id: makeId('choice', opt.id),
        title: truncate(opt.label, WA_LIMITS.BUTTON_TITLE_MAX),
      },
    })));
  }

  // More than 3 options → list message
  return interactiveList(to, step.question, 'Select', [{
    title: truncate(step.label || 'Options', WA_LIMITS.LIST_SECTION_TITLE_MAX),
    rows: options.slice(0, WA_LIMITS.LIST_ROWS_MAX).map(opt => ({
      id: makeId('choice', opt.id),
      title: truncate(opt.label, WA_LIMITS.LIST_ROW_TITLE_MAX),
    })),
  }]);
}

function renderChoiceWithManualStep(to, step) {
  const options = step.options || [];

  // Reserve 1 slot for "Type manually" if using quick replies
  const maxQuickOptions = WA_LIMITS.QUICK_REPLY_MAX - 1;

  if (options.length <= maxQuickOptions) {
    const buttons = options.map(opt => ({
      type: 'reply',
      reply: {
        id: makeId('choice', opt.id),
        title: truncate(opt.label, WA_LIMITS.BUTTON_TITLE_MAX),
      },
    }));
    buttons.push({
      type: 'reply',
      reply: {
        id: 'manual_input',
        title: 'Type manually',
      },
    });
    return interactiveButtons(to, step.question, buttons);
  }

  // Too many for quick reply → list + manual hint in body
  const bodyText = `${step.question}\n\n_Or type your answer directly._`;
  return interactiveList(to, bodyText, 'Select', [{
    title: truncate(step.label || 'Options', WA_LIMITS.LIST_SECTION_TITLE_MAX),
    rows: options.slice(0, WA_LIMITS.LIST_ROWS_MAX - 1).map(opt => ({
      id: makeId('choice', opt.id),
      title: truncate(opt.label, WA_LIMITS.LIST_ROW_TITLE_MAX),
    })).concat({
      id: 'manual_input',
      title: 'Type manually ✍️',
      description: step.manualPlaceholder || 'Enter your own answer',
    }),
  }]);
}

// ── 3. MENU TREE RENDERER ────────────────────────────────────────────
// Flattens nested menu into WhatsApp List Message with sections.
// Each menu category becomes a section, leaf items become rows.

function renderMenuStep(to, step, menuTree) {
  if (!menuTree || menuTree.length === 0) {
    return textMessage(to, step.question + '\n\n_No services available._');
  }

  // Build sections from the menu tree
  const sections = [];
  let totalRows = 0;

  for (const category of menuTree) {
    if (totalRows >= WA_LIMITS.LIST_ROWS_MAX) break;

    const children = category.children || [];

    if (children.length === 0 && category.behavior === 'info') {
      // Leaf at root level — add to a "Services" section
      let miscSection = sections.find(s => s.title === 'Services');
      if (!miscSection) {
        miscSection = { title: 'Services', rows: [] };
        sections.push(miscSection);
      }
      if (totalRows < WA_LIMITS.LIST_ROWS_MAX) {
        miscSection.rows.push({
          id: makeId('service', category.id),
          title: truncate(
            category.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim(),
            WA_LIMITS.LIST_ROW_TITLE_MAX
          ),
        });
        totalRows++;
      }
      continue;
    }

    if (category.behavior === 'menu' && children.length > 0) {
      const section = {
        title: truncate(
          category.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim(),
          WA_LIMITS.LIST_SECTION_TITLE_MAX
        ),
        rows: [],
      };

      for (const child of children) {
        if (totalRows >= WA_LIMITS.LIST_ROWS_MAX) break;

        if (child.behavior === 'info') {
          section.rows.push({
            id: makeId('service', child.id),
            title: truncate(
              child.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim(),
              WA_LIMITS.LIST_ROW_TITLE_MAX
            ),
            description: buildServiceDescription(child),
          });
          totalRows++;
        } else if (child.behavior === 'menu' && child.children?.length > 0) {
          // Deeper nesting — flatten grandchildren into this section
          for (const grandchild of child.children) {
            if (totalRows >= WA_LIMITS.LIST_ROWS_MAX) break;
            section.rows.push({
              id: makeId('service', grandchild.id),
              title: truncate(
                grandchild.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim(),
                WA_LIMITS.LIST_ROW_TITLE_MAX
              ),
              description: truncate(child.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim(), WA_LIMITS.LIST_ROW_DESC_MAX),
            });
            totalRows++;
          }
        }
      }

      if (section.rows.length > 0) {
        sections.push(section);
      }
    }
  }

  if (sections.length === 0) {
    return textMessage(to, step.question);
  }

  return interactiveList(to, step.question, 'View Services', sections);
}

function buildServiceDescription(button) {
  if (!button.infoPage) return undefined;
  const parts = [];
  if (button.infoPage.amount && button.infoPage.showPrice !== false) {
    parts.push(`${button.infoPage.currency || '$'}${button.infoPage.amount}`);
  }
  if (button.infoPage.duration && button.infoPage.showDuration !== false) {
    parts.push(button.infoPage.duration);
  }
  if (parts.length === 0) return undefined;
  return truncate(parts.join(' · '), WA_LIMITS.LIST_ROW_DESC_MAX);
}

// ── 4. INFO PAGE / SERVICE DETAIL RENDERER ───────────────────────────

export function renderInfoPage(button) {
  const phoneNumber = '{{recipient}}';
  const info = button.infoPage;
  if (!info) return [textMessage(phoneNumber, button.label)];

  // Build rich text body
  let body = `*${info.title}*\n`;
  if (info.description) body += `\n${info.description}\n`;

  const meta = [];
  if (info.amount && info.showPrice !== false) {
    meta.push(`💰 ${info.currency || 'USD'} ${info.amount}`);
  }
  if (info.duration && info.showDuration !== false) {
    meta.push(`⏱️ ${info.duration}`);
  }
  if (meta.length > 0) body += `\n${meta.join('  ·  ')}`;

  // Action buttons (max 3 for quick reply)
  const actions = info.actionButtons || [];
  const actionable = actions.filter(a => a.behavior === 'start_flow' || a.behavior === 'go_back');

  // Build message array: one image message per media, then text+buttons last
  const messages = [];
  const mediaItems = (info.media || []).filter(m => m.mediaType === 'image');
  for (const m of mediaItems) {
    messages.push(imageMessage(phoneNumber, `{{media_base_url}}/${m.id}`));
  }

  if (actionable.length === 0) {
    messages.push(textMessage(phoneNumber, body));
  } else if (actionable.length <= WA_LIMITS.QUICK_REPLY_MAX) {
    messages.push(interactiveButtons(phoneNumber, body, actionable.map(a => ({
      type: 'reply',
      reply: {
        id: a.behavior === 'start_flow' ? makeId('book', a.id) : 'go_back',
        title: truncate(a.label, WA_LIMITS.BUTTON_TITLE_MAX),
      },
    }))));
  } else {
    messages.push(interactiveList(phoneNumber, body, 'Actions', [{
      title: 'Choose',
      rows: actionable.slice(0, WA_LIMITS.LIST_ROWS_MAX).map(a => ({
        id: a.behavior === 'start_flow' ? makeId('book', a.id) : 'go_back',
        title: truncate(a.label, WA_LIMITS.LIST_ROW_TITLE_MAX),
      })),
    }]));
  }

  return messages;
}

// ── 5. BOOKING CONFIRMATION RENDERER ─────────────────────────────────

export function renderConfirmation(answers, flowSteps) {
  const phoneNumber = '{{recipient}}';

  let body = '✅ *Booking Confirmed!*\n\nHere\'s your summary:\n\n';

  // Build summary in step order
  for (const step of flowSteps) {
    const value = answers[step.label] || answers[step.key];
    if (value) {
      body += `• *${step.label}*: ${value}\n`;
    }
  }

  // Any extra fields not in base flow
  const stepLabels = new Set(flowSteps.map(s => s.label));
  const stepKeys = new Set(flowSteps.map(s => s.key));
  for (const [k, v] of Object.entries(answers)) {
    if (!k.startsWith('_') && !stepLabels.has(k) && !stepKeys.has(k)) {
      body += `• *${k}*: ${v}\n`;
    }
  }

  body += '\nWe\'ll get back to you shortly! 🙏';

  return interactiveButtons(phoneNumber, body, [
    { type: 'reply', reply: { id: 'new_booking', title: 'New Booking' } },
    { type: 'reply', reply: { id: 'main_menu', title: 'Main Menu' } },
  ]);
}

// ── 6. FULL FLOW RENDERER ────────────────────────────────────────────
// Converts an entire business config into a sequence of WhatsApp messages.

export function renderFullFlow(businessData) {
  const { welcomeMessage, buttons, flow } = businessData;
  const messages = [];

  // 1. Welcome
  messages.push({
    step: 'welcome',
    ...renderWelcome(welcomeMessage, buttons),
  });

  // 2. Menu tree (for select_from_menu steps)
  const menuRoot = buttons.find(b => b.behavior === 'menu' && b.children?.length > 0);

  // 3. Each flow step
  if (flow?.steps) {
    for (const step of flow.steps) {
      const menuTree = step.type === 'select_from_menu' && menuRoot
        ? menuRoot.children || []
        : null;

      messages.push({
        step: step.key,
        stepType: step.type,
        ...renderFlowStep(step, menuTree),
      });
    }
  }

  // 4. Info pages for each info button
  const infoButtons = flattenInfoButtons(buttons);
  for (const btn of infoButtons) {
    const infoMsgs = renderInfoPage(btn);
    for (let i = 0; i < infoMsgs.length; i++) {
      messages.push({
        step: `info_${btn.id}`,
        context: i < infoMsgs.length - 1 ? 'media' : 'service_detail',
        ...infoMsgs[i],
      });
    }
  }

  // 5. Confirmation template
  messages.push({
    step: 'confirmation',
    ...renderConfirmation({}, flow?.steps || []),
  });

  return messages;
}

function flattenInfoButtons(buttons) {
  const result = [];
  for (const btn of buttons) {
    if (btn.behavior === 'info' && btn.infoPage) {
      result.push(btn);
    }
    if (btn.children) {
      result.push(...flattenInfoButtons(btn.children));
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// WhatsApp Cloud API Message Builders
// These produce the exact JSON payloads for the Meta Graph API.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
// ═══════════════════════════════════════════════════════════════════════

function textMessage(to, body) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body: truncate(body, WA_LIMITS.TEXT_BODY_MAX) },
  };
}

function imageMessage(to, link) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'image',
    image: { link },
  };
}

function interactiveButtons(to, bodyText, buttons, header) {
  const interactive = {
    type: 'button',
    body: { text: truncate(bodyText, WA_LIMITS.TEXT_BODY_MAX) },
    action: {
      buttons: buttons.slice(0, WA_LIMITS.QUICK_REPLY_MAX),
    },
  };
  if (header) {
    interactive.header = header;
  }
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive,
  };
}

function interactiveList(to, bodyText, buttonLabel, sections) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: truncate(bodyText, WA_LIMITS.TEXT_BODY_MAX) },
      action: {
        button: truncate(buttonLabel, WA_LIMITS.BUTTON_TITLE_MAX),
        sections,
      },
    },
  };
}

// ── Exports ──
export { WA_LIMITS };
