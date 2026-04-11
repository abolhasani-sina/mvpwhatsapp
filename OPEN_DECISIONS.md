# OPEN DECISIONS

### Source: MASTER_SYSTEM_BLUEPRINT.md (FINAL v4), TECHNICAL_DECISION_INPUTS.md

### Date: April 11, 2026

### Purpose: Catalogue every unresolved technical decision that must be made before or during implementation. This document defines the questions — not the answers.

---

## 1. BACKEND STACK

### Decision

What backend framework and runtime will power the API, business logic, state machine, and data layer?

### Why It Matters

The backend is the core of the system. It handles:

- Multi-tenant data access and business logic
- Recursive menu tree operations (CRUD, traversal, validation)
- Linear flow engine (step sequencing, input collection, request generation)
- Request lifecycle management (status transitions, enforcement)
- Session state machine (menu context, flow context, human takeover, timeout)
- Webhook reception and response formatting (WhatsApp integration)
- Builder constraint validation (WhatsApp UX rules)
- Template deep-copy engine

Every system capability depends on this choice. A poor fit here cascades through every phase.

### Constraints Affecting This Decision

- Must run on a Windows VPS
- Must support multi-tenancy at the data layer
- Must be maintainable by a non-programmer with AI assistance (Claude, Copilot)
- Must support phased, incremental development (8 phases)
- Must handle webhook-based integrations (receive and respond to HTTP callbacks)
- Must work well within VS Code
- Must support structured, testable code
- Code style must be AI-readable and AI-modifiable

### Decision Needed Before

Phase 1 — Core Data & Structure

---

## 2. DATABASE

### Decision

What database system will store all persistent data (businesses, services, menu trees, flows, flow steps, requests, sessions, templates)?

### Why It Matters

The database must support:

- Relational data with foreign keys and referential integrity (businesses → services, flows → steps, requests → flows)
- Self-referencing recursive structures (menu node parent-child tree)
- JSON or structured object fields (flow step configurations, partial flow session data)
- Multi-tenant data isolation (every query must be tenant-scoped)
- Atomic operations (template deep copy, request status transitions, tree modifications)
- Efficient lookups (session by phone_number + business_id, menu node traversal)

The data model is well-defined and relational. The choice affects every phase.

### Constraints Affecting This Decision

- Must run on a Windows VPS
- Must support relational model with foreign keys
- Must support self-referencing tables (recursive menu tree)
- Must support JSON/JSONB or equivalent flexible fields
- Must be manageable by a non-DBA (simple setup, standard tooling)
- Must have good VS Code and AI tooling support

### Decision Needed Before

Phase 1 — Core Data & Structure

---

## 3. FRONTEND PANEL

### Decision

What technology will power the business owner web panel (the builder, request management, onboarding wizard, configuration interfaces)?

### Why It Matters

The business panel is the primary interface for business owners. It must support:

- Onboarding wizard (multi-step form with template selection)
- Business profile editing
- Services CRUD
- Menu tree builder (visual tree editor with drag/reorder, node type selection, inline editing)
- Info editor (structured content editing with action button management)
- Flow builder (step sequence editor with configuration per step type)
- Request management panel (list, filter, review, approve/reject/follow-up)
- Real-time or near-real-time in-panel notifications
- WhatsApp UX constraint enforcement at creation/edit/publish time (validation feedback, publish blocking, violation indicators)

The menu tree builder and flow builder are the most complex UI components. They require interactive editing with live validation.

### Constraints Affecting This Decision

- Must be maintainable by a non-programmer with AI assistance
- Must enforce WhatsApp UX constraints in the UI (not just server-side)
- Must render interactive tree structures (menu builder)
- Must support form-based editing with validation (flow builder, info editor)
- Must support real-time notification display

### Decision Needed Before

Phase 2 — Business Setup

---

## 4. WHATSAPP INTEGRATION APPROACH

### Decision

How will the system connect to WhatsApp to send and receive messages?

### Why It Matters

WhatsApp is the customer-facing delivery layer. The integration must support:

- Receiving incoming messages via webhook (customer → system)
- Sending structured responses (system → customer) using WhatsApp message formats: reply buttons (1–3 options), list messages (4–10 options), text messages
- Using the business's own WhatsApp number (not a shared platform number)
- Human takeover routing (messages routed to the business owner when takeover is active)
- WhatsApp session window rules (Meta API requires message templates outside the 24-hour window)
- Webhook signature verification for security

