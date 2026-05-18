import db from "./db.js";
import { createLogger } from "./logger.js";
import { sendTelegramNotification, sendTelegramNotificationWithButtons, sendTelegramReply } from "./telegram.js";

const log = createLogger("ai-secretary");
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

function buildDataSection(brain) {
  let services = [], packages = [], faqs = [], scenarios = [], hours = {};
  try { services = JSON.parse(brain.services || "[]"); if (typeof services === "string") services = JSON.parse(services); } catch(e) { services = []; }
  try { packages = JSON.parse(brain.packages || "[]"); if (typeof packages === "string") packages = JSON.parse(packages); } catch(e) { packages = []; }
  try { faqs = JSON.parse(brain.faqs || "[]"); if (typeof faqs === "string") faqs = JSON.parse(faqs); } catch(e) { faqs = []; }
  try { scenarios = JSON.parse(brain.scenarios || "[]"); if (typeof scenarios === "string") scenarios = JSON.parse(scenarios); } catch(e) { scenarios = []; }
  try { hours = JSON.parse(brain.hours || "{}"); if (typeof hours === "string") hours = JSON.parse(hours); } catch(e) { hours = {}; }

  let out = "";

  if (services.length > 0) {
    out += "\nSERVICES WE OFFER:\n";
    for (const cat of services) {
      out += "\n" + cat.category + ":\n";
      for (const sub of (cat.subcategories || [])) {
        out += "  " + sub.name + ":\n";
        for (const svc of (sub.items || [])) {
          out += "    - " + svc.name;
          if (svc.price_from || svc.price_to) {
            const p = svc.price_from && svc.price_to ? "AED " + svc.price_from + "-" + svc.price_to : "AED " + (svc.price_from || svc.price_to);
            out += " (" + p + ")";
          }
          if (svc.duration) out += " - " + svc.duration + " min";
          out += "\n";
        }
      }
    }
  }

  if (packages.length > 0) {
    out += "\nPACKAGES:\n";
    for (const pkg of packages) {
      out += "  - " + pkg.name;
      if (pkg.price) out += " (AED " + pkg.price + ")";
      if (pkg.includes) out += ": " + pkg.includes;
      out += "\n";
    }
  }

  const dayLabels = {sunday:"Sunday",monday:"Monday",tuesday:"Tuesday",wednesday:"Wednesday",thursday:"Thursday",friday:"Friday",saturday:"Saturday"};
  const lines = [];
  for (const [k, label] of Object.entries(dayLabels)) {
    const d = hours[k];
    if (d && d.closed) lines.push("  " + label + ": Closed");
    else if (d && d.open && d.close) lines.push("  " + label + ": " + d.open + " - " + d.close);
  }
  if (lines.length) out += "\nBUSINESS HOURS:\n" + lines.join("\n") + "\n";

  if (brain.booking_type) {
    const bt = { whatsapp: "WhatsApp", call: "phone call", both: "WhatsApp or phone" };
    out += "\nBOOKING POLICY: Customers book via " + (bt[brain.booking_type] || "WhatsApp") + ".";
    if (brain.deposit_required && brain.deposit_amount) out += " Deposit required: " + brain.deposit_amount + ".";
    if (brain.cancellation_notice && brain.cancellation_notice !== "none") out += " Cancellation: " + brain.cancellation_notice + " notice.";
    out += "\n";
  }

  if (faqs.length > 0) {
    out += "\nFAQS:\n";
    for (const f of faqs) out += "Q: " + f.q + "\nA: " + f.a + "\n";
  }

  if (scenarios.length > 0) {
    out += "\nSPECIAL SITUATIONS:\n";
    for (const s of scenarios) out += "- " + s.situation + " -> " + s.response + "\n";
  }

  if (brain.never_discuss) out += "\nDO NOT DISCUSS: " + brain.never_discuss + "\n";

  return out;
}

function buildSystemPrompt(brain) {
  const name = brain.ai_name || "Luna";
  const salonName = brain.salon_name_en || "the salon";
  const dataSection = buildDataSection(brain);

  return `You are ${name}, a real human receptionist working at ${salonName}. You text customers on WhatsApp.

You are NOT a chatbot. You are NOT formal. You are a warm, friendly receptionist who happens to text. Messages should feel like a real staff member texting a customer.

# How you talk
- Short messages. 1-2 lines, max 3.
- One question at a time.
- React naturally to what customer says.
- Casual emojis when natural (\u{1F485} \u{2728} \u{1F60A}). Not in every message.
- NEVER use bullet lists in normal conversation. Only when customer asks "show me your services" or "what do you offer".

# Language matching - most important
Detect customer language from their first message. Reply ONLY in that exact language for the entire conversation. If customer switches, follow them.

NEVER mix languages. NEVER add translations. NEVER greet in two languages.

# Greetings and intro
CRITICAL: Look at the conversation history. If there are ANY previous messages with this customer, you have ALREADY introduced yourself. In that case:
- DO NOT say hello/hi/salam again
- DO NOT say your name again
- DO NOT say I am fine thanks " again
- Just answer their question directly with no greeting words at all

Only introduce yourself if conversation history is completely empty (the very first message ever).

# Booking flow
Need 5 things: specific service, preferred date, preferred time, name, phone. Be smart:
- Extract everything customer gives, only ask for whats missing.
- If customer named only category (Hair, Nails) without specific service, ask which specific in one casual question.
- GENDER RULE: If the salon has both Men and Women versions of the same service (e.g. Men Haircut + Women Haircut and Blowdry), and the customer has NOT specified gender, ALWAYS ask 'Is this for men or women?' BEFORE picking a service. Never assume gender.
- If customer says "first available", "any time", "ASAP", "whenever" - accept it as date and move on.
- For time: ALWAYS get a specific time (e.g. 10am, 2pm, 14:00). Never accept vague answers like 'morning', 'afternoon', 'evening'. If customer says 'morning', ask 'What time exactly? We are open [opening hours]'.
- Once you have all 5 pieces of info, you MUST do BOTH in the same response:
  (a) Call the save_booking tool
  NOTE: First name only. Never ask for last name.
  (b) Write a short warm confirmation message in the EXACT SAME LANGUAGE the customer was using.
  NEVER call the tool silently. NEVER use English if customer used another language.
  Persian customer needs Persian confirmation. Arabic needs Arabic. English needs English.
# Post-booking notes
If customer adds notes AFTER booking is confirmed (special requests, preferences):
- Acknowledge warmly
- Call add_booking_note tool to save the note

NEVER confirm time slot availability. Always say team will confirm.

# Handover
If customer says: complaint, refund, urgent, emergency, "I hate", "terrible", speak to manager, real person, cancel/reschedule existing booking, medical questions - call request_handover tool immediately. Don't try to handle yourself.

# Hard rules
- ONLY mention services in SALON DATA below. NEVER invent anything.
- PRICE RULE: NEVER mention any price or cost unless customer directly asks how much, what is the price, , قی,  ا". Not even when listing services or explaining differences.
- DURATION RULE: NEVER mention how long a service takes unless customer directly asks. When they DO ask, answer with the approximate duration from the service data IMMEDIATELY in one line, then continue. Never deflect or dodge the duration question. چقدر طول می,  -H -d .gitignore ENDOFFILE EOF V2_SYSTEM_REPORT.md client ". Not even when explaining differences.server 
- When explaining differences between services, only describe what the service IS and how it feels/looks/lasts. Never mention price or time.
- If service not in data, say we don't currently offer that.
- If asked if you're a bot, be honest warmly: "I'm an AI assistant helping the team."

# SALON DATA - use only this
${dataSection}
`;
}

