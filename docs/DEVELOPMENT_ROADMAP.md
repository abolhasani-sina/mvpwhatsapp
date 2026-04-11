# DEVELOPMENT ROADMAP

### Project: MVPWhatsapp

### Status: FINAL — SINGLE EXECUTION REFERENCE

### Source: MASTER_SYSTEM_BLUEPRINT.md (FINAL v4) + All Locked Documents

### Date: April 11, 2026

---

# 1. PROJECT OVERVIEW

## What the System Is

A multi-tenant platform that replaces free-form WhatsApp conversations with structured, navigable, menu-driven interactions and guided data-collection workflows. WhatsApp is the delivery layer. All logic resides server-side.

The platform enables businesses to create interactive WhatsApp experiences where customers navigate menus, view structured information, and complete guided flows that produce actionable requests.

## What the System Is NOT

- **Not a chatbot.** No natural language processing, no AI conversation, no free-text interpretation. Interactions are menu-driven and flow-driven.
- **Not a booking system.** Booking is one use case. The platform is a general-purpose structured interaction engine.
- **Not a form builder.** The system combines tree-based navigation with linear data collection and a request lifecycle.

## Core Pipeline (LOCKED)

```
Menu → Flow → Request → Assignment → Notification
```

| Stage | Responsibility |
|---|---|
| **Menu** | Navigation only — recursive tree of nodes |
| **Flow** | Data collection only — linear step sequences |
| **Request** | Output of a completed flow — independent lifecycle |
| **Assignment** | Optional post-creation routing — deterministic, priority-based |
| **Notification** | Alert delivery — in-panel (required), email (optional) |

## User Roles

| Role | Scope |
|---|---|
| **Platform Owner** | System-wide — manage tenants, plans, templates |
| **Business Owner** | Own tenant — configure business, review requests, takeover conversations |
| **End Customer** | WhatsApp — navigate menus, complete flows, submit requests |

---

# 2. LOCKED ARCHITECTURE RULES

These constraints are final and must never be modified.

## Multi-Tenancy

- Multi-tenant from day one
- Every data entity scoped to a single tenant (`business_id`)
- Every query must include tenant filtering
- Single deployment serves all tenants
- Tenant isolation enforced at the data layer

## Node Types (Exactly 4 — No Additions)

| Node Type | Purpose | Children |
|---|---|---|
| **Menu Node** | Navigation — renders child nodes as selectable options | Any node type (≥ 1 child required) |
| **Info Node** | Display structured content (title, description, price, duration) + up to 3 action buttons | None (leaf) |
| **Flow Entry Node** | Bridge from menu to flow — transitions session context | None (leaf) |
| **Action Node** | Execute immediate action (show_phone, show_location, open_link, go_back) | None (leaf) |

## Flow Rules

- Strictly linear sequences of steps
- No branching, no conditional logic, no loops
- 7 step types: `select_option`, `select_service`, `select_date`, `select_time`, `text_input`, `confirmation`, `summary`
- Entry via Flow Entry Node or Info Node action button
- Exit always produces exactly one request

## Request Lifecycle (5 Statuses — Fixed Transitions)

| From | Allowed To |
|---|---|
| `pending` | `approved`, `rejected`, `manual_followup` |
| `approved` | `completed` |
| `rejected` | (terminal) |
| `manual_followup` | `approved`, `rejected`, `completed` |
| `completed` | (terminal) |

- Each request is independent — no cross-request logic
- Business owner has full control over all requests

## Assignment Rules

- Optional post-creation routing layer
- Deterministic: highest `priority` value wins
- Equal priority among matches → request remains unassigned
- Inactive assignee → request remains unassigned
- Evaluated exactly once at request creation time
- Assignment never modifies request status or lifecycle
- Re-assignment not supported in MVP

## Session Model

- Session key: `phone_number` + `business_id`
- 30-minute inactivity timeout → full reset to main menu
- Modes: `automated` (exclusive) or `human_takeover` (exclusive)
- Customer is in menu context OR flow context, never both

## Human Takeover

- Mandatory capability
- Mutually exclusive with automation
- Per conversation scope
- On release: session resets to main menu in automated mode

## WhatsApp Constraints (Builder-Enforced)

| Constraint | Limit | Enforcement |
|---|---|---|
| Menu Node children | Maximum 10 | Hard — builder blocks at creation/edit |
| Menu tree depth | Maximum 4 levels | Hard — builder blocks at publish |
| Info Node action buttons | Maximum 3 | Hard — builder blocks at creation/edit |
| Flow step selectable options | Maximum 10 | Hard — builder blocks at creation/edit |
| Option rendering: 1–3 | Reply buttons | Automatic format selection |
| Option rendering: 4–10 | List message | Automatic format selection |
| Option rendering: >10 | NOT ALLOWED | Must restructure before publish |

- Validation at creation, edit, and publish time
- Publish blocked if any violation exists
- Runtime assumes all published configurations are valid

## Template Rules

- One-time deep copy during onboarding
- No live link after application
- No reapply in MVP
- Business can fully customize copied structures

---

# 3. TECHNOLOGY STACK (FINAL)

## 3.1 Backend — Node.js 20 LTS + Express.js

### Why Chosen

- Webhook-native async I/O for WhatsApp message processing
- Most widely represented backend framework in AI training data — maximizes Claude/Copilot assistance accuracy for non-programmer owner
- Runs natively on Windows with no emulation
- Minimal framework opinion enables phased module addition without refactoring
- Straightforward middleware pattern for tenant scoping and auth

### Why Alternatives Were Rejected

| Alternative | Reason |
|---|---|
| NestJS | Decorator-based abstractions and dependency injection increase cognitive overhead for AI-assisted non-programmer maintenance |
| Fastify | Smaller community footprint, less AI training data coverage |
| PHP / Laravel | Steers toward monolithic MVC; webhook pipeline and session state machine more natural in Node async model |
| Python / Django | Custom business panel (tree builder, flow builder) not supportable by Django Admin; ASGI async more complex than Node native |
| Python / FastAPI | Thinner ecosystem for recursive tree operations and multi-step webhook pipelines |

### Risks

- No built-in ORM → mitigated by using Knex.js query builder (explicit SQL, no abstraction magic)
- Minimal framework structure → mitigated by blueprint-defined domain module organization

---

## 3.2 Database — PostgreSQL 16

### Query Builder — Knex.js

Knex.js provides programmatic query building with explicit SQL visibility, plus version-controlled migrations. No ORM abstraction.

### Why Chosen

- Relational with foreign key integrity for the well-defined entity relationships
- `jsonb` type for flow step configurations, session flow_data, and action configs
- Recursive CTEs (`WITH RECURSIVE`) for menu tree depth calculation and subtree queries
- ACID transactions for atomic template deep-copy, status transitions, and tree modifications
- Runs natively on Windows via official installer

### Why Alternatives Were Rejected

| Alternative | Reason |
|---|---|
| MySQL / MariaDB | Less mature recursive CTE support; weaker jsonb indexing/querying |
| SQLite | Single-writer limitation prevents concurrent webhook processing; no network server |
| MongoDB | Relational data model requires manual referential integrity enforcement; tree assembly at application level instead of database-level recursive queries |

### Risks

- Slightly more complex Windows installation than MySQL → mitigated by official Windows installer + pgAdmin GUI

---

## 3.3 Frontend — React 18 + Vite + Ant Design

