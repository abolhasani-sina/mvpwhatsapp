import db from "./db.js";
import { createLogger } from "./logger.js";
import { sendTelegramNotification, sendTelegramNotificationWithButtons } from "./telegram.js";

const log = createLogger("ai-secretary");
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

function buildDataSection(brain) {
  let services = [], packages = [], faqs = [], scenarios = [], hours = {};
  try { services = JSON.parse(brain.services || "[]"); } catch(e) {}
  try { packages = JSON.parse(brain.packages || "[]"); } catch(e) {}
  try { faqs = JSON.parse(brain.faqs || "[]"); } catch(e) {}
  try { scenarios = JSON.parse(brain.scenarios || "[]"); } catch(e) {}
  try { hours = JSON.parse(brain.hours || "{}"); } catch(e) {}

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
- If customer says "first available", "any time", "ASAP", "whenever" - accept it as date and move on.
- For time: ask morning/afternoon/evening if not specified. Accept vague answers like "morning" or "after 3pm".
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
- DURATION RULE: NEVER mention how long a service takes unless customer directly asks how long, چقدر طول می,  -H -d .gitignore ENDOFFILE EOF V2_SYSTEM_REPORT.md client ". Not even when explaining differences.server 
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
        preferred_time: { type: "string", description: "Preferred time (e.g. morning, after 3pm, 10am)" },
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

function saveBookingSubmission(businessId, customerPhone, service, date, time, name, phone) {
  phone = normalizePhone(phone);
  try {
    const data = {
      "Service": service,
      "Preferred Date": date,
      "Preferred Time": time || "Not specified",
      "Customer Name": name,
      "Customer Phone": phone,
      "Channel": "WhatsApp (AI Secretary)",
      "WhatsApp Number": customerPhone,
      "_source": "ai_secretary"
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
    const _msgText = "🆕 New Booking Request #" + counter + "\n"
      + "👤 " + name + " — " + customerPhone + "\n"
      + "✨ " + service + "\n"
      + "📅 " + date + "\n"
      + "⏰ " + (time || "Not specified");
    const _buttons = [[
      { text: "✅ Confirm", callback_data: "bk_confirm:" + _subId },
      { text: "❌ Cancel", callback_data: "bk_cancel:" + _subId },
      { text: "📅 Reschedule", callback_data: "bk_reschedule:" + _subId }
    ]];
    sendTelegramNotificationWithButtons(businessId, _msgText, _buttons)
      .catch(e => log.error({ err: e }, "Telegram notify failed"));
    return counter;
  } catch(e) {
    log.error({ err: e }, "Failed to save booking");
    return null;
  }
}

function sendHandoverNotification(businessId, customerPhone, customerName, reason, lastMessage) {
  sendTelegramNotification(businessId,
    "Handover Required\n"
    + "Customer: " + customerName + "\n"
    + "WhatsApp: " + customerPhone + "\n"
    + "Reason: " + reason + "\n"
    + "Last message: " + lastMessage
  ).catch(e => log.error({ err: e }, "Telegram handover notify failed"));
}

export async function handleAISecretary(businessId, customerPhone, customerName, incomingText, brain, imageData = null) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log.error("ANTHROPIC_API_KEY not set");
    return { type: "text", body: "Sorry, our assistant is temporarily unavailable. Please contact us directly." };
  }

  const history = getHistory(businessId, customerPhone, 10);
  const systemPrompt = buildSystemPrompt(brain);
  const _pendingOffer = db.prepare("SELECT * FROM reschedule_offers WHERE customer_phone = ? AND status = 'pending' ORDER BY id DESC LIMIT 1").get(customerPhone);
  let finalSystemPrompt = systemPrompt;
  if (_pendingOffer) {
    const _slots = JSON.parse(_pendingOffer.offered_slots || '[]');
    const _D = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const _Mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const _slotList = _slots.map(s => { const _p = s.split(':'); const _d = new Date(_p[0] + 'T00:00:00'); return '- ' + _D[_d.getDay()] + ', ' + _Mo[_d.getMonth()] + ' ' + _d.getDate() + ' at ' + _p[1] + ':00'; }).join('\n');
    finalSystemPrompt += '\n\n\u26A0 PENDING RESCHEDULE: Customer is responding to a reschedule offer. Offered slots:\n' + _slotList + '\n\nRules: if customer agrees to any slot call confirm_reschedule with slot key (YYYY-MM-DD:HH). If none work or they want different times call reject_reschedule with their suggestion. Do NOT suggest new times yourself.';
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
        system: [{ type: 'text', text: finalSystemPrompt, cache_control: { type: 'ephemeral' } }],
        tools: TOOLS,
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
        const refNum = saveBookingSubmission(
          businessId, customerPhone,
          input.service || "Not specified",
          input.preferred_date || "Not specified",
                  input.preferred_time || "Not specified",
          input.customer_name || customerName,
          input.customer_phone || customerPhone
        );
        // Generate confirmation in customer language
        const hasPersian = /[\u0600-\u06FF]/.test(incomingText) && /[\u067E\u0686\u06CC\u06A9\u06AF]/.test(incomingText + (history.map(h=>h.content).join("")));
        const hasArabic = /[\u0600-\u06FF]/.test(incomingText) && !hasPersian;
        const custName = (toolUse.input && toolUse.input.customer_name) || "";
        let finalReply;
        if (hasPersian) finalReply = "\u0645\u0645\u0646\u0648\u0646 " + custName + " \u062C\u0627\u0646! \u0631\u0632\u0631\u0648\u062A \u062B\u0628\u062A \u0634\u062F\u060C \u062A\u06CC\u0645 \u0645\u0627 \u0628\u0647 \u0632\u0648\u062F\u06CC \u062A\u0645\u0627\u0633 \u0645\u06CC\u06AF\u06CC\u0631\u0647 \u2728";
        else if (hasArabic) finalReply = "\u062A\u0645\u0627\u0645 " + custName + "! \u062D\u062C\u0632\u0643 \u0633\u062C\u0644\u062A\u060C \u0627\u0644\u0641\u0631\u064A\u0642 \u0647\u064A\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0627\u0643 \u0642\u0631\u064A\u0628 \u2728";
        else finalReply = textReply.trim() || ("All set " + custName + "! Got your booking, our team will reach out shortly \u2728");
        saveMessage(businessId, customerPhone, "assistant", finalReply);
        // keep history for corrections
        log.info({ businessId, customerPhone, refNum }, "Booking via tool use");
        return { type: "text", body: finalReply };
      }

      if (toolUse.name === "request_handover") {
        const reason = (toolUse.input && toolUse.input.reason) || "customer requested";
        sendHandoverNotification(businessId, customerPhone, customerName, reason, incomingText);
        const finalReply = textReply.trim() || "I am sorry to hear that. Let me connect you with our team right away - someone will be with you shortly.";
        saveMessage(businessId, customerPhone, "assistant", finalReply);
        log.info({ businessId, customerPhone, reason }, "Handover via tool use");
        return { type: "text", body: finalReply };
      }
      if (toolUse.name === "add_booking_note") {
        const note = (toolUse.input && toolUse.input.note) || "";
        if (note) addBookingNote(businessId, customerPhone, note);
        const finalReply = textReply.trim() || "Got it! I have noted that for the team.";
        saveMessage(businessId, customerPhone, "assistant", finalReply);
        log.info({ businessId, customerPhone, note }, "Booking note added via tool");
        return { type: "text", body: finalReply };
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
          sendTelegramNotification(businessId, '✅ Reschedule confirmed!\n' + customerName + ' chose: ' + _label).catch(() => {});
        }
        const finalReply = textReply.trim() || ('Your appointment has been rescheduled ✨ See you then, ' + customerName + '!');
        saveMessage(businessId, customerPhone, "assistant", finalReply);
        return { type: "text", body: finalReply };
      }
      if (toolUse.name === "reject_reschedule") {
        const suggestion = (toolUse.input && toolUse.input.suggestion) || "";
        const _offer2 = db.prepare("SELECT * FROM reschedule_offers WHERE customer_phone = ? AND status = 'pending' ORDER BY id DESC LIMIT 1").get(customerPhone);
        if (_offer2) {
          db.prepare("UPDATE reschedule_offers SET status = 'declined' WHERE id = ?").run(_offer2.id);
          const _notif = suggestion ? ('❌ Reschedule rejected. Customer suggestion: ' + suggestion) : '❌ Customer could not make any offered times. Please select new slots.';
          sendTelegramNotification(businessId, _notif).catch(() => {});
        }
        const finalReply = textReply.trim() || ("I'm sorry those times don't work, " + customerName + "! I'll let the team know and they'll suggest new options.");
        saveMessage(businessId, customerPhone, "assistant", finalReply);
        return { type: "text", body: finalReply };
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