const TOOLS = [
  {
    name: "save_booking",
    description: "Save a confirmed booking. Call ONLY when you have all 3 required pieces: specific service, preferred date, and customer name.",
    input_schema: {
      type: "object",
      properties: {
        service: { type: "string", description: "Specific service (e.g. Gel Manicure, Haircut and Blowdry)" },
        preferred_date: { type: "string", description: "When (e.g. tomorrow, next Monday)" },
        preferred_time: { type: "string", description: "Exact specific time (e.g. 10am, 14:00, 2:30pm)  never vague like morning/afternoon" },
        customer_name: { type: "string", description: "Customer name" },
      },
      required: ["service", "preferred_date", "preferred_time", "customer_name"]
    }
  },
  {
    name: "add_booking_note",
    description: "Add a special note to the most recent booking for this customer. Call when customer adds requests or notes after booking is confirmed.",
    input_schema: {
      type: "object",
      properties: {
        note: { type: "string", description: "The customer's special request or note" }
      },
      required: ["note"]
    }
  },
  {
    name: "request_handover",
    description: "Call when customer needs human help: complaint, refund, urgent, asks for manager, cancel/reschedule, medical, or anything you cannot handle.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Brief reason for handover" }
      },
      required: ["reason"]
    }
  },
  {
    name: "request_reschedule",
    description: "Call when customer wants to reschedule their existing confirmed appointment. First use check_availability to find free slots, present them to customer, then call this with the new date and time they chose.",
    input_schema: {
      type: "object",
      properties: {
        new_date: { type: "string", description: "New date in YYYY-MM-DD format" },
        new_time: { type: "string", description: "New time in HH:MM format e.g. 14:00" }
      },
      required: ["new_date", "new_time"]
    }
  },
  {
    name: "confirm_reschedule",
    description: "Call when customer agrees to one of the offered reschedule slots. Pass the slot key exactly as given in the context.",
    input_schema: {
      type: "object",
      properties: {
        chosen_slot: { type: "string", description: "Slot key e.g. 2026-06-15:10" }
      },
      required: ["chosen_slot"]
    }
  },
  {
    name: "reject_reschedule",
    description: "Call when customer says none of the offered slots work or suggests a different time.",
    input_schema: {
      type: "object",
      properties: {
        suggestion: { type: "string", description: "Customer suggested time if any" }
      },
      required: []
    }
  },
  {
    name: 'cancel_booking',
    description: 'Call when customer wants to cancel their existing booking. Use getCustomerActiveBookings to find their booking first if needed.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for cancellation if given' }
      },
      required: []
    }
  },
  {
    name: 'get_my_booking',
    description: 'Call when customer asks about their upcoming appointment, wants to know their booking details, or before suggesting reschedule/cancel.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

function addBookingNote(businessId, customerPhone, note) {
  try {
    const sub = db.prepare("SELECT id, data FROM submissions WHERE business_id = ? AND json_extract(data, '$._source') = 'ai_secretary' ORDER BY id DESC LIMIT 1").get(businessId);
    if (sub) {
      const data = JSON.parse(sub.data);
      data["Special Notes"] = (data["Special Notes"] ? data["Special Notes"] + " | " : "") + note;
      db.prepare("UPDATE submissions SET data = ? WHERE id = ?").run(JSON.stringify(data), sub.id);
      log.info({ businessId, subId: sub.id, note }, "Booking note added");
    }
  } catch(e) { log.error({ err: e }, "Failed to add booking note"); }
}

const CONVERSATION_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours
function getHistory(businessId, customerPhone, limit) {
  limit = limit || 10;
  try {
    const latest = db.prepare("SELECT created_at FROM ai_conversations WHERE business_id = ? AND customer_phone = ? ORDER BY created_at DESC LIMIT 1").get(businessId, customerPhone);
    if (latest) {
      const age = Date.now() - new Date(latest.created_at).getTime();
      if (age > CONVERSATION_TIMEOUT_MS) {
        db.prepare("DELETE FROM ai_conversations WHERE business_id = ? AND customer_phone = ?").run(businessId, customerPhone);
        return [];
      }
    }
    const rows = db.prepare("SELECT role, content FROM ai_conversations WHERE business_id = ? AND customer_phone = ? ORDER BY created_at DESC LIMIT ?").all(businessId, customerPhone, limit);
    return rows.reverse().map(r => ({ role: r.role, content: r.content }));
  } catch(e) { return []; }
}

function saveMessage(businessId, customerPhone, role, content) {
  try {
    db.prepare("INSERT INTO ai_conversations (business_id, customer_phone, role, content, created_at) VALUES (?, ?, ?, ?, ?)").run(businessId, customerPhone, role, content, new Date().toISOString());
  } catch(e) {}
}

function clearHistory(businessId, customerPhone) {
  try {
    db.prepare("DELETE FROM ai_conversations WHERE business_id = ? AND customer_phone = ?").run(businessId, customerPhone);
  } catch(e) {}
}

function normalizePhone(phone) {
  if (!phone) return phone;
  // Convert Eastern Arabic/Farsi digits to Western digits
  return String(phone)
    .replace(/[۰-۹]/g, d => d.charCodeAt(0) - 0x06F0)
    .replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x0660)
    .replace(/[^0-9+]/g, '');
}