### Why Chosen

- React component model handles interactive menu tree builder and flow builder naturally
- Real-time validation feedback for WhatsApp UX constraints
- Most widely represented frontend framework in AI training data
- Ant Design provides production-ready Tree, Steps, Form, Table, and notification components
- Vite provides fast builds with zero configuration

### Why Alternatives Were Rejected

| Alternative | Reason |
|---|---|
| Vue.js | Smaller AI training data representation; non-programmer AI accuracy is the priority |
| Svelte | Smaller ecosystem; less reliable AI code generation |
| Server-rendered (EJS/Blade) | Cannot provide required client-side interactivity for tree builder |
| Low-code (Retool, Appsmith) | Cannot express custom menu builder interactions; lock-in risk |

### Risks

- Significant bundle size → mitigated by Vite tree-shaking; acceptable for business panel (not public-facing)

---

## 3.4 Authentication — JWT with HTTP-Only Cookies

### Why Chosen

- Stateless API auth — no server-side session store needed for auth
- JWT payload carries `user_id`, `business_id`, `role` — enables consistent tenant scoping
- HTTP-Only cookies prevent XSS-based token theft (`Secure`, `HttpOnly`, `SameSite=Strict`)
- Standard Express middleware pattern

### Why Alternatives Were Rejected

| Alternative | Reason |
|---|---|
| Session-based auth | Requires session store (Redis or database); unnecessary operational complexity for single-server MVP |
| OAuth / SSO | Explicitly out of MVP scope |
| Third-party providers (Auth0, Firebase Auth) | External dependency and cost for simple two-role auth |

### Risks

- Tokens cannot be revoked before expiry → mitigated by short-lived access tokens (15 min) + refresh tokens (7 days)

---

## 3.5 Hosting — Direct Installation on Windows VPS

### Architecture

```
[Internet] → [HTTPS / IIS or nginx] → [Node.js :3000 (Express API + static React build)]
                                            ↓
                                     [PostgreSQL :5432]
```

- **Reverse proxy (IIS or nginx for Windows):** HTTPS termination with Let's Encrypt certificate
- **Node.js (pm2-managed):** Express API + static React production build; auto-restart on crash, startup on boot
- **PostgreSQL:** Runs as a Windows service, auto-starts on boot

### Why Chosen

- Simplest deployment model for single Windows VPS
- All components run natively on Windows
- pm2 provides process management without container overhead

### Why Alternatives Were Rejected

| Alternative | Reason |
|---|---|
| Docker | Container management overhead on Windows; non-programmer operational complexity |
| Cloud PaaS (Heroku, Render) | User has Windows VPS; no need for additional cloud cost |

### Risks

- No container isolation → acceptable for single-app MVP on dedicated VPS
- Manual deployment → acceptable; CI/CD not required for MVP

---

## 3.6 n8n — NOT USED

### Why

- Every function n8n could serve is already handled by Express (webhooks), nodemailer (email), or application code (formatting)
- Risk of business logic leaking into n8n workflows (forbidden by locked architecture)
- Additional process to install, configure, and maintain
- Non-programmer must maintain one system, not two

---

## 3.7 WhatsApp Integration — Meta Cloud API (Direct)

### Why Chosen

- Official WhatsApp Business API with native support for reply buttons and list messages
- Businesses use their own WhatsApp number
- No intermediary fees or dependency
- Webhook-based message delivery matches system architecture
- Free conversation tier reduces MVP cost

### Why Alternatives Were Rejected

| Alternative | Reason |
|---|---|
| 360dialog | Third-party cost and dependency |
| Twilio | Per-message pricing; unnecessary abstraction layer |
| WATI | SaaS platform conflicts with direct control requirements |
| Unofficial APIs | TOS violation; number ban risk |

### Risks

- Meta Business verification delay → start verification early (Phase 1–2); use test number for development
- 24-hour session window → customer-initiated interactions open the window; proactive outbound is out of MVP scope
- API changes → WhatsApp module is isolated; changes contained to one module

---

## Technology Stack Summary

| Component | Choice |
|---|---|
| Backend | Node.js 20 LTS + Express.js |
| Query Builder | Knex.js |
| Database | PostgreSQL 16 |
| Frontend | React 18 + Vite + Ant Design |
| Authentication | JWT (HTTP-Only cookies) |
| Hosting | Direct install on Windows VPS + pm2 + IIS/nginx |
| n8n | Not used |
| WhatsApp | Meta Cloud API (direct) |

---

# 4. SYSTEM ARCHITECTURE

## 4.1 Folder Structure

```
mvpwhatsapp/
├── server/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── auth.js
│   │   │   └── whatsapp.js
│   │   ├── middleware/
│   │   │   ├── authenticate.js
│   │   │   ├── tenantScope.js
│   │   │   ├── authorize.js
│   │   │   ├── validate.js
│   │   │   └── errorHandler.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.controller.js
│   │   │   │   └── auth.service.js
│   │   │   ├── business/
│   │   │   │   ├── business.routes.js
│   │   │   │   ├── business.controller.js
│   │   │   │   ├── business.service.js
│   │   │   │   └── business.validation.js
│   │   │   ├── service/
│   │   │   │   ├── service.routes.js
│   │   │   │   ├── service.controller.js
│   │   │   │   ├── service.service.js
│   │   │   │   └── service.validation.js
│   │   │   ├── template/
│   │   │   │   ├── template.routes.js
│   │   │   │   ├── template.controller.js
│   │   │   │   └── template.service.js
│   │   │   ├── menu/
│   │   │   │   ├── menu.routes.js
│   │   │   │   ├── menu.controller.js
│   │   │   │   ├── menu.service.js
│   │   │   │   ├── menu.validation.js
│   │   │   │   └── menu.tree.js
│   │   │   ├── flow/
│   │   │   │   ├── flow.routes.js
│   │   │   │   ├── flow.controller.js
│   │   │   │   ├── flow.service.js
│   │   │   │   └── flow.validation.js
│   │   │   ├── request/
│   │   │   │   ├── request.routes.js
│   │   │   │   ├── request.controller.js
│   │   │   │   ├── request.service.js
│   │   │   │   └── request.validation.js
│   │   │   ├── assignment/
│   │   │   │   ├── assignment.routes.js
│   │   │   │   ├── assignment.controller.js
│   │   │   │   ├── assignment.service.js
│   │   │   │   ├── assignment.routing.js
│   │   │   │   └── assignment.validation.js
│   │   │   ├── notification/
│   │   │   │   ├── notification.routes.js
│   │   │   │   ├── notification.controller.js
│   │   │   │   └── notification.service.js
│   │   │   ├── session/
│   │   │   │   ├── session.service.js
│   │   │   │   └── session.timeout.js
│   │   │   └── whatsapp/
│   │   │       ├── whatsapp.routes.js
│   │   │       ├── whatsapp.controller.js
│   │   │       ├── whatsapp.service.js
│   │   │       ├── whatsapp.formatter.js
│   │   │       └── whatsapp.engine.js
│   │   └── db/
│   │       ├── knexfile.js
│   │       ├── migrations/
│   │       └── seeds/
│   ├── package.json
│   └── .env
│
├── client/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Onboarding/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── BusinessProfile.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── MenuBuilder/
│   │   │   ├── FlowBuilder/
│   │   │   ├── Requests/
│   │   │   ├── Assignees/
│   │   │   ├── AssignmentRules/
│   │   │   ├── Notifications/
│   │   │   └── WhatsAppConnection/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── TenantGuard.jsx
│   │   │   └── ValidationFeedback.jsx
│   │   └── utils/
│   │       └── validators.js
│   ├── vite.config.js
│   └── package.json
│
└── docs/
```

