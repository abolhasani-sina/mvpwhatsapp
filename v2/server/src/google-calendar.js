//  Google Calendar Integration 
import { google } from 'googleapis';
import db from './db.js';
import { encryptField, decryptField } from './middleware/encryption.js';
import { createLogger } from './logger.js';

const log = createLogger('google-calendar');

// Look up service duration (in minutes) from brain data
export function getServiceDuration(brain, serviceName) {
  if (!brain || !serviceName) return 60;
  try {
    let services = JSON.parse(brain.services || '[]');
    if (typeof services === 'string') services = JSON.parse(services);
    const name = serviceName.toLowerCase().trim();
    for (const cat of services) {
      for (const sub of (cat.subcategories || [])) {
        for (const item of (sub.items || [])) {
          if (item.name && item.name.toLowerCase().trim() === name) {
            return parseInt(item.duration) || 60;
          }
        }
      }
    }
  } catch(e) {}
  return 60; // default
}

// Get booking buffer from brain (default 15 min)
export function getBookingBuffer(brain) {
  try {
    return parseInt(brain?.booking_buffer) || 15;
  } catch(e) { return 15; }
}
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://app.nabzchat.tech/api/google/callback';

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

export function getAuthUrl(businessId) {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: String(businessId),
  });
}

export async function handleOAuthCallback(code, businessId) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) throw new Error('No refresh_token returned');
  const encrypted = encryptField(tokens.refresh_token);
  db.prepare(
    'UPDATE settings SET google_refresh_token = ?, google_cal_connected = 1, google_connected_at = ? WHERE business_id = ?'
  ).run(encrypted, new Date().toISOString(), Number(businessId));
  log.info({ businessId }, 'Google Calendar connected');
}

export function disconnectCalendar(businessId) {
  db.prepare(
    'UPDATE settings SET google_refresh_token = NULL, google_cal_connected = 0, google_connected_at = NULL WHERE business_id = ?'
  ).run(businessId);
  log.info({ businessId }, 'Google Calendar disconnected');
}

export function getCalendarStatus(businessId) {
  const s = db.prepare(
    'SELECT google_cal_connected, google_connected_at, confirmation_mode FROM settings WHERE business_id = ?'
  ).get(businessId);
  return {
    connected: s?.google_cal_connected === 1,
    connectedAt: s?.google_connected_at || null,
    confirmationMode: s?.confirmation_mode || 'manual',
  };
}

function getAuthedClient(businessId) {
  const s = db.prepare('SELECT google_refresh_token FROM settings WHERE business_id = ?').get(businessId);
  if (!s?.google_refresh_token) throw new Error('Google Calendar not connected for business ' + businessId);
  const refreshToken = decryptField(s.google_refresh_token);
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

export async function getAvailableSlots(businessId, dateStr, durationMinutes, serviceName) {
  // If serviceName provided, look up real duration from brain
  if (serviceName) {
    const _brain = db.prepare('SELECT services, booking_buffer FROM business_brain WHERE business_id = ?').get(businessId);
    const _svcDuration = getServiceDuration(_brain, serviceName);
    const _buffer = getBookingBuffer(_brain);
    durationMinutes = _svcDuration + _buffer;
  } else {
    durationMinutes = Number(durationMinutes) || 75; // default: 60min service + 15min buffer
  }

  const brain = db.prepare('SELECT hours FROM business_brain WHERE business_id = ?').get(businessId);
  let hours = {};
  try {
    hours = JSON.parse(brain?.hours || '{}');
    if (typeof hours === 'string') hours = JSON.parse(hours);
  } catch(e) {}

  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const parts = dateStr.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayKey = dayNames[date.getDay()];
  const dayHours = hours[dayKey];

  if (!dayHours || dayHours.closed) {
    return { available: false, reason: 'Business is closed on this day', slots: [], date: dateStr };
  }

  const openParts = (dayHours.open || '09:00').split(':').map(Number);
  const closeParts = (dayHours.close || '18:00').split(':').map(Number);
  const openH = openParts[0], openM = openParts[1] || 0;
  const closeH = closeParts[0], closeM = closeParts[1] || 0;

  const auth = getAuthedClient(businessId);
  const calendar = google.calendar({ version: 'v3', auth });
  // Use Dubai timezone offset (+04:00) for calendar queries
  const timeMin = new Date(dateStr + 'T00:00:00+04:00').toISOString();
  const timeMax = new Date(dateStr + 'T23:59:59+04:00').toISOString();

  // Also block times from pending DB submissions (not yet confirmed by owner)
  const _pendingBlocks = [];
  try {
    const _pendingSubs = db.prepare(
      "SELECT data FROM submissions WHERE business_id = ? AND status = 'new' AND json_extract(data, '$.Preferred Date') = ?"
    ).all(businessId, dateStr);
    for (const _ps of _pendingSubs) {
      try {
        const _pd = JSON.parse(_ps.data);
        const _pt = _pd['Preferred Time'] || '';
        const _timeMatch = String(_pt).match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        if (_timeMatch) {
          let _ph = parseInt(_timeMatch[1]);
          const _pm2 = parseInt(_timeMatch[2] || '0');
          const _pampm = (_timeMatch[3] || '').toLowerCase();
          if (_pampm === 'pm' && _ph !== 12) _ph += 12;
          if (_pampm === 'am' && _ph === 12) _ph = 0;
          const _pStart = new Date(dateStr + 'T' + String(_ph).padStart(2,'0') + ':' + String(_pm2).padStart(2,'0') + ':00+04:00');
          const _pEnd = new Date(_pStart.getTime() + durationMinutes * 60000);
          _pendingBlocks.push({ start: _pStart, end: _pEnd });
        }
      } catch(_pe) {}
    }
  } catch(_pbe) {}

  let events = [];
  try {
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin, timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });
    events = res.data.items || [];
  } catch(e) {
    log.error({ err: e, businessId, dateStr }, 'Failed to fetch calendar events');
    throw new Error('Calendar fetch failed: ' + e.message);
  }

  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;
  const now = Date.now();
  const slots = [];

  for (let m = openMins; m + durationMinutes <= closeMins; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    const slotStart = new Date(dateStr + 'T' + hh + ':' + mm + ':00+04:00');
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
    if (slotStart.getTime() < now + 30 * 60000) continue;
    const conflict = events.some(ev => {
      if (!ev.start || !ev.start.dateTime) return false;
      const evStart = new Date(ev.start.dateTime);
      const evEnd = new Date(ev.end.dateTime);
      return slotStart < evEnd && slotEnd > evStart;
    }) || _pendingBlocks.some(pb => slotStart < pb.end && slotEnd > pb.start);
    if (!conflict) slots.push(hh + ':' + mm);
  }

  return { available: slots.length > 0, slots, date: dateStr, day: dayKey };
}

