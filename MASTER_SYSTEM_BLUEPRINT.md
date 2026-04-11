# MASTER SYSTEM BLUEPRINT

### STATUS: FINAL v4 — LOCKED — SINGLE SOURCE OF TRUTH — NON-EXTENSIBLE

### Last Updated: April 11, 2026

---

## 1. SYSTEM IDENTITY

A multi-tenant platform that replaces free-form WhatsApp conversations with structured, navigable, menu-driven interactions and guided data-collection workflows. WhatsApp is the delivery layer. All logic resides server-side.

---

## 2. USER ROLES

| Role | Scope | Capabilities |
|---|---|---|
| **Platform Owner** | System-wide | Manage tenants, plans, templates, platform evolution |
| **Business Owner** | Own tenant | Configure business, services, menus, flows; review requests; takeover conversations |
| **End Customer** | WhatsApp conversation | Navigate menus, view info, complete flows, submit requests |

---

## 3. NODE TYPES (EXACTLY 4 — NO ADDITIONS IN MVP)

### 3.1 Menu Node

- **Purpose:** Navigation
- **Behavior:** Renders its child nodes as selectable options
- **Constraint:** MUST always have at least one child
- **Children allowed:** Any node type

### 3.2 Info Node

- **Purpose:** Display structured content about a service or item
- **Fields:**
  - `title` (required)
  - `description` (required)
  - `price` (optional)
  - `duration` (optional)
- **Children:** None (leaf node)
- **Action buttons:** Allowed. Each button is typed:
  - If a button triggers a flow → it behaves identically to a Flow Entry Node (same transition, same session state change)
  - If a button triggers an immediate action → it behaves identically to an Action Node (same action type enum)
- **Button limit:** Maximum **3** action buttons per Info Node (WhatsApp reply button constraint — see Section 14)
- **Rule:** Info Node action buttons do NOT create new node entities. They are inline behaviors configured on the Info Node itself, constrained to the same action types defined for Action Nodes and Flow Entry Nodes.

### 3.3 Flow Entry Node

- **Purpose:** Bridge from Menu system to Flow system
- **Behavior:** Transitions the customer session from menu navigation context into a specific flow execution context
- **Children:** None (leaf in the menu tree; execution continues in Flow system)
- **Links to:** Exactly one Flow

### 3.4 Action Node

- **Purpose:** Execute an immediate, single-shot action
- **Children:** None (leaf node)
- **Allowed action types (MVP — fixed enum):**

| Action Type | Behavior |
|---|---|
| `show_phone` | Display the business phone number |
| `show_location` | Display the business location/address |
| `open_link` | Open a URL |
| `go_back` | Navigate to parent menu node |

No other action types are permitted in MVP.

---

## 4. MENU SYSTEM RULES

| Rule | Value |
|---|---|
| Structure | Recursive tree (self-referencing parent → children) |
| Root per business | Exactly ONE root menu node |
| Hard depth limit (MVP) | **4 levels maximum** — builder validation enforced (see Section 14) |
| Max children per Menu Node (MVP) | **10** — hard builder validation rule (see Section 14) |
| Recommended main menu options | 3–5 top-level items (UX guidance, not hard-enforced) |
| Customization | Fully customizable per business (within WhatsApp constraints) |
| Node types allowed in tree | All 4 types |

**Menu system responsibility: NAVIGATION ONLY.** No data collection, no request creation, no flow logic.

**Builder constraints apply:** All menu structures must comply with WhatsApp UX constraint rules (Section 14) at creation, edit, and publish time.

---

## 5. FLOW SYSTEM RULES (MVP)

| Rule | Value |
|---|---|
| Structure | Strictly LINEAR sequence of steps |
| Branching | NOT allowed in MVP |
| Conditional logic | NOT allowed in MVP |
| Loops | NOT allowed in MVP |
| Entry point | Flow Entry Node (or Info Node action button wired to a flow) |
| Exit | Always produces exactly ONE request |
| Multiple entry points | A single Flow CAN be referenced by multiple Flow Entry Nodes / Info Node buttons |