### Structural Principles

- One folder per blueprint domain under `modules/`
- Routes → Controller → Service pattern per module
- Validation files per module contain domain-specific rules
- No shared base classes — each module is self-contained
- Phases add new module folders without modifying existing ones

---

## 4.2 Module Breakdown

| Server Module | Domain | Phase |
|---|---|---|
| `auth/` | Authentication — login, JWT, refresh, roles | 2 |
| `business/` | Business entity, profile, tenant context | 1–2 |
| `service/` | Service CRUD, tenant-scoped | 2 |
| `template/` | Deep-copy template application | 2 |
| `menu/` | MenuNode tree, all 4 node types, info content, action buttons | 3 |
| `flow/` | Flow + FlowStep CRUD, step ordering, configuration | 4 |
| `request/` | Request creation, status transitions, business actions | 5 |
| `assignment/` | Assignee CRUD, rule CRUD, routing evaluation engine | 5b |
| `notification/` | In-panel notifications, optional email | 6 |
| `session/` | Customer session state, context tracking, timeout | 7 |
| `whatsapp/` | Webhook handling, message formatting, Meta API calls, state machine | 7 |

### Cross-Module Dependencies (One-Directional)

```
auth → (standalone)
business → (standalone)
service → business
template → business, service, menu, flow
menu → business, service
flow → business, service, menu
request → business, flow, menu
assignment → business, request, menu, service, flow
notification → business, request, assignment
session → business, menu, flow, request, assignment, notification
whatsapp → session
```

---

## 4.3 API Design

All routes prefixed with `/api/v1/`. Resource names are plural nouns. Every endpoint requires authentication except WhatsApp webhook and auth routes. Business owner endpoints are tenant-scoped via middleware.

### Auth

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/login` | Login → JWT |
| POST | `/api/v1/auth/refresh` | Refresh token |
| POST | `/api/v1/auth/logout` | Clear cookie |

### Business

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/businesses` | List all (platform_owner only) |
| POST | `/api/v1/businesses` | Create business |
| GET | `/api/v1/businesses/:id` | Get business |
| PUT | `/api/v1/businesses/:id` | Update business |

### Business Profile

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/profile` | Get own profile |
| PUT | `/api/v1/profile` | Update own profile |

### Services

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/services` | List (tenant-scoped) |
| POST | `/api/v1/services` | Create |
| GET | `/api/v1/services/:id` | Get |
| PUT | `/api/v1/services/:id` | Update |
| DELETE | `/api/v1/services/:id` | Delete |

### Templates

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/templates` | List available |
| POST | `/api/v1/templates/:id/apply` | Apply (deep copy) |

### Menu Nodes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/menu-nodes` | Get full tree (tenant-scoped) |
| POST | `/api/v1/menu-nodes` | Create node |
| GET | `/api/v1/menu-nodes/:id` | Get single node |
| PUT | `/api/v1/menu-nodes/:id` | Update node |
| DELETE | `/api/v1/menu-nodes/:id` | Delete node |
| PUT | `/api/v1/menu-nodes/:id/reorder` | Reorder among siblings |
| POST | `/api/v1/menu-nodes/publish` | Validate + publish |

### Flows

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/flows` | List (tenant-scoped) |
| POST | `/api/v1/flows` | Create |
| GET | `/api/v1/flows/:id` | Get with steps |
| PUT | `/api/v1/flows/:id` | Update |
| DELETE | `/api/v1/flows/:id` | Delete |

### Flow Steps

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/flows/:flowId/steps` | List (ordered) |
| POST | `/api/v1/flows/:flowId/steps` | Add step |
| PUT | `/api/v1/flows/:flowId/steps/:id` | Update step |
| DELETE | `/api/v1/flows/:flowId/steps/:id` | Remove step |
| PUT | `/api/v1/flows/:flowId/steps/reorder` | Reorder |
| POST | `/api/v1/flows/:flowId/publish` | Validate + publish |

### Requests

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/requests` | List (tenant-scoped, filterable) |
| GET | `/api/v1/requests/:id` | Get detail |
| PUT | `/api/v1/requests/:id/approve` | pending → approved |
| PUT | `/api/v1/requests/:id/reject` | pending → rejected |
| PUT | `/api/v1/requests/:id/followup` | pending → manual_followup |
| PUT | `/api/v1/requests/:id/complete` | approved/manual_followup → completed |

### Assignees

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/assignees` | List (tenant-scoped) |
| POST | `/api/v1/assignees` | Create |
| GET | `/api/v1/assignees/:id` | Get |
| PUT | `/api/v1/assignees/:id` | Update |
| PUT | `/api/v1/assignees/:id/deactivate` | Set status = inactive |
| PUT | `/api/v1/assignees/:id/activate` | Set status = active |

### Assignment Rules

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/assignment-rules` | List (tenant-scoped) |
| POST | `/api/v1/assignment-rules` | Create |
| GET | `/api/v1/assignment-rules/:id` | Get |
| PUT | `/api/v1/assignment-rules/:id` | Update |
| PUT | `/api/v1/assignment-rules/:id/deactivate` | Set is_active = false |
| PUT | `/api/v1/assignment-rules/:id/activate` | Set is_active = true |

### Notifications

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/notifications` | List (tenant-scoped) |
| PUT | `/api/v1/notifications/:id/read` | Mark as read |
| GET | `/api/v1/notifications/unread-count` | Count for badge |

### WhatsApp Webhook

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/webhook/whatsapp` | Webhook verification (Meta challenge) |
| POST | `/api/v1/webhook/whatsapp` | Incoming message handler |

### WhatsApp Connection

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/whatsapp-connection` | Get connection status |
| PUT | `/api/v1/whatsapp-connection` | Update connection config |

### Sessions (Business Panel)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/sessions` | List active sessions |
| PUT | `/api/v1/sessions/:sessionId/takeover` | Activate human takeover |
| PUT | `/api/v1/sessions/:sessionId/release` | Release to automated mode |

---

## 4.4 Database Schema Mapping

### Tables

