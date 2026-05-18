// booking-engine.js  Phase 2 Core
// DB is source of truth. Google Calendar is display only.
// All DB calls are synchronous (better-sqlite3). Calendar calls are async.

import db from './db.js';
import { createLogger } from './logger.js';
import { sendTelegramNotification } from './telegram.js';

const log = createLogger('booking-engine');

export function detectLanguage(text) {
  if (!text) return 'en';
  const hasPersian = /[\u067E\u0686\u06CC\u06A9\u06AF\u0698]/.test(text);
  if (hasPersian) return 'fa';
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  if (hasArabic) return 'ar';
  return 'en';
}

export function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone)
    .replace(/[\u06F0-\u06F9]/g, d => d.charCodeAt(0) - 0x06F0)
    .replace(/[\u0660-\u0669]/g, d => d.charCodeAt(0) - 0x0660)
    .replace(/[^0-9+]/g, '');
}

export function getOrCreateCustomer(businessId, phone, name, channel, channelId) {
  phone = normalizePhone(phone || channelId || '');
  channelId = String(channelId || phone);
  channel = channel || 'voice';
  let customer = null;
  if (phone) {
    customer = db.prepare('SELECT * FROM customers WHERE business_id = ? AND phone = ? LIMIT 1').get(businessId, phone);
  }
  if (!customer) {
    customer = db.prepare('SELECT * FROM customers WHERE business_id = ? AND channel = ? AND channel_user_id = ? LIMIT 1').get(businessId, channel, channelId);
  }
  if (customer) {
    if (name && name !== customer.name) { db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(name, customer.id); customer.name = name; }
    if (phone && !customer.phone) { db.prepare('UPDATE customers SET phone = ? WHERE id = ?').run(phone, customer.id); customer.phone = phone; }
    return customer;
  }
  const result = db.prepare('INSERT INTO customers (business_id, channel, channel_user_id, phone, name, last_detected_language) VALUES (?, ?, ?, ?, ?, ?)').run(businessId, channel, channelId, phone, name || '', 'en');
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
}

export function updateCustomerLanguage(customerId, language) {
  if (!customerId || !language) return;
  db.prepare('UPDATE customers SET last_detected_language = ? WHERE id = ?').run(language, customerId);
}

function isStaffAvailableDB(staff, date, time, dayOfWeek) {
  try { const wd = JSON.parse(staff.working_days || '[0,1,2,3,4,5,6]'); if (!wd.includes(dayOfWeek)) return false; } catch(e) {}
  if (staff.work_start && staff.work_end && time) { if (time < staff.work_start || time >= staff.work_end) return false; }
  const unavail = db.prepare('SELECT id FROM staff_unavailability WHERE staff_id = ? AND date = ?').get(staff.id, date);
  if (unavail) return false;
  const conflict = db.prepare("SELECT id FROM bookings WHERE staff_id = ? AND date = ? AND time = ? AND status = 'confirmed' AND (slot_locked_until IS NULL OR slot_locked_until < datetime('now'))").get(staff.id, date, time);
  if (conflict) return false;
  const locked = db.prepare("SELECT id FROM bookings WHERE staff_id = ? AND date = ? AND time = ? AND slot_locked_until > datetime('now')").get(staff.id, date, time);
  if (locked) return false;
  return true;
}