### Allowed Step Types (MVP — fixed enum)

| Step Type | Purpose |
|---|---|
| `select_option` | Choose from a list of predefined options |
| `select_service` | Choose a service from the business's service list |
| `select_date` | Pick a date |
| `select_time` | Pick a time |
| `text_input` | Free text entry (name, notes, etc.) |
| `confirmation` | Yes/No confirmation before submission |
| `summary` | Display collected data for review before final confirm |

Each flow step has:

- `step_type` (from enum above)
- `order` (integer, defines sequence position)
- `configuration` (step-specific: labels, options, validation hints)

**Flow step option constraints (WhatsApp — see Section 14):**

- Any step presenting selectable options (e.g., `select_option`, `select_service`) must follow:
  - 1–3 options → rendered as reply buttons
  - 4–10 options → rendered as list message
  - >10 options → **NOT allowed**; must be restructured before publish

**Flow system responsibility: DATA COLLECTION ONLY.** No menu rendering, no navigation tree logic.

**Builder constraints apply:** All flow step configurations must comply with WhatsApp UX constraint rules (Section 14) at creation, edit, and publish time.

---

## 6. MENU ↔ FLOW BOUNDARY (HARD RULE)

```
┌──────────────────┐         ┌──────────────────┐
│   MENU SYSTEM    │         │   FLOW SYSTEM    │
│   (Navigation)   │────────▶│   (Collection)   │
│                  │  Flow   │                  │
│  Menu Nodes      │  Entry  │  Steps           │
│  Info Nodes      │  Node   │  Input gathering │
│  Action Nodes    │         │  Request output  │
└──────────────────┘         └──────────────────┘
```

- **Only connection between the two systems:** Flow Entry Node (or functionally equivalent Info Node action button)
- They share NO execution logic
- A customer is in EITHER menu context OR flow context at any given moment, never both
- When a flow completes (request created), the session returns to menu context (the node from which the flow was entered, or the main menu)

---

## 7. CUSTOMER MODEL

| Attribute | Value |
|---|---|
| Identity | Phone number ONLY |
| Accounts | None |
| Authentication | None |
| Profiles | None in MVP |
| Record persistence | Phone number is stored on Requests; no standalone customer entity required |

---

## 8. SESSION MODEL

### Session Key

`phone_number` + `business_id` (composite unique identifier)

### Session State Fields

| Field | Type | Description |
|---|---|---|
| `phone_number` | string | Customer's WhatsApp number |
| `business_id` | reference | Tenant identifier |
| `current_menu_node_id` | reference | Current position in menu tree |
| `current_flow_id` | reference, nullable | Active flow (null if in menu context) |
| `current_flow_step` | integer, nullable | Current step position within active flow |
| `mode` | enum | `automated` or `human_takeover` |
| `last_activity` | timestamp | Last message/interaction time |
| `flow_data` | object, nullable | Partially collected flow responses |

### Session Timeout

- **Threshold:** 30 minutes of inactivity
- **Behavior:** Session resets completely. Next message presents main menu.
- **Applies to:** Both automated and human_takeover modes

### Context Transitions

| From | To | Trigger |
|---|---|---|
| Menu context | Flow context | Customer selects Flow Entry Node or flow-linked Info Node button |
| Flow context | Menu context | Flow completes (request created) |
| Flow context | Menu context | Session timeout and reset |
| Automated mode | Human takeover mode | Business owner activates takeover |
| Human takeover mode | Automated mode | Business owner deactivates takeover (session resets to main menu) |

---

## 9. HUMAN TAKEOVER RULES

| Rule | Value |
|---|---|
| Scope | Per conversation (phone_number + business_id) |
| Modes | Mutually exclusive: `automated` XOR `human_takeover` |
| Activation | Business owner triggers takeover |
| Effect | ALL automation stops. System does not process incoming messages. Messages are routed to business owner. |
| Deactivation | Business owner can return conversation to `automated` mode |
| On return to automated | Session resets to main menu |

