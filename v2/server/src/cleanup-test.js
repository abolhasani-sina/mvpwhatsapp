import db from './db.js';
import { deleteCalendarEvent } from './google-calendar.js';

const bookings = db.prepare("SELECT id, gcal_event_id, business_id FROM bookings WHERE gcal_event_id IS NOT NULL AND gcal_event_id != ''").all();
console.log(`Found ${bookings.length} bookings with calendar events`);

for (const b of bookings) {
  const _staff = b.staff_id ? db.prepare('SELECT google_calendar_id FROM staff WHERE id = ?').get(b.staff_id) : null;
  try {
    await deleteCalendarEvent(b.business_id, b.gcal_event_id, _staff?.google_calendar_id || 'primary');
    console.log(` Deleted calendar event ${b.gcal_event_id}`);
  } catch(e) {
    console.log(` Failed ${b.gcal_event_id}: ${e.message}`);
  }
}

db.prepare("DELETE FROM bookings").run();
db.prepare("DELETE FROM reminders").run();
db.prepare("DELETE FROM customers").run();
db.prepare("DELETE FROM ai_conversations").run();
db.prepare("DELETE FROM reschedule_requests").run();
console.log(' DB cleared');
process.exit(0);
