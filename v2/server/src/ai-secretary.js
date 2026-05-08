import db from './db.js';
import { createLogger } from './logger.js';
import { sendTelegramNotification } from './telegram.js';

const log = createLogger('ai-secretary');
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

function buildSystemPrompt(brain) {
  const name = brain.ai_name || 'Assistant';
  const salonName = brain.salon_name_en || 'the salon';
  const tone = brain.ai_tone || 'friendly';
  const toneMap = {
    friendly: 'Be warm, friendly and approachable.',
    professional: 'Be professional and precise.',
    luxury: 'Be elegant and sophisticated.',
    quick: 'Be brief and direct.',
  };
  const toneInstructions = toneMap[tone] || 'Be warm and helpful.';
  let services = [], packages = [], faqs = [], scenarios = [], hours = {};
  try { services = JSON.parse(brain.services || '[]'); } catch(e) {}
  try { packages = JSON.parse(brain.packages || '[]'); } catch(e) {}
  try { faqs = JSON.parse(brain.faqs || '[]'); } catch(e) {}
  try { scenarios = JSON.parse(brain.scenarios || '[]'); } catch(e) {}
  try { hours = JSON.parse(brain.hours || '{}'); } catch(e) {}

  let servicesBlock = '';
  if (services.length > 0) {
    servicesBlock = '\n\nSERVICES OFFERED:';
    for (const cat of services) {
      servicesBlock += '\n' + cat.category + ':';
      for (const sub of (cat.subcategories || [])) {
        servicesBlock += '\n  ' + sub.name + ':';
        for (const svc of (sub.items || [])) {
          servicesBlock += '\n    - ' + svc.name;
          if (svc.price_from || svc.price_to) {
            const p = svc.price_from && svc.price_to ? 'AED ' + svc.price_from + '-' + svc.price_to : 'AED ' + (svc.price_from || svc.price_to);
            servicesBlock += ' (' + p + ')';
          }
          if (svc.duration) servicesBlock += ' - ' + svc.duration + ' min';
        }
      }
    }
  }

  let packagesBlock = '';
  if (packages.length > 0) {
    packagesBlock = '\n\nPACKAGES:';
    for (const pkg of packages) {
      packagesBlock += '\n  - ' + pkg.name;
      if (pkg.price) packagesBlock += ' (AED ' + pkg.price + ')';
      if (pkg.includes) packagesBlock += ': ' + pkg.includes;
    }
  }

  let hoursBlock = '';
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dayLabels = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const hoursLines = [];
  for (let i = 0; i < dayNames.length; i++) {
    const day = hours[dayNames[i]];
    if (day && day.closed) hoursLines.push('  ' + dayLabels[i] + ': Closed');
    else if (day && day.open && day.close) hoursLines.push('  ' + dayLabels[i] + ': ' + day.open + ' - ' + day.close);
  }
  if (hoursLines.length > 0) hoursBlock = '\n\nBUSINESS HOURS:\n' + hoursLines.join('\n');

  let faqsBlock = '';
  if (faqs.length > 0) {
    faqsBlock = '\n\nFAQS:';
    for (const faq of faqs) faqsBlock += '\nQ: ' + faq.question + '\nA: ' + faq.answer + '\n';
  }

  let scenariosBlock = '';
  if (scenarios.length > 0) {
    scenariosBlock = '\n\nSPECIAL SCENARIOS:';
    for (const sc of scenarios) scenariosBlock += '\nSituation: ' + sc.situation + '\nResponse: ' + sc.response + '\n';
  }

  let bookingBlock = '';
  if (brain.booking_type) {
    const bt = { whatsapp: 'via WhatsApp', call: 'by calling', both: 'via WhatsApp or by calling' };
    bookingBlock = '\n\nBOOKING: Customers book ' + (bt[brain.booking_type] || 'via WhatsApp') + '.';
    if (brain.deposit_required && brain.deposit_amount) bookingBlock += ' Deposit: ' + brain.deposit_amount + ' required.';
    if (brain.cancellation_notice && brain.cancellation_notice !== 'none') bookingBlock += ' Cancellation: ' + brain.cancellation_notice + ' notice required.';
  }

  let neverBlock = '';
  if (brain.never_discuss) neverBlock = '\n\nNEVER discuss: ' + brain.never_discuss;
  const handoverNumber = brain.handover_number || '';

  return 'You are ' + name + ', the AI receptionist for ' + salonName + '.\n\n'
    + toneInstructions + '\n\n'
    + 'CRITICAL RULES - NEVER BREAK THESE:\n'
    + '1. ONLY mention services and prices listed below. NEVER invent anything.\n'
    + '2. NEVER mention prices unless the customer directly asks about price or cost.\n'
    + '3. NEVER mention service duration unless the customer directly asks how long it takes. If asked, give approximate time from the services data.\n'
    + 'IMPORTANT: When customer asks for service list, list ONLY services from the SERVICES OFFERED section below. Use EXACT names and prices from the list. NEVER use dollar signs - always use AED. NEVER mention services not in the list.\n'
    + 'SUBCATEGORIES: When customer asks about a category that has subcategories (e.g. Hair), ask which subcategory they want (e.g. Women Hair or Men Hair?) before listing services.\n'
    + '2. Detect customer language and ALWAYS reply in the SAME language. Handle Arabic, English and mixed naturally.\n'
    + '3. If message contains: complaint, refund, urgent, emergency, terrible, awful - hand off to human immediately.\n'
    + '4. NEVER give medical, legal or financial advice. If off-topic, warmly redirect to salon services.\n'
    + '5. BOOKING FLOW - follow exactly, never skip steps, never repeat questions:\n'
    + '   STEP 1: Customer wants to book -> confirm service and ask: What date works for you?\n'
    + '   STEP 2: Customer gives date -> ask: What is your name?\n'
    + '   STEP 3: Customer gives name -> ask: What is the best phone number to reach you?\n'
    + '   STEP 4: You have service + date + name + phone -> reply EXACTLY: BOOKING_COMPLETE:[service]|[date]|[name]|[phone]\n'
    + '   IMPORTANT: Never ask for info already given. Never repeat a question.\n'
    + '6. NEVER confirm actual availability. Always say subject to confirmation by the team.\n'
    + '7. When introducing yourself: Hi! I am ' + name + ', the AI receptionist for ' + salonName + '. How can I help you today?\n'
    + neverBlock + '\n\n'
    + 'HANDOVER: If you need to hand off say exactly: I am sorry to hear that. Let me connect you with our team right away, someone will be with you shortly.\n'
    + servicesBlock + packagesBlock + hoursBlock + bookingBlock + faqsBlock + scenariosBlock
    + '\n\nRemember: You represent ' + salonName + '. Be helpful, accurate, never make up information.';
}