export function assignStaff(businessId, specialty, date, time, requestedStaffId, customerId) {
  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  if (requestedStaffId) {
    const s = db.prepare('SELECT * FROM staff WHERE id = ? AND business_id = ? AND is_active = 1').get(requestedStaffId, businessId);
    if (s && isStaffAvailableDB(s, date, time, dayOfWeek)) return s;
    return null;
  }
  if (customerId) {
    const cust = db.prepare('SELECT preferred_staff_id FROM customers WHERE id = ?').get(customerId);
    if (cust?.preferred_staff_id) {
      const s = db.prepare('SELECT * FROM staff WHERE id = ? AND business_id = ? AND is_active = 1').get(cust.preferred_staff_id, businessId);
      if (s && isStaffAvailableDB(s, date, time, dayOfWeek)) return s;
    }
  }
  const pool = db.prepare("SELECT * FROM staff WHERE business_id = ? AND is_active = 1 AND (specialty = ? OR specialty = 'any' OR ? = 'any') ORDER BY CASE WHEN priority = 'vip' THEN 0 ELSE 1 END ASC, CASE WHEN last_assigned_at IS NULL THEN 0 ELSE 1 END ASC, last_assigned_at ASC").all(businessId, specialty || 'any', specialty || 'any');
  for (const s of pool) { if (isStaffAvailableDB(s, date, time, dayOfWeek)) return s; }
  return null;
}

export async function getAvailableSlotsMultiStaff(businessId, specialty, date, durationMinutes) {
  durationMinutes = Number(durationMinutes) || 60;
  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  const bh = db.prepare('SELECT * FROM business_hours WHERE business_id = ? AND day_of_week = ?').get(businessId, dayOfWeek);
  let openTime = '09:00', closeTime = '21:00';
  if (bh) {
    if (bh.is_closed) return { available: false, slots: [], reason: 'Closed today' };
    openTime = bh.open_time; closeTime = bh.close_time;
  } else {
    const brain = db.prepare('SELECT hours FROM business_brain WHERE business_id = ?').get(businessId);
    if (brain) {
      try {
        const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        const hrs = JSON.parse(brain.hours || '{}');
        const d = hrs[dayNames[dayOfWeek]];
        if (d?.closed) return { available: false, slots: [], reason: 'Closed today' };
        if (d?.open) openTime = d.open;
        if (d?.close) closeTime = d.close;
      } catch(e) {}
    }
  }
  const staff = db.prepare("SELECT * FROM staff WHERE business_id = ? AND is_active = 1 AND (specialty = ? OR specialty = 'any' OR ? = 'any')").all(businessId, specialty || 'any', specialty || 'any');
  if (staff.length === 0) {
    const { getAvailableSlots } = await import('./google-calendar.js');
    return getAvailableSlots(businessId, date, durationMinutes, null);
  }
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMins = openH * 60 + openM, closeMins = closeH * 60 + closeM;
  const now = Date.now();
  const slotStaffMap = {};
  for (let m = openMins; m + durationMinutes <= closeMins; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0'), mm = String(m % 60).padStart(2, '0');
    const slotStart = new Date(date + 'T' + hh + ':' + mm + ':00+04:00');
    if (slotStart.getTime() < now + 30 * 60000) continue;
    slotStaffMap[hh + ':' + mm] = [];
  }
  const { getAvailableSlots: _gcalSlots } = await import('./google-calendar.js');
  for (const s of staff) {
    try {
      const calId = s.google_calendar_id || 'primary';
      const result = await _gcalSlots(businessId, date, durationMinutes, null, calId);
      for (const slot of (result.slots || [])) {
        if (slotStaffMap[slot] !== undefined && isStaffAvailableDB(s, date, slot, dayOfWeek)) {
          slotStaffMap[slot].push(s.id);
        }
      }
    } catch(e) { log.warn({ staffId: s.id, err: e.message }, 'Calendar check failed'); }
  }
  const availableSlots = Object.entries(slotStaffMap).filter(([_, ids]) => ids.length > 0).map(([slot]) => slot).sort();
  return { available: availableSlots.length > 0, slots: availableSlots, date, staffCount: staff.length };
}