---

## 10. REQUEST MODEL

### Created by

Exactly ONE request per completed flow execution.

### Request Fields

| Field | Type | Required |
|---|---|---|
| `id` | unique identifier | Yes |
| `business_id` | reference | Yes |
| `source_flow_id` | reference (to Flow) | Yes |
| `entered_from_node_id` | reference (to MenuNode) | Yes |
| `phone_number` | string | Yes |
| `service` | reference/string | Yes |
| `date` | date | Yes |
| `time` | time | Yes |
| `notes` | text | No |
| `status` | enum | Yes (default: `pending`) |
| `created_at` | timestamp | Yes |
| `assigned_to_id` | reference (to Assignee), nullable | No |
| `assignment_rule_id` | reference (to AssignmentRule), nullable | No |
| `assigned_at` | timestamp, nullable | No |

**`source_flow_id`** — Identifies which Flow generated this request. Required for traceability, debugging, and future analytics/reporting.

**`entered_from_node_id`** — Identifies the exact MenuNode (Flow Entry Node or Info Node with flow-triggering button) from which the customer entered the flow. Enables full Menu → Flow → Request traceability, debugging, and advanced analytics.

### Request Lifecycle (FINAL — 5 statuses)

```
                    ┌──────────┐
     ┌─────────────▶│ approved │──────────────┐
     │              └──────────┘              │
     │                                        ▼
┌─────────┐                             ┌───────────┐
│ pending │                             │ completed │
└─────────┘                             └───────────┘
     │                                        ▲
     ├─────────────▶┌──────────┐              │
     │              │ rejected │              │
     │              └──────────┘              │
     │                                        │
     └─────────────▶┌─────────────────┐       │
                    │ manual_followup │───────┘
                    └─────────────────┘
```

**Status transition rules:**

| From | Allowed To |
|---|---|
| `pending` | `approved`, `rejected`, `manual_followup` |
| `approved` | `completed` |
| `rejected` | (terminal) |
| `manual_followup` | `approved`, `rejected`, `completed` |
| `completed` | (terminal) |

### Multiple Requests

- A customer CAN have multiple requests simultaneously
- Each request is fully independent
- No cross-request logic

---

## 10.1 REQUEST ASSIGNMENT & ROUTING LAYER

### Architecture Rule

Assignment is an **optional layer** that runs AFTER request creation. The pipeline is:

```
Menu → Flow → Request → Assignment → Notification
```

Assignment must NEVER modify the Menu system, Flow system, or Request lifecycle. It is strictly a post-creation routing mechanism.

### Assignee Entity

An assignee represents a person within a business who can be assigned to handle requests.

| Field | Type | Required |
|---|---|---|
| `id` | unique identifier | Yes |
| `business_id` | reference | Yes |
| `name` | string | Yes |
| `phone_number` | string | Yes |
| `label` | string (e.g., "Sales - Prado", "Nail Specialist") | No |
| `status` | enum: `active`, `inactive` | Yes (default: `active`) |
| `created_at` | timestamp | Yes |
| `updated_at` | timestamp | Yes |

- Assignees are tenant-scoped (each assignee belongs to exactly one business)
- Only `active` assignees may be targeted by assignment rules
- Assignment to an `inactive` assignee is NOT allowed — if a matched assignee is inactive at evaluation time, the request remains unassigned
- An assignee is NOT a user account — assignees do not log into the system in MVP
- CRUD operations for assignees are managed by the business owner via the business panel

### Assignment Rule Entity

An assignment rule defines an automatic mapping from a trigger condition to an assignee.

