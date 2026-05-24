// voice-routes.js
import express from 'express';
import db from './db.js';
import { createLogger } from './logger.js';
import {
  getAvailableSlotsMultiStaff,
  createBooking,
  cancelBooking,
  rescheduleBooking,
  getCustomerActiveBookings,
  normalizePhone,
} from './booking-engine.js';

const router = express.Router();
const log = createLogger('voice-routes');

function getBusinessByPhone(toNumber) {
  if (!toNumber) return null;
  const clean = String(toNumber).replace(/[\s\-().]/g, '');
  return db.prepare("SELECT business_id FROM settings WHERE retell_phone_number = ? LIMIT 1").get(clean);
}

function getBusinessBrain(businessId) {
  return db.prepare('SELECT * FROM business_brain WHERE business_id = ?').get(businessId);
}

function getTodayDubai() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
}

function getDayName(dateStr) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days[new Date(dateStr + 'T12:00:00').getDay()];
}

function getTomorrowDubai() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
}

function verifyRetell(req, res) {
  const secret = process.env.RETELL_WEBHOOK_SECRET;
  if (!secret) return true;
  const sig = req.headers['x-retell-signature'] || req.headers['authorization'];
  if (!sig || !sig.includes(secret)) { res.status(401).json({ error: 'Unauthorized' }); return false; }
  return true;
}

router.post('/inbound-webhook', async (req, res) => {
  try {
    const toNumber = req.body?.call?.to_number || req.body?.to_number;
    const fromNumber = req.body?.call?.from_number || req.body?.from_number;
    const row = getBusinessByPhone(toNumber);
    if (!row) {
      return res.json({ llm_dynamic_variables: { business_name: 'the salon', services_summary: 'various services', today_date: getTodayDubai(), tomorrow_date: getTomorrowDubai(), caller_phone: normalizePhone(fromNumber), business_id: '0' } });
    }
    const businessId = row.business_id;
    const brain = getBusinessBrain(businessId);
    const settings = db.prepare('SELECT * FROM settings WHERE business_id = ?').get(businessId);
    let servicesSummary = 'various services';
    try {
      const services = JSON.parse(brain?.services || '[]');
      if (Array.isArray(services) && services.length > 0) servicesSummary = services.map(s => s.name + ' (' + (s.duration || 60) + ' min)').join(', ');
    } catch(e) {}
    let hoursSummary = '9am to 9pm';
    try {
      const hrs = JSON.parse(brain?.hours || '{}');
      const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const d = hrs[dayNames[new Date().getDay()]];
      if (d && !d.closed) hoursSummary = (d.open || '09:00') + ' to ' + (d.close || '21:00');
      else if (d?.closed) hoursSummary = 'closed today';
    } catch(e) {}
    const callerPhone = normalizePhone(fromNumber);
    let existingBookingInfo = 'none';
    if (callerPhone) {
      const active = getCustomerActiveBookings(businessId, callerPhone);
      if (active.length > 0) { const b = active[0]; existingBookingInfo = b.service_name + ' on ' + b.date + ' at ' + b.time + (b.staff_name ? ' with ' + b.staff_name : ''); }
    }
    res.json({ llm_dynamic_variables: { business_id: String(businessId), business_name: settings?.name || brain?.name || 'the salon', services_summary: servicesSummary, today_date: getTodayDubai(), tomorrow_date: getTomorrowDubai(), today_hours: hoursSummary, caller_phone: callerPhone, existing_booking: existingBookingInfo, cancellation_policy: brain?.cancellation_notice ? 'Cancellation must be made ' + brain.cancellation_notice.replace('_', ' ') + ' in advance' : 'Cancellation anytime before the appointment' } });
  } catch(err) { log.error({ err: err.message }, 'inbound-webhook error'); res.status(500).json({ error: 'Internal error' }); }
});