| Table | Phase | Key Fields |
|---|---|---|
| `businesses` | 1 | id, name, phone, location, description, is_active, created_at |
| `users` | 1 | id, business_id (nullable), email, password_hash, role (enum: platform_owner, business_owner), created_at |
| `services` | 2 | id, business_id, name, description, price, duration, created_at |
| `templates` | 2 | id, industry_type, name, description |
| `template_data` | 2 | id, template_id, data (jsonb) |
| `menu_nodes` | 3 | id, business_id, parent_id (self-ref, nullable), node_type (enum), label, sort_order, action_type (nullable), action_config (jsonb, nullable), flow_id (nullable), created_at |
| `info_contents` | 3 | id, menu_node_id, title, description, price (nullable), duration (nullable) |
| `action_buttons` | 3 | id, menu_node_id, label, behavior_type (enum), flow_id (nullable), action_type (nullable), action_config (jsonb, nullable), sort_order |
| `flows` | 4 | id, business_id, name, description, is_published, created_at |
| `flow_steps` | 4 | id, flow_id, step_type (enum: 7 types), order (integer), configuration (jsonb), created_at |
| `requests` | 5 | id, business_id, source_flow_id, entered_from_node_id, phone_number, service, date, time, notes, status (enum: 5 statuses), assigned_to_id (nullable), assignment_rule_id (nullable), assigned_at (nullable), created_at |
| `assignees` | 5b | id, business_id, name, phone_number, label, status (enum: active, inactive), created_at, updated_at |
| `assignment_rules` | 5b | id, business_id, trigger_type (enum), trigger_id, assigned_to_id, priority (integer), is_active (boolean), created_at, updated_at |
| `notifications` | 6 | id, business_id, request_id, type, message, assigned_to_name (nullable), is_read, created_at |
| `sessions` | 7 | id, phone_number, business_id, current_menu_node_id, current_flow_id (nullable), current_flow_step (nullable), flow_data (jsonb, nullable), mode (enum: automated, human_takeover), last_activity, created_at |
| `whatsapp_connections` | 7 | id, business_id, phone_number_id, access_token (encrypted), webhook_verify_token, is_connected, created_at |

### Key Indexes

- `sessions`: UNIQUE on (`phone_number`, `business_id`)
- `menu_nodes`: INDEX on (`business_id`, `parent_id`)
- `flow_steps`: INDEX on (`flow_id`, `order`)
- `requests`: INDEX on (`business_id`, `status`)
- `requests`: INDEX on (`business_id`, `assigned_to_id`)
- `assignment_rules`: INDEX on (`business_id`, `is_active`)
- All tables: INDEX on `business_id`

### Foreign Keys

```
users.business_id              → businesses.id
services.business_id           → businesses.id
menu_nodes.business_id         → businesses.id
menu_nodes.parent_id           → menu_nodes.id (self-referencing)
info_contents.menu_node_id     → menu_nodes.id
action_buttons.menu_node_id    → menu_nodes.id
action_buttons.flow_id         → flows.id
flows.business_id              → businesses.id
flow_steps.flow_id             → flows.id
requests.business_id           → businesses.id
requests.source_flow_id        → flows.id
requests.entered_from_node_id  → menu_nodes.id
requests.assigned_to_id        → assignees.id
requests.assignment_rule_id    → assignment_rules.id
assignees.business_id          → businesses.id
assignment_rules.business_id   → businesses.id
assignment_rules.assigned_to_id → assignees.id
notifications.business_id      → businesses.id
notifications.request_id       → requests.id
sessions.business_id           → businesses.id
whatsapp_connections.business_id → businesses.id
```

---

## 4.5 Session Handling

### Storage

Customer sessions stored in the `sessions` PostgreSQL table. Sessions survive server restarts. Partial flow data is durable.

### Lifecycle

1. New message → lookup session by (`phone_number`, `business_id`)
2. No session → create new, set `current_menu_node_id` to root, `mode` = automated
3. Session exists → check `last_activity` against 30-minute timeout
   - Expired → reset session (clear flow context, set to root)
   - Active → continue from current state
4. Every message → update `last_activity`

### Context Tracking

| Field | Menu Context | Flow Context | Human Takeover |
|---|---|---|---|
| `current_menu_node_id` | Current position | Node that initiated flow | Current position |
| `current_flow_id` | null | Active flow ID | null |
| `current_flow_step` | null | Current step index | null |
| `flow_data` | null | Partial responses (jsonb) | null |
| `mode` | automated | automated | human_takeover |

### Timeout

- Check-on-access pattern: compare `last_activity` to current time on each message
- If > 30 minutes → full reset
- No background cleanup job required for MVP

---

## 4.6 Webhook Processing Pipeline

```
Incoming POST /api/v1/webhook/whatsapp
     │
     ▼
[1. Signature Verification]     Validate Meta webhook signature
     │
     ▼
[2. Payload Parsing]            Extract phone_number, business context, message content
     │
     ▼
[3. Business Lookup]            Identify business from WhatsApp number
     │
     ▼
[4. Session Load/Create]        Lookup by (phone_number, business_id); create if new; check timeout
     │
     ▼
[5. Mode Check]                 human_takeover → route to business owner (skip automation)
     │                          automated → continue to state machine
     ▼
[6. State Machine Evaluation]
     ├── Menu context           → Navigate tree → format response
     │   ├── Menu Node          → Load children
     │   ├── Info Node          → Load content + buttons
     │   ├── Flow Entry Node    → Transition to flow context
     │   └── Action Node        → Execute action
     └── Flow context           → Collect step input → advance
         ├── Step complete       → Next step
         └── All complete        → Create Request → Assignment → Notification → Return to menu
     │
     ▼
[7. Response Formatting]        Convert to WhatsApp message type (buttons/list/text)
     │
     ▼
[8. Send via Meta API]          POST to Meta Cloud API
     │
     ▼
[9. Session Update]             Persist updated state to database
     │
     ▼
[200 OK]                        Acknowledge webhook receipt
```

---

## 4.7 Builder Validation Strategy

### Dual Layer

| Layer | Purpose |
|---|---|
| **Client-side (React)** | Immediate UX feedback; prevent obviously invalid actions |
| **Server-side (Express)** | Enforcement; reject invalid requests; authoritative layer |

### Validation Points

| Timing | Behavior |
|---|---|
| **Creation** | Validate constraint before saving new node/step |
| **Edit** | Validate constraint after modification |
| **Publish** | Full tree/flow scan; block if any violation found; return violation list |

### Constraint Checks

| Constraint | Check |
|---|---|
| Menu Node max 10 children | Count on add-child; scan on publish |
| Menu depth max 4 levels | Recursive CTE on publish |
| Info Node max 3 buttons | Count on add-button; scan on publish |
| Flow step max 10 options | Count on create/edit; scan on publish |
| Menu Node ≥ 1 child | Scan on publish |
| Flow Entry references valid flow | Scan on publish |

### Publish Response (On Failure)

```json
{
  "success": false,
  "violations": [
    {
      "entity_type": "menu_node",
      "entity_id": "...",
      "rule": "max_children",
      "current": 12,
      "limit": 10
    }
  ]
}
```

---

## 4.8 Multi-Tenancy Enforcement

### Strategy: Row-Level Tenant Scoping

Every data table includes `business_id`. Isolation enforced at four layers:

**Layer 1 — Authentication Middleware:** Extract JWT → decode → attach `req.user = { id, business_id, role }`

**Layer 2 — Tenant Scope Middleware:** For business_owner: set `req.tenantId = req.user.business_id`. For platform_owner: explicit business_id parameter or cross-tenant access.

**Layer 3 — Service Level:** Every service function receives `tenantId`. Every query includes `WHERE business_id = tenantId`.

**Layer 4 — Object Access Validation:** When accessing resource by ID: fetch record → verify `record.business_id === tenantId` → reject on mismatch.

---

# 5. DEVELOPMENT PHASES

---

## Phase 1: Core Data & Structure

### Objective

Establish the foundational data layer: database, tenant model, project skeleton, base schemas.

### What Is Built

- PostgreSQL installation and configuration
- Knex.js connection and migration system
- Express project skeleton with middleware stack
- Business entity with CRUD API
- User entity (schema only — auth implemented in Phase 2)
- Error handling middleware
- pm2 process management

### Tables