| Field | Type | Required |
|---|---|---|
| `id` | unique identifier | Yes |
| `business_id` | reference | Yes |
| `trigger_type` | enum: `menu_node`, `service`, `flow` | Yes |
| `trigger_id` | reference (to MenuNode, Service, or Flow depending on trigger_type) | Yes |
| `assigned_to_id` | reference (to Assignee) | Yes |
| `priority` | integer | Yes |
| `is_active` | boolean | Yes (default: `true`) |
| `created_at` | timestamp | Yes |
| `updated_at` | timestamp | Yes |

- Assignment rules are tenant-scoped
- `trigger_type` + `trigger_id` define WHAT triggers the rule
- `assigned_to_id` defines WHO gets assigned
- `priority` defines rule precedence — higher numeric value wins when multiple rules match
- Only `is_active` rules are evaluated
- A business may have zero rules (assignment is fully optional)

### Trigger Types

| Trigger Type | Evaluates Against | Example |
|---|---|---|
| `menu_node` | `entered_from_node_id` on the Request | "Any request entering from the 'Nails' menu node → assign to Sarah" |
| `service` | `service` field on the Request | "Any request for 'Manicure' service → assign to Sarah" |
| `flow` | `source_flow_id` on the Request | "Any request from the 'Booking Flow' → assign to Reception" |

### Routing Evaluation Logic

1. A request is created (status = `pending`) — this is the existing lifecycle, unchanged
2. The system checks if any `is_active` assignment rules exist for the business
3. The system evaluates all active rules against the request:
   - `menu_node` rules match against `entered_from_node_id`
   - `service` rules match against `service`
   - `flow` rules match against `source_flow_id`
4. **If exactly ONE rule matches:**
   - Assign the request to that rule's assignee
5. **If MULTIPLE rules match:**
   - The rule with the **highest `priority` value** wins
6. **If multiple matching rules share the same highest priority:**
   - The system must NOT guess — request remains **unassigned**
7. **If NO rule matches:**
   - Request remains unassigned (`assigned_to_id` = null)
   - The request proceeds normally — assignment is optional
8. **If the matched assignee is `inactive`:**
   - Request remains **unassigned** — inactive assignees must never receive assignments
9. If assignment succeeds:
   - `assigned_to_id` is set on the Request
   - `assignment_rule_id` is set on the Request
   - `assigned_at` is set to the current timestamp
10. Assignment NEVER changes the request status — the request is still `pending` after assignment

**This routing logic is deterministic. There must be zero ambiguity at runtime.**

### Priority Rules (LOCKED)

- Each assignment rule MUST have a numeric `priority` value
- Higher `priority` value wins when multiple rules match
- If two or more matching rules have equal `priority`, the system must NOT guess — request remains unassigned
- This prevents all runtime ambiguity

### Constraints

- Assignment evaluation happens exactly ONCE per request, at creation time
- Re-assignment is NOT supported in MVP (no manual reassign, no rule re-evaluation)
- Assignment does NOT affect the Request lifecycle (status transitions remain unchanged)
- The business owner can still act on all requests regardless of assignment (assignment is informational/routing, not access control)
- If the assigned assignee is deactivated after assignment, the historical assignment remains on the request (the `assigned_to_id` is preserved as a record)

---

## 11. NOTIFICATION RULES (MVP)

| Channel | Status |
|---|---|
| In-panel notification | **Required** — must be implemented |
| Email notification | **Optional** — implement only if low effort |
| WhatsApp to business owner | **Not required** in MVP |
| Push notifications | **Not required** in MVP |

**Trigger events for notifications:**

- New request created (status = `pending`)

### Notification Routing with Assignment

- If a request is **assigned** (has `assigned_to_id`):
  - The in-panel notification should indicate the assigned assignee
  - If email notifications are implemented, the email may optionally be sent to the assignee's contact info (future consideration — NOT required in MVP)
- If a request is **unassigned** (`assigned_to_id` = null):
  - Standard notification behavior (notify the business owner as before)
- Assignment does NOT replace business owner notifications — the business owner always receives notifications for all requests regardless of assignment

---

## 12. TEMPLATE RULES