router.post('/check-availability', async (req, res) => {
  if (!verifyRetell(req, res)) return;
  try {
    log.warn({ date: req.body?.date, service: req.body?.service, business_id: req.body?.business_id }, 'CHECK-AVAIL-DEBUG');
    const { business_id, date, service, duration_minutes, specialty } = req.body;
    if (!business_id || !date) return res.status(400).json({ error: 'business_id and date are required' });
    let duration = Number(duration_minutes) || 0;
    if (!duration && service) { try { const { getServiceDuration } = await import('./google-calendar.js'); const brain = getBusinessBrain(business_id); if (brain) duration = getServiceDuration(brain, service) || 60; } catch(e) { duration = 60; } }
    if (!duration) duration = 60;
    const result = await getAvailableSlotsMultiStaff(Number(business_id), specialty || null, date, duration);
    res.json({ available: result.available, slots: result.slots || [], date: result.date || date, duration_minutes: duration, reason: result.reason || null });
  } catch(err) { log.error({ err: err.message }, 'check-availability error'); res.status(500).json({ error: 'Failed to check availability' }); }
});

router.post('/create-booking', async (req, res) => {
  if (!verifyRetell(req, res)) return;
  try {
    const { business_id, customer_phone, customer_name, service, date, time, duration_minutes, specialty, language } = req.body;
    if (!business_id || !service || !date || !time) return res.status(400).json({ error: 'business_id, service, date, time are required' });
    if (!customer_phone) return res.status(400).json({ error: 'customer_phone is required' });
    let duration = Number(duration_minutes) || 0;
    if (!duration && service) { try { const { getServiceDuration } = await import('./google-calendar.js'); const brain = getBusinessBrain(Number(business_id)); if (brain) duration = getServiceDuration(brain, service) || 60; } catch(e) { duration = 60; } }
    if (!duration) duration = 60;
    const result = await createBooking({ businessId: Number(business_id), customerPhone: normalizePhone(customer_phone), customerName: customer_name || 'Voice Customer', channel: 'voice', channelId: normalizePhone(customer_phone), service, date, time, durationMinutes: duration, specialty: specialty || null, requestedStaffId: null, language: language || 'en' });
    if (!result.success) return res.json({ success: false, error: result.error, message: result.error === 'already_booked' ? 'You already have a booking at ' + time + ' on ' + date + '. Would you like a different time?' : 'Could not complete the booking. Please try a different time.', booking_id: result.bookingId || null });
    res.json({ success: true, booking_id: result.bookingId, staff_name: result.staffName || null, message: 'Your ' + service + ' is booked for ' + date + ' at ' + time + (result.staffName ? ' with ' + result.staffName : '') + '. You will receive a confirmation shortly.' });
  } catch(err) { log.error({ err: err.message }, 'create-booking error'); res.status(500).json({ error: 'Failed to create booking' }); }
});

router.post('/get-booking', (req, res) => {
  if (!verifyRetell(req, res)) return;
  try {
    const { business_id, customer_phone } = req.body;
    if (!business_id || !customer_phone) return res.status(400).json({ error: 'business_id and customer_phone are required' });
    const bookings = getCustomerActiveBookings(Number(business_id), normalizePhone(customer_phone));
    if (!bookings || bookings.length === 0) return res.json({ found: false, bookings: [], message: "I couldn't find any upcoming bookings. Would you like to make a new appointment?" });
    const formatted = bookings.map(b => ({ id: b.id, service: b.service_name, date: b.date, time: b.time, staff_name: b.staff_name || null, status: b.status }));
    const first = formatted[0];
    res.json({ found: true, bookings: formatted, message: 'You have ' + (formatted.length === 1 ? 'an appointment' : formatted.length + ' appointments') + '. The next one is ' + first.service + ' on ' + first.date + ' at ' + first.time + (first.staff_name ? ' with ' + first.staff_name : '') + '.' });
  } catch(err) { log.error({ err: err.message }, 'get-booking error'); res.status(500).json({ error: 'Failed to get booking' }); }
});

router.post('/cancel-booking', async (req, res) => {
  if (!verifyRetell(req, res)) return;
  try {
    const { business_id, booking_id, reason } = req.body;
    if (!booking_id) return res.status(400).json({ error: 'booking_id is required' });
    const result = await cancelBooking(Number(booking_id), reason || 'Cancelled via voice call', Number(business_id));
    if (!result.success) {
      if (result.error === 'not_found') return res.json({ success: false, error: 'not_found', message: "I couldn't find that booking." });
      if (result.error === 'past_deadline') return res.json({ success: false, error: 'past_deadline', message: 'Sorry, cancellations must be made at least ' + result.deadlineHours + ' hours before the appointment. Your appointment is in ' + result.hoursUntil + ' hours.' });
      return res.json({ success: false, error: result.error, message: 'Unable to cancel this booking.' });
    }
    res.json({ success: true, message: 'Your appointment has been successfully cancelled. We hope to see you again soon.' });
  } catch(err) { log.error({ err: err.message }, 'cancel-booking error'); res.status(500).json({ error: 'Failed to cancel booking' }); }
});