| Table | Key Fields |
|---|---|
| `businesses` | id, name, phone, location, description, is_active, created_at |
| `users` | id, business_id (nullable), email, password_hash, role (enum: platform_owner, business_owner), created_at |

### Migration

- `001_create_businesses_and_users.js`

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/businesses` | List businesses (platform_owner only) |
| POST | `/api/v1/businesses` | Create business |
| GET | `/api/v1/businesses/:id` | Get business |
| PUT | `/api/v1/businesses/:id` | Update business |

### UI

None.

### Validation Rules

- Business name: required, non-empty string
- Business phone: required, valid phone format
- User email: required, unique, valid format
- User role: must be `platform_owner` or `business_owner`
- `business_id` column present on all tables

### Dependencies

None.

### Definition of DONE

- PostgreSQL running on VPS, database created
- Knex configured, first migration runs successfully
- `businesses` and `users` tables exist with correct schema
- Business CRUD API endpoints respond correctly
- Error handler returns structured error responses
- pm2 runs Express app, restarts on crash
- All queries include tenant scoping where applicable

---

## Phase 2: Business Setup

### Objective

Authentication, business profile management, services CRUD, template engine, onboarding wizard backend, and initial React frontend shell.

### What Is Built

- JWT authentication system (login, refresh, logout)
- Authentication and tenant scope middleware
- Business profile API
- Services CRUD
- Template engine (deep-copy)
- React frontend project with routing and auth context
- Login page, onboarding wizard, profile page, services page

### Tables

| Table | Key Fields |
|---|---|
| `services` | id, business_id, name, description, price, duration, created_at |
| `templates` | id, industry_type, name, description |
| `template_data` | id, template_id, data (jsonb) |

### Migrations

- `002_create_services.js`
- `003_create_templates.js`

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/login` | Login → JWT |
| POST | `/api/v1/auth/refresh` | Refresh token |
| POST | `/api/v1/auth/logout` | Clear auth cookie |
| GET | `/api/v1/profile` | Get own business profile |
| PUT | `/api/v1/profile` | Update own business profile |
| GET | `/api/v1/services` | List services (tenant-scoped) |
| POST | `/api/v1/services` | Create service |
| GET | `/api/v1/services/:id` | Get service |
| PUT | `/api/v1/services/:id` | Update service |
| DELETE | `/api/v1/services/:id` | Delete service |
| GET | `/api/v1/templates` | List available templates |
| POST | `/api/v1/templates/:id/apply` | Apply template (deep copy) |

### UI

- Login page
- App layout shell (sidebar, header)
- Auth context (JWT storage, auto-refresh, route guards)
- Onboarding wizard (business info → services → template selection → apply)
- Business profile page (view/edit)
- Services page (CRUD table)
- API client (axios with auth interceptor)

### Validation Rules

- Service name: required, non-empty
- Service price: optional, numeric if provided
- Service duration: optional, string if provided
- Template apply: one-time only (reject if business already has menu data)
- Password hashing with bcrypt
- JWT: HTTP-Only cookie, Secure, SameSite=Strict

### Template Deep-Copy Logic

1. Fetch template data (jsonb blob)
2. Begin transaction
3. Insert services (new IDs, mapped to business_id)
4. Insert menu nodes (new IDs, preserving parent-child via ID mapping)
5. Insert flows (new IDs, mapped to business_id)
6. Insert flow steps (new IDs, mapped to new flow IDs)
7. Update references (Flow Entry Nodes → new flow IDs, buttons → new flow IDs)
8. Commit transaction (rollback on any failure)

### Dependencies

Phase 1.

### Definition of DONE

- Authentication works end-to-end: login → JWT → authenticated access → refresh → logout
- JWT contains user_id, business_id, role
- Tenant scope middleware active on all authenticated routes
- Services CRUD fully functional with tenant isolation
- Template deep-copy creates complete independent copy in a single atomic transaction
- React app loads, login works, sidebar renders
- Onboarding wizard completes successfully
- Business profile displays and edits correctly
- Services page lists, creates, edits, deletes

---

## Phase 3: Menu System

### Objective

Complete menu tree builder with all 4 node types, Info Node content with action buttons, tree operations, and WhatsApp UX constraint validation.

### What Is Built

- MenuNode tree CRUD with self-referencing parent-child relationships
- All 4 node types: menu, info, flow_entry, action
- Info content management (title, description, price, duration)
- Action button management (up to 3 per Info Node)
- Tree operations (recursive retrieval, depth calculation, subtree management)
- Menu builder UI with visual tree editor
- Builder validation for WhatsApp constraints
- Publish endpoint with full tree validation

### Tables

| Table | Key Fields |
|---|---|
| `menu_nodes` | id, business_id, parent_id (self-ref, nullable), node_type (enum), label, sort_order, action_type (nullable), action_config (jsonb, nullable), flow_id (nullable), created_at |
| `info_contents` | id, menu_node_id, title, description, price (nullable), duration (nullable) |
| `action_buttons` | id, menu_node_id, label, behavior_type (enum: trigger_flow, action), flow_id (nullable), action_type (nullable), action_config (jsonb, nullable), sort_order |

### Migrations

- `004_create_menu_nodes.js`
- `005_create_info_contents.js`
- `006_create_action_buttons.js`

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/menu-nodes` | Get full tree (tenant-scoped) |
| POST | `/api/v1/menu-nodes` | Create node |
| GET | `/api/v1/menu-nodes/:id` | Get single node |
| PUT | `/api/v1/menu-nodes/:id` | Update node |
| DELETE | `/api/v1/menu-nodes/:id` | Delete node |
| PUT | `/api/v1/menu-nodes/:id/reorder` | Reorder among siblings |
| POST | `/api/v1/menu-nodes/publish` | Validate + publish |

### UI

- Menu builder page — visual tree editor (Ant Design Tree component)
- Add node (select type), edit inline, drag to reorder, delete with confirmation
- Info editor — title, description, price, duration fields + action button management
- Action node config — action type + config
- Flow Entry Node config — flow selector (may be empty in Phase 3; wired in Phase 4)
- Publish button with validation feedback (violation list)

### Validation Rules

| Rule | Enforcement |
|---|---|
| Menu Node: max 10 children | Create/edit/publish |
| Menu depth: max 4 levels | Publish (recursive CTE) |
| Info Node: max 3 buttons | Create/edit/publish |
| Menu Node: ≥ 1 child | Publish |
| Node type: one of 4 enum values | Create/edit |
| Action type: from fixed enum | Create/edit |

### Tree Operations

- Full tree retrieval: recursive CTE → assemble in service layer
- Depth calculation: recursive CTE from root
- Subtree management: cascade delete or block if has children

### Dependencies

Phase 2.

### Definition of DONE

- All 4 node types can be created, edited, deleted
- Menu tree displays correctly in builder UI
- Info Nodes show content editor with action buttons
- Action buttons support trigger_flow and action behavior types
- Max 10 children per Menu Node enforced (server + client)
- Publish validates max 4 depth, max 10 children, ≥ 1 child per menu node, max 3 buttons
- Publish returns violation list on failure
- All queries are tenant-scoped

---

## Phase 4: Flow System

### Objective

Flow definitions, flow step management (all 7 types), flow builder UI, flow-to-menu wiring, and WhatsApp option limit validation.

### What Is Built

- Flow entity CRUD
- FlowStep management with all 7 step types
- Flow builder UI
- Flow-to-menu wiring (Flow Entry Nodes and Info Node trigger_flow buttons link to flows)
- Publish validation for flow configurations

### Tables

| Table | Key Fields |
|---|---|
| `flows` | id, business_id, name, description, is_published, created_at |
| `flow_steps` | id, flow_id, step_type (enum: 7 types), order (integer), configuration (jsonb), created_at |

### Migrations

- `007_create_flows.js`
- `008_create_flow_steps.js`

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/flows` | List flows (tenant-scoped) |
| POST | `/api/v1/flows` | Create flow |
| GET | `/api/v1/flows/:id` | Get flow with steps |
| PUT | `/api/v1/flows/:id` | Update flow metadata |
| DELETE | `/api/v1/flows/:id` | Delete flow |
| GET | `/api/v1/flows/:flowId/steps` | List steps (ordered) |
| POST | `/api/v1/flows/:flowId/steps` | Add step |
| PUT | `/api/v1/flows/:flowId/steps/:id` | Update step |
| DELETE | `/api/v1/flows/:flowId/steps/:id` | Remove step |
| PUT | `/api/v1/flows/:flowId/steps/reorder` | Reorder |
| POST | `/api/v1/flows/:flowId/publish` | Validate + publish |

