# BotDesk V2 — Complete System Report

> **Purpose**: This document is a full, truthful, code-verified report of everything implemented in the V2 system. Written by reading every single source file. Intended as a handoff to a new AI or developer so they can understand the entire system without looking at code.

> **Product**: BotDesk — A SaaS platform where business owners build WhatsApp chatbots visually (no code), manage bookings/submissions, and route them to staff via Telegram or Email.

> **Date**: June 2025

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Database Schema (SQLite)](#3-database-schema-sqlite)
4. [Backend — Server](#4-backend--server)
5. [Frontend — Client](#5-frontend--client)
6. [Templates System](#6-templates-system)
7. [Data Flow: How It All Connects](#7-data-flow-how-it-all-connects)
8. [What Works (Implemented & Functional)](#8-what-works-implemented--functional)
9. [What Is Mock / Placeholder](#9-what-is-mock--placeholder)
10. [What Is Missing / Not Implemented](#10-what-is-missing--not-implemented)
11. [Known Architecture Decisions](#11-known-architecture-decisions)

---

## 1. Tech Stack

### Frontend (`v2/client/`)
| Technology | Version | Purpose |
|---|---|---|
| React | 19.0.0 | UI framework |
| Vite | 6.0.0 | Build tool & dev server |
| Tailwind CSS | 4.2.2 | Utility-first CSS (via `@tailwindcss/vite` plugin) |
| lucide-react | 1.8.0 | Icon library |
| @dnd-kit/core | 6.3.1 | Drag-and-drop framework |
| @dnd-kit/sortable | 10.0.0 | Sortable drag-and-drop |
| @dnd-kit/utilities | 3.2.2 | DnD utility helpers |

- **Dev server port**: 5174
- **API base URL**: Hardcoded to `http://localhost:4000/api` in `v2/client/src/lib/api.js`

### Backend (`v2/server/`)
| Technology | Version | Purpose |
|---|---|---|
| Express | 4.21.0 | HTTP server framework |
| better-sqlite3 | 12.9.0 | SQLite database driver (synchronous) |
| cors | 2.8.5 | Cross-origin resource sharing |

- **Server port**: 4000
- **Database file**: `v2/server/data.db` (SQLite, created automatically)
- **Database mode**: WAL journal mode, foreign keys ON

### No Build/Deploy Pipeline
- No Docker, no CI/CD, no deployment configuration
- Runs locally only: `npm run dev` in both client and server directories

---

## 2. Project Structure

```
v2/
├── client/                          # React frontend
│   ├── index.html                   # Vite entry HTML
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite config (proxy not configured — uses hardcoded API URL)
│   └── src/
│       ├── App.jsx                  # Root app — routing, auth, business state
│       ├── main.jsx                 # React DOM render entry
│       ├── index.css                # Tailwind CSS imports
│       ├── lib/
│       │   ├── api.js               # All API call functions (20+ exports)
│       │   ├── auth.jsx             # Mock auth context (localStorage only)
│       │   └── templates.js         # 15 industry templates (~4300 lines)
│       ├── components/
│       │   ├── AdminLayout.jsx      # Sidebar + header layout
│       │   ├── EditorPanel.jsx      # Right-side builder editor (~1100 lines)
│       │   ├── PhoneMockup.jsx      # WhatsApp phone preview (~900 lines)
│       │   ├── SubmissionsList.jsx  # Submissions list + detail view
│       │   └── StaffManager.jsx     # Staff CRUD management
│       └── pages/
│           ├── Landing.jsx          # Marketing landing page
│           ├── Login.jsx            # Login form (mock auth)
│           ├── Register.jsx         # Register form (mock auth)
│           ├── Dashboard.jsx        # Analytics dashboard
│           ├── BuilderPage.jsx      # Main bot builder page
│           └── SettingsPage.jsx     # Business + notification settings
│
└── server/                          # Express backend
    ├── package.json                 # Backend dependencies
    └── src/
        ├── server.js                # Express app entry point
        ├── db.js                    # SQLite connection setup
        ├── migrate.js               # Schema creation + migrations
        ├── seed.js                  # Template → database seeder
        ├── routes.js                # All API route handlers (~780 lines)
        └── telegram.js              # Telegram notification sender
```

---

## 3. Database Schema (SQLite)

The database has **14 tables**, all created with `IF NOT EXISTS` in `migrate.js`. The schema runs on every server startup (safe to re-run).

### Table: `users`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| email | TEXT UNIQUE NOT NULL | |
| password_hash | TEXT NOT NULL | |
| name | TEXT | |
| created_at | DATETIME | Default: now |

**Purpose**: User accounts. Currently only a mock user (id=1) is auto-created by migration. No real auth exists — the frontend uses localStorage mock auth.

### Table: `businesses`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| user_id | INTEGER FK → users | |
| name | TEXT NOT NULL | |
| phone | TEXT | |
| created_at | DATETIME | Default: now |

**Purpose**: Each user can own one or more businesses. A business is the core entity — everything else (buttons, flows, submissions, staff) belongs to a business.

### Table: `bot_configs`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| business_id | INTEGER FK → businesses UNIQUE | |
| welcome_message | TEXT | Default: 'Welcome! How can I help you today?' |

**Purpose**: Stores the bot's welcome message (the first thing a customer sees). One config per business.

### Table: `buttons`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| business_id | INTEGER FK → businesses | |
| parent_id | INTEGER FK → buttons (nullable) | Self-referencing for nesting |
| label | TEXT NOT NULL | |
| behavior | TEXT | `'menu'` or `'info'` |
| sort_order | INTEGER | Default: 0 |
| created_at | DATETIME | Default: now |

**Purpose**: The recursive menu tree. Each button can be a "menu" (has children) or "info" (has an info page). `parent_id = NULL` means root-level button. This creates an unlimited-depth nested menu structure.

**Index**: `idx_buttons_business` on `(business_id, parent_id)`

### Table: `info_pages`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| button_id | INTEGER FK → buttons UNIQUE | |
| title | TEXT | |
| description | TEXT | |
| amount | TEXT | Stored as text (e.g., "120") |
| currency | TEXT | Default: 'USD' |
| duration | TEXT | e.g., "30 min" |
| style | TEXT | Default: 'clean' (also: friendly, premium) |
| show_price | BOOLEAN | Default: 1 |
| show_duration | BOOLEAN | Default: 1 |

**Purpose**: When a button has `behavior='info'`, it gets an info page. This is a service/product detail card with title, description, price, duration, and visual style. Displayed in the phone mockup as a styled card.

### Table: `action_buttons`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| info_page_id | INTEGER FK → info_pages | |
| label | TEXT NOT NULL | |
| behavior | TEXT | `'start_flow'` or `'go_back'` |
| sort_order | INTEGER | Default: 0 |
| delivery_method | TEXT | Default: 'none'. Values: 'none', 'email', 'telegram' |
| delivery_staff_id | INTEGER | FK to staff (nullable) |

**Purpose**: Buttons displayed inside an info page. "start_flow" triggers a booking/questionnaire flow. "go_back" returns to the parent menu. Each action button can have its own delivery configuration (per-button delivery).

### Table: `extra_steps`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| info_page_id | INTEGER FK → info_pages | |
| question | TEXT NOT NULL | |
| type | TEXT NOT NULL | 'text', 'choice', 'choice_with_manual', 'select_from_menu' |
| key | TEXT | |
| label | TEXT | Summary label shown in booking summary |
| sort_order | INTEGER | Default: 0 |
| options | TEXT | JSON string of choice options |
| menu_root | INTEGER | Used when type='select_from_menu' |
| manual_placeholder | TEXT | Placeholder for manual input in choice_with_manual |

**Purpose**: Service-specific questions that get appended to the main booking flow when a specific info page's "Book this" is clicked. For example, a nail service might ask "Do you need removal first?" as an extra step.

### Table: `action_button_flow_steps`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| action_button_id | INTEGER FK → action_buttons | |
| question | TEXT NOT NULL | |
| type | TEXT NOT NULL | Same types as above |
| key | TEXT | |
| label | TEXT | |
| sort_order | INTEGER | Default: 0 |
| options | TEXT | JSON string |
| menu_root | INTEGER | |
| manual_placeholder | TEXT | |

**Purpose**: Flow steps that belong to a specific action button (not the main flow). When an action button has behavior='start_flow', its questions are stored here.

### Table: `flows`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| business_id | INTEGER FK → businesses | |
| name | TEXT | Default: 'Main Flow' |
| created_at | DATETIME | Default: now |

**Purpose**: A business's main booking/questionnaire flow. Currently each business gets exactly one flow, created by the seeder.

### Table: `flow_steps`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| flow_id | INTEGER FK → flows | |
| question | TEXT NOT NULL | |
| type | TEXT NOT NULL | 'text', 'choice', 'choice_with_manual', 'select_from_menu' |
| key | TEXT | |
| label | TEXT | |
| sort_order | INTEGER | Default: 0 |
| options | TEXT | JSON string |
| menu_root | INTEGER | |
| manual_placeholder | TEXT | |

**Purpose**: The steps (questions) in the main booking flow. These are the base questions asked during any booking, regardless of which specific service was selected.

### Table: `submissions`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| business_id | INTEGER FK → businesses | |
| flow_id | INTEGER | FK to flows (nullable) |
| data | TEXT NOT NULL | JSON string of all answers |
| status | TEXT | Default: 'new'. Values: 'new', 'in_progress', 'done', 'cancelled' |
| assigned_to | INTEGER | FK to staff (nullable) |
| created_at | DATETIME | Default: now |

**Purpose**: Every completed flow (booking request, inquiry, etc.) creates a submission. The `data` field contains a JSON object mapping step keys to user answers. Can be assigned to staff and tracked by status.

### Table: `staff`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| business_id | INTEGER FK → businesses | |
| name | TEXT NOT NULL | |
| role | TEXT | |
| email | TEXT | Added via migration |
| telegram_chat_id | TEXT | Added via migration |
| active | BOOLEAN | Default: 1 (soft delete: set to 0) |
| created_at | DATETIME | Default: now |

**Purpose**: Team members who can receive submission notifications and be assigned to submissions. Soft-deleted (active=0) rather than actually removed.

### Table: `settings`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| business_id | INTEGER FK → businesses UNIQUE | |
| telegram_bot_token | TEXT | |
| telegram_chat_id | TEXT | Global notification chat ID |
| business_email | TEXT | Added via migration |
| whatsapp_number | TEXT | Added via migration |

**Purpose**: Per-business settings for notifications. The Telegram bot token + chat ID enable global Telegram notifications for all submissions.

### Table: `flow_destinations`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| flow_id | INTEGER FK → flows | |
| method | TEXT NOT NULL | 'email' or 'telegram' |
| staff_id | INTEGER FK → staff | |
| created_at | DATETIME | Default: now |

**Purpose**: Per-flow delivery rules. When a submission is created for a specific flow, notifications go to these staff members via the specified method. This is the "middle tier" of the 3-tier delivery system (per-button → per-flow → global).

---

## 4. Backend — Server

### Entry Point: `server.js`
- Creates Express app on port 4000
- CORS enabled (all origins)
- JSON body parser with 10MB limit
- On startup: runs `migrate()` to ensure schema exists
- Mounts all API routes from `routes.js` at `/api`
- Has two legacy stub endpoints (`GET /builder`, `POST /builder/save`) that return empty responses for backward compatibility

### Database Connection: `db.js`
- Uses `better-sqlite3` (synchronous SQLite driver)
- Opens `v2/server/data.db` (auto-created if missing)
- Enables WAL journal mode for better concurrent read performance
- Enables foreign keys enforcement

### Schema & Migrations: `migrate.js`
- Single `migrate()` function called on startup
- Creates all 14 tables with `CREATE TABLE IF NOT EXISTS`
- Creates indexes
- Runs safe `ALTER TABLE ADD COLUMN` wrapped in try/catch (ignores "column already exists" errors)
- Ensures a mock user exists: `INSERT OR IGNORE INTO users (id, email, password_hash, name) VALUES (1, 'demo@botdesk.com', 'placeholder', 'Demo User')`

### Template Seeder: `seed.js`
- Exported function: `seedBusiness(templateData)`
- Takes `{ welcomeMessage, buttons }` from a template
- Runs in a SQLite transaction:
  1. Creates business (user_id=1, name from first menu button label or 'My Business')
  2. Creates bot_config with welcome message
  3. Creates a flow named 'Main Flow'
  4. Recursively inserts all buttons: for each button, creates the DB row; if behavior='info', creates info_page + action_buttons + extra_steps + action_button_flow_steps
  5. Captures `baseFlowSteps` from the first action button with behavior='start_flow'
  6. Builds an `oldToNewButtonId` map (template IDs → database-assigned IDs)
  7. Inserts flow_steps with remapped `menuRoot` IDs (so `select_from_menu` steps point to correct DB button IDs)
- Returns `{ businessId }`

### Telegram Notifications: `telegram.js`
Three functions:
1. `sendTelegramNotification(businessId, text)` — Reads global settings (telegram_bot_token + telegram_chat_id), sends to the business's main chat
2. `sendTelegramToChat(businessId, chatId, text)` — Sends to a specific staff member's chat ID using the business's bot token
3. `sendTelegramMessage(botToken, chatId, text)` — Internal: calls Telegram Bot API `sendMessage` endpoint via fetch

All functions silently skip if bot token or chat ID is not configured (no errors thrown).

### API Routes: `routes.js` (~780 lines)

All routes are mounted under `/api`.

#### Business Routes
| Method | Path | What It Does |
|---|---|---|
| GET | `/business` | Returns the first business for user_id=1, or null. Used on login to check if a business exists. |
| GET | `/business/:id` | Returns a specific business by ID |
| POST | `/business` | Creates a new business from a template. Receives `{ templateKey }`. Loads the template from the TEMPLATES array, calls `seedBusiness()`, returns `{ businessId }` |
| PUT | `/business/:id` | Updates business name and/or phone |
| DELETE | `/business/:id` | Deletes a business and ALL related data (cascading manual delete of: flow_destinations, action_button_flow_steps, extra_steps, action_buttons, info_pages, flow_steps, flows, submissions, staff, settings, bot_configs, buttons, then the business itself) |

#### Bot Config Routes
| Method | Path | What It Does |
|---|---|---|
| GET | `/business/:id/config` | Returns the bot_config (welcome message) |
| PUT | `/business/:id/config` | Updates the welcome message |

#### Builder Load (Complex)
| Method | Path | What It Does |
|---|---|---|
| GET | `/business/:id/builder` | Loads the entire builder state from DB. Queries: business, bot_config, flow, flow_steps, all buttons, all info_pages, all action_buttons (with delivery_method, delivery_staff_id), all extra_steps, all action_button_flow_steps. Builds indexed lookup maps. Reconstructs the nested button tree by: (1) attaching infoPage objects to buttons, (2) attaching actionButtons with parsed flowSteps and deliveryMethod/deliveryStaffId to info pages, (3) attaching extraSteps to info pages, (4) building parent→children relationships. Returns `{ business, welcomeMessage, buttons (nested tree), flow: { id, name, steps } }` |

#### Builder Save (Complex)
| Method | Path | What It Does |
|---|---|---|
| PUT | `/business/:id/builder` | Saves the entire builder state to DB. Validates: buttons with behavior != 'menu' cannot have children. Runs in a transaction: (1) Updates welcome message, (2) Deletes ALL existing buttons (which cascades info_pages, action_buttons, etc. via ON DELETE CASCADE triggers — actually done manually), deletes flow_steps, (3) Re-inserts everything recursively using `insertButton()` helper, (4) Captures baseFlowSteps from first start_flow action button, (5) Builds oldToNewButtonId map for menuRoot remapping, (6) Inserts flow_steps with remapped menuRoot IDs. Returns `{ ok: true }` |

#### Individual Button CRUD
| Method | Path | What It Does |
|---|---|---|
| GET | `/business/:id/buttons` | Returns all buttons for a business (flat list) |
| POST | `/business/:id/buttons` | Creates a single button. If behavior='info', also creates default info_page |
| PUT | `/buttons/:id` | Updates a single button (label, behavior, sort_order) |
| DELETE | `/buttons/:id` | Deletes a button and its children recursively (manually handles cascade) |

*Note: These individual CRUD routes exist but are mostly superseded by the full builder save, which replaces everything atomically.*

#### Flow Routes
| Method | Path | What It Does |
|---|---|---|
| GET | `/business/:id/flows` | Returns all flows for a business |

#### Analytics Route
| Method | Path | What It Does |
|---|---|---|
| GET | `/business/:id/analytics` | Returns: `totalSubmissions`, `newCount`, `inProgressCount`, `doneCount`, `staffCount`, `recentSubmissions` (last 10 with staff name and flow name via LEFT JOIN), `dailyCounts` (last 7 days grouped by date with zero-fill) |

#### Submission Routes
| Method | Path | What It Does |
|---|---|---|
| POST | `/business/:id/submissions` | Creates a new submission. Receives `{ data, flowId, deliveryMethod, deliveryStaffId }`. Inserts into DB. Then runs **3-tier delivery**: (1) **Per-button delivery**: If deliveryMethod is 'email' or 'telegram' AND deliveryStaffId is set, auto-assigns staff to submission, sends notification to that specific staff member. (2) **Per-flow delivery**: Queries flow_destinations for this flowId, sends to each configured staff destination. (3) **Global delivery**: Calls `sendTelegramNotification()` to the business's main Telegram chat. Returns `{ id, status }` |
| GET | `/business/:id/submissions` | Returns all submissions with `assigned_name` (LEFT JOIN on staff.name) |
| PUT | `/submissions/:id/status` | Updates submission status (new/in_progress/done/cancelled) |
| PUT | `/submissions/:id/assign` | Assigns submission to a staff member. Auto-sets status to 'in_progress' if currently 'new'. Pass `staffId: null` to unassign |

#### Staff Routes
| Method | Path | What It Does |
|---|---|---|
| GET | `/business/:id/staff` | Returns all active staff (WHERE active=1) |
| POST | `/business/:id/staff` | Creates a staff member with name, role, email, telegram_chat_id |
| PUT | `/staff/:id` | Updates a staff member's name, role, email, telegram_chat_id |
| DELETE | `/staff/:id` | Soft deletes: sets active=0, unassigns from all submissions |

#### Settings Routes
| Method | Path | What It Does |
|---|---|---|
| GET | `/business/:id/settings` | Returns settings (telegram_bot_token, telegram_chat_id, business_email, whatsapp_number). Creates default row if none exists |
| PUT | `/business/:id/settings` | Upserts settings |

#### Flow Destination Routes
| Method | Path | What It Does |
|---|---|---|
| GET | `/flows/:flowId/destinations` | Returns all destinations for a flow with staff name/role |
| POST | `/flows/:flowId/destinations` | Creates a destination. Validates staff has the required contact info (email for email method, telegram_chat_id for telegram method) |
| PUT | `/flows/:flowId/destinations` | **Bulk replace**: Deletes all existing destinations, inserts new array. Validates each. |
| DELETE | `/flow-destinations/:id` | Deletes a single destination |

---

## 5. Frontend — Client

### App Root: `App.jsx`
- Wraps everything in `AuthProvider` (mock auth context)
- String-based routing via `page` state: `'landing'`, `'login'`, `'register'`, `'dashboard'`, `'builder'`, `'submissions'`, `'staff'`, `'settings'`
- On login/register, fetches the user's business via `fetchBusiness()` API to get `businessId`
- Protected pages are wrapped in `AdminLayout` (sidebar)
- `navigate` function changes page + resets businessId for public pages

### Auth System: `auth.jsx` (MOCK)
- `AuthProvider` with `useAuth()` hook
- `login(email, password)`: Creates `{ email, name: email.split('@')[0], id: Date.now() }`, stores in localStorage key `'botdesk_user'`
- `register(email, password, name)`: Same as login but uses provided name
- `logout()`: Removes from localStorage
- **NO real backend authentication. No JWT. No password hashing. No session management. Any email/password combination "works".**

### API Layer: `api.js`
Base URL: `http://localhost:4000/api` (hardcoded)

All exported functions:
| Function | HTTP | Endpoint | Purpose |
|---|---|---|---|
| `fetchBusiness()` | GET | `/business` | Get user's business |
| `createBusiness(templateKey)` | POST | `/business` | Create from template |
| `deleteBusiness(id)` | DELETE | `/business/:id` | Delete business |
| `updateBusiness(id, data)` | PUT | `/business/:id` | Update name/phone |
| `loadBuilder(id)` | GET | `/business/:id/builder` | Load full builder state |
| `saveBuilder(id, data)` | PUT | `/business/:id/builder` | Save full builder state |
| `submitForm(id, data, flowId, deliveryMethod, deliveryStaffId)` | POST | `/business/:id/submissions` | Submit a form |
| `fetchSubmissions(id)` | GET | `/business/:id/submissions` | List submissions |
| `fetchAnalytics(id)` | GET | `/business/:id/analytics` | Dashboard analytics |
| `updateSubmissionStatus(id, status)` | PUT | `/submissions/:id/status` | Change status |
| `assignSubmission(id, staffId)` | PUT | `/submissions/:id/assign` | Assign to staff |
| `fetchStaff(id)` | GET | `/business/:id/staff` | List staff |
| `createStaff(id, name, role, email, telegramChatId)` | POST | `/business/:id/staff` | Add staff |
| `updateStaff(id, name, role, email, telegramChatId)` | PUT | `/staff/:id` | Edit staff |
| `deleteStaff(id)` | DELETE | `/staff/:id` | Soft-delete staff |
| `fetchSettings(id)` | GET | `/business/:id/settings` | Get settings |
| `updateSettings(id, data)` | PUT | `/business/:id/settings` | Save settings |
| `fetchFlowDestinations(flowId)` | GET | `/flows/:flowId/destinations` | List flow destinations |
| `addFlowDestination(flowId, method, staffId)` | POST | `/flows/:flowId/destinations` | Add destination |
| `updateFlowDestinations(flowId, destinations)` | PUT | `/flows/:flowId/destinations` | Bulk replace |
| `deleteFlowDestination(id)` | DELETE | `/flow-destinations/:id` | Remove destination |

### Pages

#### Landing Page (`Landing.jsx`)
- Full marketing landing page for BotDesk
- Sections: Navbar (BotDesk logo + Login/Register), Hero (gradient bg, "Turn WhatsApp into your AI receptionist", Start free CTA), Trust badges (Free plan, No code, 5 min setup), Features grid (3 cards: Automate Replies, Capture Leads, Manage Requests), Use Cases (8 industry chips: Beauty Salon, Clinic, Restaurant, Gym, Real Estate, Auto Repair, Tutoring, Pet Services), Demo section (static phone mockup showing a sample conversation), CTA banner (emerald gradient), Footer
- Uses Tailwind CSS classes throughout
- Uses lucide-react icons: MessageSquare, Bot, Users, CalendarCheck, Sparkles, ArrowRight, CheckCircle2, Star

#### Login Page (`Login.jsx`)
- Clean login form with email + password fields
- Password show/hide toggle (Eye/EyeOff icons)
- Back to home link
- On submit: calls `login(email, password)` from auth context (mock — no real validation) then navigates to dashboard
- Client-side only validation: requires both fields non-empty
- BotDesk branding at top

#### Register Page (`Register.jsx`)
- Registration form with business name + email + password
- Password show/hide toggle
- Back to home link
- On submit: validates all fields, password >= 6 chars, calls `register(email, password, name)` from auth context (mock), navigates to dashboard
- BotDesk branding at top

#### Dashboard (`Dashboard.jsx`)
Two states:

**State 1 — No business (businessId is null):**
- Shows onboarding card: "Welcome to BotDesk" with description
- Green "Create Your Bot" CTA button that navigates to builder

**State 2 — Business exists:**
- Fetches analytics via `fetchAnalytics(businessId)` on mount
- **4 Stat Cards**: Total Submissions, New, In Progress, Completed — each with icon and count
- **Daily Bar Chart**: Last 7 days of submissions as vertical bars with date labels, max-height normalized, emerald colored
- **Recent Submissions**: Last 5 submissions shown as cards with #id, status badge, first 2 data fields, timestamp
- **Quick Actions**: 3 buttons — Edit Bot (→ builder), View Submissions (→ submissions), Manage Staff (→ staff)

#### Builder Page (`BuilderPage.jsx`, ~400 lines)
The main bot builder — a two-panel layout:

**Left panel**: `PhoneMockup` component (interactive WhatsApp preview)
**Right panel**: `EditorPanel` component (settings/configuration editor)

**State management:**
- `buttons` — The nested button tree (recursive children)
- `welcomeMessage` — The bot's greeting
- `path` — Array of button IDs representing current navigation depth in the menu tree
- `selectedButtonId` — Currently selected button for editing
- `businessId` — Current business
- `businessName` — Displayed in phone header
- `flowId` — The business's main flow ID
- `flowSteps` — Flow step definitions

**Key behaviors:**
- **localStorage caching**: Saves/restores builder state to `botdesk_builder_cache_{businessId}` for fast reload and offline recovery
- **Template loading**: When user picks a template → deletes existing business → creates new one via API → reloads builder from DB → caches
- **Save**: Sends full state to `PUT /business/:id/builder` → reloads from DB (to get new auto-increment IDs) → updates localStorage cache
- **Flow submission**: When user completes a flow in the phone mockup → calls `submitForm()` API with collected data + deliveryMethod + deliveryStaffId → shows success toast
- **Path navigation**: Double-clicking a menu button in the phone mockup navigates into it (pushes to path). Back button pops path.
- **Button CRUD**: Add button, update button fields, change behavior, add children — all update local state, saved on explicit Save click

#### Settings Page (`SettingsPage.jsx`)
Four sections in a single form:

1. **Business Profile**: Business name + phone number (saved via `updateBusiness()` API)
2. **Business Contact**: Email + WhatsApp number
3. **Telegram Configuration**: Bot token field + Chat ID field
4. **More Channels**: Placeholder text "Coming soon"

- Single "Save Settings" button saves both `updateSettings()` and `updateBusiness()` in parallel
- Fetches settings on mount via `fetchSettings()` and business info via `loadBuilder()` (to get business name/phone)

### Components

#### AdminLayout (`AdminLayout.jsx`)
- Sidebar (240px wide, collapsible to 68px) with:
  - BotDesk brand logo (emerald green MessageSquare icon)
  - 5 navigation items: Dashboard (LayoutDashboard), WhatsApp Builder (Bot), Submissions (Inbox), Staff (Users), Settings (Settings)
  - Active nav item highlighted with emerald background
  - Sidebar toggle button (ChevronLeft/ChevronRight)
  - User avatar (first letter of name) + logout button in footer
- Top header bar showing current page title
- Main content area renders children

#### PhoneMockup (`PhoneMockup.jsx`, ~900 lines)
A fully interactive WhatsApp-style phone preview. Three rendering modes:

**Mode 1 — Flow Execution** (when `activeFlowButton` is set):
- WhatsApp-style chat bubbles (gray for bot, green for user)
- Processes flow steps sequentially:
  - `text` → Shows text input field, user types answer
  - `choice` → Shows quick-reply buttons, user picks one
  - `choice_with_manual` → Shows choice buttons + "Type your own" option with text input + manual placeholder
  - `select_from_menu` → Navigates into the menu tree starting from `menuRoot`. User drills through nested menus. When reaching an info page, shows a preview card with "Confirm" button. Selection becomes the answer.
- After all steps: Shows **booking summary** card with all answers listed
- Summary has: Confirm button (triggers submission), Edit button (restarts flow)
- After confirm: Shows delivery method message if applicable (e.g., "📨 This request will be sent via Telegram to [staff name]")
- After confirm: Shows success message "✅ Request received! We'll get back to you shortly."

**Mode 2 — Info Page Preview** (when navigating to an info-type button):
- Styled card with 3 visual presets:
  - `clean` — white background, subtle borders
  - `friendly` — light green tint, warm feel
  - `premium` — dark background, gold accents
- Shows: title, description, price (if showPrice), duration (if showDuration)
- Action buttons at bottom (e.g., "Book this", "Back")
- Clicking "Book this" (start_flow behavior) enters flow execution mode
- Clicking "Back" (go_back behavior) returns to parent menu

**Mode 3 — Default Menu** (root or submenu level):
- Phone header: Business name (dynamic), "online" status, green WhatsApp header bar
- Welcome message as chat bubble (at root level)
- Draggable button list (uses @dnd-kit for reordering)
- Each button shows: label text, behavior badge (📂 Menu / ℹ️ Info)
- "+ Add Button" button at bottom
- Navigation: double-click menu button → enter its children. Back button to go up.
- Single-click selects button for editing in EditorPanel

**Additional features:**
- All three header instances show the dynamic business name
- WhatsApp-style visual treatment: green header, chat wallpaper pattern background, rounded message bubbles, timestamp on messages
- Phone frame: rounded corners, screen with status bar (time, battery, signal)

#### EditorPanel (`EditorPanel.jsx`, ~1100 lines)
The right-side configuration panel. What it shows depends on context:

**Context 1 — Button selected:**
- Back button to deselect
- "Button settings" header
- Button label text input
- **Behavior Accordion**: Pick between `menu` (📂 Sub-options, has children) or `info` (ℹ️ Info Page, shows details)
- If behavior = `info`: Shows `InfoPageEditor` (see below)
- If behavior = `menu`: Shows children count + list + "Add sub-option" button

**Context 2 — Inside a submenu (no button selected):**
- Shows "Sub-options of [parent label]" header
- Lists child buttons with behavior badges
- "Add sub-option" button
- Tip: "Click any sub-option to set what it does"

**Context 3 — Root level (no selection, no path):**
- Welcome message textarea
- Template selector: Shows all 15 templates as clickable cards (emoji + name + description). Click → confirm dialog → loads template (replaces current data)

**Sub-components inside EditorPanel:**

**`InfoPageEditor`** — Full editor for info pages:
- Style Accordion: 3 style presets (clean/friendly/premium) as selectable cards
- Content Accordion: Title (with emoji picker), Description (with emoji picker), Amount + Currency (dropdown: TRY/AED/USD/EUR), Duration, Display toggles (showPrice, showDuration)
- Extra Questions Accordion: Optional service-specific flow steps (e.g., "Do you have allergies?") using `InfoActionFlowBuilder`
- Action Buttons Accordion: List of action buttons inside the info page. Each has: label input, behavior picker (start_flow / go_back), flow builder (if start_flow), per-button delivery settings (if start_flow), remove button. "+ Add action button" to add more.

**`FlowBuilder`** — Drag-and-drop flow step editor:
- Uses @dnd-kit for reordering steps
- Each step is a `SortableStepItem` (expandable):
  - Question text input
  - Summary label input
  - Step type selector (text / choice / choice_with_manual / select_from_menu)
  - If choice: Option list with add/remove
  - If choice_with_manual: Options + manual placeholder input
  - If select_from_menu: `MenuRootPicker` dropdown (shows all menu buttons that have children)
  - Delete step button
- "+ Add Step" button with suggestion chips (pre-written questions per type)

**`ButtonDelivery`** — Per-button delivery configuration:
- Delivery method dropdown: None / Email / Telegram / WhatsApp (disabled, coming soon)
- If method != none: Staff assignment dropdown (filtered to show only staff with the required contact info)
- Validation warnings: shows if no staff have the required contact, or if selected staff is missing it

**`MenuRootPicker`** — Dropdown to select a parent menu button:
- Flattens the button tree to show only buttons that have children
- Indented display to show hierarchy
- Required validation warning if no selection

**`EmojiPicker`** — Grid of common emojis for title/description fields

**`Accordion`** — Reusable collapsible section component

#### SubmissionsList (`SubmissionsList.jsx`, ~207 lines)
- Two-panel layout: 420px list panel + flex detail panel
- Empty state when no businessId: Inbox icon + "No bot configured yet" message
- **Filter tabs**: All / New / In Progress / Done / Cancelled
- **List items**: Show #id, status badge (colored pill), first 2 data fields truncated, timestamp, assigned staff name
- **Detail panel** (`SubmissionDetail`): Shows submission #id, timestamp, status dropdown (changeable), staff assignment dropdown, all submitted data fields as key-value pairs
- Assigning staff auto-sets status to 'in_progress' if currently 'new'
- Data refreshes after any status change or assignment

#### StaffManager (`StaffManager.jsx`, ~200 lines)
- Empty state when no businessId: Users icon + "No bot configured yet" message
- **Add form**: Name (required), Role (optional), Email (optional), Telegram Chat ID (optional) — two rows of inputs + "Add Staff" button
- **Staff list**: Each card shows name, role badge, email/telegram contact info
- **Inline edit**: Click "Edit" → inputs appear in-place → Save/Cancel
- **Delete**: Confirm dialog → soft delete (sets active=0, unassigns submissions)

---

## 6. Templates System

File: `v2/client/src/lib/templates.js` (~4300 lines)

**15 industry templates**, each a function that generates a complete `{ welcomeMessage, buttons }` structure:

| # | Key | Name | Business Name | Service Categories |
|---|---|---|---|---|
| 1 | beauty_salon | Beauty Salon | Glow Studio | Hair (6), Nails (5), Lashes & Brows (5), Skincare (4), Waxing (5) = 25 services |
| 2 | medical_clinic | Medical Clinic | CarePoint Medical | General Medicine (4), Pediatrics (4), Dentistry (4), Dermatology (4), Orthopedics (4), Eye Care (4) = 24 services |
| 3 | restaurant | Restaurant / Cafe | Bella Tavola | Breakfast (4), Starters (4), Main Courses (5), Pasta (5), Desserts (4), Drinks (5) = 27 items |
| 4 | real_estate | Real Estate | Skyline Realty | Apartments (5), Houses (4), Condos (4), Commercial (4), Land (4) = 21 listings |
| 5 | car_rental | Car Rental | DriveEasy Rentals | Economy (4), SUV (4), Luxury (4), Vans (3), Convertibles (3) = 18 vehicles |
| 6 | fitness_gym | Fitness / Gym | IronCore Fitness | Strength (4), Cardio (4), Yoga (4), Martial Arts (3), Personal Training (3) = 18 programs |
| 7 | hotel | Hotel | The Grand Meridian | Standard (3), Suites (3), Family (3), Spa & Wellness (4) = 13 rooms/services |
| 8 | pet_care | Pet Care / Vet | Paws & Whiskers | Check-ups (4), Vaccines (4), Grooming (5), Dental (4), Surgery (4) = 21 services |
| 9 | education | Education / Tutoring | BrightPath Academy | Math (4), Languages (4), Science (4), Test Prep (4), Music (4) = 20 courses |
| 10 | auto_repair | Auto Repair | TrustWrench Auto | Oil (3), Brakes (4), Tires (4), Engine (4), A/C (3) = 18 services |
| 11 | photography | Photography Studio | FrameLight Studios | Portraits (4), Weddings (3), Product (4), Events (4) = 15 packages |
| 12 | law_firm | Law Firm | Sterling & Associates | Family (4), Business (4), Real Estate (4), Injury (3), Immigration (4) = 19 services |
| 13 | cleaning | Cleaning Services | SparkleHome | Regular (4), Deep (4), Move-in/out (3), Office (4), Specialty (4) = 19 services |
| 14 | event_planning | Event Planning | Luxe Events Co | Weddings, Corporate, Birthday, Social (varied) |
| 15 | travel_agency | Travel Agency | Wanderlust Travel | Beach (varies), Adventure, Cultural, Luxury |

**Each template includes:**
- A welcome message with emojis
- A nested menu tree (typically: "Our Services/Menu/Departments" → categories → individual items)
- A "Book Appointment / Reserve / Contact" shortcut button
- A "Call Us / Emergency" info button with contact details
- A "Location / Find Us" info button with address
- **Base flow steps** (shared questions: service selection via select_from_menu, name, returning customer, preferred date, preferred time)
- **Category-specific extra steps** (e.g., beauty salon's nail services ask about removal, restaurant asks about dietary needs)
- Each service has an info page with: title, description, price, currency, duration, display style
- Each service's info page has action buttons: "Book this" (start_flow) + "Back" (go_back)

**ID ranges**: Each template uses a unique starting ID (1000, 2000, 3000, etc.) with an auto-incrementing counter to avoid collisions.

**Template loading flow:**
1. User clicks template in EditorPanel → confirm dialog
2. If business exists → deletes it via API
3. Creates new business via `POST /business` with templateKey
4. Backend calls `seedBusiness()` which inserts everything into DB
5. Frontend reloads builder from DB via `GET /business/:id/builder`
6. Caches in localStorage

---

## 7. Data Flow: How It All Connects

### Creating a Bot
1. User registers (mock auth) → dashboard shows onboarding
2. User goes to builder → picks a template
3. Template function generates `{ welcomeMessage, buttons }` structure
4. API `POST /business` → `seedBusiness()` runs in a transaction → inserts business, bot_config, flow, all buttons recursively, flow_steps
5. Frontend loads builder state from DB → caches in localStorage
6. User can now customize: edit labels, change behaviors, add/remove buttons, modify flow steps, configure delivery

### Customer Interaction (Simulated in Phone Mockup)
1. Phone mockup shows welcome message + root buttons
2. Customer taps a menu button → navigates to submenu
3. Customer taps an info button → sees service card (title, description, price, duration)
4. Customer taps "Book this" → enters flow execution
5. Flow asks questions step by step (text input, choice buttons, menu selection)
6. After all steps: shows booking summary
7. Customer confirms → `POST /business/:id/submissions` with all answers + delivery config
8. Submission created in DB, 3-tier notifications sent

### 3-Tier Delivery System
When a submission is created, notifications are sent in 3 layers:

**Tier 1 — Per-Button Delivery** (highest priority):
- Configured in EditorPanel's `ButtonDelivery` component
- Each action button can have its own `deliveryMethod` (email/telegram) and `deliveryStaffId`
- If set: staff is auto-assigned to submission, notification sent directly to that staff member

**Tier 2 — Per-Flow Delivery** (flow-level rules):
- Configured via flow_destinations table (managed in flow destinations API)
- Each flow can have multiple destinations (staff + method pairs)
- All matching destinations receive notification

**Tier 3 — Global Delivery** (business-level fallback):
- Configured in Settings page (Telegram bot token + chat ID)
- `sendTelegramNotification()` sends to the main business chat
- Always fires regardless of Tier 1 and Tier 2

### Data Persistence
- **Primary**: SQLite database (`v2/server/data.db`)
- **Cache**: localStorage in browser (`botdesk_builder_cache_{businessId}`)
- **Cache strategy**: Save → reload from DB → cache. On page load: try cache first, then fetch from DB.
- **Auth**: localStorage only (`botdesk_user` key)

---

## 8. What Works (Implemented & Functional)

1. **Full bot builder UI** — Two-panel layout with interactive phone mockup and configuration editor
2. **Nested menu tree** — Unlimited depth, parent→child relationships, drag-and-drop reordering
3. **Two button behaviors**: menu (has children) and info (has info page)
4. **Info pages** — Title, description, price, currency, duration, 3 visual styles (clean/friendly/premium), display toggles
5. **Action buttons on info pages** — start_flow (triggers questionnaire) and go_back (returns to menu)
6. **4 flow step types**: text, choice, choice_with_manual, select_from_menu
7. **select_from_menu step type** — Lets user navigate the menu tree and pick a service during flow execution
8. **Extra steps per service** — Service-specific questions appended to the main flow
9. **Flow execution in phone mockup** — Full chat simulation with step-by-step questions, answers, booking summary, confirm/edit
10. **15 industry templates** — Each with complete menu trees, flow steps, service details, category-specific extra questions
11. **Template loading** — Pick template → delete old business → create new → reload from DB
12. **Full builder save/load** — Atomic save (replaces all data in transaction), load reconstructs full nested tree
13. **localStorage caching** — Fast reload, offline recovery, save-and-reload flow
14. **Submissions system** — Create, list, filter by status, view details, change status, assign to staff
15. **Staff management** — CRUD with name, role, email, Telegram chat ID. Soft delete.
16. **3-tier delivery** — Per-button → per-flow → global Telegram notifications
17. **Telegram integration** — Real Telegram Bot API calls for notifications (when configured)
18. **Per-button delivery configuration** — Each action button can route to a specific staff member via email or telegram
19. **Per-flow delivery destinations** — Flow-level routing rules
20. **Analytics dashboard** — Total/new/in-progress/done counts, daily chart, recent submissions, quick actions
21. **Dashboard onboarding state** — Welcome card when no business exists
22. **Settings page** — Business profile (name/phone), contact info (email/WhatsApp), Telegram config
23. **Marketing landing page** — Full responsive design with features, use cases, demo section, CTA
24. **Login/Register pages** — Styled forms with BotDesk branding (mock auth)
25. **Admin sidebar layout** — Collapsible sidebar with 5 nav items, user avatar, logout
26. **Responsive empty states** — Consistent empty state cards on Submissions, Staff pages when no business exists
27. **Drag-and-drop** — Button reordering in phone mockup, flow step reordering in editor
28. **Emoji picker** — Inline emoji insertion for info page titles and descriptions
29. **Dynamic business name** — Phone mockup header shows actual business name from template/settings
30. **SQLite with full relational schema** — 14 tables with proper foreign keys, indexes, migrations

---

## 9. What Is Mock / Placeholder

1. **Authentication is completely fake** — `login()` and `register()` just store a JSON object in localStorage. No password hashing, no JWT tokens, no backend session validation. Any email/password works. The backend hardcodes `user_id = 1` for all operations.

2. **Email delivery is NOT implemented** — The `deliveryMethod: 'email'` option exists in the UI and database, but no actual email sending code exists anywhere. The per-button delivery for email only auto-assigns the staff member. The per-flow delivery for email does nothing (Telegram is the only send method implemented).

3. **WhatsApp delivery is disabled** — The dropdown shows "WhatsApp (coming soon)" as a disabled option. No WhatsApp Business API integration exists.

4. **"More Channels" in Settings** — Shows "Coming soon — email, SMS, WhatsApp Business API" placeholder text.

5. **Multi-user / multi-tenant** — The schema supports multiple users and businesses, but the backend hardcodes `user_id = 1`. No tenant isolation. No user registration on backend. Everyone shares the same mock user.

6. **The phone mockup is a simulation only** — It does NOT connect to any real WhatsApp. It's a local preview tool for the business owner to see how the bot would look. Submissions are created in the local database.

7. **No real chatbot runtime** — There is no webhook, no WhatsApp Cloud API integration, no message processing pipeline. The system only builds the bot definition and simulates it in-browser.

---

## 10. What Is Missing / Not Implemented

1. **Real authentication** — Backend auth routes, password hashing (bcrypt), JWT/session tokens, protected API routes
2. **Real WhatsApp integration** — WhatsApp Cloud API webhook, message receiving, automated response sending
3. **Email sending** — SMTP/SendGrid/Mailgun integration for email delivery
4. **Multi-user support** — User registration on backend, tenant isolation on all queries
5. **Image/media upload** — No file upload for info pages (images, photos)
6. **Flow destinations UI** — The API exists but there's no UI page to manage per-flow delivery destinations (the routes exist but no frontend page was built to configure them)
7. **Deployment** — No Docker, no environment variables for configuration, no production build config
8. **API security** — No rate limiting, no input sanitization middleware, no CORS restriction, no helmet headers
9. **Error handling** — Minimal. Most API calls in frontend silently fail. Backend has basic try/catch.
10. **Search / pagination** — Submissions and staff lists have no search, no pagination (loads all)
11. **Audit log** — No history tracking of changes, no activity log
12. **Export** — No CSV/PDF export of submissions
13. **Testing** — No unit tests, no integration tests, no E2E tests
14. **i18n** — English only, no internationalization
15. **Dark mode** — UI is light theme only
16. **Mobile responsiveness** — Admin UI is desktop-oriented. Landing page is responsive but admin pages may not be.
17. **Flow branching/logic** — Flows are linear only. No conditional branching based on answers.
18. **Multiple flows per business** — Schema supports it but UI only shows/uses one flow
19. **Business deletion confirmation** — Template loading deletes the entire business without an undo option
20. **Scheduled messages / follow-ups** — Not implemented
21. **Customer identity / conversation history** — No concept of end-customer identity or conversation continuity

---

## 11. Known Architecture Decisions

1. **SQLite + better-sqlite3**: Chosen for simplicity. Synchronous driver means no async/await needed for DB calls. WAL mode supports concurrent reads. Fine for single-server, local development. Would need to migrate to PostgreSQL/MySQL for production multi-server.

2. **Full save/reload pattern**: The builder doesn't do incremental updates. It sends the entire button tree + welcome message on every save. The backend deletes everything and re-inserts. This avoids complex diff logic but means: (a) all IDs change on every save, (b) localStorage cache is essential for fast UX. The reload-after-save step gets the new DB-assigned IDs.

3. **ID remapping for menuRoot**: Flow steps with type `select_from_menu` reference a `menuRoot` button ID. Since full-save deletes and re-inserts all buttons (giving them new IDs), the save logic builds an `oldToNewButtonId` map and remaps all menuRoot references.

4. **Templates as code**: Templates are JavaScript functions, not database records. They generate fresh ID-sequenced data structures on each call. This means templates can't be edited at runtime, but they're easy to author and version-control.

5. **3-tier delivery priority**: Per-button delivery (closest to the action) → per-flow delivery (flow-level rules) → global Telegram (business fallback). All three fire independently — they don't short-circuit. A submission could trigger notifications at all three levels.

6. **Soft delete for staff**: Staff are never actually removed from the database. `active=0` hides them from lists. This preserves referential integrity for existing submissions that reference them.

7. **Inline styles in EditorPanel + PhoneMockup**: These two large components use JavaScript style objects, not Tailwind classes. The rest of the app (Landing, Login, Register, Dashboard, AdminLayout, SubmissionsList, StaffManager, SettingsPage) uses Tailwind CSS classes. This is a mix that happened over development iterations.

8. **Mock auth as MVP shortcut**: Authentication was intentionally deferred. The focus was on building the builder + submission flow + delivery pipeline. Auth would be the first thing to implement for a real deployment.

9. **No environment variables**: All configuration (port, API URL, DB path) is hardcoded. Would need .env files and a config module for deployment.

10. **Single flow per business (in practice)**: The database schema supports multiple flows per business, but the seeder creates exactly one flow, the builder loads/saves one flow, and the UI doesn't expose multi-flow management. The schema is ready for expansion.

---

*End of report. Every statement above was verified by reading the actual source code.*