The choice between Meta Cloud API (direct) and a third-party provider (360dialog, Twilio, WATI) significantly impacts development effort, cost, setup complexity, and feature availability.

### Constraints Affecting This Decision

- Must use the business's own WhatsApp number
- Must support structured message types (buttons, lists)
- Must support webhook-based message receiving
- Must support HTTPS for webhook endpoints
- Must run on a Windows VPS
- Meta API requires business verification (onboarding complexity)
- Future considerations: Meta embedded signup, coexistence model

### Decision Needed Before

Phase 7 — WhatsApp Integration (but should be investigated early to avoid rework in data model or API design)

---

## 5. n8n USAGE

### Decision

Should n8n (or a similar workflow orchestration tool) be used, and if so, for what specific purpose?

### Why It Matters

n8n could potentially simplify:

- Webhook routing (receiving WhatsApp webhooks and forwarding to the application)
- Notification dispatch (sending emails when a request is created)
- WhatsApp message formatting and sending

However, using n8n introduces a risk:

- If business logic leaks into n8n workflows, it creates architecture drift
- The locked architecture requires all logic to be server-side in the main application
- n8n adds operational complexity (another process to manage, another config to maintain)

The decision is whether the benefit (simplified integrations) outweighs the risk (complexity, drift) for an MVP maintained by a non-programmer.

### Constraints Affecting This Decision

- n8n must NOT contain core business logic (locked architecture decision)
- All business logic must reside in the main backend application
- If used, n8n must be limited to orchestration/glue roles only
- Must run on a Windows VPS alongside the main application
- Must not create a maintenance burden that outweighs its benefits

### Decision Needed Before

Phase 6 (notifications) or Phase 7 (WhatsApp integration)

---

## 6. HOSTING & DEPLOYMENT

### Decision

How will the application (backend, frontend, database) be deployed and maintained on the Windows VPS?

### Why It Matters

The deployment setup must support:

- Running the backend application continuously (process management)
- Serving the frontend panel to business owners
- Running the database server
- HTTPS for webhook endpoints (WhatsApp requires HTTPS callbacks)
- Automatic restart on crash or server reboot
- Simple deployment workflow (non-programmer must be able to deploy updates)

### Constraints Affecting This Decision

- Must run on a Windows VPS
- Must support HTTPS (required for WhatsApp webhooks)
- Must handle process management (no silent crashes)
- Must be operable by a non-programmer
- CI/CD pipeline is NOT required for MVP (manual deployment is acceptable)
- Containerization (Docker) is optional, not required
- Must support the chosen backend, database, and frontend technologies

### Decision Needed Before

Phase 1 — Core Data & Structure (at least a working local setup)

---

## 7. AUTHENTICATION SYSTEM

### Decision

How will the business panel authenticate Platform Owners and Business Owners?

### Why It Matters

Authentication is the gatekeeper for all business panel operations. It must:

- Verify the identity of users accessing the panel
- Distinguish between Platform Owner and Business Owner roles
- Enforce tenant isolation (a business owner must only access their own data)
- Reject unauthenticated requests to all panel API endpoints
- Be simple and reliable (MVP does not require advanced auth features)

End customers do NOT authenticate — they are identified by phone number only. This decision applies exclusively to the web panel.

### Constraints Affecting This Decision

- Must enforce multi-tenant data isolation (auth must carry tenant context)
- Must distinguish two roles: Platform Owner (system-wide) and Business Owner (tenant-scoped)
- Must be implementable by a non-programmer with AI assistance
- SSO, OAuth, and two-factor authentication are NOT required for MVP
- Must be compatible with the chosen backend framework

### Decision Needed Before

Phase 2 — Business Setup

---

## ASSIGNMENT & ROUTING OPEN DECISIONS

The following decisions are specific to the Request Assignment & Routing system (Phase 5b). They do not block earlier phases but must be resolved before Phase 5b implementation.

---

### 8. ASSIGNMENT RULE STORAGE APPROACH

#### Decision

How will assignment rules be stored and queried during routing evaluation?

#### Why It Matters

Assignment rules are evaluated on every request creation. The storage approach must support:

- Efficient querying of all active rules for a given business
- Matching by trigger_type + trigger_id against request fields
- Priority-based ordering for deterministic resolution
- Safe handling of is_active filtering and inactive assignee checks

#### Constraints Affecting This Decision