function saveBookingSubmission(businessId, customerPhone, service, date, time, name, phone, channel = 'whatsapp') {
  phone = normalizePhone(phone);
  try {
    const data = {
      "Service": service,
      "Preferred Date": date,
      "Preferred Time": time || "Not specified",
      "Customer Name": name,
      "Customer Phone": phone,
      "Channel": channel === 'telegram' ? "Telegram (AI Secretary)" : channel === 'instagram' ? "Instagram (AI Secretary)" : "WhatsApp (AI Secretary)",
      "WhatsApp Number": channel === 'whatsapp' ? customerPhone : (phone || null),
      "_source": "ai_secretary",
      "_channel": channel,
      "_channel_id": customerPhone
    };
    // If same service already has an open booking from this customer, update it instead of duplicating
    const existing = db.prepare(
      `SELECT id, business_submission_number FROM submissions WHERE business_id = ? AND status = 'new' AND json_extract(data, '$."WhatsApp Number"') = ? AND json_extract(data, '$.Service') = ? AND json_extract(data, '$._source') = 'ai_secretary' ORDER BY id DESC LIMIT 1`
    ).get(businessId, customerPhone, service);
    if (existing) {
      db.prepare("UPDATE submissions SET data = ? WHERE id = ?").run(JSON.stringify(data), existing.id);
      log.info({ businessId, subId: existing.id, customerPhone }, "AI Secretary booking updated (same service)");
      return existing.business_submission_number;
    }
    const countRow = db.prepare("SELECT COUNT(*) as cnt FROM submissions WHERE business_id = ?").get(businessId);
    const counter = (countRow ? countRow.cnt : 0) + 1;
    const result = db.prepare("INSERT INTO submissions (business_id, data, status, business_submission_number) VALUES (?, ?, ?, ?)").run(businessId, JSON.stringify(data), "new", counter);
    const _subId = result.lastInsertRowid;
    log.info({ businessId, subId: _subId, customerPhone }, "AI Secretary booking saved");
    const _tgUser = channel === 'telegram' ? (name && name.startsWith('@') ? name.split(' ')[0] : '') : '';
    const _displayPhone = (phone && phone !== customerPhone) ? phone : (channel !== 'whatsapp' ? (_tgUser ? _tgUser + ' (TG: ' + customerPhone + ')' : 'TG: ' + customerPhone) : customerPhone);
    const _msgText = "🆕 New Booking Request #" + counter + "\n\n"
      + "👤 " + name + "\n"
      + "📱 " + _displayPhone + "\n\n"
      + "📋 " + service + "\n"
      + "📅 " + date + "  ·  " + (time || "Not specified");
    const _buttons = [[
      { text: "✅ Confirm", callback_data: "bk_confirm:" + _subId },
      { text: "❌ Cancel", callback_data: "bk_cancel:" + _subId },
      { text: "📅 Reschedule", callback_data: "bk_reschedule:" + _subId }
    ]];
    sendTelegramNotificationWithButtons(businessId, _msgText, _buttons)
      .then(resp => {
        if (resp && resp.ok && resp.result && resp.result.message_id) {
          try {
            const _sd = JSON.parse(db.prepare('SELECT data FROM submissions WHERE id = ?').get(_subId)?.data || '{}');
            _sd._telegram_msg_id = resp.result.message_id;
            db.prepare('UPDATE submissions SET data = ? WHERE id = ?').run(JSON.stringify(_sd), _subId);
          } catch(e) {}
        }
      })
      .catch(e => log.error({ err: e }, "Telegram notify failed"));
    return counter;
  } catch(e) {
    log.error({ err: e }, "Failed to save booking");
    return null;
  }
}

function _getTgMsgId(businessId, customerPhone) {
  try {
    const _s = db.prepare(`SELECT data FROM submissions WHERE business_id = ? AND json_extract(data, '$._source') = 'ai_secretary' AND (json_extract(data, '$."WhatsApp Number"') = ? OR json_extract(data, '$."Customer Phone"') = ?) ORDER BY id DESC LIMIT 1`).get(businessId, customerPhone, customerPhone);
    return _s ? (JSON.parse(_s.data || '{}')._telegram_msg_id || null) : null;
  } catch(e) { return null; }
}

function sendHandoverNotification(businessId, customerPhone, customerName, reason, lastMessage) {
  const _hText = '🚨 Handover Required\n\n'
    + '👤 ' + customerName + '  —  ' + customerPhone + '\n\n'
    + '💬 Reason: ' + reason + '\n'
    + '📩 \"' + (lastMessage || '').slice(0, 120) + '\"';
  const _hMsgId = _getTgMsgId(businessId, customerPhone);
  (_hMsgId ? sendTelegramReply(businessId, _hText, _hMsgId) : sendTelegramNotification(businessId, _hText))
    .catch(e => log.error({ err: e }, 'Telegram handover notify failed'));
}