| Rule | Value |
|---|---|
| Application | Once, during onboarding |
| Mechanism | Deep copy — all template data is duplicated into the business's own entities |
| Live link | None. After application, template and business data are fully independent |
| Reapply | NOT allowed in MVP |
| Sync | None |
| Customization | Full. Business can modify/delete any copied structure |

**What a template contains (copied on application):**

- Pre-built menu tree (nodes)
- Pre-built services
- Pre-built flows and their steps
- Pre-built info content

---

## 13. BUSINESS PANEL MODULES

| Module | Core Domain | Purpose |
|---|---|---|
| Onboarding Wizard | Business Setup | Step-by-step initial configuration + template application |
| Business Profile | Business Setup | View/edit business info |
| Services Manager | Business Setup | CRUD services |
| Menu Builder | Menu Navigation | Visual editor for menu tree and all node types; enforces WhatsApp UX constraints (max 10 children, max 4 depth, option rendering rules) at creation/edit/publish |
| Info Editor | Menu Navigation | Edit Info Node content (title, description, price, duration, action buttons); enforces max 3 buttons per Info Node |
| Flow Builder | Flow Execution | Define linear step sequences for data collection; enforces WhatsApp option limits (max 10 selectable options per step) at creation/edit/publish |
| Requests Panel | Request Management | List, review, approve, reject, follow up on requests; display assignment info (assigned assignee, rule matched) |
| Assignee Manager | Assignment & Routing | CRUD assignees (name, phone, label, active/inactive status) |
| Assignment Rule Builder | Assignment & Routing | CRUD assignment rules (trigger_type, trigger_id, assigned_to_id, priority, is_active); map Menu Nodes / Services / Flows to Assignees |
| Notifications Settings | Cross-cutting | Configure notification preferences |
| WhatsApp Connection | Integration | Link/manage business's WhatsApp number |

---

## 14. WHATSAPP UX & BUILDER CONSTRAINT RULES

All builder constraints below are derived from WhatsApp Business API interaction limitations. The business panel MUST enforce these rules at creation, edit, and publish time. The system must NOT rely solely on runtime failure handling.

### 14.1 Option Rendering Rules

| Option Count | WhatsApp Rendering | Applies To |
|---|---|---|
| 1–3 options | **Reply buttons** | Menu Node children, Flow step options |
| 4–10 options | **List message** | Menu Node children, Flow step options |
| >10 options | **NOT ALLOWED** — must be restructured | Menu Node children, Flow step options |

### 14.2 Menu Node Child Limit

- A Menu Node may have a **maximum of 10 direct children** in MVP
- This is a **HARD builder validation rule**
- If a business attempts to add an 11th child, the builder must block the action and prompt restructuring into subcategories

### 14.3 Main Menu Recommendation

- Main menu should contain **3–5 top-level options**
- This is **UX guidance only**, not a hard validation rule

### 14.4 Menu Depth Limit

- Architecture remains recursive (unlimited depth in data model)
- For MVP publishing: **maximum allowed menu depth = 4 levels**
- This is a **HARD builder validation rule** enforced at publish time
- A configuration exceeding 4 levels cannot be published until fixed

### 14.5 Info Node Button Limit

- Maximum **3 action buttons** per Info Node
- This aligns with WhatsApp's reply button limit
- This is a **HARD builder validation rule**

### 14.6 Flow Step Option Limit

- Any flow step presenting selectable options must follow the same rendering rules:
  - 1–3 options → reply buttons
  - 4–10 options → list message
  - >10 options → **NOT allowed**, must be restructured
- This is a **HARD builder validation rule**

### 14.7 Publish Blocking Rule

- If ANY part of a business configuration violates the constraints above, the menu and/or flow **cannot be published** until all violations are resolved
- The builder must clearly indicate which nodes/steps are in violation
- Validation runs on save AND on publish

### 14.8 Builder Validation Responsibility

