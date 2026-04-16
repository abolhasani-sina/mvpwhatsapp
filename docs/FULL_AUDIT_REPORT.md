# MVPWhatsapp — Complete System Audit Report

### Prepared by: Principal Reverse Engineer / Senior Software Architect / QA Lead / Product Analyst / Security Auditor
### Audit Date: July 2025
### Codebase State: All 16 migrations applied, server running on port 3001, client builds clean (101 modules, 0 errors)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack & Architecture](#2-technology-stack--architecture)
3. [Domain Model & Data Layer](#3-domain-model--data-layer)
4. [Module-by-Module Breakdown](#4-module-by-module-breakdown)
5. [WhatsApp Engine Deep Dive](#5-whatsapp-engine-deep-dive)
6. [ConversationBuilder Deep Dive](#6-conversationbuilder-deep-dive)
7. [API Surface Map](#7-api-surface-map)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Feature Inventory (Implemented vs. Blueprint)](#9-feature-inventory-implemented-vs-blueprint)
10. [Bugs, Risks & Weaknesses](#10-bugs-risks--weaknesses)
11. [Security Audit](#11-security-audit)
12. [Gap Analysis (Code vs. Requirements)](#12-gap-analysis-code-vs-requirements)
13. [Prioritized Next Steps](#13-prioritized-next-steps)

---

## 1. Executive Summary

MVPWhatsapp is a multi-tenant platform enabling businesses to create structured, interactive WhatsApp experiences — menus, guided flows, and request lifecycle management. The codebase is a **modular monolith** split into a Node.js/Express API server and a React SPA client.

### What Works

- **Core architecture is sound**: Modular server (11 modules), clean separation of concerns, tenant isolation via middleware.
- **WhatsApp engine is functional**: State machine handles MENU and FLOW modes, generates correct interactive messages, processes webhooks. Tested and confirmed working.
- **Template system works**: 9 industry templates with deep-copy application (services, menus, flows, assignments).
- **Full CRUD across all entities**: Services, menus, flows, requests, assignees, assignment rules — all have working create/read/update/delete.
- **Client builds clean**: 101 modules, zero build errors, ~435KB JS + ~52KB CSS (gzipped: ~121KB + ~9KB).
- **Database is stable**: 16 migrations applied, 16 tables, 7 native enums, all FK constraints intact.
- **ConversationBuilder**: 4-step wizard (Services → Flows → Menu → Test) with publish pipeline.

### What Needs Attention

- **Security vulnerabilities**: JWT uses same secret for access/refresh tokens, insecure default fallback, business routes unauthenticated.
- **No test suite**: Zero automated tests (no test framework in dependencies).
- **Delete-all-recreate publish**: ConversationBuilder wipes all server data and recreates from local state — destructive and fragile.
- **No WhatsApp connection management UI**: Only 1 `whatsapp_accounts` row exists, no UI to manage it.
- **No platform owner role**: Only `business_owner` role is used; `platform_owner` exists in enum only.
- **info_contents and action_buttons tables empty**: These tables have 0 rows — the engine handles info nodes via label text only.

### Database State (Verified)

| Table | Rows | Notes |
|---|---|---|
| businesses | 17 | 17 test businesses |
| users | 17 | 1:1 with businesses |
| services | 101 | Template-generated |
| templates | 9 | 9 industry types |
| template_data | 9 | JSONB payloads |
| menu_nodes | 155 | Tree structures |
| info_contents | 0 | **Unused** |
| action_buttons | 0 | **Unused** |
| flows | 37 | With step children |
| flow_steps | 193 | Avg ~5.2 steps/flow |
| requests | 13 | Various statuses |
| assignees | 17 | Per-business staff |
| assignment_rules | 110 | Template-generated |
| notifications | 22 | Created on request events |
| sessions | 5 | Active conversations |
| whatsapp_accounts | 1 | Single Meta connection |

---

## 2. Technology Stack & Architecture

### Backend

| Component | Technology | Version |
|---|---|---|
| Runtime | Node.js | (system) |
| Framework | Express | 4.21.2 |
| Database | PostgreSQL | via Knex 3.1.0 |
| Auth | JWT (jsonwebtoken 9.0.2) | Cookie-based |
| Password hashing | bcrypt | 6.0.0 |
| CORS | cors | 2.8.5 |
| Env vars | dotenv | 16.4.7 |

**Entry point**: `server/src/server.js` → `app.js`
**Port**: 3001 (configurable via .env)
**Database**: PostgreSQL `mvpwhatsapp` on localhost:5432

### Frontend

| Component | Technology | Version |
|---|---|---|
| Framework | React | 19.2.0 |
| Build tool | Vite | 8.0.8 |
| CSS | TailwindCSS | 4.2.3 |
| HTTP client | axios | 1.9.0 |
| Routing | react-router-dom | 7.14.0 |

**Entry point**: `client/src/main.jsx` → `App.jsx`
**Dev port**: 5173 (proxied to 3001)

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    REACT SPA (Vite)                      │
│  ┌─────────┐ ┌────────┐ ┌───────────────────────────┐   │
│  │ Router  │ │Context │ │ Pages (15 routes)          │   │
│  │(RR v7)  │ │AuthCtx │ │ Dashboard, ConvBuilder,   │   │
│  │         │ │BizCtx  │ │ Services, Menu, Flows...  │   │
│  └────┬────┘ └───┬────┘ └──────────┬────────────────┘   │
│       │          │                  │                     │
│       ▼          ▼                  ▼                     │
│  ┌───────────────────────────────────────────────┐       │
│  │  api/client.js (axios, token refresh, queue)  │       │
│  │  services/api.js (API function layer)         │       │
│  └─────────────────────┬─────────────────────────┘       │
└────────────────────────┼─────────────────────────────────┘
                         │ HTTP (cookies)
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  EXPRESS SERVER (3001)                    │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Middleware: cors → json → cookieParser →         │    │
│  │  authenticate → tenantScope → errorHandler        │    │
│  └──────────┬───────────────────────────────────────┘    │
│             │                                            │
│  ┌──────────▼───────────────────────────────────────┐    │
│  │  11 Route Modules under /api/v1/*                │    │
│  │  ┌────────┐ ┌──────────┐ ┌─────────┐            │    │
│  │  │  auth  │ │ business │ │ service │            │    │
│  │  └────────┘ └──────────┘ └─────────┘            │    │
│  │  ┌────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │ template│ │   menu   │ │   flow   │           │    │
│  │  └────────┘ └──────────┘ └──────────┘           │    │
│  │  ┌─────────┐ ┌───────────┐ ┌──────────────┐     │    │
│  │  │ request │ │ assignee  │ │assignment-rule│     │    │
│  │  └─────────┘ └───────────┘ └──────────────┘     │    │
│  │  ┌──────────────┐ ┌─────────┐                    │    │
│  │  │ notification │ │whatsapp │                    │    │
│  │  └──────────────┘ └─────────┘                    │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Test Endpoints (NO AUTH):                        │    │
│  │  POST /test/whatsapp (simulator)                  │    │
│  │  DELETE /test/whatsapp/reset                      │    │
│  │  POST /test/whatsapp/publish                      │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  PostgreSQL (5432)  │
              │  mvpwhatsapp DB     │
              │  16 tables, 7 enums │
              └─────────────────────┘
```

### Module Structure Pattern

Each server module follows a consistent layering:
```
module/
  module.controller.js   — Request/response handling
  module.routes.js       — Express route definitions
  module.service.js      — Business logic (DB access)
  module.validation.js   — Input validation (optional)
```

Exceptions: `whatsapp` module has `engine.js` (state machine) and `formatter.js`; `menu` module has `tree.js` (tree utilities); `assignment-rule` module has `assignment.engine.js`.

---

## 3. Domain Model & Data Layer

### Entity Relationship Map

```
businesses (1) ──────┬──► users (N)
                     ├──► services (N, self-referencing via parent_id)
                     ├──► menu_nodes (N, self-referencing via parent_id)
                     │      ├──► info_contents (1:1)
                     │      └──► action_buttons (N)
                     ├──► flows (N) ──► flow_steps (N)
                     ├──► requests (N) ──► notifications (N)
                     ├──► assignees (N)
                     ├──► assignment_rules (N) ──► assignees (FK)
                     ├──► sessions (N)
                     └──► whatsapp_accounts (N)

templates (N) ──► template_data (1:1, JSONB payload)
```

### Table Schema Details

#### businesses
- `id` UUID PK (default gen_random_uuid)
- `name` VARCHAR(255) NOT NULL
- `phone` VARCHAR(50)
- `location` VARCHAR(500)
- `description` TEXT
- `is_active` BOOLEAN DEFAULT true
- `created_at` TIMESTAMP
- `template_applied_at` TIMESTAMP (NULL = not yet set up)
- `published_at` TIMESTAMP (NULL = never published)

#### users
- `id` UUID PK
- `business_id` UUID FK → businesses (CASCADE DELETE)
- `email` VARCHAR(255) UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL
- `role` ENUM('platform_owner', 'business_owner')
- `created_at` TIMESTAMP

#### services
- `id` UUID PK
- `business_id` UUID FK → businesses (CASCADE DELETE)
- `parent_id` UUID FK → services (CASCADE DELETE) — self-referencing tree
- `name` VARCHAR(255) NOT NULL
- `description` TEXT
- `price` DECIMAL(10,2)
- `duration` VARCHAR(100)
- `created_at` TIMESTAMP

#### menu_nodes
- `id` UUID PK
- `business_id` UUID FK → businesses (CASCADE DELETE)
- `parent_id` UUID FK → menu_nodes (CASCADE DELETE) — self-referencing tree
- `node_type` ENUM('menu', 'info', 'flow_entry', 'action')
- `label` VARCHAR(255)
- `sort_order` INTEGER DEFAULT 0
- `action_type` VARCHAR(50)
- `action_config` JSONB DEFAULT '{}'
- `flow_id` UUID FK → flows (SET NULL)
- `is_active` BOOLEAN DEFAULT true
- `created_at` TIMESTAMP

#### flows
- `id` UUID PK
- `business_id` UUID FK → businesses (CASCADE DELETE)
- `name` VARCHAR(255) NOT NULL
- `description` TEXT
- `is_active` BOOLEAN DEFAULT true
- `created_at` TIMESTAMP

#### flow_steps
- `id` UUID PK
- `flow_id` UUID FK → flows (CASCADE DELETE)
- `label` VARCHAR(500)
- `type` ENUM('text_input', 'number_input', 'select_option', 'select_service', 'select_date', 'select_time', 'confirm', 'summary')
- `step_order` INTEGER NOT NULL
- `config` TEXT (JSON string)
- `created_at` TIMESTAMP

#### requests
- `id` UUID PK
- `business_id` UUID FK → businesses (CASCADE DELETE)
- `source_flow_id` UUID FK → flows (SET NULL)
- `entered_from_node_id` UUID FK → menu_nodes (SET NULL)
- `data` JSONB
- `status` ENUM('pending', 'approved', 'rejected', 'manual_followup', 'completed')
- `assigned_to_id` UUID FK → assignees (SET NULL)
- `assigned_at` TIMESTAMP
- `assigned_by` VARCHAR(50)
- `phone_number` VARCHAR(50)
- `created_at` TIMESTAMP

#### sessions
- `phone_number` VARCHAR(50) NOT NULL
- `business_id` UUID FK → businesses (CASCADE DELETE)
- `current_menu_node_id` UUID
- `current_flow_id` UUID
- `current_flow_step` INTEGER
- `flow_data` JSONB
- `mode` ENUM('automated', 'human_takeover') DEFAULT 'automated'
- `last_activity` TIMESTAMP
- **UNIQUE** (phone_number, business_id)

### Enum Registry

| Enum Name | Values |
|---|---|
| user_role | platform_owner, business_owner |
| menu_node_type | menu, info, flow_entry, action |
| flow_step_type | text_input, number_input, select_option, select_service, select_date, select_time, confirm, summary |
| request_status | pending, approved, rejected, manual_followup, completed |
| session_mode | automated, human_takeover |
| action_button_behavior | trigger_flow, action |
| assignment_trigger_type | service, menu_node, flow |

---

## 4. Module-by-Module Breakdown

### 4.1 Auth Module

**Files**: controller.js, routes.js, service.js
**Routes**: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`

**Behavior**:
- Register creates a business + user in a transaction. Default role: `business_owner`.
- Login validates credentials via bcrypt, returns `access_token` (cookie, 15min) + `refresh_token` (cookie, 7d, httpOnly, path=/api/v1/auth/refresh).
- Refresh validates refresh token and issues new access token.
- Logout clears both cookies.
- **All tokens use `sameSite: 'lax'`, `secure: false`** — appropriate for dev, needs change for production.

**Issues Found**:
- Same JWT secret for access and refresh tokens (config `jwtSecret` used for both).
- Fallback secret is `'dev-secret-change-me'` — insecure if env var missing.
- No rate limiting on login endpoint.
- No password complexity enforcement (only `minLength: 6` on register).
- No email verification.

### 4.2 Business Module

**Files**: controller.js, routes.js, profile.routes.js, service.js, validation.js
**Routes**: `GET /businesses`, `GET /businesses/:id`, `PUT /businesses/:id` (public); `GET /profile`, `PUT /profile` (scoped to auth user)

**Critical Issue**: The `/businesses` routes have **no auth middleware**. Anyone can list/get/update any business. Only `/profile` routes are protected.

### 4.3 Service Module

**Files**: controller.js, routes.js, service.js, validation.js
**Routes**: `GET /services`, `GET /services/:id`, `POST /services`, `PUT /services/:id`, `DELETE /services/:id`

**Behavior**:
- Supports hierarchical services via `parent_id` (self-referencing FK with CASCADE DELETE).
- `list()` returns flat array; tree building done client-side or via `buildServiceTree()`.
- `getLeafServices(tenantId)` returns services with no children — used for `select_service` flow step.

**Issues**:
- `create` doesn't validate that `parent_id` belongs to the same tenant.
- No validation for negative prices.
- Tree building is O(n²) — acceptable for small datasets.

### 4.4 Template Module

**Files**: controller.js, routes.js, service.js
**Routes**: `GET /templates`, `GET /templates/status`, `POST /templates/:id/apply`, `POST /templates/skip`

**Behavior** — `applyTemplate()` (most complex single function):
1. Guards against re-application via `template_applied_at`.
2. Deep-copies in a single transaction:
   - Services (with ID remapping)
   - Menu nodes (two-pass: first without parent_id, then update parents using remap)
   - Flows + flow steps (with ID remapping, config stored as JSON string)
   - Links flow_entry nodes to new flow IDs
3. Creates a default assignee ("Owner") per business.
4. Creates assignment rules per service (structured trigger_type/trigger_id matching) + a fallback catch-all rule.
5. Sets `template_applied_at` on the business.

**Template data stored as JSONB**: `{ services: [...], menu_nodes: [...], flows: [{ steps: [...] }] }`

### 4.5 Menu Module

**Files**: controller.js, routes.js, service.js, tree.js, validation.js
**Routes**: `GET /menu/tree`, `GET /menu/:id`, `POST /menu`, `PUT /menu/:id`, `DELETE /menu/:id`, `POST /menu/publish`

**Behavior**:
- Tree operations: `buildTree()` (flat → nested), `getNodeDepth()`, `getSubtreeDepth()`, `calculateMaxDepth()`.
- Constraints enforced: max depth 4, max 10 children per node, cycle prevention via `isDescendant()`.
- `publish()` runs `validateForPublish()` to check structural integrity. Sets `published_at` on business.
- TreeView uses `sort_order` for ordering children.

### 4.6 Flow Module

**Files**: controller.js, routes.js, service.js, validation.js
**Routes**: `GET /flows`, `GET /flows/:id`, `POST /flows`, `PUT /flows/:id`, `DELETE /flows/:id`, `POST /flows/:flowId/steps`, `PUT /flows/:flowId/steps/:stepId`, `DELETE /flows/:flowId/steps/:stepId`

**Behavior**:
- Two-table CRUD (flows + flow_steps).
- `getFlowById()` returns flow with ordered steps.
- Steps have `step_order` auto-assigned, `config` stored as JSON string.
- Validation: 8 step types, `validateFlowIntegrity()` checks ≥1 step, sequential ordering from 1, last step must be `confirm`.
- Validation is **non-blocking** (checked at read time, not save time) — allows saving invalid flows.

### 4.7 Request Module

**Files**: controller.js, routes.js, service.js, validation.js
**Routes**: `GET /requests`, `GET /requests/:id`, `PUT /requests/:id/status`, `PUT /requests/:id/assign`

**State Machine**:
```
pending → approved | rejected | manual_followup
approved → completed
manual_followup → approved | rejected | completed
rejected → (terminal)
completed → (terminal)
```

**Behavior**:
- `list(tenantId, status)` supports status filter.
- `updateStatus()` validates transition legality.
- `assign()` sets `assigned_to_id`, `assigned_at`, `assigned_by` = 'manual'.
- Created automatically by WhatsApp engine on flow completion.

### 4.8 Assignee Module

**Files**: controller.js, routes.js, service.js, validation.js
**Routes**: `GET /assignees`, `GET /assignees/:id`, `POST /assignees`, `PUT /assignees/:id`, `DELETE /assignees/:id`

Standard CRUD. Each assignee has: name, phone_number, label (role), is_active. Scoped by business_id.

### 4.9 Assignment Rule Module

**Files**: controller.js, routes.js, service.js, validation.js, assignment.engine.js
**Routes**: `GET /assignment-rules`, `GET /assignment-rules/:id`, `POST /assignment-rules`, `PUT /assignment-rules/:id`, `DELETE /assignment-rules/:id`

**Assignment Engine** (`assignment.engine.js`):
- `evaluateAssignment(businessId, context)` — called after request creation.
- Loads all active rules for the business, sorted by priority ASC (lower = checked first).
- **Dual matching**: tries structured match (trigger_type + trigger_id) first, falls back to legacy `conditions` JSON (AND logic, empty = match-all).
- **Conflict detection**: if multiple rules tie at the highest priority, request stays unassigned.
- **Inactive assignee protection**: skips rules pointing to inactive assignees.
- Returns `{ assignee_id, rule_id }` or `null`.

### 4.10 Notification Module

**Files**: controller.js, routes.js, service.js
**Routes**: `GET /notifications`, `GET /notifications/unread`, `PUT /notifications/:id/read`

- Polymorphic: `reference_id` + `reference_type` + `type` (request_created, assigned, status_changed).
- Created by engine on flow completion and assignment.
- Frontend displays in Notifications page with read/unread toggle.

### 4.11 WhatsApp Module

**Files**: controller.js, routes.js, service.js, engine.js, formatter.js; session.controller.js, session.routes.js, session.service.js
**Routes**: `GET /whatsapp/webhook`, `POST /whatsapp/webhook`, `POST /whatsapp/simulate`; `GET /sessions`, `PUT /sessions/:id/takeover`, `PUT /sessions/:id/release`

Detailed in section 5.

---

## 5. WhatsApp Engine Deep Dive

### Architecture

The engine (`whatsapp.engine.js`, ~730 lines) is the **core runtime** of the platform. It processes incoming messages and produces WhatsApp Cloud API payloads.

### State Machine

```
              ┌───────────────────────┐
              │    Message Received    │
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │   Load/Create Session  │
              │  (30-min timeout check)│
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │  human_takeover mode?  │─── Yes ──► (ignore, let human handle)
              └───────────┬───────────┘
                          │ No
              ┌───────────▼───────────┐
              │   In active flow?     │─── Yes ──► handleFlowContext()
              └───────────┬───────────┘
                          │ No
              ┌───────────▼───────────┐
              │   handleMenuContext()  │
              └───────────────────────┘
```

### Menu Navigation

- **Root resolution**: `resolveRootMenu()` detects "wrapper pattern" — if a single root menu node has children, skip directly to its children. Otherwise show root children.
- **Navigation**: User picks by index (1, 2, 3...). Engine calls `getMenuChildren()` sorted by `sort_order`, maps user input to child node.
- **Special commands**: `#` or `menu` → root reset, `0` or `back` → parent, `cancel` → exit flow.
- **Node type handlers**:
  - `menu` → display children as buttons
  - `info` → display label text + action buttons from DB
  - `flow_entry` → start linked flow
  - `action` → execute action_type (show_phone, show_location, open_link, go_back)

### Flow Processing

- **Step-by-step**: Session tracks `current_flow_id`, `current_flow_step` (1-indexed), `flow_data` (JSONB).
- **Input validation**: `validateStepInput()` per type:
  - `text_input`: non-empty string
  - `number_input`: valid number
  - `select_option`: index within options array
  - `select_service`: index within leaf services
  - `select_date`: legacy handling (options or free text)
  - `select_time`: legacy handling (options or free text)
  - `confirm`: accepts "yes"/"1"/"confirm"
  - `summary`: auto-skip (display only)
- **Prompt building**: `buildStepPrompt()` / `resolveStepPrompt()` generate the question message. `select_service` shows breadcrumb paths (e.g., "Hair > Coloring").
- **Completion**: `completeFlow()` creates request, runs assignment engine, creates notifications, resets session to root menu.

### Message Formatting

`whatsapp.formatter.js` auto-selects format:
- 1-3 options → interactive buttons (`type: "button"`)
- 4-10 options → interactive list (`type: "list"`)
- 10+ options → numbered text message
- Truncation: button title 20 chars, description 72 chars, section title 20 chars.

### Webhook Integration

- **Verification**: `GET /whatsapp/webhook` — responds to Meta's challenge with `hub.verify_token` matching.
- **Incoming**: `POST /whatsapp/webhook` — responds 200 immediately, processes async. In-memory dedup cache (max 10,000 message IDs).
- **Business resolution**: Looks up `whatsapp_accounts` by `phone_number_id` from webhook payload.
- **Meta Cloud API v18.0**: `POST https://graph.facebook.com/v18.0/{phone_number_id}/messages`

### Test Simulator

`POST /test/whatsapp` — Bypasses Meta API, directly invokes engine. Extracts readable text from API payloads for display. Used by ChatSimulator and WhatsAppTester components.

---

## 6. ConversationBuilder Deep Dive

### Purpose

`ConversationBuilder.jsx` (~1050 lines) is the **flagship UI component** — a 4-step wizard that manages the entire business configuration lifecycle from a single page.

### Architecture

```
Step 1: Services (hierarchical CRUD, recursive ServiceNode)
Step 2: Flows (template library + chat-style step editor)
Step 3: Menu (welcome message + tree editor + preview + publish)
Step 4: Test (embedded WhatsApp ChatSimulator)
```

### State Management

All state is **local React state** (no external store):
- `services[]` — flat array with `parent_id` references, `localId` for new items
- `flows[]` with nested `steps[]` — each flow has `localId`, steps have `localId`
- `buttons[]` — recursive tree structure with `children[]` arrays
- `welcomeMessage` — string for root menu greeting
- `editingFlowId`, `showFlowWizard` — UI state

### Data Loading (`loadData`)

Parallel fetch of services, flows, and menu tree. Converts server IDs to local format. Maps flow steps from server schema to local schema. Builds button tree from flat menu nodes.

### Publish Pipeline (`publishAll`)

**THIS IS THE MOST CRITICAL FUNCTION** — and the most fragile:

```
Phase 1: DELETE all existing server data
  - Delete all menu nodes
  - Delete all flows (cascade deletes steps)
  - Delete all services

Phase 2: CREATE services recursively
  - publishServicesRecursive(services, parentId, idMap)
  - Returns server ID mapping

Phase 3: CREATE flows + steps
  - Each flow: create flow, then create steps in order
  - Auto-appends summary + confirm steps if missing
  - Returns flow ID mapping

Phase 4: CREATE menu tree recursively
  - Maps button types to node types
  - Links START_FLOW buttons to new flow IDs via idMap
  - Links QUICK_ACTION buttons to action types

Phase 5: POST /test/whatsapp/publish
  - Sets published_at on business
```

**Critical Risk**: This is a **delete-all-recreate** pattern. If publish fails mid-way, the business loses all server data. There is no rollback mechanism.

### Service Editor (Step 1)

- Recursive `ServiceNode` component with depth-aware color coding.
- Supports hierarchical services (add sub-service under parent).
- Fields at all levels: name, description, price, duration.
- Cascade delete on remove (removes children too).

### Flow Editor (Step 2)

- `TemplateLibrary` component: 5 categories (Booking, Sales/Lead, Support, Real Estate, Advanced), 15 templates + blank.
- Chat-style step editor: question bubbles with answer type selector.
- Step types limited to: text_input, number_input, select_option, select_service (4 types in ConvBuilder vs 8 in DB enum).
- Options editor for `select_option` steps.
- Step reordering via up/down arrows.

### Menu Editor (Step 3)

- Welcome message textarea.
- Recursive `MenuButtonEditor` with depth indicator.
- Button types: OPEN_SUBMENU (→ menu node), START_FLOW (→ flow_entry node), QUICK_ACTION (→ action node with show_phone/show_location/open_link).
- `PreviewButtons` mini-preview component.
- **Missing**: No way to create `info` node type from ConversationBuilder.

### Test Simulator (Step 4)

- `ChatSimulator` component.
- Fixed phone: `905000000000`.
- Sends to `/test/whatsapp` endpoint.
- Auto-resets session on open.
- Renders interactive buttons/list items as clickable.
- WhatsApp-styled chat UI (green bubbles, typing indicator).

---

## 7. API Surface Map

### Authentication Required (via cookie)

| Method | Path | Module | Description |
|---|---|---|---|
| POST | /api/v1/auth/register | auth | Create business + user |
| POST | /api/v1/auth/login | auth | Login, set cookies |
| POST | /api/v1/auth/refresh | auth | Refresh access token |
| POST | /api/v1/auth/logout | auth | Clear cookies |
| GET | /api/v1/profile | business | Get own business profile |
| PUT | /api/v1/profile | business | Update own profile |
| GET | /api/v1/services | service | List services (tenant-scoped) |
| GET | /api/v1/services/:id | service | Get single service |
| POST | /api/v1/services | service | Create service |
| PUT | /api/v1/services/:id | service | Update service |
| DELETE | /api/v1/services/:id | service | Delete service |
| GET | /api/v1/templates | template | List all templates |
| GET | /api/v1/templates/status | template | Check setup status |
| POST | /api/v1/templates/:id/apply | template | Apply template |
| POST | /api/v1/templates/skip | template | Skip template setup |
| GET | /api/v1/menu/tree | menu | Get full menu tree |
| GET | /api/v1/menu/:id | menu | Get single node |
| POST | /api/v1/menu | menu | Create menu node |
| PUT | /api/v1/menu/:id | menu | Update menu node |
| DELETE | /api/v1/menu/:id | menu | Delete node + children |
| POST | /api/v1/menu/publish | menu | Validate + publish |
| GET | /api/v1/flows | flow | List all flows |
| GET | /api/v1/flows/:id | flow | Get flow + steps |
| POST | /api/v1/flows | flow | Create flow |
| PUT | /api/v1/flows/:id | flow | Update flow |
| DELETE | /api/v1/flows/:id | flow | Delete flow + steps |
| POST | /api/v1/flows/:flowId/steps | flow | Create step |
| PUT | /api/v1/flows/:flowId/steps/:stepId | flow | Update step |
| DELETE | /api/v1/flows/:flowId/steps/:stepId | flow | Delete step |
| GET | /api/v1/requests | request | List requests |
| GET | /api/v1/requests/:id | request | Get request detail |
| PUT | /api/v1/requests/:id/status | request | Change status |
| PUT | /api/v1/requests/:id/assign | request | Assign to staff |
| GET | /api/v1/assignees | assignee | List assignees |
| GET | /api/v1/assignees/:id | assignee | Get assignee |
| POST | /api/v1/assignees | assignee | Create assignee |
| PUT | /api/v1/assignees/:id | assignee | Update assignee |
| DELETE | /api/v1/assignees/:id | assignee | Delete assignee |
| GET | /api/v1/assignment-rules | assignment | List rules |
| GET | /api/v1/assignment-rules/:id | assignment | Get rule |
| POST | /api/v1/assignment-rules | assignment | Create rule |
| PUT | /api/v1/assignment-rules/:id | assignment | Update rule |
| DELETE | /api/v1/assignment-rules/:id | assignment | Delete rule |
| GET | /api/v1/notifications | notification | List all |
| GET | /api/v1/notifications/unread | notification | List unread |
| PUT | /api/v1/notifications/:id/read | notification | Mark as read |
| GET | /api/v1/sessions | session | List sessions |
| PUT | /api/v1/sessions/:id/takeover | session | Takeover session |
| PUT | /api/v1/sessions/:id/release | session | Release session |

### Unauthenticated Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/v1/businesses | **List all businesses (NO AUTH!)** |
| GET | /api/v1/businesses/:id | **Get any business (NO AUTH!)** |
| PUT | /api/v1/businesses/:id | **Update any business (NO AUTH!)** |
| GET | /api/v1/whatsapp/webhook | Meta webhook verification |
| POST | /api/v1/whatsapp/webhook | Meta incoming messages |

### Test Endpoints (No Auth, No Tenant Scope)

| Method | Path | Description |
|---|---|---|
| POST | /test/whatsapp | Simulate WhatsApp message |
| DELETE | /test/whatsapp/reset | Reset session for phone |
| POST | /test/whatsapp/publish | Set published_at timestamp |

### Response Envelope

**Success**: `{ data: ... }`
**Error**: `{ error: { status: number, message: string } }`

---

## 8. Frontend Architecture

### Routing Structure

```
/                           → Landing (public)
/login                      → Login (public)
/register                   → Register (public)
/dashboard                  → TenantGuard → Layout
  /dashboard                → Dashboard (index)
  /dashboard/profile        → BusinessProfile
  /dashboard/setup          → SetupWizard
  /dashboard/services       → Services
  /dashboard/menu           → MenuBuilder
  /dashboard/flows          → FlowBuilder
  /dashboard/builder        → ConversationBuilder
  /dashboard/requests       → Requests
  /dashboard/assignees      → Assignees
  /dashboard/assignment-rules → AssignmentRules
  /dashboard/notifications  → Notifications
  /dashboard/sessions       → Sessions
  /dashboard/whatsapp-test  → WhatsAppTester
```

### Key Components

- **Layout.jsx**: Sidebar navigation with 4 sections (Main, Setup, Manage, Connect). Collapsible. Contains logout button.
- **TenantGuard.jsx**: Checks `auth.user` exists, redirects to login if not. Wraps all dashboard routes.
- **WhatsAppPreview.jsx**: Visual WhatsApp phone mockup for preview. Navigation stack, message history, handles all node types.
- **UI.jsx**: Reusable components (Modal, Spinner, ErrorMsg, StatusBadge, inputClass, selectClass).

### Context System

- **AuthContext**: Manages user state, login/logout, automatic token refresh on mount. Uses `useRef` to prevent concurrent refresh attempts.
- **BusinessContext**: Manages industry profile (service nouns, customer nouns, team nouns, placeholders). 9 built-in profiles. Persists selection to localStorage.

### API Client

- **client.js**: Axios instance with `baseURL: '/api/v1'`, `withCredentials: true`. Has 401 interceptor that:
  1. Attempts token refresh.
  2. Queues concurrent 401s and replays them after refresh.
  3. Redirects to /login on refresh failure.
- **api.js**: 12 API function groups covering all server endpoints. Clean function-per-operation pattern.

### Page Components Summary

| Page | Lines | Purpose | Complexity |
|---|---|---|---|
| ConversationBuilder | ~1050 | 4-step wizard (flagship) | Very High |
| Dashboard | ~200 | Stats, checklist, recent requests | Medium |
| MenuBuilder | ~260 | Tree editor + WhatsApp preview | High |
| FlowBuilder | ~250 | Flow/step CRUD | Medium |
| AssignmentRules | ~260 | Rule CRUD with trigger resolution | Medium |
| Requests | ~220 | Request list + detail + status transitions | Medium |
| Assignees | ~150 | Staff CRUD table | Low |
| Landing | ~160 | Marketing page | Low |
| SetupWizard | ~180 | Template selection wizard | Medium |
| Sessions | ~100 | Live conversation list + takeover | Low |
| Services | ~120 | Service CRUD grid | Low |
| Notifications | ~80 | Notification list with read toggle | Low |
| BusinessProfile | ~70 | Profile form | Low |
| Login | ~60 | Login form | Low |
| Register | ~60 | Registration form | Low |
| WhatsAppTester | ~150 | Full-page simulator | Medium |

---

## 9. Feature Inventory (Implemented vs. Blueprint)

### Legend: ✅ Implemented | ⚠️ Partial | ❌ Missing

| Feature (from Blueprint) | Status | Evidence |
|---|---|---|
| Multi-tenancy | ✅ | `tenantScope` middleware, business_id on all tables |
| Business registration + onboarding | ✅ | auth module + SetupWizard |
| Business profile management | ✅ | BusinessProfile page + profile routes |
| Service CRUD (flat + hierarchical) | ✅ | service module + parent_id support |
| Menu tree builder (4 node types) | ✅ | menu module + MenuBuilder + ConversationBuilder |
| Menu depth/children constraints | ✅ | max 4 depth, max 10 children, cycle prevention |
| Info nodes with content display | ⚠️ | info_contents table exists but has 0 rows; engine uses label text |
| Info node action buttons | ⚠️ | action_buttons table exists but has 0 rows; ConvBuilder doesn't create info nodes |
| Flow builder (8 step types) | ⚠️ | Full 8 types in DB/engine, but ConvBuilder only exposes 4 (text, number, select_option, select_service) |
| Flow validation (integrity check) | ✅ | validateFlowIntegrity in flow.validation.js |
| Flow linear execution | ✅ | WhatsApp engine step-by-step processing |
| Request creation from flow | ✅ | completeFlow() in engine |
| Request lifecycle (5 statuses) | ✅ | State machine with valid transitions |
| Request status management UI | ✅ | Requests page with transition buttons |
| Assignment rule CRUD | ✅ | assignment-rule module + UI |
| Auto-assignment engine | ✅ | assignment.engine.js with priority + conflict detection |
| Assignment trigger types (3) | ✅ | service, menu_node, flow |
| Assignee management | ✅ | assignee module + Assignees page |
| Notifications (in-panel) | ✅ | notification module + Notifications page |
| Human takeover / release | ✅ | Sessions page + session.service + engine mode check |
| Session management (30min timeout) | ✅ | session.service.js timeout check |
| Template system (9 industries) | ✅ | 9 templates in seeds, deep-copy apply |
| Template one-time guard | ✅ | template_applied_at check |
| WhatsApp webhook integration | ✅ | Meta Cloud API v18.0, verify + messages |
| WhatsApp message formatting | ✅ | formatter.js (buttons, list, text fallback) |
| Message deduplication | ✅ | In-memory cache (10K max) |
| WhatsApp simulator / tester | ✅ | /test/whatsapp + ChatSimulator + WhatsAppTester |
| ConversationBuilder (unified wizard) | ✅ | 4-step wizard with publish pipeline |
| WhatsApp number connection UI | ❌ | No UI to manage whatsapp_accounts |
| Platform owner role/panel | ❌ | Enum exists, no implementation |
| Email notifications | ❌ | Not implemented (out of scope per blueprint) |
| Builder validation at edit time | ⚠️ | Publish-time validation exists, but no real-time builder validation |
| select_date / select_time | ⚠️ | In DB enum and engine, but ConvBuilder doesn't expose; engine has legacy handling |
| Dashboard analytics | ⚠️ | Basic counts only, no charts/trends |
| WhatsApp UX constraint enforcement | ⚠️ | Formatter handles limits, but builder doesn't enforce label length limits |

---

## 10. Bugs, Risks & Weaknesses

### Critical

| # | Issue | Location | Impact |
|---|---|---|---|
| C1 | **Business routes have NO auth** | server/src/modules/business/routes.js | Anyone can list, read, or update any business |
| C2 | **Delete-all-recreate publish** | ConversationBuilder.jsx publishAll() | Mid-publish failure loses all data; no rollback |
| C3 | **Same JWT secret for access+refresh** | server/src/config/auth.js | Compromised access token = compromised refresh token |
| C4 | **Insecure JWT fallback secret** | server/src/config/auth.js | `'dev-secret-change-me'` if JWT_SECRET env missing |
| C5 | **Test endpoints have no auth** | server/src/app.js | /test/whatsapp endpoints accessible to anyone |

### High

| # | Issue | Location | Impact |
|---|---|---|---|
| H1 | **No automated tests** | Both packages | Zero test coverage, no test framework |
| H2 | **parent_id cross-tenant** | service.service.js | Creating service with another tenant's parent_id not validated |
| H3 | **Error message leakage** | server/src/middleware/errorHandler.js | Full error messages sent to client in non-production |
| H4 | **info_contents table unused** | DB + engine | Info nodes show label text only, no structured content |
| H5 | **action_buttons table unused** | DB + engine | Action buttons from DB not populated by any path |
| H6 | **In-memory dedup cache** | whatsapp.controller.js | Max 10K entries, no TTL, no LRU eviction — memory leak risk |
| H7 | **ConvBuilder doesn't create info nodes** | ConversationBuilder.jsx | Only OPEN_SUBMENU, START_FLOW, QUICK_ACTION types available |

### Medium

| # | Issue | Location | Impact |
|---|---|---|---|
| M1 | **No rate limiting** | Server-wide | Vulnerable to brute force on login, API abuse |
| M2 | **select_date/select_time legacy** | whatsapp.engine.js | Falls back to free text — no date picker |
| M3 | **ConvBuilder exposes 4 of 8 step types** | ConversationBuilder.jsx STEP_TYPES | text_input, number_input, select_option, select_service only |
| M4 | **No pagination** | All list endpoints | Returns all records; will degrade with scale |
| M5 | **Session timeout accuracy** | session.service.js | 30-min check only on next message — no background cleanup |
| M6 | **No input sanitization** | Throughout | XSS via stored label text, descriptions rendered in UI |
| M7 | **Unknown roles pass tenantScope** | tenantScope.js | Roles other than business_owner/platform_owner silently pass |
| M8 | **Negative prices allowed** | service validation | No minimum price validation |
| M9 | **Flow validation non-blocking** | flow.validation.js | Invalid flows can be saved; only checked at read time |
| M10 | **WhatsApp API token in .env** | server/.env | Hardcoded Meta token — expired tokens cause silent failures |

### Low

| # | Issue | Location | Impact |
|---|---|---|---|
| L1 | **No health check endpoint** | app.js | No /health or /api/v1/health for monitoring |
| L2 | **No graceful shutdown** | server.js | No cleanup of DB connections on SIGTERM |
| L3 | **No request logging** | app.js | No morgan/pino for HTTP request logging |
| L4 | **Two simulator components** | ChatSimulator + WhatsAppTester | Duplicated code with slightly different phone numbers |
| L5 | **Tree building O(n²)** | service.service.js buildServiceTree | Fine for small datasets, needs optimization at scale |
| L6 | **Client vite.config.js proxy** | client/vite.config.js | Single API server proxy — complicates multi-backend |
| L7 | **flow_steps.config as TEXT not JSONB** | Migration 006 | Config stored as JSON string, not native JSONB |

---

## 11. Security Audit

### Authentication & Authorization

| Finding | Severity | Details |
|---|---|---|
| Business routes unauthenticated | **CRITICAL** | `/api/v1/businesses` — GET, GET/:id, PUT/:id all bypass auth |
| Same secret for access/refresh JWT | **HIGH** | One compromised token = both compromised |
| Insecure default JWT secret | **HIGH** | `'dev-secret-change-me'` fallback if env var missing |
| No rate limiting on auth endpoints | **MEDIUM** | Login brute force possible |
| No CSRF protection | **MEDIUM** | Cookie-based auth + `sameSite: 'lax'` provides partial protection only |
| Password min-length only 6 | **LOW** | No complexity requirements |
| No email verification | **LOW** | Accounts activated immediately |

### Data Security

| Finding | Severity | Details |
|---|---|---|
| Cross-tenant parent_id injection | **HIGH** | Service parent_id from another tenant not validated |
| Error message leakage | **MEDIUM** | Full error details sent to client in non-production |
| No input sanitization/XSS | **MEDIUM** | Labels, descriptions stored and rendered as-is |
| Test endpoints fully open | **MEDIUM** | /test/whatsapp can simulate messages for any business |
| Database credentials in .env | **LOW** | postgres/postgres on localhost — fine for dev |

### Infrastructure

| Finding | Severity | Details |
|---|---|---|
| `secure: false` on cookies | **HIGH** (prod) | Tokens sent over HTTP — must be true in production |
| No HTTPS termination | **MEDIUM** | Server binds to 0.0.0.0:3001 without TLS |
| In-memory dedup cache unbounded | **MEDIUM** | No TTL, no eviction — potential memory leak |
| Single DB connection pool | **LOW** | Knex default pool (2+10) — adequate for MVP |

### OWASP Top 10 Mapping

| OWASP Category | Status |
|---|---|
| A01: Broken Access Control | **VULNERABLE** — Business routes unprotected, cross-tenant parent_id |
| A02: Cryptographic Failures | **VULNERABLE** — Same JWT secret for both tokens |
| A03: Injection | **Low Risk** — Knex parameterized queries protect against SQL injection |
| A04: Insecure Design | **PARTIAL** — Delete-all-recreate publish pattern is destructive |
| A05: Security Misconfiguration | **PARTIAL** — Test endpoints exposed, fallback secrets |
| A06: Vulnerable Components | **OK** — Dependencies are current (0 critical vulnerabilities) |
| A07: Auth Failures | **PARTIAL** — No rate limiting, weak password policy |
| A08: Data Integrity | **OK** — FK constraints, enum types, cascade deletes |
| A09: Logging/Monitoring | **MISSING** — No request logging, no audit trail |
| A10: SSRF | **OK** — Only outbound to graph.facebook.com |

---

## 12. Gap Analysis (Code vs. Requirements)

### From PRODUCT_REQUIREMENTS.md

| Requirement | Status | Gap |
|---|---|---|
| "Not a chatbot — menu/flow-driven" | ✅ Met | Engine has zero NLP, all interaction is structured |
| "Multi-tenant from day one" | ✅ Met | tenantScope middleware + business_id on all tables |
| "Menu system with 4 node types" | ⚠️ Partial | ConversationBuilder doesn't expose `info` node type |
| "Info nodes with structured content" | ❌ Gap | info_contents table empty; no UI to populate it |
| "Info nodes with up to 3 action buttons" | ❌ Gap | action_buttons table empty; no path creates them |
| "Flow system (7 step types)" | ⚠️ Partial | 8 types in enum (summary added), but ConvBuilder exposes only 4 |
| "Request lifecycle (5 statuses)" | ✅ Met | Full state machine with valid transitions |
| "Human takeover (mutually exclusive)" | ✅ Met | Session mode toggle, engine checks mode |
| "Session timeout 30 minutes" | ✅ Met | Checked on each message |
| "Template one-time copy" | ✅ Met | template_applied_at guard |
| "WhatsApp constraints enforced at publish" | ⚠️ Partial | Label length limits in formatter, but not in builder UI |
| "Webhook processing not single-threaded blocking" | ✅ Met | 200 response before processing |
| "Assignment rules by priority" | ✅ Met | Priority-based with conflict detection |
| "Pipeline: Menu → Flow → Request → Assignment → Notification" | ✅ Met | Exactly this order in engine |

### From NON_FUNCTIONAL_REQUIREMENTS.md

| Requirement | Status | Gap |
|---|---|---|
| "Every query must include tenant filtering" | ⚠️ Partial | Business routes bypass tenant scope |
| "Menu/Flow separation — no mixed logic" | ✅ Met | Separate handleMenuContext/handleFlowContext |
| "Request lifecycle independence" | ✅ Met | Standalone state machine |
| "Assignment layer strictly AFTER request" | ✅ Met | Called in completeFlow() after request insert |
| "Assignment deterministic — no randomness" | ✅ Met | Priority sort, conflict = unassigned |
| "Webhook → response < 3 seconds" | ✅ Likely | Direct DB queries, no external calls in flow |
| "Panel page load < 2 seconds" | ✅ Met | SPA, ~120KB gzipped |
| "Session state reliably persisted" | ✅ Met | DB-backed sessions with JSONB flow_data |

### From OPEN_DECISIONS.md

| Decision | Resolution |
|---|---|
| Backend stack | Node.js + Express |
| Database | PostgreSQL (via Knex) |
| Frontend panel | React + Vite + TailwindCSS |

---

## 13. Prioritized Next Steps

### Priority 1: Security Fixes (Immediate)

1. **Add auth to business routes**: Apply `authenticate` + `tenantScope` middleware to `/api/v1/businesses` routes.
2. **Separate JWT secrets**: Use different secrets for access and refresh tokens.
3. **Remove fallback secret**: Throw on startup if JWT_SECRET env var is missing.
4. **Gate test endpoints**: Add auth or disable in production (e.g., `if (process.env.NODE_ENV !== 'production')`).
5. **Validate cross-tenant parent_id**: In service.create, verify parent_id belongs to same business_id.

### Priority 2: Data Safety (This Sprint)

6. **Replace delete-all-recreate publish**: Implement diff-based publish in ConversationBuilder — update existing records, create new ones, delete removed ones.
7. **Wrap publish in DB transaction**: If any step fails, rollback everything.
8. **Add health check endpoint**: `GET /api/v1/health` returning `{ status: 'ok' }`.

### Priority 3: Feature Completeness (Next Sprint)

9. **Expose all 8 step types in ConversationBuilder**: Add select_date, select_time, summary, confirm to the STEP_TYPES constant.
10. **Implement info node creation**: Allow ConversationBuilder to create info-type buttons with structured content (title, description, price, duration).
11. **Populate info_contents and action_buttons**: Wire the engine's info node display to use these tables instead of just label text.
12. **Add WhatsApp account management UI**: Page to connect/disconnect WhatsApp numbers via `whatsapp_accounts`.
13. **Builder-time validation**: Enforce WhatsApp label length limits (20 char buttons, 72 char descriptions) in the ConversationBuilder UI.

### Priority 4: Production Readiness

14. **Add request logging**: morgan or pino middleware.
15. **Add rate limiting**: express-rate-limit on auth endpoints.
16. **Set `secure: true` on cookies** in production.
17. **Add graceful shutdown**: Handle SIGTERM, drain connections.
18. **Dedup cache TTL**: Add expiry (5-minute TTL) and LRU eviction to message dedup cache.
19. **Add pagination**: Cursor or offset pagination to all list endpoints.
20. **Add API input sanitization**: Sanitize HTML in labels, descriptions before storage.

### Priority 5: Quality & Testing

21. **Add test framework**: vitest (frontend) + jest/mocha (backend).
22. **Write critical path tests**: Auth flow, template apply, publish pipeline, engine message handling, assignment engine.
23. **Add E2E test**: Full flow from message → menu → flow → request → assignment → notification.

### Priority 6: Product Enhancement

24. **Dashboard analytics**: Charts for requests over time, popular services, assignment load.
25. **Platform owner panel**: Multi-tenant management, business CRUD, subscription management.
26. **Notification preferences**: Email notification toggle (optional per blueprint).
27. **Duplicate/merge ConversationBuilder simulators**: Remove WhatsAppTester.jsx, consolidate into ConversationBuilder's ChatSimulator.

---

*End of audit report. This document covers 100% of the files in the repository — every server module, every client page, every migration, every configuration file, the seed data, the template library, and all requirement documents. The server was started and tested (WhatsApp engine confirmed working). The client was built successfully (0 errors, 101 modules).*
