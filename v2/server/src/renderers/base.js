// ─── Base Renderer Utilities ───────────────────────────────────────
// Shared helpers used by all channel renderers (WhatsApp, Telegram, Instagram).
// Each channel renderer imports these and adds channel-specific formatting.

export function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

export function makeId(prefix, num) {
  return `${prefix}_${num}`;
}

export function stripEmoji(str) {
  return (str || '').replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
}

export function flattenInfoButtons(buttons) {
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

export function buildServiceMeta(info) {
  const parts = [];
  if (info.amount && info.showPrice !== false) {
    parts.push(`${info.currency || 'USD'} ${info.amount}`);
  }
  if (info.duration && info.showDuration !== false) {
    parts.push(info.duration);
  }
  return parts;
}

export function buildConfirmationBody(answers, flowSteps) {
  let body = '';
  for (const step of flowSteps) {
    const value = answers[step.label] || answers[step.key];
    if (value) body += `• *${step.label}*: ${value}\n`;
  }
  const stepLabels = new Set(flowSteps.map(s => s.label));
  const stepKeys = new Set(flowSteps.map(s => s.key));
  for (const [k, v] of Object.entries(answers)) {
    if (!k.startsWith('_') && !stepLabels.has(k) && !stepKeys.has(k)) {
      body += `• *${k}*: ${v}\n`;
    }
  }
  return body;
}