function getConversationHistory(businessId, customerPhone, limit) {
  limit = limit || 10;
  try {
    const rows = db.prepare('SELECT role, content FROM ai_conversations WHERE business_id = ? AND customer_phone = ? ORDER BY created_at DESC LIMIT ?').all(businessId, customerPhone, limit);
    return rows.reverse();
  } catch(e) { return []; }
}

function saveMessage(businessId, customerPhone, role, content) {
  try {
    db.prepare('INSERT INTO ai_conversations (business_id, customer_phone, role, content, created_at) VALUES (?, ?, ?, ?, ?)').run(businessId, customerPhone, role, content, new Date().toISOString());
  } catch(e) {}
}

function clearHistory(businessId, customerPhone) {
  try {
    db.prepare('DELETE FROM ai_conversations WHERE business_id = ? AND customer_phone = ?').run(businessId, customerPhone);
  } catch(e) {}
}

function needsHandover(text) {
  const lower = text.toLowerCase();
  const triggers = ['refund','complaint','terrible','awful','wrong order','urgent','emergency','i hate','connect me to owner','speak to owner','talk to owner','need help','speak to someone','talk to someone','speak to manager','talk to manager','human please','real person'];
  return triggers.some(t => lower.includes(t));
}

function saveBookingSubmission(businessId, customerPhone, service, date, name, phone) {
  try {
    const biz = db.prepare('SELECT name FROM businesses WHERE id = ?').get(businessId);
    const countRow = db.prepare('SELECT COUNT(*) as cnt FROM submissions WHERE business_id = ?').get(businessId);
    const counter = (countRow ? countRow.cnt : 0) + 1;
    const data = {
      'Service': service,
      'Preferred Date': date,
      'Customer Name': name,
      'Customer Phone': phone,
      'Channel': 'WhatsApp (AI Secretary)',
      'WhatsApp Number': customerPhone,
      '_source': 'ai_secretary'
    };
    const result = db.prepare('INSERT INTO submissions (business_id, data, status, business_submission_number) VALUES (?, ?, ?, ?)').run(businessId, JSON.stringify(data), 'new', counter);
    const subId = Number(result.lastInsertRowid);
    log.info({ businessId, subId, customerPhone }, 'AI Secretary booking saved');
    sendTelegramNotification(businessId,
      'New Booking Request #' + counter + '\n'
      + 'From: ' + name + ' (' + phone + ')\n'
      + 'Service: ' + service + '\n'
      + 'Date: ' + date + '\n'
      + 'WhatsApp: ' + customerPhone
    ).catch(e => log.error({ err: e }, 'Telegram notify failed'));
    return counter;
  } catch(e) {
    log.error({ err: e }, 'Failed to save booking submission');
    return null;
  }
}