export async function createBooking({ businessId, customerPhone, customerName, channel, channelId, service, date, time, durationMinutes, specialty, requestedStaffId, language }) {
  durationMinutes = Number(durationMinutes) || 60;
  const customer = getOrCreateCustomer(businessId, customerPhone, customerName, channel, channelId);
  if (language) updateCustomerLanguage(customer.id, language);
  const dbl = db.prepare("SELECT id FROM bookings WHERE customer_id = ? AND date = ? AND time = ? AND status = 'confirmed'").get(customer.id, date, time);
  if (dbl) return { success: false, error: 'already_booked', bookingId: dbl.id };
  const staff = assignStaff(businessId, specialty, date, time, requestedStaffId, customer.id);
  const lockUntil = new Date(Date.now() + 2 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  const result = db.prepare("INSERT INTO bookings (business_id, staff_id, customer_id, service_name, duration_minutes, date, time, status, channel, slot_locked_until, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, datetime('now'))").run(businessId, staff ? staff.id : null, customer.id, service, durationMinutes, date, time, channel || 'voice', lockUntil);
  const bookingId = result.lastInsertRowid;
  let gcalEventId = null;
  try {
    const { createBookingEvent, getCalendarStatus } = await import('./google-calendar.js');
    const calStatus = getCalendarStatus(businessId);
    if (calStatus.connected) {
      const calId = staff?.google_calendar_id || 'primary';
      gcalEventId = await createBookingEvent(businessId, date, time, durationMinutes, customerName || customer.name, service, customerPhone || customer.phone, calId);
      db.prepare('UPDATE bookings SET gcal_event_id = ?, slot_locked_until = NULL WHERE id = ?').run(gcalEventId, bookingId);
    }
  } catch(e) {
    log.warn({ err: e.message, bookingId }, 'Calendar event failed');
    db.prepare('UPDATE bookings SET slot_locked_until = NULL WHERE id = ?').run(bookingId);
  }
  if (staff) db.prepare("UPDATE staff SET last_assigned_at = datetime('now') WHERE id = ?").run(staff.id);
  _scheduleReminders(bookingId, businessId, date, time);
  await _sendBookingNotifications(businessId, bookingId, { customerName: customerName || customer.name, customerPhone: customerPhone || customer.phone, service, date, time, staffName: staff?.name || null, channel });
  db.prepare("INSERT INTO event_log (business_id, event_type, entity_type, entity_id, payload) VALUES (?, 'booking_created', 'booking', ?, ?)").run(businessId, bookingId, JSON.stringify({ service, date, time, staffId: staff?.id }));
  return { success: true, bookingId, staffName: staff?.name || null, staffId: staff?.id || null, gcalEventId };
}

export async function cancelBooking(bookingId, reason, businessId) {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return { success: false, error: 'not_found' };
  const biz = booking.business_id || businessId;
  const settings = db.prepare('SELECT cancellation_deadline_hours FROM settings WHERE business_id = ?').get(biz);
  const deadlineHours = settings?.cancellation_deadline_hours ?? 24;
  const appointmentTime = new Date(booking.date + 'T' + booking.time + ':00+04:00');
  const hoursUntil = (appointmentTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < deadlineHours && hoursUntil > 0) return { success: false, error: 'past_deadline', deadlineHours, hoursUntil: Math.round(hoursUntil) };
  db.prepare("UPDATE bookings SET status = 'cancelled', cancelled_at = datetime('now'), cancellation_reason = ? WHERE id = ?").run(reason || '', bookingId);
  if (booking.gcal_event_id) { try { const { deleteCalendarEvent } = await import('./google-calendar.js'); await deleteCalendarEvent(biz, booking.gcal_event_id); } catch(e) {} }
  db.prepare("UPDATE reminders SET status = 'cancelled' WHERE booking_id = ? AND status = 'pending'").run(bookingId);
  const customer = booking.customer_id ? db.prepare('SELECT * FROM customers WHERE id = ?').get(booking.customer_id) : null;
  const staff = booking.staff_id ? db.prepare('SELECT * FROM staff WHERE id = ?').get(booking.staff_id) : null;
  const msg = '\u274C Booking Cancelled\n\n\uD83D\uDC64 ' + (customer?.name || 'Customer') + '  \u2014  ' + (customer?.phone || '') + '\n\uD83D\uDCCB ' + booking.service_name + '\n\uD83D\uDCC5 ' + booking.date + ' at ' + booking.time + (staff ? '\n\uD83D\uDC64 Staff: ' + staff.name : '') + (reason ? '\n\uD83D\uDCAC Reason: ' + reason : '');
  sendTelegramNotification(biz, msg).catch(() => {});
  if (staff?.telegram_chat_id) _sendDirectTelegram(staff.telegram_chat_id, '\u274C Your booking was cancelled: ' + booking.service_name + ', ' + booking.date + ' at ' + booking.time).catch(() => {});
  db.prepare("INSERT INTO event_log (business_id, event_type, entity_type, entity_id, payload) VALUES (?, 'booking_cancelled', 'booking', ?, ?)").run(biz, bookingId, JSON.stringify({ reason }));
  return { success: true };
}

export async function rescheduleBooking(bookingId, newDate, newTime, businessId) {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return { success: false, error: 'not_found' };
  const biz = booking.business_id || businessId;
  const settings = db.prepare('SELECT reschedule_deadline_hours FROM settings WHERE business_id = ?').get(biz);
  const deadlineHours = settings?.reschedule_deadline_hours ?? 24;
  const hoursUntil = (new Date(booking.date + 'T' + booking.time + ':00+04:00').getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < deadlineHours && hoursUntil > 0) return { success: false, error: 'past_deadline', deadlineHours };
  const oldStaff = booking.staff_id ? db.prepare('SELECT * FROM staff WHERE id = ?').get(booking.staff_id) : null;
  let newStaff = null;
  if (oldStaff && isStaffAvailableDB(oldStaff, newDate, newTime, new Date(newDate + 'T12:00:00').getDay())) { newStaff = oldStaff; }
  else {
    const customer = booking.customer_id ? db.prepare('SELECT * FROM customers WHERE id = ?').get(booking.customer_id) : null;
    newStaff = assignStaff(biz, oldStaff?.specialty || 'any', newDate, newTime, null, customer?.id);
  }
  if (booking.gcal_event_id) { try { const { deleteCalendarEvent } = await import('./google-calendar.js'); await deleteCalendarEvent(biz, booking.gcal_event_id); } catch(e) {} }
  let newGcalId = null;
  try {
    const { createBookingEvent, getCalendarStatus } = await import('./google-calendar.js');
    if (getCalendarStatus(biz).connected) {
      const customer = booking.customer_id ? db.prepare('SELECT * FROM customers WHERE id = ?').get(booking.customer_id) : null;
      newGcalId = await createBookingEvent(biz, newDate, newTime, booking.duration_minutes, customer?.name || 'Customer', booking.service_name, customer?.phone || '', newStaff?.google_calendar_id || 'primary');
    }
  } catch(e) { log.warn({ err: e.message }, 'Calendar event failed on reschedule'); }
  db.prepare('UPDATE bookings SET date = ?, time = ?, staff_id = ?, gcal_event_id = ?, slot_locked_until = NULL WHERE id = ?').run(newDate, newTime, newStaff?.id || booking.staff_id, newGcalId, bookingId);
  if (newStaff) db.prepare("UPDATE staff SET last_assigned_at = datetime('now') WHERE id = ?").run(newStaff.id);
  db.prepare("UPDATE reminders SET status = 'cancelled' WHERE booking_id = ? AND status = 'pending'").run(bookingId);
  _scheduleReminders(bookingId, biz, newDate, newTime);
  const customer = booking.customer_id ? db.prepare('SELECT * FROM customers WHERE id = ?').get(booking.customer_id) : null;
  sendTelegramNotification(biz, '\uD83D\uDD04 Rescheduled\n\n\uD83D\uDC64 ' + (customer?.name || 'Customer') + '\n\uD83D\uDCCB ' + booking.service_name + '\nFrom: ' + booking.date + ' at ' + booking.time + '\nTo: ' + newDate + ' at ' + newTime + (newStaff ? '\n\uD83D\uDC64 Staff: ' + newStaff.name : '')).catch(() => {});
  db.prepare("INSERT INTO event_log (business_id, event_type, entity_type, entity_id, payload) VALUES (?, 'booking_rescheduled', 'booking', ?, ?)").run(biz, bookingId, JSON.stringify({ oldDate: booking.date, oldTime: booking.time, newDate, newTime }));
  return { success: true, newDate, newTime, staffName: newStaff?.name || null };
}

export function getCustomerActiveBookings(businessId, customerPhone) {
  const customer = db.prepare('SELECT id FROM customers WHERE business_id = ? AND phone = ? LIMIT 1').get(businessId, normalizePhone(customerPhone));
  if (!customer) return [];
  return db.prepare("SELECT b.*, s.name as staff_name FROM bookings b LEFT JOIN staff s ON s.id = b.staff_id WHERE b.customer_id = ? AND b.status = 'confirmed' AND b.date >= date('now', '+04:00') ORDER BY b.date ASC, b.time ASC").all(customer.id);
}

export function markNoShow(bookingId) {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return false;
  db.prepare("UPDATE bookings SET status = 'no_show', no_show = 1 WHERE id = ?").run(bookingId);
  if (booking.customer_id) {
    db.prepare('UPDATE customers SET no_show_count = no_show_count + 1 WHERE id = ?').run(booking.customer_id);
    const cust = db.prepare('SELECT no_show_count FROM customers WHERE id = ?').get(booking.customer_id);
    if (cust && cust.no_show_count >= 3) sendTelegramNotification(booking.business_id, '\u26A0\uFE0F Customer has 3+ no-shows. Consider blacklisting. Customer ID: ' + booking.customer_id).catch(() => {});
  }
  db.prepare("INSERT INTO event_log (business_id, event_type, entity_type, entity_id, payload) VALUES (?, 'booking_no_show', 'booking', ?, '{}')").run(booking.business_id, bookingId);
  return true;
}

function _scheduleReminders(bookingId, businessId, date, time) {
  try {
    const settings = db.prepare('SELECT reminder_1_enabled, reminder_1_hours, reminder_2_enabled, reminder_2_hours, review_request_enabled FROM settings WHERE business_id = ?').get(businessId);
    const appointmentMs = new Date(date + 'T' + time + ':00+04:00').getTime();
    if (settings?.reminder_1_enabled) {
      const scheduledAt = new Date(appointmentMs - (settings.reminder_1_hours || 24) * 3600000).toISOString().replace('T', ' ').slice(0, 19);
      if (new Date(scheduledAt) > new Date()) db.prepare("INSERT INTO reminders (booking_id, business_id, type, scheduled_at, status) VALUES (?, ?, 'reminder_1', ?, 'pending')").run(bookingId, businessId, scheduledAt);
    }
    if (settings?.reminder_2_enabled) {
      const scheduledAt = new Date(appointmentMs - (settings.reminder_2_hours || 1) * 3600000).toISOString().replace('T', ' ').slice(0, 19);
      if (new Date(scheduledAt) > new Date()) db.prepare("INSERT INTO reminders (booking_id, business_id, type, scheduled_at, status) VALUES (?, ?, 'reminder_2', ?, 'pending')").run(bookingId, businessId, scheduledAt);
    }
    if (settings?.review_request_enabled) {
      const scheduledAt = new Date(appointmentMs + 2 * 3600000).toISOString().replace('T', ' ').slice(0, 19);
      db.prepare("INSERT INTO reminders (booking_id, business_id, type, scheduled_at, status) VALUES (?, ?, 'review', ?, 'pending')").run(bookingId, businessId, scheduledAt);
    }
  } catch(e) { log.warn({ err: e.message, bookingId }, 'Failed to schedule reminders'); }
}

async function _sendBookingNotifications(businessId, bookingId, { customerName, customerPhone, service, date, time, staffName }) {
  const showStaff = staffName ? '\n\uD83D\uDC64 Staff: ' + staffName : '';
  const ownerMsg = '\uD83C\uDD95 New Booking\n\n\uD83D\uDC64 ' + customerName + '\n\uD83D\uDCF1 ' + customerPhone + '\n\n\uD83D\uDCCB ' + service + showStaff + '\n\uD83D\uDCC5 ' + date + ' at ' + time;
  sendTelegramNotification(businessId, ownerMsg).catch(() => {});
  await _sendSMS(businessId, ownerMsg);
  if (staffName) {
    const staff = db.prepare('SELECT * FROM staff WHERE name = ? AND business_id = ?').get(staffName, businessId);
    if (staff?.telegram_chat_id) _sendDirectTelegram(staff.telegram_chat_id, '\uD83D\uDCC5 New Booking: ' + service + '\n\uD83D\uDD54 ' + date + ' at ' + time + '\n\uD83D\uDC64 Customer: ' + customerName + ' (' + customerPhone + ')').catch(() => {});
    if (staff?.phone) _sendSMSDirect(staff.phone, 'New booking: ' + service + ', ' + date + ' ' + time + '. Customer: ' + customerName).catch(() => {});
  }
  if (customerPhone) await _sendSMSDirect(customerPhone, 'Confirmed: ' + service + (staffName ? ' with ' + staffName : '') + '\n' + date + ' at ' + time + '\nThank you!');
}

async function _sendSMS(businessId, message) {
  try {
    const settings = db.prepare('SELECT notification_channel, owner_phone FROM settings WHERE business_id = ?').get(businessId);
    if (!settings || settings.notification_channel === 'telegram' || !settings.owner_phone) return;
    await _sendSMSDirect(settings.owner_phone, message);
  } catch(e) {}
}

async function _sendSMSDirect(phone, message) {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from || !phone) return;
  try {
    await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', { method: 'POST', headers: { 'Authorization': 'Basic ' + Buffer.from(sid + ':' + token).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ To: phone, From: from, Body: message }).toString() });
  } catch(e) { log.warn({ err: e.message, phone }, 'SMS send failed'); }
}

