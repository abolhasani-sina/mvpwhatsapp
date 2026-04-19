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
}