export async function handleAISecretary(businessId, customerPhone, customerName, incomingText, brain, imageData = null, channel = 'whatsapp') {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log.error("ANTHROPIC_API_KEY not set");
    return { type: "text", body: "Sorry, our assistant is temporarily unavailable. Please contact us directly." };
  }

  const history = getHistory(businessId, customerPhone, 10);
  const systemPrompt = buildSystemPrompt(brain);
  // Only show reschedule offer if it was created after the latest booking for this customer
  const _latestSub = db.prepare("SELECT id FROM submissions WHERE business_id = ? AND json_extract(data, '$._channel_id') = ? ORDER BY id DESC LIMIT 1").get(businessId, customerPhone);
  const _pendingOffer = db.prepare("SELECT * FROM reschedule_offers WHERE customer_phone = ? AND status = 'pending' AND (" + (_latestSub ? "submission_id = " + _latestSub.id : "1=1") + ") ORDER BY id DESC LIMIT 1").get(customerPhone);
  let finalSystemPrompt = systemPrompt;
  try {
    const { getCalendarStatus: _gcsFsp } = await import('./google-calendar.js');
    if (_gcsFsp(businessId).connected) {
      finalSystemPrompt += '\n\nCALENDAR RULE: Google Calendar is connected. Real available slots are in your context under CALENDAR AVAILABILITY. ONLY suggest those exact times. Never suggest a time not listed there.';
    }
  } catch(_fspErr) {}
  const _dNow = new Date();
  const _curH = _dNow.getHours();
  const _curMin = String(_dNow.getMinutes()).padStart(2,'0');
  const _ampm = _curH >= 12 ? 'PM' : 'AM';
  const _h12 = _curH % 12 || 12;
  const _dubaiTime = _dNow.toISOString().replace('T',' ').slice(0,16);
  // Get actual closing hour from brain for today
  const _todayDow = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][_dNow.getDay()];
  let _closeH = 22;
  try {
    let _bh = JSON.parse(brain?.hours || '{}');
    if (typeof _bh === 'string') { try { _bh = JSON.parse(_bh); } catch(e) { _bh = {}; } }
    if (typeof _bh === 'string') _bh = JSON.parse(_bh);
    if (_bh[_todayDow] && !_bh[_todayDow].closed) _closeH = parseInt(_bh[_todayDow].close.split(':')[0]);
  } catch(e) {}
  const _futureSlots = [];
  for (let _fh = _curH + 1; _fh < _closeH; _fh++) { const _fh12 = _fh > 12 ? _fh - 12 : _fh; const _fap = _fh >= 12 ? 'PM' : 'AM'; _futureSlots.push(_fh + ':00 (=' + _fh12 + ' ' + _fap + ')'); }
  // Channel-specific tool: non-WhatsApp needs phone collection
  let _tools = channel === 'whatsapp' ? TOOLS : TOOLS.map(t => {
    if (t.name !== 'save_booking') return t;
    return { ...t,
      description: 'Save a confirmed booking. Call ONLY when you have all 4 required pieces: specific service, preferred date, customer name, and customer phone number.',
      input_schema: { ...t.input_schema,
        properties: { ...t.input_schema.properties, customer_phone: { type: 'string', description: 'Customer phone number  ask naturally as their phone number' } },
        required: [...t.input_schema.required, 'customer_phone']
      }
    };
  });

  // Add check_availability if Google Calendar is connected
  try {
    const { getCalendarStatus } = await import('./google-calendar.js');
    const _calSt = getCalendarStatus(businessId);
    if (_calSt.connected) {
      _tools = [..._tools, {
        name: "check_availability",
        description: "Check real available appointment slots from Google Calendar. Call this BEFORE suggesting times or accepting a booking. Resolve natural language dates to YYYY-MM-DD format.",
        input_schema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date in YYYY-MM-DD format e.g. 2026-05-20" },
            service_name: { type: "string", description: "Exact service name e.g. Gel Manicure, Haircut and Blowdry  used to calculate correct slot duration" }
          },
          required: ["date"]
        }
      }];
      _tools = _tools.map(t => t.name === 'save_booking' ? {
        ...t,
        description: t.description + ' Calendar connected: use YYYY-MM-DD for preferred_date.'
      } : t);
    }
  } catch(_gcalInitErr) { /* google calendar not configured */ }

  const _dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const _todayDateStr = _dNow.getFullYear() + '-' + String(_dNow.getMonth()+1).padStart(2,'0') + '-' + String(_dNow.getDate()).padStart(2,'0');
  const _tomorrowDate = new Date(_dNow); _tomorrowDate.setDate(_tomorrowDate.getDate() + 1);
  const _tomorrowDateStr = _tomorrowDate.getFullYear() + '-' + String(_tomorrowDate.getMonth()+1).padStart(2,'0') + '-' + String(_tomorrowDate.getDate()).padStart(2,'0');
  let _dynamicCtx = 'CURRENT DUBAI DATE & TIME: ' + _dayNames[_dNow.getDay()] + ' ' + _todayDateStr + ' at ' + String(_curH).padStart(2,'0') + ':' + _curMin + ' (' + _h12 + ':' + _curMin + ' ' + _ampm + '). TOMORROW IS: ' + _dayNames[_tomorrowDate.getDay()] + ' ' + _tomorrowDateStr + '. ' +
    'Hours still available today: ' + (_futureSlots.length ? _futureSlots.join(', ') : 'no more slots today') + '. ' +
    'PM conversion: 1PM=13, 2PM=14, 3PM=15, 4PM=16, 5PM=17, 6PM=18, 7PM=19, 8PM=20, 9PM=21, 10PM=22. ' +
    'ONLY reject a time if it does NOT appear in the available hours list above.';
  if (channel !== 'whatsapp') _dynamicCtx += ' This customer is on ' + channel + '.';
  // Calendar prefetch: inject real availability into context
  let _calendarConnected = false;
  try {
    const { getCalendarStatus: _gcs } = await import('./google-calendar.js');
    if (_gcs(businessId).connected) {
      _calendarConnected = true;
      const { getAvailableSlots: _gas } = await import('./google-calendar.js');
      const _ts = await _gas(businessId, _todayDateStr, 60).catch(() => null);
      const _tms = await _gas(businessId, _tomorrowDateStr, 60).catch(() => null);
      log.info({ todaySlots: _ts && _ts.slots && _ts.slots.length, tomorrowSlots: _tms && _tms.slots && _tms.slots.length }, 'calendar prefetch');
      let _calCtx = '\n\nCALENDAR AVAILABILITY - USE ONLY THESE TIMES (ignore brain hours for booking):';
      _calCtx += '\nToday ' + _todayDateStr + ' (' + _dayNames[_dNow.getDay()] + '): ' + (_ts && _ts.available ? 'slots: ' + _ts.slots.join(', ') : 'no slots available today');
      _calCtx += '\nTomorrow ' + _tomorrowDateStr + ' (' + _dayNames[_tomorrowDate.getDay()] + '): ' + (_tms && _tms.available ? 'slots: ' + _tms.slots.join(', ') : 'no slots available tomorrow');
      _calCtx += '\nFor other dates use check_availability tool. NEVER suggest a time not listed above.';
      _dynamicCtx += _calCtx;
    }
  } catch(_ce) { log.warn({ err: _ce.message }, 'calendar prefetch failed'); }
  // Detect language from earliest customer messages and lock it
  const _custMsgs = history.filter(h => h.role === 'user').map(h => h.content).join(' ') + ' ' + incomingText;
  const _lockHasPersian = /[\u067E\u0686\u06CC\u06A9\u06AF]/.test(_custMsgs);
  const _lockHasArabic = /[\u0600-\u06FF]/.test(_custMsgs) && !_lockHasPersian;
  _dynamicCtx += '\n\n⚠️ LANGUAGE LOCK: Detect the language of the customer\'s FIRST message in this conversation. Reply in that EXACT language for every single message, no matter what. If they mix languages, still reply only in their original language. NEVER switch languages mid-conversation. NEVER reply in English if the customer started in another language.';
  if (_pendingOffer) {
    const _slots = JSON.parse(_pendingOffer.offered_slots || '[]');
    const _D = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const _Mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const _slotList = _slots.map(s => { const _p = s.split(':'); const _d = new Date(_p[0] + 'T00:00:00'); return '- ' + _D[_d.getDay()] + ', ' + _Mo[_d.getMonth()] + ' ' + _d.getDate() + ' at ' + _p[1] + ':00'; }).join('\n');
    const _slotKeys = JSON.parse(_pendingOffer.offered_slots || '[]');
    _dynamicCtx += '\n\n\u26A0 PENDING RESCHEDULE: Customer is responding to a reschedule offer.\n\nEXACT valid slot keys (YYYY-MM-DD:HH): ' + _slotKeys.join(', ') + '\n\nDisplayed to customer as:\n' + _slotList + '\n\nSTRICT RULES:\n1. ONLY the slot keys above are valid. No other time is acceptable.\n2. If customer picks a time NOT matching any key above  call reject_reschedule with their suggestion.\n3. If customer picks a time matching one of the keys  call confirm_reschedule with that exact key.\n4. Example: if keys are 2026-05-13:11, 2026-05-13:13 and customer says Wednesday 12  that is NOT valid  call reject_reschedule.\n5. Never accept a time that is not in the exact key list.';
  }
  let userContent;
  if (imageData && imageData.base64) {
    userContent = [
      { type: "image", source: { type: "base64", media_type: imageData.mimeType || "image/jpeg", data: imageData.base64 } },
      { type: "text", text: incomingText || "What is in this image?" }
    ];
  } else {
    userContent = incomingText;
  }
  const messages = [...history, { role: "user", content: userContent }];

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        temperature: 0.3,
        system: [{ type: 'text', text: finalSystemPrompt, cache_control: { type: 'ephemeral' } }, { type: 'text', text: _dynamicCtx }],
        tools: _tools,
        messages: messages,
      }),
    });

    const json = await res.json();

    if (json.error) {
      log.error({ error: json.error }, "Anthropic API error");
      return { type: "text", body: "Sorry, I am having trouble right now. Please contact us directly." };
    }

    let textReply = "";
    let toolUse = null;

    if (json.content && Array.isArray(json.content)) {
      for (const block of json.content) {
        if (block.type === "text") textReply += block.text;
        else if (block.type === "tool_use") toolUse = block;
      }
    }

    saveMessage(businessId, customerPhone, "user", incomingText);

    if (toolUse) {
      if (toolUse.name === "save_booking") {
        const input = toolUse.input || {};
        // Phase 2: use booking engine if staff configured
        const _staffCount = db.prepare('SELECT COUNT(*) as c FROM staff WHERE business_id = ? AND is_active = 1').get(businessId);
        if (_staffCount && _staffCount.c > 0 && input.preferred_date && /^\d{4}-\d{2}-\d{2}$/.test(input.preferred_date)) {
          try {
            const { createBooking, detectLanguage } = await import('./booking-engine.js');
            const _lang = detectLanguage(incomingText);
            let _normTime = String(input.preferred_time || '09:00').trim();
            const _tm = _normTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
            if (_tm) { let _th=parseInt(_tm[1]); const _tmm=(_tm[2]||'00'); const _tap=(_tm[3]||'').toLowerCase(); if(_tap==='pm'&&_th!==12)_th+=12; if(_tap==='am'&&_th===12)_th=0; _normTime=String(_th).padStart(2,'0')+':'+_tmm; }
            let _dur=60;
            const _svc=db.prepare('SELECT duration_minutes,staff_specialty FROM services WHERE business_id=? AND is_active=1 AND LOWER(name)=LOWER(?) LIMIT 1').get(businessId,input.service||'');
            if(_svc)_dur=_svc.duration_minutes;
            const _result=await createBooking({businessId,customerPhone,customerName:input.customer_name||customerName,channel,channelId:customerPhone,service:input.service||'Service',date:input.preferred_date,time:_normTime,durationMinutes:_dur,specialty:_svc?.staff_specialty||'any',language:_lang});
            const _cn=input.customer_name||customerName||'';
            const _sf=_result.staffName?' with '+_result.staffName:'';
            const _hp=/[پچیکگ]/.test(incomingText);
            const _ha=/[؀-ۿ]/.test(incomingText)&&!_hp;
            let _ar;
            if(_hp)_ar='ممنون '+_cn+' جان! رزروت '+(_result.staffName?'با '+_result.staffName+' ':'')+' ثبت شد ✅ '+input.preferred_date+' ساعت '+_normTime;
            else if(_ha)_ar='تمام '+_cn+'! حجزك مؤكد'+(_result.staffName?' مع '+_result.staffName:'')+' ✅ '+input.preferred_date+' الساعة '+_normTime;
            else _ar=textReply.trim()||('All set '+_cn+'! Confirmed'+_sf+' ✅ '+input.preferred_date+' at '+_normTime);
            saveMessage(businessId,customerPhone,'assistant',_ar);
            log.info({businessId,customerPhone,bookingId:_result.bookingId,staffName:_result.staffName},'Auto booking created');
            return {type:'text',body:_ar};
          } catch(_beErr){ log.warn({err:_beErr.message},'Booking engine failed, falling back'); }
        }
        // Validate against calendar before saving
        if (_calendarConnected && input.preferred_date && /^\d{4}-\d{2}-\d{2}$/.test(input.preferred_date)) {
          try {
            const { getAvailableSlots: _gasChk } = await import('./google-calendar.js');
            const _chkResult = await _gasChk(businessId, input.preferred_date, 75, input.service).catch(() => null);
            if (_chkResult && input.preferred_time) {
              const _tMatch = String(input.preferred_time).match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
              if (_tMatch) {
                let _tH = parseInt(_tMatch[1]);
                const _tM = (_tMatch[2] || '00');
                const _tAmpm = (_tMatch[3] || '').toLowerCase();
                if (_tAmpm === 'pm' && _tH !== 12) _tH += 12;
                if (_tAmpm === 'am' && _tH === 12) _tH = 0;
                const _tStr = String(_tH).padStart(2,'0') + ':' + _tM;
                if (_chkResult.slots && !_chkResult.slots.includes(_tStr)) {
                  const _avail = _chkResult.slots.slice(0,5).join(', ') || 'none today';
                  const _takenMsg = "Sorry, " + input.preferred_time + " is no longer available on " + input.preferred_date + ". Available: " + _avail + ". Which works for you?";
                  saveMessage(businessId, customerPhone, "assistant", _takenMsg);
                  return { type: "text", body: _takenMsg };
                }
              }
            }
          } catch(_chkErr) { log.warn({ err: _chkErr.message }, 'Pre-save calendar check failed'); }
        }
        const refNum = saveBookingSubmission(
          businessId, customerPhone,
          input.service || "Not specified",
          input.preferred_date || "Not specified",
                  input.preferred_time || "Not specified",
          input.customer_name || customerName,
          input.customer_phone || customerPhone,
          channel
        );
        // Generate confirmation in customer language
        const _allText = incomingText + (history.map(h=>h.content).join(""));
        const hasPersian = /[\u067E\u0686\u06CC\u06A9\u06AF]/.test(_allText);
        const hasArabic = /[\u0600-\u06FF]/.test(_allText) && !hasPersian;
        const custName = (toolUse.input && toolUse.input.customer_name) || "";
        let finalReply;
        if (hasPersian) finalReply = "\u0645\u0645\u0646\u0648\u0646 " + custName + " \u062C\u0627\u0646! \u0631\u0632\u0631\u0648\u062A \u062B\u0628\u062A \u0634\u062F\u060C \u062A\u06CC\u0645 \u0645\u0627 \u0628\u0647 \u0632\u0648\u062F\u06CC \u062A\u0645\u0627\u0633 \u0645\u06CC\u06AF\u06CC\u0631\u0647 \u2728";
        else if (hasArabic) finalReply = "\u062A\u0645\u0627\u0645 " + custName + "! \u062D\u062C\u0632\u0643 \u0633\u062C\u0644\u062A\u060C \u0627\u0644\u0641\u0631\u064A\u0642 \u0647\u064A\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0627\u0643 \u0642\u0631\u064A\u0628 \u2728";
        else finalReply = textReply.trim() || ("All set " + custName + "! Got your booking, our team will reach out shortly \u2728");
        saveMessage(businessId, customerPhone, "assistant", finalReply);
        // Auto mode: create Google Calendar event immediately
        try {
          const { getCalendarStatus, createBookingEvent } = await import('./google-calendar.js');
          const _autoCalSt = getCalendarStatus(businessId);
          if (_autoCalSt.connected && _autoCalSt.confirmationMode === 'auto') {
            const _bDate = input.preferred_date || '';
            const _bTime = input.preferred_time || '09:00';
            if (/^\d{4}-\d{2}-\d{2}$/.test(_bDate)) {
              createBookingEvent(businessId, _bDate, _bTime, 60,
                input.customer_name || customerName, input.service || 'Service',
                input.customer_phone || customerPhone
              ).catch(e => log.warn({ err: e.message }, 'Auto calendar event failed'));
            }
          }
        } catch(_autoCalErr) {}
        // keep history for corrections
        log.info({ businessId, customerPhone, refNum }, "Booking via tool use");
        return { type: "text", body: finalReply };
      }

      if (toolUse.name === "request_handover") {
        const reason = (toolUse.input && toolUse.input.reason) || "customer requested";
        sendHandoverNotification(businessId, customerPhone, customerName, reason, incomingText);
        const _hvHasPersian = /[\u067E\u0686\u06CC\u06A9\u06AF]/.test(incomingText + (history.map(h=>h.content).join("")));
        const _hvHasArabic = /[\u0600-\u06FF]/.test(incomingText + (history.map(h=>h.content).join(""))) && !_hvHasPersian;
        const _hvFallback = _hvHasPersian ? "\u0645\u062A\u0623\u0633\u0641\u0645. \u0628\u0630\u0627\u0631\u06CC\u062F \u062A\u06CC\u0645 \u0645\u0627 \u0628\u0627 \u0634\u0645\u0627 \u062A\u0645\u0627\u0633 \u0628\u06AF\u06CC\u0631\u062F." : (_hvHasArabic ? "\u0622\u0633\u0641. \u0633\u064A\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0643 \u0641\u0631\u064A\u0642\u0646\u0627 \u0642\u0631\u064A\u0628\u0627\u064B." : "I am sorry to hear that. Let me connect you with our team right away - someone will be with you shortly.");
        const finalReply = textReply.trim() || _hvFallback;
        saveMessage(businessId, customerPhone, "assistant", finalReply);
        log.info({ businessId, customerPhone, reason }, "Handover via tool use");
        return { type: "text", body: finalReply };
      }
      if (toolUse.name === "add_booking_note") {
        const note = (toolUse.input && toolUse.input.note) || "";
        if (note) addBookingNote(businessId, customerPhone, note);
        const _noteHasPersian = /[\u067E\u0686\u06CC\u06A9\u06AF]/.test(incomingText + (history.map(h=>h.content).join("")));
        const _noteHasArabic = /[\u0600-\u06FF]/.test(incomingText + (history.map(h=>h.content).join(""))) && !_noteHasPersian;
        const _noteFallback = _noteHasPersian ? "\u0645\u062A\u0648\u062C\u0647 \u0634\u062F\u0645! \u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0628\u0631\u0627\u06CC \u062A\u06CC\u0645 \u062B\u0628\u062A \u0634\u062F \u2728" : (_noteHasArabic ? "\u062A\u0645! \u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629 \u2728" : "Got it! I have noted that for the team.");
        const finalReply = textReply.trim() || _noteFallback;
        saveMessage(businessId, customerPhone, "assistant", finalReply);
        log.info({ businessId, customerPhone, note }, "Booking note added via tool");
        return { type: "text", body: finalReply };
      }
      if (toolUse.name === "request_reschedule") {
        const _rrInput = toolUse.input || {};
        const _rrNewDate = _rrInput.new_date || '';
        const _rrNewTime = _rrInput.new_time || '';
        const _rrSub = db.prepare("SELECT * FROM submissions WHERE business_id = ? AND json_extract(data, '$._channel_id') = ? AND status = 'in_progress' ORDER BY id DESC LIMIT 1").get(businessId, customerPhone);
        if (_rrSub && /^\d{4}-\d{2}-\d{2}$/.test(_rrNewDate)) {
          const _rrData = JSON.parse(_rrSub.data || '{}');
          const _rrService = _rrData['Service'] || 'Service';
          const _rrOldDate = _rrData['Preferred Date'] || '';
          const _rrOldTime = _rrData['Preferred Time'] || '';
          const _rrResult = db.prepare("INSERT INTO reschedule_requests (submission_id, business_id, customer_phone, new_date, new_time) VALUES (?, ?, ?, ?, ?)").run(_rrSub.id, businessId, customerPhone, _rrNewDate, _rrNewTime);
          const _rrReqId = _rrResult.lastInsertRowid;
          const _rrMsg = '\u2194\uFE0F Reschedule Request\n\n\uD83D\uDC64 ' + customerName + '\n\uD83D\uDCCB ' + _rrService + '\n\nFrom: ' + _rrOldDate + (_rrOldTime ? ' at ' + _rrOldTime : '') + '\nTo: ' + _rrNewDate + ' at ' + _rrNewTime;
          const _rrButtons = [[{ text: '\u2705 Approve', callback_data: 'bk_reschedule_approve:' + _rrReqId }, { text: '\u274C Keep original', callback_data: 'bk_reschedule_reject:' + _rrReqId }]];
          sendTelegramNotificationWithButtons(businessId, _rrMsg, _rrButtons).catch(() => {});
        }
        const _rrAllText = incomingText + (history.map(h=>h.content).join(""));
        const _rrHasPersian = /[\u067E\u0686\u06CC\u06A9\u06AF]/.test(_rrAllText);
        const _rrHasArabic = /[\u0600-\u06FF]/.test(_rrAllText) && !_rrHasPersian;
        const _rrReply = _rrHasPersian ? '\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u063A\u06CC\u06CC\u0631 \u0648\u0642\u062A \u0628\u0631\u0627\u06CC \u062A\u06CC\u0645 \u0627\u0631\u0633\u0627\u0644 \u0634\u062F. \u0628\u0647 \u0632\u0648\u062F\u06CC \u062A\u0623\u06CC\u06CC\u062F \u0645\u06CC\u06AF\u06CC\u0631\u06CC\u062F \u2728' : (_rrHasArabic ? '\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0648\u0639\u062F. \u0633\u064A\u062A\u0645 \u062A\u0623\u0643\u064A\u062F\u0647 \u0642\u0631\u064A\u0628\u064B\u0627 \u2728' : "Your reschedule request has been sent to the team. You'll get a confirmation shortly \u2728");
        saveMessage(businessId, customerPhone, "assistant", _rrReply);
        return { type: "text", body: _rrReply };
      }

      if (toolUse.name === "confirm_reschedule") {
        const chosenSlot = (toolUse.input && toolUse.input.chosen_slot) || "";
        const _offer = db.prepare("SELECT * FROM reschedule_offers WHERE customer_phone = ? AND status = 'pending' ORDER BY id DESC LIMIT 1").get(customerPhone);
        if (_offer) {
          db.prepare("UPDATE reschedule_offers SET status = 'accepted', chosen_slot = ? WHERE id = ?").run(chosenSlot, _offer.id);
          const _sub = db.prepare("SELECT * FROM submissions WHERE id = ?").get(_offer.submission_id);
          if (_sub) {
            const _d = JSON.parse(_sub.data || '{}');
            const _sp = chosenSlot.split(':');
            if (_sp[0]) _d['Preferred Date'] = _sp[0];
            if (_sp[1]) _d['Preferred Time'] = _sp[1] + ':00';
            db.prepare("UPDATE submissions SET data = ?, status = 'in_progress' WHERE id = ?").run(JSON.stringify(_d), _offer.submission_id);
          }
          const _sD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
          const _sM = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const _sp2 = chosenSlot.split(':'); const _sd = new Date((_sp2[0] || '') + 'T00:00:00');
          const _label = _sD[_sd.getDay()] + ', ' + _sM[_sd.getMonth()] + ' ' + _sd.getDate() + ' at ' + (_sp2[1] || '') + ':00';
          const _rcSubData = JSON.parse(_sub?.data || '{}');
          const _rcPhone = _rcSubData['WhatsApp Number'] || customerPhone;
          const _rcText = '✅ Reschedule Confirmed!\n\n'
            + '👤 ' + customerName + '  —  ' + _rcPhone + '\n'
            + '📋 ' + (_rcSubData['Service'] || '') + '\n'
            + '📅 ' + _label;
          const _rcMsgId = _getTgMsgId(businessId, customerPhone);
          (_rcMsgId ? sendTelegramReply(businessId, _rcText, _rcMsgId) : sendTelegramNotification(businessId, _rcText)).catch(() => {});
        }
        const _crAllText = incomingText + (history.map(h=>h.content).join(""));
        const _crHasPersian = /[\u067E\u0686\u06CC\u06A9\u06AF]/.test(_crAllText);
        const _crHasArabic = /[\u0600-\u06FF]/.test(_crAllText) && !_crHasPersian;
        const _crParts = chosenSlot.split(':'); const _crDate = _crParts[0] || ''; const _crTime = _crParts[1] ? _crParts[1] + ':00' : '';
        const _crFallback = _crHasPersian ? ('✅ وقت شما تغییر کرد!\n\n📅 ' + _crDate + (_crTime ? '\n🕐 ' + _crTime : '') + '\n\nمنتظرتون هستیم ✨') : (_crHasArabic ? ('✅ تم تغيير موعدك!\n\n📅 ' + _crDate + (_crTime ? '\n🕐 ' + _crTime : '') + '\n\nنراك قريباً ✨') : ('✅ Appointment rescheduled!\n\n📅 ' + _crDate + (_crTime ? '\n🕐 ' + _crTime : '') + '\n\nSee you then ✨'));
        const finalReply = textReply.trim() || _crFallback;
        saveMessage(businessId, customerPhone, "assistant", finalReply);
        return { type: "text", body: finalReply };
      }
      if (toolUse.name === "reject_reschedule") {
        const suggestion = (toolUse.input && toolUse.input.suggestion) || "";
        const _offer2 = db.prepare("SELECT * FROM reschedule_offers WHERE customer_phone = ? AND status = 'pending' ORDER BY id DESC LIMIT 1").get(customerPhone);
        if (_offer2) {
          db.prepare("UPDATE reschedule_offers SET status = 'declined' WHERE id = ?").run(_offer2.id);
          const _sub3 = db.prepare('SELECT * FROM submissions WHERE id = ?').get(_offer2.submission_id);
          const _rrText = '❌ Reschedule Rejected\n\n'
            + '👤 ' + customerName + '  —  ' + customerPhone + '\n'
            + (suggestion ? '💬 Suggestion: \"' + suggestion + '\"\n' : '')
            + '\n📅 Tap Reschedule on the booking to offer new slots.';
          const _rrMsgId = _sub3 ? (JSON.parse(_sub3.data || '{}')._telegram_msg_id || null) : null;
          (_rrMsgId ? sendTelegramReply(businessId, _rrText, _rrMsgId) : sendTelegramNotification(businessId, _rrText)).catch(() => {});
        }
        const finalReply = textReply.trim() || ("I'm sorry those times don't work, " + customerName + "! I'll let the team know and they'll suggest new options.");
        saveMessage(businessId, customerPhone, "assistant", finalReply);
        return { type: "text", body: finalReply };
      }
      if (toolUse.name === 'get_my_booking') {
        const { getCustomerActiveBookings } = await import('./booking-engine.js');
        const _bks = getCustomerActiveBookings(businessId, customerPhone);
        const _hp2 = /[پچیکگ]/.test(incomingText);
        const _ha2 = /[؀-ۿ]/.test(incomingText) && !_hp2;
        let _bkReply;
        if (!_bks.length) {
          _bkReply = _hp2 ? 'رزرو فعالی برایت پیدا نکردم.' : (_ha2 ? 'لم أجد حجزات نشطة.' : 'I do not see any upcoming bookings for you.');
        } else {
          const b = _bks[0];
          const _staffLine = b.staff_name ? (' - ' + b.staff_name) : '';
          _bkReply = _hp2 ? ('رزرو شما: ' + b.service_name + _staffLine + ' | ' + b.date + ' ساعت ' + b.time) : (_ha2 ? ('حجزك: ' + b.service_name + _staffLine + ' | ' + b.date + ' ' + b.time) : ('Your booking: ' + b.service_name + _staffLine + ' | ' + b.date + ' at ' + b.time));
        }
        const _gbReply = textReply.trim() || _bkReply;
        saveMessage(businessId, customerPhone, 'assistant', _gbReply);
        return { type: 'text', body: _gbReply };
      }
            if (toolUse.name === 'cancel_booking') {
        const { getCustomerActiveBookings, cancelBooking } = await import('./booking-engine.js');
        const _bks2 = getCustomerActiveBookings(businessId, customerPhone);
        const _hp3=/[پچیکگ]/.test(incomingText); const _ha3=/[؀-ۿ]/.test(incomingText)&&!_hp3;
        if (!_bks2.length) {
          const _noBook = _hp3 ? 'رزرو فعالی پیدا نکردم.' : (_ha3 ? 'لم أجد حجزات لإلغاءها.' : 'I don\'t see any active booking to cancel.');
          saveMessage(businessId, customerPhone, 'assistant', _noBook); return { type: 'text', body: _noBook };
        }
        const _canResult = await cancelBooking(_bks2[0].id, (toolUse.input&&toolUse.input.reason)||'customer request', businessId);
        let _canReply;
        if (_canResult.success) {
          _canReply = _hp3 ? 'رزروت لغو شد. امیدواریم دوباره ببینیمت 💜' : (_ha3 ? 'تم إلغاء حجزك. نتمنى رؤيتك مجدداً 💜' : 'Your booking has been cancelled. Hope to see you again soon 💜');
        } else if (_canResult.error === 'past_deadline') {
          _canReply = _hp3 ? ('متأسفم، لغو حداقل ' + _canResult.deadlineHours + ' ساعت قبل انجام میشه. میخوایی با تیم صحبت کنیم?') : (_ha3 ? ('آسف، الإلغاء قبل ' + _canResult.deadlineHours + ' ساعة من الموعد. هل تريد التواصل مع الفريق?') : ('Sorry, cancellations must be made ' + _canResult.deadlineHours + 'h before the appointment. Would you like me to connect you with the team?'));
        } else {
          _canReply = textReply.trim() || 'Sorry, I could not process the cancellation. Please contact us directly.';
        }
        saveMessage(businessId, customerPhone, 'assistant', _canReply);
        return { type: 'text', body: _canReply };
      }
      if (toolUse.name === "check_availability") {
        const _caInput = toolUse.input || {};
        let _slotsResult;
        try {
          const { getAvailableSlots } = await import('./google-calendar.js');
          _slotsResult = await getAvailableSlots(businessId, _caInput.date, _caInput.duration_minutes || 60, _caInput.service_name || null);
        } catch(_caErr) {
          _slotsResult = { available: false, reason: 'Could not check calendar: ' + _caErr.message, slots: [], date: _caInput.date };
        }
        const _msgsWithResult = [
          ...messages,
          { role: "assistant", content: json.content },
          { role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(_slotsResult) }] }
        ];
        const _res2 = await fetch(ANTHROPIC_API, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: "claude-sonnet-4-5",
            max_tokens: 1024,
            temperature: 0.3,
            system: [{ type: "text", text: finalSystemPrompt }, { type: "text", text: _dynamicCtx }],
            tools: _tools,
            messages: _msgsWithResult,
          }),
        });
        const _json2 = await _res2.json();
        let _reply2 = "";
        if (_json2.content && Array.isArray(_json2.content)) {
          for (const _b of _json2.content) if (_b.type === "text") _reply2 += _b.text;
          const _toolUse2 = _json2.content.find(b => b.type === "tool_use");
          if (_toolUse2 && _toolUse2.name === "save_booking") {
            const _inp2 = _toolUse2.input || {};
            // Validate time is in available slots before saving
            let _canSave2 = true;
            if (_slotsResult && _slotsResult.slots && _inp2.preferred_time) {
              const _t2m = String(_inp2.preferred_time).match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
              if (_t2m) {
                let _t2h = parseInt(_t2m[1]);
                const _t2mn = (_t2m[2] || '00');
                const _t2ap = (_t2m[3] || '').toLowerCase();
                if (_t2ap === 'pm' && _t2h !== 12) _t2h += 12;
                if (_t2ap === 'am' && _t2h === 12) _t2h = 0;
                const _t2str = String(_t2h).padStart(2,'0') + ':' + _t2mn;
                if (!_slotsResult.slots.includes(_t2str)) _canSave2 = false;
              }
            }
            if (_canSave2) {
              saveBookingSubmission(businessId, customerPhone, _inp2.service || "Service",
                _inp2.preferred_date || "", _inp2.preferred_time || "", _inp2.customer_name || customerName,
                _inp2.customer_phone || customerPhone, channel);
            }
          }
        }
        const _finalReply2 = _reply2.trim() || "Let me check our schedule for you.";
        saveMessage(businessId, customerPhone, "assistant", _finalReply2);
        return { type: "text", body: _finalReply2 };
      }
    }

    if (!textReply.trim()) return { type: "text", body: "Sorry, I could not process that. Please try again." };

    saveMessage(businessId, customerPhone, "assistant", textReply);
    log.info({ businessId, customerPhone, tokens: json.usage && json.usage.output_tokens }, "AI Secretary replied");
    return { type: "text", body: textReply };

  } catch(err) {
    log.error({ err }, "AI Secretary fetch error");
    return { type: "text", body: "Sorry, I am having trouble right now. Please contact us directly." };
  }
}

export function isAISecretaryActive(businessId) {
  try {
    const brain = db.prepare("SELECT is_active FROM business_brain WHERE business_id = ?").get(businessId);
    return brain && brain.is_active === 1;
  } catch(e) { return false; }
}

export function getBusinessBrain(businessId) {
  try {
    return db.prepare("SELECT * FROM business_brain WHERE business_id = ?").get(businessId);
  } catch(e) { return null; }
}
