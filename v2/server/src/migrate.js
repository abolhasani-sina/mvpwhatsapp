import db from './db.js';
import bcrypt from 'bcryptjs';

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      template_key TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bot_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL UNIQUE,
      welcome_message TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS buttons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      parent_id INTEGER,
      label TEXT NOT NULL DEFAULT 'New button',
      behavior TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES buttons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS info_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      button_id INTEGER NOT NULL UNIQUE,
      title TEXT DEFAULT '',
      description TEXT DEFAULT '',
      amount TEXT DEFAULT '',
      currency TEXT DEFAULT 'USD',
      duration TEXT DEFAULT '',
      style TEXT DEFAULT 'clean',
      show_price INTEGER DEFAULT 1,
      show_duration INTEGER DEFAULT 1,
      FOREIGN KEY (button_id) REFERENCES buttons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS action_buttons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      info_page_id INTEGER NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      behavior TEXT NOT NULL DEFAULT 'go_back',
      prefill_service TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      back_target TEXT DEFAULT 'parent',
      FOREIGN KEY (info_page_id) REFERENCES info_pages(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      name TEXT DEFAULT 'Booking Flow',
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flow_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flow_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      question TEXT DEFAULT '',
      key TEXT DEFAULT '',
      summary_label TEXT DEFAULT '',
      options TEXT DEFAULT '[]',
      step_order INTEGER DEFAULT 0,
      menu_root_button_id INTEGER,
      manual_placeholder TEXT DEFAULT '',
      FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS extra_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      button_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      question TEXT DEFAULT '',
      key TEXT DEFAULT '',
      summary_label TEXT DEFAULT '',
      options TEXT DEFAULT '[]',
      step_order INTEGER DEFAULT 0,
      manual_placeholder TEXT DEFAULT '',
      FOREIGN KEY (button_id) REFERENCES buttons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS action_button_flow_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_button_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      question TEXT DEFAULT '',
      key TEXT DEFAULT '',
      summary_label TEXT DEFAULT '',
      options TEXT DEFAULT '[]',
      step_order INTEGER DEFAULT 0,
      menu_root_button_id INTEGER,
      manual_placeholder TEXT DEFAULT '',
      FOREIGN KEY (action_button_id) REFERENCES action_buttons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      data TEXT DEFAULT '{}',
      status TEXT DEFAULT 'new',
      assigned_to INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES staff(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL UNIQUE,
      telegram_bot_token TEXT DEFAULT '',
      telegram_chat_id TEXT DEFAULT '',
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flow_destinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flow_id INTEGER NOT NULL,
      channel TEXT NOT NULL CHECK(channel IN ('email', 'telegram')),
      staff_id INTEGER NOT NULL,
      FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS button_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      button_id INTEGER NOT NULL,
      business_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video', 'document', 'audio')),
      data TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (button_id) REFERENCES buttons(id) ON DELETE CASCADE,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_businesses_user ON businesses(user_id);
    CREATE INDEX IF NOT EXISTS idx_buttons_business ON buttons(business_id);
    CREATE INDEX IF NOT EXISTS idx_buttons_parent ON buttons(parent_id);
    CREATE INDEX IF NOT EXISTS idx_flow_steps_flow ON flow_steps(flow_id);
    CREATE INDEX IF NOT EXISTS idx_extra_steps_button ON extra_steps(button_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_business ON submissions(business_id);
    CREATE INDEX IF NOT EXISTS idx_staff_business ON staff(business_id);
    CREATE INDEX IF NOT EXISTS idx_flow_destinations_flow ON flow_destinations(flow_id);
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      channel TEXT NOT NULL CHECK(channel IN ('whatsapp', 'telegram', 'instagram')),
      channel_user_id TEXT NOT NULL,
      name TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_unique
      ON customers(business_id, channel, channel_user_id);

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      business_id INTEGER NOT NULL,
      channel TEXT NOT NULL,
      state TEXT DEFAULT '{}',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_business ON conversations(business_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_active
      ON conversations(customer_id, status) WHERE status = 'active';

    CREATE INDEX IF NOT EXISTS idx_button_media_button ON button_media(button_id);
    CREATE INDEX IF NOT EXISTS idx_button_media_business ON button_media(business_id);
  `);

  // Ensure a demo user exists (user_id = 1)
  const existingUser = db.prepare('SELECT id FROM users WHERE id = 1').get();
  if (!existingUser) {
    const hashedPw = bcrypt.hashSync('demo1234', 12);
    db.prepare('INSERT INTO users (id, email, password, name) VALUES (1, ?, ?, ?)').run(
      'demo@example.com',
      hashedPw,
      'Demo User'
    );
  } else {
    // Migrate plaintext password to bcrypt if needed
    const user = db.prepare('SELECT password FROM users WHERE id = 1').get();
    if (user && !user.password.startsWith('$2')) {
      const hashedPw = bcrypt.hashSync('demo1234', 12);
      db.prepare('UPDATE users SET password = ? WHERE id = 1').run(hashedPw);
    }
  }

  // Add name column to users if missing
  const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userCols.includes('name')) {
    db.exec("ALTER TABLE users ADD COLUMN name TEXT DEFAULT ''");
  }

  // Add columns if missing (safe ALTER TABLE migrations)
  const staffCols = db.prepare("PRAGMA table_info(staff)").all().map(c => c.name);
  if (!staffCols.includes('email')) {
    db.exec("ALTER TABLE staff ADD COLUMN email TEXT DEFAULT ''");
  }
  if (!staffCols.includes('telegram_chat_id')) {
    db.exec("ALTER TABLE staff ADD COLUMN telegram_chat_id TEXT DEFAULT ''");
  }

  const subCols = db.prepare("PRAGMA table_info(submissions)").all().map(c => c.name);
  if (!subCols.includes('flow_id')) {
    db.exec("ALTER TABLE submissions ADD COLUMN flow_id INTEGER REFERENCES flows(id) ON DELETE SET NULL");
  }
  // [ADDED: action_button_flow_steps] Track which action button (if any) triggered
  // a submission. NULL for legacy/main-flow submissions. ON DELETE SET NULL so
  // historical submissions survive action_button rebuilds during builder saves.
  if (!subCols.includes('action_button_id')) {
    db.exec("ALTER TABLE submissions ADD COLUMN action_button_id INTEGER REFERENCES action_buttons(id) ON DELETE SET NULL");
  }

  const settCols = db.prepare("PRAGMA table_info(settings)").all().map(c => c.name);
  if (!settCols.includes('business_email')) {
    db.exec("ALTER TABLE settings ADD COLUMN business_email TEXT DEFAULT ''");
  }
  if (!settCols.includes('whatsapp_number')) {
    db.exec("ALTER TABLE settings ADD COLUMN whatsapp_number TEXT DEFAULT ''");
  }

  // Add delivery config columns to action_buttons
  const abCols = db.prepare("PRAGMA table_info(action_buttons)").all().map(c => c.name);
  if (!abCols.includes('delivery_method')) {
    db.exec("ALTER TABLE action_buttons ADD COLUMN delivery_method TEXT DEFAULT 'none'");
  }
  if (!abCols.includes('delivery_staff_id')) {
    db.exec("ALTER TABLE action_buttons ADD COLUMN delivery_staff_id INTEGER DEFAULT NULL");
  }
  if (!abCols.includes('back_target')) {
    db.exec("ALTER TABLE action_buttons ADD COLUMN back_target TEXT DEFAULT 'parent'");
  }

  // ── Phase 7 tables ──

  // 7.1 — Callback deduplication (prevent double-click double-process)
  db.exec(`
    CREATE TABLE IF NOT EXISTS processed_callbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      channel TEXT NOT NULL,
      customer_id INTEGER NOT NULL,
      callback_hash TEXT NOT NULL,
      processed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_processed_callbacks_lookup
      ON processed_callbacks(business_id, channel, customer_id, callback_hash);
  `);

  // 7.1 — Telegram update_id tracking (prevent re-processing same update)
  db.exec(`
    CREATE TABLE IF NOT EXISTS telegram_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      update_id INTEGER NOT NULL,
      processed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_telegram_updates_unique
      ON telegram_updates(business_id, update_id);
  `);

  // 7.4 — Message queue for reliable delivery with retries
  db.exec(`
    CREATE TABLE IF NOT EXISTS message_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      channel TEXT NOT NULL DEFAULT 'telegram',
      chat_id TEXT NOT NULL,
      message_json TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed', 'exhausted')),
      attempt_count INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 5,
      next_retry_at TEXT DEFAULT (datetime('now')),
      error_message TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      processed_at TEXT,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_message_queue_pending
      ON message_queue(status, next_retry_at) WHERE status = 'pending';
    CREATE INDEX IF NOT EXISTS idx_message_queue_business
      ON message_queue(business_id);
  `);

  // Add last_activity to conversations (for session timeout)
  const convCols = db.prepare("PRAGMA table_info(conversations)").all().map(c => c.name);
  if (!convCols.includes('last_activity')) {
    db.exec("ALTER TABLE conversations ADD COLUMN last_activity TEXT DEFAULT (datetime('now'))");
    // Backfill existing conversations
    db.exec("UPDATE conversations SET last_activity = updated_at WHERE last_activity IS NULL");
  }

  // ── Phase 10 — SaaS Owner Panel + Channel Provisioning Control ──

  // 10.1 — User role + suspension flag
  const usersCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!usersCols.includes('role')) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  }
  if (!usersCols.includes('suspended')) {
    db.exec("ALTER TABLE users ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0");
  }

  // 10.1 — Plans catalog
  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      monthly_price INTEGER NOT NULL DEFAULT 0,
      max_flows INTEGER NOT NULL DEFAULT 1,
      max_staff INTEGER NOT NULL DEFAULT 1,
      max_submissions_per_month INTEGER NOT NULL DEFAULT 50,
      allow_whatsapp INTEGER NOT NULL DEFAULT 0,
      allow_telegram INTEGER NOT NULL DEFAULT 1,
      allow_instagram INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default plans if catalog empty
  const planCount = db.prepare('SELECT COUNT(*) AS c FROM plans').get().c;
  if (planCount === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO plans (name, monthly_price, max_flows, max_staff, max_submissions_per_month,
        allow_whatsapp, allow_telegram, allow_instagram, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPlan.run('Starter', 0, 1, 1, 50, 0, 1, 0, 1);
    insertPlan.run('Pro', 29, 10, 5, 2000, 1, 1, 1, 0);
    insertPlan.run('Business', 79, 100, 100, 10000, 1, 1, 1, 0);
  }

  // 10.1 — Plan assignment per business + audit log
  const bizCols = db.prepare("PRAGMA table_info(businesses)").all().map(c => c.name);
  if (!bizCols.includes('plan_id')) {
    db.exec("ALTER TABLE businesses ADD COLUMN plan_id INTEGER REFERENCES plans(id)");
  }
  if (!bizCols.includes('status')) {
    // active | suspended (set by platform owner)
    db.exec("ALTER TABLE businesses ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }

  // Backfill plan_id with default plan for any business missing one
  const defaultPlan = db.prepare('SELECT id FROM plans WHERE is_default = 1 LIMIT 1').get();
  if (defaultPlan) {
    db.prepare('UPDATE businesses SET plan_id = ? WHERE plan_id IS NULL').run(defaultPlan.id);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS plan_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      assigned_by INTEGER,
      assigned_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES plans(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_plan_assignments_biz ON plan_assignments(business_id);
  `);

  // 10.2 — One-time channel setup lock columns on settings
  const settChannelCols = db.prepare("PRAGMA table_info(settings)").all().map(c => c.name);
  if (!settChannelCols.includes('telegram_set_at')) {
    db.exec("ALTER TABLE settings ADD COLUMN telegram_set_at TEXT");
  }
  if (!settChannelCols.includes('telegram_locked')) {
    db.exec("ALTER TABLE settings ADD COLUMN telegram_locked INTEGER NOT NULL DEFAULT 0");
  }
  if (!settChannelCols.includes('whatsapp_set_at')) {
    db.exec("ALTER TABLE settings ADD COLUMN whatsapp_set_at TEXT");
  }
  if (!settChannelCols.includes('whatsapp_locked')) {
    db.exec("ALTER TABLE settings ADD COLUMN whatsapp_locked INTEGER NOT NULL DEFAULT 0");
  }
  if (!settChannelCols.includes('instagram_page_id')) {
    db.exec("ALTER TABLE settings ADD COLUMN instagram_page_id TEXT DEFAULT ''");
  }
  if (!settChannelCols.includes('instagram_set_at')) {
    db.exec("ALTER TABLE settings ADD COLUMN instagram_set_at TEXT");
  }
  if (!settChannelCols.includes('instagram_locked')) {
    db.exec("ALTER TABLE settings ADD COLUMN instagram_locked INTEGER NOT NULL DEFAULT 0");
  }

  // Backfill: existing populated channel values get marked as set+locked
  db.exec(`
    UPDATE settings SET telegram_set_at = COALESCE(telegram_set_at, datetime('now')), telegram_locked = 1
      WHERE telegram_bot_token IS NOT NULL AND telegram_bot_token != '' AND telegram_locked = 0;
    UPDATE settings SET whatsapp_set_at = COALESCE(whatsapp_set_at, datetime('now')), whatsapp_locked = 1
      WHERE whatsapp_number IS NOT NULL AND whatsapp_number != '' AND whatsapp_locked = 0;
    UPDATE settings SET instagram_set_at = COALESCE(instagram_set_at, datetime('now')), instagram_locked = 1
      WHERE instagram_page_id IS NOT NULL AND instagram_page_id != '' AND instagram_locked = 0;
  `);

  // 10.2 — Channel change requests
  db.exec(`
    CREATE TABLE IF NOT EXISTS channel_change_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      requested_by INTEGER NOT NULL,
      channel TEXT NOT NULL CHECK(channel IN ('telegram', 'whatsapp', 'instagram')),
      requested_value TEXT NOT NULL,
      requested_value_masked TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      decided_by INTEGER,
      decided_at TEXT,
      decision_note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (requested_by) REFERENCES users(id),
      FOREIGN KEY (decided_by) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_channel_requests_status ON channel_change_requests(status);
    CREATE INDEX IF NOT EXISTS idx_channel_requests_business ON channel_change_requests(business_id);
  `);

  // 10.1 — Bootstrap platform owner from env (if any user matches PLATFORM_OWNER_EMAIL)
  const ownerEmail = (process.env.PLATFORM_OWNER_EMAIL || '').trim().toLowerCase();
  if (ownerEmail) {
    const existing = db.prepare('SELECT id, role FROM users WHERE LOWER(email) = ?').get(ownerEmail);
    if (existing && existing.role !== 'platform_owner') {
      db.prepare("UPDATE users SET role = 'platform_owner' WHERE id = ?").run(existing.id);
    }
  }
}