export async function handleAISecretary(businessId, customerPhone, customerName, incomingText, brain) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log.error('ANTHROPIC_API_KEY not set');
    return { type: 'text', body: 'Sorry, our AI assistant is temporarily unavailable. Please contact us directly.' };
  }
  if (needsHandover(incomingText)) {
    const msg = 'I am sorry to hear that. Let me connect you with our team right away  someone will be with you shortly.';
    saveMessage(businessId, customerPhone, 'user', incomingText);
    saveMessage(businessId, customerPhone, 'assistant', msg);
    sendTelegramNotification(businessId,
      'Handover Required\nCustomer: ' + customerName + '\nWhatsApp: ' + customerPhone + '\nMessage: ' + incomingText
    ).catch(e => log.error({ err: e }, 'Telegram handover notify failed'));
    return { type: 'text', body: msg };
  }
  const history = getConversationHistory(businessId, customerPhone, 10);
  const systemPrompt = buildSystemPrompt(brain);
  const messages = [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: incomingText }];
  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 1024, system: messages.find(m => m.role === 'system') ? messages.find(m => m.role === 'system').content : '', messages: messages.filter(m => m.role !== 'system') }),
    });
    const json = await res.json();
    if (json.error) {
      log.error({ error: json.error }, 'OpenAI API error');
      return { type: 'text', body: 'Sorry, I am having trouble right now. Please contact us directly.' };
    }
    let reply = json.content && json.content[0] && json.content[0].text ? json.content[0].text.trim() : null;
    if (!reply) return { type: 'text', body: 'Sorry, I could not process that. Please try again.' };
    saveMessage(businessId, customerPhone, 'user', incomingText);
    if (reply.includes('BOOKING_COMPLETE:')) {
      try {
        const raw = reply.split('BOOKING_COMPLETE:')[1].split('\n')[0].trim();
        const parts = raw.split('|');
        const service = (parts[0] || '').trim() || 'Not specified';
        const date    = (parts[1] || '').trim() || 'Not specified';
        const name    = (parts[2] || '').trim() || customerName;
        const phone   = (parts[3] || '').trim() || customerPhone;
        const refNum = saveBookingSubmission(businessId, customerPhone, service, date, name, phone);
        clearHistory(businessId, customerPhone);
        const confirmMsg = 'Your booking request has been received!\n\n'
          + 'Service: ' + service + '\n'
          + 'Date: ' + date + '\n'
          + 'Name: ' + name + '\n'
          + 'Reference: #BK-' + (refNum || Math.floor(Math.random()*9000+1000)) + '\n\n'
          + 'Our team will contact you within 1 hour to confirm. Thank you ' + name + '!';
        saveMessage(businessId, customerPhone, 'assistant', confirmMsg);
        log.info({ businessId, customerPhone }, 'Booking completed');
        return { type: 'text', body: confirmMsg };
      } catch(parseErr) {
        log.error({ err: parseErr }, 'Failed to parse BOOKING_COMPLETE');
      }
    }
    saveMessage(businessId, customerPhone, 'assistant', reply);
    log.info({ businessId, customerPhone, tokens: json.usage && json.usage.total_tokens }, 'AI Secretary replied');
    return { type: 'text', body: reply };
  } catch(err) {
    log.error({ err }, 'AI Secretary fetch error');
    return { type: 'text', body: 'Sorry, I am having trouble right now. Please contact us directly.' };
  }
}

export function isAISecretaryActive(businessId) {
  try {
    const brain = db.prepare('SELECT is_active FROM business_brain WHERE business_id = ?').get(businessId);
    return brain && brain.is_active === 1;
  } catch(e) { return false; }
}

export function getBusinessBrain(businessId) {
  try {
    return db.prepare('SELECT * FROM business_brain WHERE business_id = ?').get(businessId);
  } catch(e) { return null; }
}
