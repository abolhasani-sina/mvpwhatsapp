import db from './db.js';

export function migratePhase1() {

  //  1. NEW TABLES 

  db.exec(`
    CREATE TABLE IF NOT EXISTS business_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      open_time TEXT NOT NULL DEFAULT '09:00',
      close_time TEXT NOT NULL DEFAULT '21:00',
      is_closed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_business_hours_unique
      ON business_hours(business_id, day_of_week);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS business_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL UNIQUE,
      address TEXT DEFAULT '',
      maps_link TEXT DEFAULT '',
      parking_info TEXT DEFAULT '',
      instagram_handle TEXT DEFAULT '',
      website TEXT DEFAULT '',
      about_text TEXT DEFAULT '',
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      staff_specialty TEXT NOT NULL DEFAULT 'any',
      price TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_unavailability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      business_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      reason TEXT DEFAULT 'personal',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_staff_unavailability_lookup
      ON staff_unavailability(staff_id, date);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      staff_id INTEGER,
      customer_id INTEGER,
      service_name TEXT NOT NULL DEFAULT '',
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed'
        CHECK(status IN ('confirmed','cancelled','completed','no_show')),
      booking_type TEXT NOT NULL DEFAULT 'appointment'
        CHECK(booking_type IN ('appointment','callback')),
      channel TEXT NOT NULL DEFAULT 'voice'
        CHECK(channel IN ('telegram','whatsapp','instagram','voice')),
      gcal_event_id TEXT DEFAULT '',
      slot_locked_until TEXT,
      cancelled_at TEXT,
      cancellation_reason TEXT DEFAULT '',
      no_show INTEGER NOT NULL DEFAULT 0,
      telegram_message_id TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_bookings_business ON bookings(business_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_staff ON bookings(staff_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(business_id, date);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(business_id, status);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS availability_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      cached_slots TEXT NOT NULL DEFAULT '[]',
      cached_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_cache_unique
      ON availability_cache(business_id, staff_id, date);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      customer_phone TEXT NOT NULL,
      started_at TEXT,
      duration_seconds INTEGER DEFAULT 0,
      recording_url TEXT DEFAULT '',
      stored_recording_url TEXT DEFAULT '',
      transcript_original TEXT DEFAULT '',
      transcript_translated TEXT DEFAULT '',
      transcript_language TEXT DEFAULT 'en',
      transcript_summary TEXT DEFAULT '',
      booking_id INTEGER,
      outcome TEXT DEFAULT 'failed'
        CHECK(outcome IN ('booked','failed','transferred','no_answer','callback')),
      sms_confirmation_sent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_calls_business ON calls(business_id);
    CREATE INDEX IF NOT EXISTS idx_calls_phone ON calls(business_id, customer_phone);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      business_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('reminder_1','reminder_2','review')),
      scheduled_at TEXT NOT NULL,
      sent_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','sent','failed','cancelled')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_reminders_pending
      ON reminders(status, scheduled_at) WHERE status = 'pending';
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      target TEXT NOT NULL DEFAULT 'all',
      scheduled_at TEXT,
      sent_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK(status IN ('draft','scheduled','sending','sent','failed')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_campaigns_business ON campaigns(business_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS event_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      event_type TEXT NOT NULL,
      entity_type TEXT DEFAULT '',
      entity_id INTEGER,
      payload TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_event_log_business ON event_log(business_id);
    CREATE INDEX IF NOT EXISTS idx_event_log_type ON event_log(event_type);
  `);

  //  2. ALTER EXISTING TABLES 

  const bizCols = db.prepare("PRAGMA table_info(businesses)").all().map(c => c.name);
  if (!bizCols.includes('timezone'))             db.exec("ALTER TABLE businesses ADD COLUMN timezone TEXT DEFAULT 'Asia/Dubai'");
  if (!bizCols.includes('retell_phone_number'))  db.exec("ALTER TABLE businesses ADD COLUMN retell_phone_number TEXT DEFAULT ''");
  if (!bizCols.includes('retell_agent_id'))      db.exec("ALTER TABLE businesses ADD COLUMN retell_agent_id TEXT DEFAULT ''");
  if (!bizCols.includes('is_paused'))            db.exec("ALTER TABLE businesses ADD COLUMN is_paused INTEGER NOT NULL DEFAULT 0");
  if (!bizCols.includes('pause_from'))           db.exec("ALTER TABLE businesses ADD COLUMN pause_from TEXT");
  if (!bizCols.includes('pause_until'))          db.exec("ALTER TABLE businesses ADD COLUMN pause_until TEXT");
  if (!bizCols.includes('pause_message'))        db.exec("ALTER TABLE businesses ADD COLUMN pause_message TEXT DEFAULT ''");

  const settCols = db.prepare("PRAGMA table_info(settings)").all().map(c => c.name);
  if (!settCols.includes('ai_name'))                     db.exec("ALTER TABLE settings ADD COLUMN ai_name TEXT DEFAULT 'Luna'");
  if (!settCols.includes('ai_personality'))              db.exec("ALTER TABLE settings ADD COLUMN ai_personality TEXT DEFAULT 'friendly'");
  if (!settCols.includes('owner_phone'))                 db.exec("ALTER TABLE settings ADD COLUMN owner_phone TEXT DEFAULT ''");
  if (!settCols.includes('owner_language'))              db.exec("ALTER TABLE settings ADD COLUMN owner_language TEXT DEFAULT 'en'");
  if (!settCols.includes('notification_channel'))        db.exec("ALTER TABLE settings ADD COLUMN notification_channel TEXT DEFAULT 'telegram'");
  if (!settCols.includes('show_staff_name'))             db.exec("ALTER TABLE settings ADD COLUMN show_staff_name INTEGER NOT NULL DEFAULT 1");
  if (!settCols.includes('auto_booking_enabled'))        db.exec("ALTER TABLE settings ADD COLUMN auto_booking_enabled INTEGER NOT NULL DEFAULT 1");
  if (!settCols.includes('cancellation_deadline_hours')) db.exec("ALTER TABLE settings ADD COLUMN cancellation_deadline_hours INTEGER NOT NULL DEFAULT 24");
  if (!settCols.includes('reschedule_deadline_hours'))   db.exec("ALTER TABLE settings ADD COLUMN reschedule_deadline_hours INTEGER NOT NULL DEFAULT 24");
  if (!settCols.includes('transfer_phone_number'))       db.exec("ALTER TABLE settings ADD COLUMN transfer_phone_number TEXT DEFAULT ''");
  if (!settCols.includes('send_sms_confirmation'))       db.exec("ALTER TABLE settings ADD COLUMN send_sms_confirmation INTEGER NOT NULL DEFAULT 1");
  if (!settCols.includes('reminder_1_enabled'))          db.exec("ALTER TABLE settings ADD COLUMN reminder_1_enabled INTEGER NOT NULL DEFAULT 1");
  if (!settCols.includes('reminder_1_hours'))            db.exec("ALTER TABLE settings ADD COLUMN reminder_1_hours INTEGER NOT NULL DEFAULT 24");
  if (!settCols.includes('reminder_2_enabled'))          db.exec("ALTER TABLE settings ADD COLUMN reminder_2_enabled INTEGER NOT NULL DEFAULT 1");
  if (!settCols.includes('reminder_2_hours'))            db.exec("ALTER TABLE settings ADD COLUMN reminder_2_hours INTEGER NOT NULL DEFAULT 1");
  if (!settCols.includes('review_request_enabled'))      db.exec("ALTER TABLE settings ADD COLUMN review_request_enabled INTEGER NOT NULL DEFAULT 0");
  if (!settCols.includes('review_link'))                 db.exec("ALTER TABLE settings ADD COLUMN review_link TEXT DEFAULT ''");
  if (!settCols.includes('ramadan_mode'))                db.exec("ALTER TABLE settings ADD COLUMN ramadan_mode INTEGER NOT NULL DEFAULT 0");
  if (!settCols.includes('ramadan_open_time'))           db.exec("ALTER TABLE settings ADD COLUMN ramadan_open_time TEXT DEFAULT '20:00'");
  if (!settCols.includes('ramadan_close_time'))          db.exec("ALTER TABLE settings ADD COLUMN ramadan_close_time TEXT DEFAULT '02:00'");

  const staffCols = db.prepare("PRAGMA table_info(staff)").all().map(c => c.name);
  if (!staffCols.includes('specialty'))           db.exec("ALTER TABLE staff ADD COLUMN specialty TEXT DEFAULT 'any'");
  if (!staffCols.includes('priority'))            db.exec("ALTER TABLE staff ADD COLUMN priority TEXT DEFAULT 'normal'");
  if (!staffCols.includes('google_calendar_id'))  db.exec("ALTER TABLE staff ADD COLUMN google_calendar_id TEXT DEFAULT ''");
  if (!staffCols.includes('working_days'))        db.exec("ALTER TABLE staff ADD COLUMN working_days TEXT DEFAULT '[0,1,2,3,4,5,6]'");
  if (!staffCols.includes('work_start'))          db.exec("ALTER TABLE staff ADD COLUMN work_start TEXT DEFAULT '09:00'");
  if (!staffCols.includes('work_end'))            db.exec("ALTER TABLE staff ADD COLUMN work_end TEXT DEFAULT '21:00'");
  if (!staffCols.includes('last_assigned_at'))    db.exec("ALTER TABLE staff ADD COLUMN last_assigned_at TEXT");
  if (!staffCols.includes('phone'))               db.exec("ALTER TABLE staff ADD COLUMN phone TEXT DEFAULT ''");
  if (!staffCols.includes('is_active'))         db.exec("ALTER TABLE staff ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");

  const custCols = db.prepare("PRAGMA table_info(customers)").all().map(c => c.name);
  if (!custCols.includes('phone'))                   db.exec("ALTER TABLE customers ADD COLUMN phone TEXT DEFAULT ''");
  if (!custCols.includes('last_detected_language'))  db.exec("ALTER TABLE customers ADD COLUMN last_detected_language TEXT DEFAULT 'en'");
  if (!custCols.includes('preferred_staff_id'))      db.exec("ALTER TABLE customers ADD COLUMN preferred_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL");
  if (!custCols.includes('notification_channel'))    db.exec("ALTER TABLE customers ADD COLUMN notification_channel TEXT DEFAULT 'sms'");
  if (!custCols.includes('notification_contact'))    db.exec("ALTER TABLE customers ADD COLUMN notification_contact TEXT DEFAULT ''");
  if (!custCols.includes('no_show_count'))           db.exec("ALTER TABLE customers ADD COLUMN no_show_count INTEGER NOT NULL DEFAULT 0");
  if (!custCols.includes('is_blacklisted'))          db.exec("ALTER TABLE customers ADD COLUMN is_blacklisted INTEGER NOT NULL DEFAULT 0");

  console.log('[migrate-phase1] \u2705 Done. All Phase 1 tables and columns applied.');
}