- Rules are tenant-scoped (always filtered by business_id)
- Rules reference entities from multiple tables (MenuNode, Service, Flow) via polymorphic trigger_type + trigger_id
- Must support efficient priority ordering
- Must integrate cleanly with the chosen database (Decision #2)

#### Decision Needed Before

Phase 5b — Assignment & Routing

---

### 9. ASSIGNMENT RULE EVALUATION STRATEGY

#### Decision

What is the exact implementation strategy for evaluating assignment rules at request creation time?

#### Why It Matters

The evaluation logic must be deterministic:

- Collect all matching active rules
- Resolve by highest priority
- Handle ties (equal priority = unassigned)
- Handle inactive assignee (= unassigned)
- Execute in a single pass per request creation (no re-evaluation)

The strategy affects whether this is implemented as a single database query, an in-memory evaluation, or a combination. It also affects how trigger_type polymorphism is resolved.

#### Constraints Affecting This Decision

- Must complete within < 500 ms (performance target)
- Must be deterministic — no randomness, no fallback heuristics
- Must handle the case where a business has zero rules (no-op, request remains unassigned)
- Must not modify request status
- Must run after request creation and before notification dispatch

#### Decision Needed Before

Phase 5b — Assignment & Routing

---

### 10. ASSIGNED NOTIFICATION DELIVERY STRATEGY

#### Decision

How should notifications behave differently when a request is assigned vs. unassigned?

#### Why It Matters

In MVP, in-panel notifications are required. The assignment layer adds context:

- Should assigned requests appear under the assignee's name in the panel?
- Should unassigned requests appear in a separate "unassigned" section?
- Is a dedicated assignee notification view needed, or is the existing request panel sufficient with assignment info columns?
- Future: if email-to-assignee is added, what triggers it?

This decision affects the notification module (Phase 6) and how it integrates with assignment data.

#### Constraints Affecting This Decision

- Must not expand MVP notification scope beyond in-panel (required) and email (optional)
- Must not introduce WhatsApp-to-assignee or push notifications in MVP
- Business owner must always receive notifications for all requests regardless of assignment
- External delivery to assignee phone number is NOT required in MVP

#### Decision Needed Before

Phase 6 — Notifications

---

### 11. ASSIGNEE-FACING UI MODEL

#### Decision

What UI does the business panel provide for viewing and managing assigned requests from the assignee perspective?

#### Why It Matters

The Requests Panel must display assignment information. The question is how deeply:

- Option A: Add assignment columns (assigned_to, rule matched) to the existing Requests Panel — minimal UI change
- Option B: Add a filterable assignee view within the Requests Panel — allows filtering requests by assignee
- Option C: Create a dedicated assignee dashboard — more complex, potentially out of MVP scope

This decision also determines whether the assignee context is visible only to the business owner, or whether a future assignee-facing interface is planned.

#### Constraints Affecting This Decision

- Must be simple UI compatible with non-programmer maintenance
- Must be tenant-scoped (all data scoped to business_id)
- Must be optional usage — businesses not using assignment must not see unnecessary UI
- Must be compatible with existing request management UI
- Assignees are NOT user accounts in MVP — no assignee login

#### Decision Needed Before

Phase 5b — Assignment & Routing (for data display) or Phase 6 — Notifications (for assignee-aware notifications)

---

## DECISION DEPENDENCY MAP

The following shows which decisions block which phases:

```
Phase 1: Core Data & Structure
   BLOCKED BY: Backend Stack, Database, Hosting (basic setup)

Phase 2: Business Setup
   BLOCKED BY: Frontend Panel, Authentication

Phase 3: Menu System
   (no new decisions — uses Phase 1+2 stack)

Phase 4: Flow System
   (no new decisions — uses Phase 1+2 stack)

Phase 5: Request Lifecycle
   (no new decisions — uses Phase 1+2 stack)

Phase 5b: Assignment & Routing
   (no new decisions — uses Phase 1+2 stack; Assignee, AssignmentRule entities, routing logic)

Phase 6: Notifications
   BLOCKED BY: n8n Usage (if considering n8n for email dispatch)

Phase 7: WhatsApp Integration
   BLOCKED BY: WhatsApp Integration Approach, n8n Usage (if considering n8n for webhooks)

Phase 8: Testing & Refinement
   (no new decisions)
```

**Minimum decisions required to start Phase 1: Backend Stack + Database + Hosting (basic).**

---

**This document is derived from MASTER_SYSTEM_BLUEPRINT.md (FINAL v4) and TECHNICAL_DECISION_INPUTS.md. No solutions are proposed here — only questions and constraints. These source documents take precedence in all cases.**