- The **business panel** is the primary enforcement layer for all WhatsApp UX constraints
- Constraints must be checked at:
  - **Creation time** (prevent invalid structures from being built)
  - **Edit time** (prevent edits that would violate constraints)
  - **Publish time** (final gate before configuration goes live)
- Runtime message formatting assumes all published configurations are already valid

---

## 15. DATA RELATIONSHIPS

```
Platform
  └── has many → Business

Business
  ├── has one  → BusinessProfile
  ├── has many → Service
  ├── has one  → MenuTree root (one root MenuNode)
  ├── has many → Flow
  ├── has many → Request
  ├── has many → CustomerSession
  ├── has many → Assignee
  ├── has many → AssignmentRule
  └── has one  → WhatsAppConnection

MenuNode (recursive tree)
  ├── belongs to → Business
  ├── has → parent_id (nullable; null = root)
  ├── has many → children (MenuNodes)
  ├── has → node_type: { menu | info | flow_entry | action }
  │
  │   IF node_type = menu:
  │     └── must have ≥ 1 child
  │
  │   IF node_type = info:
  │     ├── has → InfoContent (title, description, price?, duration?)
  │     └── has many → ActionButtons
  │           └── each button has: label, behavior_type { trigger_flow | action }
  │               IF trigger_flow → references a Flow
  │               IF action → has action_type from Action Node enum
  │
  │   IF node_type = flow_entry:
  │     └── references → one Flow
  │
  │   IF node_type = action:
  │     └── has → action_type: { show_phone | show_location | open_link | go_back }
  │     └── has → action_config (e.g., URL for open_link)

Flow
  ├── belongs to → Business
  ├── has many → FlowStep (ordered)
  ├── has many → Request (via source_flow_id back-reference)
  └── referenced by → many MenuNodes / Info Node buttons

FlowStep
  ├── belongs to → Flow
  ├── has → step_type: { select_option | select_service | select_date |
  │                       select_time | text_input | confirmation | summary }
  ├── has → order (integer)
  └── has → configuration (JSON: labels, options, validation hints)

Request
  ├── belongs to → Business
  ├── references → Flow (via source_flow_id)
  ├── references → MenuNode (via entered_from_node_id)
  ├── references → Assignee (via assigned_to_id, nullable)
  ├── references → AssignmentRule (via assignment_rule_id, nullable)
  ├── has → phone_number
  ├── has → service, date, time, notes
  ├── has → status: { pending | approved | rejected | manual_followup | completed }
  ├── has → created_at
  └── has → assigned_at (nullable)

---

## OS Portability & Deployment Constraints

This section defines mandatory OS-agnostic and portability constraints. These rules apply to all phases and all code written for this system. This is a constraint layer — it does not change architecture, system behavior, or features.

### 1. OS-Agnostic Requirement

- The system must run on both Windows and Linux without any code changes
- No OS-specific logic is permitted anywhere in the codebase
- All code must be tested and functional on both operating systems

### 2. Environment-Driven Configuration

- All configuration values must come from `.env` files or environment variables
- No hardcoded credentials, ports, paths, hostnames, or connection strings
- Environment variables must be the single source for all deployment-specific values

### 3. Filesystem Neutrality

- All file path construction must use the Node.js `path` module (`path.join`, `path.resolve`)
- No hardcoded file paths (e.g., `C:\...` or `/var/...`)
- No OS-specific path separators (`\` or `/` literals in path strings)
- No assumptions about filesystem layout beyond the project root

### 4. Process Management Neutrality

- The application must be runnable with any of the following:
  - `node` (direct execution)
  - `pm2` (process manager)
  - `systemd` (Linux service manager)
- No dependency on a specific process manager in application code
- Process management is an operational concern, not an application concern

### 5. Database Portability

- All PostgreSQL usage must remain standard SQL and standard PostgreSQL features
- No OS-specific PostgreSQL extensions
- Database must support `pg_dump`/`pg_restore` across Windows and Linux environments
- Connection configuration must be fully environment-driven

### 6. Deployment Independence

- The system must be deployable on:
  - Windows VPS (current production environment)
  - Linux VPS (future migration target)
- Migration from Windows to Linux must require zero code changes
- Only environment variables and process management configuration may differ between deployments

### 7. Prohibited Practices

The following are explicitly forbidden in all code and configuration:

- Hardcoded Windows paths (e.g., `C:\Users\...`, `D:\app\...`)
- OS-specific shell commands in application code (e.g., `cmd /c`, `bash -c`)
- IIS-only assumptions or IIS-specific configuration in application logic
- Local-machine-only logic (e.g., `localhost`-only bindings without environment override)
- OS-specific line endings enforced in application logic
- Platform-conditional code branches (`process.platform` checks for business logic)

CustomerSession (runtime state)
  ├── keyed by → (phone_number, business_id)
  ├── has → current_menu_node_id
  ├── has → current_flow_id (nullable)
  ├── has → current_flow_step (nullable)
  ├── has → flow_data (nullable, partial responses)
  ├── has → mode: { automated | human_takeover }
  └── has → last_activity (timestamp)

Assignee
  ├── belongs to → Business
  ├── has → name, phone_number
  ├── has → label (nullable)
  ├── has → status: { active | inactive }
  ├── has → created_at, updated_at
  └── referenced by → Request (via assigned_to_id), AssignmentRule (via assigned_to_id)

AssignmentRule
  ├── belongs to → Business
  ├── has → trigger_type: { menu_node | service | flow }
  ├── has → trigger_id (references MenuNode, Service, or Flow depending on trigger_type)
  ├── has → assigned_to_id (references Assignee)
  ├── has → priority (integer)
  ├── has → is_active (boolean)
  ├── has → created_at, updated_at
  └── referenced by → Request (via assignment_rule_id)

Template (design-time only)
  ├── has → industry_type
  ├── contains → blueprint for menu tree, services, flows
  └── relationship to Business = one-time deep copy
```

