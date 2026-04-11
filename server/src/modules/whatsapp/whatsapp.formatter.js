/**
 * WhatsApp message formatter.
 * Converts internal response objects into WhatsApp Cloud API message payloads.
 *
 * Rules:
 * - 1–3 options → interactive reply buttons
 * - 4–10 options → interactive list message
 * - Plain text → text message
 */

/**
 * Build a text message payload.
 */
function textMessage(to, text) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  };
}

/**
 * Build an interactive reply buttons message (max 3 buttons).
 */
function buttonMessage(to, bodyText, buttons) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map((btn, i) => ({
          type: 'reply',
          reply: {
            id: btn.id || String(i + 1),
            title: truncate(btn.title, 20),
          },
        })),
      },
    },
  };
}

/**
 * Build an interactive list message (max 10 items).
 */
function listMessage(to, bodyText, buttonLabel, items) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: truncate(buttonLabel, 20),
        sections: [
          {
            title: 'Options',
            rows: items.map((item, i) => ({
              id: item.id || String(i + 1),
              title: truncate(item.title, 24),
              description: item.description ? truncate(item.description, 72) : undefined,
            })),
          },
        ],
      },
    },
  };
}

/**
 * Build a menu options message — auto-selects buttons vs list.
 * Each option: { id, title, description? }
 */
function menuMessage(to, headerText, options) {
  if (options.length === 0) {
    return textMessage(to, headerText + '\n\nNo options available.');
  }

  if (options.length <= 3) {
    return buttonMessage(to, headerText, options);
  }

  if (options.length <= 10) {
    return listMessage(to, headerText, 'Choose', options);
  }

  // Over 10: fallback to numbered text list
  const numbered = options.map((opt, i) => `${i + 1}. ${opt.title}`).join('\n');
  return textMessage(to, `${headerText}\n\n${numbered}\n\nReply with the number of your choice.`);
}

/**
 * Truncate a string to maxLen characters.
 */
function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

module.exports = {
  textMessage,
  buttonMessage,
  listMessage,
  menuMessage,
  truncate,
};