router.post('/reschedule-booking', async (req, res) => {
  if (!verifyRetell(req, res)) return;
  try {
    const { business_id, booking_id, new_date, new_time } = req.body;
    if (!booking_id || !new_date || !new_time) return res.status(400).json({ error: 'booking_id, new_date, new_time are required' });
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(Number(booking_id));
    if (!booking) return res.json({ success: false, error: 'not_found', message: "I couldn't find that booking." });
    const slotsResult = await getAvailableSlotsMultiStaff(Number(business_id || booking.business_id), null, new_date, booking.duration_minutes || 60);
    if (!slotsResult.slots?.includes(new_time)) {
      const altSlots = (slotsResult.slots || []).slice(0, 3).join(', ');
      return res.json({ success: false, error: 'slot_unavailable', available_slots: slotsResult.slots || [], message: 'Sorry, ' + new_time + ' on ' + new_date + ' is not available.' + (altSlots ? ' Available times: ' + altSlots + '. Would any work for you?' : '') });
    }
    const result = await rescheduleBooking(Number(booking_id), new_date, new_time, Number(business_id || booking.business_id));
    if (!result.success) {
      if (result.error === 'past_deadline') return res.json({ success: false, error: 'past_deadline', message: 'Sorry, changes must be made at least ' + result.deadlineHours + ' hours before your appointment.' });
      return res.json({ success: false, error: result.error, message: 'Unable to reschedule this booking.' });
    }
    res.json({ success: true, new_date: result.newDate, new_time: result.newTime, staff_name: result.staffName || null, message: 'Done! Rescheduled to ' + result.newDate + ' at ' + result.newTime + (result.staffName ? ' with ' + result.staffName : '') + '. See you then!' });
  } catch(err) { log.error({ err: err.message }, 'reschedule-booking error'); res.status(500).json({ error: 'Failed to reschedule booking' }); }
});


// POST /api/voice/vapi-webhook
router.post('/vapi-webhook', async (req, res) => {
  try {
    const msg = req.body?.message;
    const call = msg?.call || req.body?.call;
    const fromNumber = call?.customer?.number || '';
    const toNumber = call?.phoneNumber?.number || '';
    const row = getBusinessByPhone(toNumber);
    const businessId = row?.business_id || 1;
    const brain = getBusinessBrain(businessId);
    const settings = db.prepare('SELECT * FROM settings WHERE business_id = ?').get(businessId);
    let servicesSummary = 'various services';
    try {
      let rawServices = brain?.services || '[]';
      if (rawServices.startsWith('"')) rawServices = JSON.parse(rawServices);
      const services = JSON.parse(rawServices);
      const items = [];
      for (const cat of services) {
        for (const sub of (cat.subcategories || [])) {
          for (const item of (sub.items || [])) {
            items.push(item.name + (item.duration ? ' (' + item.duration + ' min)' : ''));
          }
        }
      }
      if (items.length > 0) servicesSummary = items.join(', ');
    } catch(e) {}
    const callerPhone = normalizePhone(fromNumber);
    let existingBookingInfo = 'none';
    if (callerPhone) {
      const active = getCustomerActiveBookings(businessId, callerPhone);
      if (active.length > 0) {
        const b = active[0];
        existingBookingInfo = b.service_name + ' on ' + b.date + ' at ' + b.time;
      }
    }
    return res.json({
      assistant: {
        variableValues: {
          business_id: String(businessId),
          business_name: settings?.name || brain?.name || 'the salon',
          services_summary: servicesSummary,
          today_date: getTodayDubai(),
          today_day: getDayName(getTodayDubai()),
          tomorrow_date: getTomorrowDubai(),
          tomorrow_day: getDayName(getTomorrowDubai()),
          caller_phone: callerPhone,
          existing_booking: existingBookingInfo,
          cancellation_policy: brain?.cancellation_notice
            ? 'Cancellation must be made ' + brain.cancellation_notice.replace('_', ' ') + ' in advance'
            : 'Cancellation anytime before the appointment',
        }
      }
    });
  } catch(err) {
    log.error({ err: err.message }, 'vapi-webhook error');
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