---

## 16. ARCHITECTURE LAYER MAP

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLATFORM ADMIN LAYER                        │
│  (Platform Owner: manage tenants, plans, templates, system)     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    BUSINESS PANEL LAYER (Web)                   │
│  Onboarding │ Profile │ Services │ Menu Builder │ Flow Builder  │
│  Info Editor │ Requests Panel │ Assignee Manager │ Rule Builder  │
│  Notifications │ WhatsApp Conn.                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ configures
┌──────────────────────────────▼──────────────────────────────────┐
│                     APPLICATION CORE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Business     │  │ Menu         │  │ Flow Execution       │  │
│  │ Setup Core   │  │ Navigation   │  │ Core                 │  │
│  │              │  │ Core         │  │                      │  │
│  │ • Business   │  │ • Tree mgmt  │  │ • Flow definitions   │  │
│  │ • Services   │  │ • Node types │  │ • Step sequencing    │  │
│  │ • Templates  │  │ • Traversal  │  │ • Input collection   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐ │
│  │ Request Management   │  │ Session & State Management      │ │
│  │ Core                 │  │ (conversation tracking,         │ │
│  │ • Request storage    │  │  position in tree/flow,         │ │
│  │ • Lifecycle          │  │  human takeover flag)           │ │
│  │ • Decisions          │  │                                 │ │
│  │ • Assignment &       │  │                                 │ │
│  │   Routing Layer      │  │                                 │ │
│  └──────────────────────┘  └─────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │ sends/receives
┌──────────────────────────────▼──────────────────────────────────┐
│                   WHATSAPP INTEGRATION LAYER                    │
│  Message receiving │ Message formatting & sending │ Webhook     │
│  Human takeover routing │ Business number management            │
└─────────────────────────────────────────────────────────────────┘
                               │
                        [ WhatsApp / Meta API ]
                               │
                        [ End Customer Phone ]