async function _sendDirectTelegram(chatId, text) {
  try {
    const bots = db.prepare("SELECT telegram_bot_token FROM settings WHERE telegram_bot_token IS NOT NULL AND telegram_bot_token != '' LIMIT 1").get();
    if (!bots?.telegram_bot_token) return;
    await fetch('https://api.telegram.org/bot' + bots.telegram_bot_token + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text }) });
  } catch(e) {}
}

export async function processReminders() {
  const due = db.prepare("SELECT r.*, b.service_name, b.date, b.time, b.customer_id, b.business_id, c.phone as customer_phone, s2.review_link FROM reminders r JOIN bookings b ON b.id = r.booking_id LEFT JOIN customers c ON c.id = b.customer_id LEFT JOIN settings s2 ON s2.business_id = b.business_id WHERE r.status = 'pending' AND r.scheduled_at <= datetime('now') LIMIT 20").all();
  for (const reminder of due) {
    try {
      let message = '';
      if (reminder.type === 'reminder_1' || reminder.type === 'reminder_2') message = 'Reminder: Your appointment for ' + reminder.service_name + ' is on ' + reminder.date + ' at ' + reminder.time + '. See you soon!';
      else if (reminder.type === 'review') message = 'Thank you for visiting! We\'d love your feedback \u2B50 ' + (reminder.review_link || '');
      if (message && reminder.customer_phone) await _sendSMSDirect(reminder.customer_phone, message);
      db.prepare("UPDATE reminders SET status = 'sent', sent_at = datetime('now') WHERE id = ?").run(reminder.id);
    } catch(e) { db.prepare("UPDATE reminders SET status = 'failed' WHERE id = ?").run(reminder.id); }
  }
}
