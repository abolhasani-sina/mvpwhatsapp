//  Google Calendar Integration 
import { google } from 'googleapis';
import db from './db.js';
import { encryptField, decryptField } from './middleware/encryption.js';
import { createLogger } from './logger.js';

const log = createLogger('google-calendar');
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

export async function getAvailableSlots(businessId, dateStr, durationMinutes) {
  durationMinutes = Number(durationMinutes) || 60;

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
  const timeMin = new Date(dateStr + 'T00:00:00').toISOString();
  const timeMax = new Date(dateStr + 'T23:59:59').toISOString();

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
    const slotStart = new Date(dateStr + 'T' + hh + ':' + mm + ':00');
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
    if (slotStart.getTime() < now + 30 * 60000) continue;
    const conflict = events.some(ev => {
      if (!ev.start || !ev.start.dateTime) return false;
      const evStart = new Date(ev.start.dateTime);
      const evEnd = new Date(ev.end.dateTime);
      return slotStart < evEnd && slotEnd > evStart;
    });
    if (!conflict) slots.push(hh + ':' + mm);
  }

  return { available: slots.length > 0, slots, date: dateStr, day: dayKey };
}

export async function createBookingEvent(businessId, dateStr, timeStr, durationMinutes, customerName, service, customerPhone) {
  durationMinutes = Number(durationMinutes) || 60;
  const auth = getAuthedClient(businessId);
  const calendar = google.calendar({ version: 'v3', auth });

  const match = String(timeStr).match(/(\d{1,2}):(\d{2})/);
  if (!match) throw new Error('Invalid time format: ' + timeStr);
  const hh = match[1].padStart(2, '0');
  const mm = match[2];

  const startDT = new Date(dateStr + 'T' + hh + ':' + mm + ':00');
  const endDT = new Date(startDT.getTime() + durationMinutes * 60000);

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: service + ' \u2014 ' + customerName,
      description: 'Customer: ' + customerName + '\nPhone: ' + customerPhone + '\nService: ' + service + '\n\nBooked via NabzChat',
      start: { dateTime: startDT.toISOString() },
      end: { dateTime: endDT.toISOString() },
    },
  });

  log.info({ businessId, eventId: event.data.id, customerName, service }, 'Calendar event created');
  return event.data.id;
}