```

---

## 17. DEPENDENCY GRAPH (BUILD ORDER)

```
Phase 1: Core Data & Structure
   └── Tenant model, Service entity, base schemas
          │
Phase 2: Business Setup
   └── BusinessProfile, Services CRUD, Template engine (copy)
          │
Phase 3: Menu System  ◄── depends on Services (Info Nodes display service data)
   └── MenuNode tree, all 4 node types, Info content, Action buttons
          │
Phase 4: Flow System  ◄── depends on Services + Menu (Flow Entry Nodes link flows to tree)
   └── Flow + FlowStep definitions, Flow Entry wiring
          │
Phase 5: Request Lifecycle  ◄── depends on Flow + Menu (source_flow_id, entered_from_node_id)
   └── Request entity, source_flow_id, entered_from_node_id, status transitions, business decisions
          │
Phase 5b: Assignment & Routing  ◄── depends on Request + Service + Menu + Flow (trigger references)
   └── Assignee entity, AssignmentRule entity (with priority), deterministic routing evaluation logic, assignment fields on Request
          │
Phase 6: Notifications  ◄── depends on Request + Assignment (triggers, routing)
   └── In-panel alerts, optional email
          │
Phase 7: WhatsApp Integration  ◄── depends on ALL above
   └── Session management, message rendering, state machine,
       menu traversal, flow execution, human takeover
          │
Phase 8: Testing & Refinement
   └── End-to-end validation
```

---

## 18. LOCKED ARCHITECTURE DECISIONS

These MUST NOT change:

- Multi-tenant architecture from day one
- Menu and Flow are separate systems; only bridge is Flow Entry Node
- Templates are data only — no runtime role, no live link
- Requests have independent lifecycle with full traceability (`source_flow_id` + `entered_from_node_id`)
- Human takeover is mandatory and mutually exclusive with automation
- WhatsApp is the delivery layer; all logic is server-side
- Builder enforces WhatsApp UX constraints at creation/edit/publish time (Section 14)
- Assignment is a post-creation routing layer only — pipeline: Menu → Flow → Request → Assignment → Notification
- Assignment must NEVER modify Menu, Flow, or Request lifecycle logic
- Implementation is phased; dependency graph is strictly followed

---

## 19. SYSTEM SUMMARY

This system is a **stateful, multi-tenant WhatsApp interaction platform** with:

- **4 node types** powering a recursive menu tree (navigation layer)
- **7 flow step types** powering linear data collection sequences (collection layer)
- **1 bridge** between the two systems (Flow Entry Node / equivalent button behavior)
- **5-status request lifecycle** with full business owner control and complete Menu → Flow → Request traceability via `source_flow_id` (originating flow) and `entered_from_node_id` (menu entry point)
- **Request Assignment & Routing Layer** — optional, priority-based post-creation routing to assignees (by menu node, service, or flow); deterministic evaluation with numeric priority (higher wins, equal priority = unassigned, inactive assignee = unassigned); evaluated once at request creation, never modifying the request lifecycle
- **Per-conversation session state** with 30-minute timeout
- **Exclusive-mode human takeover** that fully suspends automation
- **One-time template copy** for onboarding acceleration
- **Phone-number-only customer identity**
- **In-panel notifications** as the MVP alert channel, with assignment-aware routing
- **WhatsApp UX constraint layer** enforced by the builder: max 10 children per Menu Node, max 4-level depth, max 3 buttons per Info Node, max 10 selectable options per flow step, publish-blocking validation

All ambiguities are resolved. All decisions are locked. Builder constraints are based on WhatsApp interaction limitations. The system is logically consistent and ready for Phase 1 implementation.

---

**THIS DOCUMENT IS FINAL v4 — SINGLE SOURCE OF TRUTH — NON-EXTENSIBLE WITHOUT NEW PHASE. ALL DEVELOPMENT MUST ALIGN WITH THIS BLUEPRINT. NO DEVIATIONS ARE ALLOWED.**