export async function createBookingEvent(businessId, dateStr, timeStr, durationMinutes, customerName, service, customerPhone) {
  durationMinutes = Number(durationMinutes) || 60;
  const auth = getAuthedClient(businessId);
  const calendar = google.calendar({ version: 'v3', auth });

  // Normalize time: handle '4pm', '4:00pm', '16:00', '16', etc.
  let normalizedTime = String(timeStr).trim().toLowerCase();
  let timeHour = 0, timeMin = 0;
  const ampmMatch = normalizedTime.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  const colonMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})$/);
  const hourOnly = normalizedTime.match(/^(\d{1,2})$/);
  if (ampmMatch) {
    timeHour = parseInt(ampmMatch[1]);
    timeMin = parseInt(ampmMatch[2] || '0');
    if (ampmMatch[3] === 'pm' && timeHour !== 12) timeHour += 12;
    if (ampmMatch[3] === 'am' && timeHour === 12) timeHour = 0;
  } else if (colonMatch) {
    timeHour = parseInt(colonMatch[1]);
    timeMin = parseInt(colonMatch[2]);
  } else if (hourOnly) {
    timeHour = parseInt(hourOnly[1]);
  } else {
    throw new Error('Invalid time format: ' + timeStr);
  }
  const match = [null, String(timeHour), String(timeMin).padStart(2,'0')];
  if (!match) throw new Error('Invalid time format: ' + timeStr);
  const hh = String(timeHour).padStart(2, '0');
  const mm = String(timeMin).padStart(2, '0');

  // Use Dubai timezone offset explicitly (+04:00) to avoid timezone shift
  const _startStr = dateStr + 'T' + hh + ':' + mm + ':00+04:00';
  const _endDate = new Date(new Date(_startStr).getTime() + durationMinutes * 60000);
  const _endH = String(_endDate.getUTCHours() + 4).padStart(2,'0'); // +4 for Dubai
  const _endM = String(_endDate.getUTCMinutes()).padStart(2,'0');
  const _endDateStr = _endDate.toISOString().slice(0,10);
  const _endStr = _endDateStr + 'T' + _endH.padStart(2,'0') + ':' + _endM + ':00+04:00';

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: service + ' \u2014 ' + customerName,
      description: 'Customer: ' + customerName + '\nPhone: ' + customerPhone + '\nService: ' + service + '\n\nBooked via NabzChat',
      start: { dateTime: _startStr, timeZone: 'Asia/Dubai' },
      end: { dateTime: _endStr, timeZone: 'Asia/Dubai' },
    },
  });

  log.info({ businessId, eventId: event.data.id, customerName, service }, 'Calendar event created');
  return event.data.id;
}

export async function deleteCalendarEvent(businessId, eventId) {
  if (!eventId) return;
  try {
    const auth = getAuthedClient(businessId);
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({ calendarId: 'primary', eventId });
    log.info({ businessId, eventId }, 'Calendar event deleted');
  } catch(e) {
    log.warn({ businessId, eventId, err: e.message }, 'Calendar event delete failed');
  }
}