### UI

- Flow list page (CRUD table)
- Flow builder page — step sequence editor
- Step type selector (7-type dropdown)
- Per-step configuration forms:
  - `select_option`: option list (labels + values)
  - `select_service`: auto-populate from business services
  - `select_date`: date picker config
  - `select_time`: time picker config
  - `text_input`: label, placeholder
  - `confirmation`: prompt text
  - `summary`: display template config
- Menu builder updated: Flow Entry Nodes and trigger_flow buttons can now select a flow
- Publish button with validation feedback

### Validation Rules

| Rule | Enforcement |
|---|---|
| Flow step options: max 10 | Create/edit/publish |
| Step type: one of 7 enum values | Create/edit |
| Flow: at least 1 step | Publish |
| Flow Entry Node: references valid published flow | Menu publish |
| Step order: contiguous integers from 1 | Reorder |

### Dependencies

Phase 3.

### Definition of DONE

- Flows can be created, edited, deleted
- All 7 step types supported with configuration forms
- Flow builder shows steps in order with inline editing
- Flow publish validates step options ≤ 10
- Flow Entry Nodes link to flows
- Info Node trigger_flow buttons link to flows
- Menu publish validates Flow Entry Node references
- All queries are tenant-scoped

---

## Phase 5: Request Lifecycle

### Objective

Request entity, status transitions, business owner actions, and request management UI.

### What Is Built

- Request table with all fields (including nullable assignment fields for Phase 5b)
- Status transition enforcement
- Business action endpoints (approve, reject, followup, complete)
- Request management UI (list with filters, detail with actions)

### Tables

| Table | Key Fields |
|---|---|
| `requests` | id, business_id, source_flow_id, entered_from_node_id, phone_number, service, date, time, notes, status (enum: 5 statuses), assigned_to_id (nullable), assignment_rule_id (nullable), assigned_at (nullable), created_at |

### Migration

- `009_create_requests.js`

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/requests` | List (tenant-scoped, filterable by status) |
| GET | `/api/v1/requests/:id` | Get detail |
| PUT | `/api/v1/requests/:id/approve` | pending → approved |
| PUT | `/api/v1/requests/:id/reject` | pending → rejected |
| PUT | `/api/v1/requests/:id/followup` | pending → manual_followup |
| PUT | `/api/v1/requests/:id/complete` | approved/manual_followup → completed |

### UI

- Requests list page (table: phone, service, date, time, status, assigned to, created_at)
- Filter by status
- Request detail page (full info, traceability, assignment info placeholder)
- Action buttons by status:
  - pending: Approve, Reject, Manual Follow-up
  - approved: Complete
  - manual_followup: Approve, Reject, Complete
  - rejected/completed: no actions

### Validation Rules

| Rule | Enforcement |
|---|---|
| Status transitions: only allowed paths | Every status change |
| Terminal states: no modifications | Every update attempt |
| source_flow_id: valid flow reference | Creation |
| entered_from_node_id: valid menu node | Creation |
| Tenant ownership | Every operation |

### Status Transition Table

```
ALLOWED_TRANSITIONS = {
  pending:          ['approved', 'rejected', 'manual_followup'],
  approved:         ['completed'],
  rejected:         [],
  manual_followup:  ['approved', 'rejected', 'completed'],
  completed:        []
}
```

### Dependencies

Phase 4.

### Definition of DONE

- Requests table exists with all fields
- Request detail shows traceability (source flow, entry node)
- All 5 status transition paths work correctly
- Invalid transitions rejected with clear error
- Terminal states block all modifications
- Request list supports status filtering
- Assignment nullable fields exist but are not populated
- All queries are tenant-scoped

---

## Phase 5b: Assignment & Routing

### Objective

Assignee management, assignment rule management, deterministic routing evaluation engine, and assignment-related UI.

### What Is Built

- Assignee entity CRUD with active/inactive status
- Assignment rule entity CRUD with trigger types and priority
- Deterministic routing evaluation engine
- Integration into request creation pipeline
- Assignment UI (assignee manager, rule builder, request assignment display)

### Tables

| Table | Key Fields |
|---|---|
| `assignees` | id, business_id, name, phone_number, label (nullable), status (enum: active, inactive), created_at, updated_at |
| `assignment_rules` | id, business_id, trigger_type (enum: menu_node, service, flow), trigger_id, assigned_to_id, priority (integer), is_active (boolean), created_at, updated_at |

### Migrations

- `010_create_assignees.js`
- `011_create_assignment_rules.js`

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/assignees` | List (tenant-scoped) |
| POST | `/api/v1/assignees` | Create |
| GET | `/api/v1/assignees/:id` | Get |
| PUT | `/api/v1/assignees/:id` | Update |
| PUT | `/api/v1/assignees/:id/deactivate` | Set status = inactive |
| PUT | `/api/v1/assignees/:id/activate` | Set status = active |
| GET | `/api/v1/assignment-rules` | List (tenant-scoped) |
| POST | `/api/v1/assignment-rules` | Create |
| GET | `/api/v1/assignment-rules/:id` | Get |
| PUT | `/api/v1/assignment-rules/:id` | Update |
| PUT | `/api/v1/assignment-rules/:id/deactivate` | Set is_active = false |
| PUT | `/api/v1/assignment-rules/:id/activate` | Set is_active = true |

### Routing Evaluation Engine

Implemented in `assignment.routing.js`:

1. Receive newly created request (`business_id`, `entered_from_node_id`, `service`, `source_flow_id`)
2. Query all `is_active` assignment rules for this `business_id`
3. Match each rule:
   - `menu_node` → compare `trigger_id` against `entered_from_node_id`
   - `service` → compare `trigger_id` against `service`
   - `flow` → compare `trigger_id` against `source_flow_id`
4. Collect all matching rules
5. 0 matches → no assignment
6. 1 match → check assignee active → assign or skip
7. Multiple matches → highest `priority` wins:
   - Single winner → check assignee active → assign or skip
   - Tied at highest priority → no assignment
8. If assigning: set `assigned_to_id`, `assignment_rule_id`, `assigned_at` on request

### UI

- Assignees page (CRUD table: name, phone, label, status toggle)
- Assignment Rules page (CRUD table: trigger type, trigger name, assignee, priority, active toggle)
- Rule creation form: trigger type dropdown → trigger selector → assignee selector → priority input
- Update Requests list/detail: display assigned-to column and full assignment info

### Validation Rules

| Rule | Enforcement |
|---|---|
| `trigger_id` references valid entity matching `trigger_type` | Create/edit rule |
| `assigned_to_id` references active assignee in same business | Create/edit rule |
| `priority` is valid integer | Create/edit rule |
| Deactivating assignee preserves past assignments | Deactivate |

### Dependencies

Phase 5.

### Definition of DONE

- Assignees CRUD works: create, edit, activate, deactivate, list
- Assignment rules CRUD works: create, edit, activate, deactivate, list
- Routing evaluation handles all scenarios:
  - 0 matches → unassigned
  - 1 match, active assignee → assigned
  - 1 match, inactive assignee → unassigned
  - Multiple matches, clear priority winner → assigned
  - Multiple matches, priority tie → unassigned
- Routing wired into request creation flow
- Assignment fields populated correctly on requests
- Requests list shows assigned-to column
- Request detail shows full assignment info
- Deactivating assignee does not modify existing assignments
- All queries are tenant-scoped
- Routing completes in < 500 ms

---

## Phase 6: Notifications

### Objective

In-panel notification system triggered by request creation (after assignment evaluation), notification UI, and optional email.

### What Is Built

- Notification entity and storage
- Notification trigger on request creation (after assignment)
- In-panel notification display (bell icon, dropdown, unread count)
- Optional email notification via nodemailer

### Tables

| Table | Key Fields |
|---|---|
| `notifications` | id, business_id, request_id, type (enum: new_request), message, assigned_to_name (nullable), is_read (boolean), created_at |

### Migration

- `012_create_notifications.js`

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/notifications` | List (tenant-scoped, unread-first) |
| PUT | `/api/v1/notifications/:id/read` | Mark as read |
| GET | `/api/v1/notifications/unread-count` | Count for badge |

### Notification Trigger

Integrated into request creation pipeline:

1. Flow completes → Request created (Phase 5)
2. Assignment evaluation runs (Phase 5b)
3. Notification created:
   - If assigned: message includes "Assigned to: {assignee_name}"
   - If unassigned: standard notification
4. Business owner always receives notification regardless of assignment
5. (Optional) Email via nodemailer if configured

### UI

- Notification bell icon in header (badge with unread count)
- Dropdown showing recent notifications
- Click notification → navigate to request detail
- Mark as read on click

### Validation Rules

- Notification linked to valid request
- Tenant-scoped
- Business owner always receives all notifications

### Dependencies

Phase 5b.

### Definition of DONE

- Notification created automatically on new request
- Notification includes assignment info when applicable
- Bell icon shows unread count
- Dropdown lists recent notifications
- Click navigates to request detail
- Mark as read works
- (Optional) Email sends on request creation
- Business owner receives all notifications regardless of assignment
- All queries are tenant-scoped

---

## Phase 7: WhatsApp Integration

### Objective

Full runtime engine: webhook handling, Meta Cloud API, session management, conversation state machine, message formatting, human takeover, and WhatsApp connection UI.

### What Is Built

- Webhook endpoint (verification + message handling)
- Meta Cloud API client (send messages)
- Customer session management (create, load, update, timeout, reset)
- Conversation state machine (menu traversal + flow execution)
- Message formatter (reply buttons, list messages, text)
- Human takeover (activate, route messages, release)
- WhatsApp connection management UI
- Active sessions / conversations UI

### Tables

| Table | Key Fields |
|---|---|
| `sessions` | id, phone_number, business_id, current_menu_node_id, current_flow_id (nullable), current_flow_step (nullable), flow_data (jsonb, nullable), mode (enum: automated, human_takeover), last_activity, created_at |
| `whatsapp_connections` | id, business_id, phone_number_id, access_token (encrypted), webhook_verify_token, is_connected, created_at |

### Migrations

- `013_create_sessions.js`
- `014_create_whatsapp_connections.js`

### APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/webhook/whatsapp` | Webhook verification (Meta challenge) |
| POST | `/api/v1/webhook/whatsapp` | Incoming message handler |
| GET | `/api/v1/whatsapp-connection` | Get connection status |
| PUT | `/api/v1/whatsapp-connection` | Update connection config |
| GET | `/api/v1/sessions` | List active sessions |
| PUT | `/api/v1/sessions/:sessionId/takeover` | Activate human takeover |
| PUT | `/api/v1/sessions/:sessionId/release` | Release to automated mode |

### Engine Components

**`whatsapp.engine.js`** — Conversation state machine:
- Load/create session → check timeout → check mode → evaluate context (menu vs flow) → produce response

**`whatsapp.formatter.js`** — Message type converter:
- 1–3 options → WhatsApp interactive reply buttons
- 4–10 options → WhatsApp interactive list message
- Text/info content → WhatsApp text message

**`whatsapp.service.js`** — Meta Cloud API client:
- Send message, verify webhook, handle API errors

**`session.service.js`** — Session state management:
- Load, create, update, reset sessions

**`session.timeout.js`** — 30-minute timeout check (check-on-access)

### Request Creation Integration

When flow completes:
1. Collect flow_data from session
2. Create request (Phase 5)
3. Run assignment evaluation (Phase 5b)
4. Create notification (Phase 6)
5. Reset session flow context → return to menu
6. Format confirmation message

### Human Takeover

- Business panel shows active sessions
- Takeover → set `mode = human_takeover` → automation stops
- Messages routed to business owner for manual response
- Release → set `mode = automated` → session resets to main menu

### UI

- WhatsApp Connection page (config fields, status indicator, test connection)
- Active Sessions page (conversation list: phone, context, last activity, mode)
- Takeover/Release per session
- In-takeover: message history + reply input for business owner

### Validation Rules

- Webhook signature verification (Meta security)
- Session timeout: 30 minutes
- Mode mutual exclusivity: automated XOR human_takeover
- Published configurations assumed valid at runtime

### Dependencies

Phase 6.

### Definition of DONE

- Webhook verification responds to Meta challenge
- Incoming messages processed through full pipeline
- New customers get main menu on first message
- Menu navigation: Menu Node children, Info Node content, Action Node execution
- Flow Entry Node transitions to flow context
- Flow steps presented one-by-one, responses collected
- Flow completion → request → assignment → notification → return to menu
- 30-minute timeout resets session
- Human takeover stops automation, business owner responds manually
- Release resets session to main menu + automated
- Message formatting: 1–3 = reply buttons, 4–10 = list
- WhatsApp connection configurable from panel
- Sessions survive server restarts
- Composite key (phone_number + business_id) used for all session queries
- Concurrent conversations handled independently

---

## Phase 8: Testing & Refinement

### Objective

End-to-end validation of the complete system. No new entities, no new features. Verify all phases work together and the full pipeline operates as designed.

### What Is Built

No new tables, no new APIs, no new UI. Only testing and bug fixing.

### Test Scenarios

**End-to-End Pipeline:**
1. Business onboards → template applied → menu and flows exist
2. Business customizes menu, services, flows
3. Business creates assignees and assignment rules
4. Business publishes menu and flows (validation passes)
5. Business connects WhatsApp number
6. Customer sends first message → main menu
7. Customer navigates menu → Info Node → flow button
8. Customer completes flow → request → assignment → notification
9. Business owner views request (with assignment) → approves → completes
10. Verify data integrity (tenant scoping, references, timestamps)

**State Machine Edge Cases:**
- Session timeout mid-flow → reset to menu
- Session timeout mid-menu → reset to root
- Multiple customers messaging same business simultaneously
- Customer starts flow, times out, starts again
- Human takeover mid-flow → automation stops
- Human takeover released → session resets to main menu

**Assignment Edge Cases:**
- 0 rules → unassigned
- 1 rule, active assignee → assigned
- 1 rule, inactive assignee → unassigned
- Multiple rules, clear priority → assigned to highest
- Multiple rules, tied priority → unassigned
- Business with no rules → no errors

**Validation Edge Cases:**
- Menu with 11 children → publish blocked
- Menu with 5 levels → publish blocked
- Info Node with 4 buttons → creation blocked
- Flow step with 11 options → creation blocked
- Publish with violations → violation list
- All violations resolved → publish succeeds

**Multi-Tenancy Verification:**
- Business A data never visible to Business B
- Direct object reference with wrong tenant → rejected
- All list endpoints return only current tenant data

### Dependencies

Phase 7.

### Definition of DONE

- Full end-to-end flow works: onboarding → menu → flow → request → assignment → notification → WhatsApp
- All status transitions enforce rules correctly
- All WhatsApp constraints enforced at creation, edit, and publish
- Multi-tenancy fully isolated (verified with 2+ businesses)
- Human takeover and release work correctly
- Session timeout at exactly 30 minutes
- All state machine edge cases handled
- All assignment routing edge cases handled
- No data leaks between tenants
- System runs stably on Windows VPS under pm2
- System recovers from restart without data loss

---

# 6. SYSTEM EXECUTION ORDER

The system pipeline is locked and must never change:

```
Menu → Flow → Request → Assignment → Notification
```

| Stage | What Happens | Dependency |
|---|---|---|
| **Menu** | Customer navigates recursive tree of nodes | Entry point for all interactions |
| **Flow** | Customer completes linear data collection steps | Entered from Menu (Flow Entry Node) |
| **Request** | System creates structured request from flow data | Output of completed Flow |
| **Assignment** | System evaluates rules and assigns request to assignee | Runs after Request creation |
| **Notification** | System alerts business owner (with assignment info) | Runs after Assignment evaluation |

### Rules

- Each stage is architecturally separate
- No stage may modify a preceding stage's logic or data
- Assignment never changes request status
- Notification always fires after assignment (even if no assignment occurred)
- The pipeline executes once per flow completion — no re-evaluation

### Phase Build Order (Mirrors Pipeline)

```
Phase 1: Core Data
Phase 2: Business Setup
Phase 3: Menu System          ← Menu
Phase 4: Flow System           ← Flow
Phase 5: Request Lifecycle     ← Request
Phase 5b: Assignment & Routing ← Assignment
Phase 6: Notifications         ← Notification
Phase 7: WhatsApp Integration  ← Runtime engine (orchestrates entire pipeline)
Phase 8: Testing               ← Validates everything
```

---

# 7. FINAL NOTES

### System Characteristics

- **Stateful.** Each customer conversation maintains persistent session state (menu position, flow progress, partial data). Sessions are stored in PostgreSQL and survive server restarts.

- **WhatsApp is the delivery layer only.** All business logic resides server-side in the Express application. WhatsApp handles message transport. Message formatting is the only WhatsApp-specific logic.

- **Builder enforces constraints.** All WhatsApp UX constraints (max children, max depth, max buttons, max options) are enforced by the business panel at creation, edit, and publish time. Runtime assumes published configurations are valid.

- **Assignment is optional and post-request only.** The assignment layer runs after request creation. A business with zero rules operates normally — requests are created without assignment. Assignment is routing/informational, never access control. Assignment never modifies request lifecycle.

- **No redesign allowed.** The architecture, data model, pipeline order, phase dependencies, and all constraints documented in this roadmap are locked. Implementation must follow this document exactly. No features may be added. No phases may be reordered or merged. No architectural changes may be made.

### Locked Source Documents

| Document | Role |
|---|---|
| MASTER_SYSTEM_BLUEPRINT.md | Primary source of truth |
| PRODUCT_REQUIREMENTS.md | Product scope and user journeys |
| FUNCTIONAL_REQUIREMENTS.md | Testable per-module requirements |
| NON_FUNCTIONAL_REQUIREMENTS.md | Performance, security, scalability constraints |
| TECHNICAL_DECISION_INPUTS.md | Tech stack constraints and unknowns |
| OPEN_DECISIONS.md | Unresolved decisions (now resolved in this roadmap) |
| CLAUDE_WORKING_RULES.md | Development behavior rules |
| PHASE_PLANNING_REQUEST.md | Formal request that produced this roadmap |

All documents are FINAL and LOCKED. This roadmap is derived from them and must not contradict them. MASTER_SYSTEM_BLUEPRINT.md takes precedence in all cases.

---

# 8. OS Portability & Deployment Constraints

This section defines mandatory OS-agnostic and portability constraints. These are system constraints — not features, not redesigns. They apply to all phases and all code written for this system. They do not change architecture, system behavior, or the phase structure.

---

## 8.1 OS-Agnostic Requirement

- The system must run on both Windows and Linux without any code changes
- Migration from one OS to another must not require code modifications
- No OS-specific logic is permitted anywhere in the codebase

---

## 8.2 Environment-Driven Configuration

- All configuration values must come from:
  - `.env` files
  - Environment variables
- No hardcoded values for:
  - Ports
  - Database connection strings
  - Secrets or credentials
  - File paths
  - Hostnames

---

## 8.3 Filesystem Neutrality

- All file path construction must use the Node.js `path` module (`path.join`, `path.resolve`)
- No hardcoded file paths (e.g., `C:\...` or `/var/...`)
- No Windows-specific path formats or separators in application code
- No assumptions about filesystem layout beyond the project root

---

## 8.4 Process Management Neutrality

- The application must be runnable with any of the following:
  - `node` (direct execution)
  - `pm2` (process manager)
  - `systemd` (Linux service manager)
- No dependency on a specific process manager in application code
- Process management is an operational concern, not an application concern

---

## 8.5 Database Portability

- All PostgreSQL usage must remain standard SQL and standard PostgreSQL features
- No OS-specific PostgreSQL extensions
- Database must support `pg_dump`/`pg_restore` across Windows and Linux environments
- Connection configuration must be fully environment-driven

---

## 8.6 Deployment Independence

- The system must be deployable on:
  - Windows VPS (current production environment)
  - Linux VPS (future migration target)
- Migration from Windows to Linux must require zero code changes
- Only environment variables and process management configuration may differ between deployments

---

## 8.7 Prohibited Practices

The following are explicitly forbidden in all code and configuration:

- Hardcoded Windows paths (e.g., `C:\Users\...`, `D:\app\...`)
- OS-specific shell commands in application code (e.g., `cmd /c`, `bash -c`)
- IIS-only assumptions or IIS-specific configuration in application logic
- Local-machine-only logic (e.g., `localhost`-only bindings without environment override)
- OS-specific line endings enforced in application logic
- Platform-conditional code branches (`process.platform` checks for business logic)
