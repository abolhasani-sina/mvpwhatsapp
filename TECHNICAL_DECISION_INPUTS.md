# TECHNICAL DECISION INPUTS

### Source: MASTER_SYSTEM_BLUEPRINT.md (FINAL v4)

### Date: April 11, 2026

### Purpose: Provide structured context for technology stack decisions. This document does NOT propose solutions — it defines the characteristics, constraints, and unknowns that must inform those decisions.

---

## 1. CURRENT ENVIRONMENT

| Factor | Current State |
|---|---|
| **Server** | Windows VPS |
| **Development IDE** | VS Code |
| **AI Assistance** | GitHub Copilot + Claude |
| **Project Owner** | Non-programmer — requires maintainable, well-structured, and well-documented codebase |
| **Team Size** | Solo development assisted by AI tools |
| **Deployment** | Self-hosted on VPS (current expectation) |

### Implications

- Technology choices must favor simplicity and long-term maintainability over raw power or cutting-edge features
- The codebase must be structured clearly enough for AI tools to assist effectively
- Windows compatibility must be confirmed for all chosen tools
- Debug and development workflows must work within VS Code

---

## 2. CONSTRAINTS

### Architectural Constraints (from Blueprint)

| Constraint | Source |
|---|---|
| Multi-tenant architecture from day one | Locked Architecture Decision |
| Menu system and Flow system must be separate | Locked Architecture Decision |
| Templates are data only — no runtime role | Locked Architecture Decision |
| Requests have independent lifecycle | Locked Architecture Decision |
| Human takeover is mandatory | Locked Architecture Decision |
| WhatsApp is the delivery layer; all logic is server-side | Locked Architecture Decision |
| Builder enforces WhatsApp UX constraints at creation/edit/publish time | Locked Architecture Decision |
| Implementation must be phased per dependency graph | Locked Architecture Decision |

### Development Constraints

| Constraint | Rationale |
|---|---|
| Must be maintainable by a non-programmer with AI assistance | Project owner profile |
| Must support phased, incremental development | Blueprint requires 8 implementation phases |
| Must prevent architecture drift | Locked decisions must remain enforceable as system grows |
| Must run on a Windows VPS | Current hosting environment |
| Must support structured, testable code | System has complex state management and validation rules |

### WhatsApp Constraints (MVP)

| Constraint | Rule |
|---|---|
| Maximum selectable options per interaction | 10 (list message); 3 (reply buttons) |
| Maximum menu depth for publish | 4 levels |
| Maximum children per Menu Node | 10 |
| Maximum action buttons per Info Node | 3 |
| Maximum selectable options per flow step | 10 |
| Builder must validate at creation, edit, and publish time | Hard requirement |
| Publish must be blocked if any violation exists | Hard requirement |

---

## 3. UNKNOWNS — UNRESOLVED TECHNICAL DECISIONS

The following decisions are NOT resolved by the blueprint and must be made before implementation begins.

### 3.1 Backend Framework

| Question | What framework will power the API, business logic, and data layer? |
|---|---|
| **Consideration** | Must support multi-tenancy, stateful session management, recursive tree operations, webhook handling |
| **Consideration** | Must be maintainable by non-programmer + AI |
| **Consideration** | Must run on Windows VPS |
| **Options to evaluate** | Node.js (Express/Fastify/NestJS), PHP (Laravel), Python (Django/FastAPI), others |
| **Decision needed before** | Phase 1 |

### 3.2 Database

| Question | What database will store all system data? |
|---|---|
| **Consideration** | Must support relational data (businesses, services, requests, flows) |
| **Consideration** | Must support recursive tree structures (menu nodes with self-referencing parent-child) |
| **Consideration** | Must support JSON/object fields (flow step configurations, flow session data) |
| **Consideration** | Must support multi-tenant data isolation |
| **Options to evaluate** | PostgreSQL, MySQL/MariaDB, SQLite (development only), others |
| **Decision needed before** | Phase 1 |

### 3.3 Frontend / Business Panel

| Question | What technology will power the business owner web panel? |
|---|---|
| **Consideration** | Must support: onboarding wizard, menu tree builder (visual), flow builder, request management panel, real-time notifications |
| **Consideration** | Must enforce WhatsApp UX constraints in the builder UI |
| **Consideration** | Must be maintainable |
| **Options to evaluate** | React, Vue, Svelte, server-rendered (Blade/EJS/Jinja), low-code panel builders, others |
| **Decision needed before** | Phase 2 |

### 3.4 WhatsApp Integration Strategy

| Question | How will the system connect to WhatsApp? |
|---|---|
| **Consideration** | Must use the business's own WhatsApp number |
| **Consideration** | Must support receiving and sending structured messages (buttons, lists) |
| **Consideration** | Must support human takeover (routing messages to business owner) |
| **Consideration** | Meta Business API has requirements: business verification, message templates, 24-hour session windows |
| **Options to evaluate** | Meta Cloud API (direct), third-party providers (360dialog, Twilio, WATI), unofficial APIs (not recommended) |
| **Future considerations** | Meta embedded signup, coexistence model |
| **Decision needed before** | Phase 7 (but should be investigated early to avoid rework) |

### 3.5 Role of n8n (or Similar Orchestration Tools)

| Question | Should n8n be used, and if so, for what? |
|---|---|
| **Consideration** | n8n could handle webhook routing, notification dispatch, or WhatsApp message formatting |
| **Consideration** | n8n must NOT contain core business logic (all logic must be server-side in the main application) |
| **Consideration** | Using n8n for logic would create architecture drift risk |
| **Options to evaluate** | Use n8n for orchestration/glue only, use n8n for notifications only, don't use n8n at all |
| **Decision needed before** | Phase 6 (notifications) or Phase 7 (WhatsApp integration) |

### 3.6 Hosting & Deployment

| Question | How will the application be deployed and maintained on the Windows VPS? |
|---|---|
| **Consideration** | Must support the chosen backend, database, and frontend |
| **Consideration** | Must handle process management (restart on crash, startup on boot) |
| **Consideration** | Must support HTTPS for webhook endpoints (WhatsApp requires HTTPS) |
| **Options to evaluate** | Docker, direct installation, PM2/supervisor for process management, nginx/IIS as reverse proxy |
| **Decision needed before** | Phase 1 (at least a basic setup) |

### 3.7 Authentication & Authorization

| Question | How will the business panel authenticate users? |
|---|---|
| **Consideration** | Platform Owner and Business Owner access the web panel |
| **Consideration** | End customers do NOT authenticate (phone number only) |
| **Consideration** | Multi-tenant: a business owner must only see their own data |
| **Options to evaluate** | JWT-based auth, session-based auth, OAuth, third-party auth providers |
| **Decision needed before** | Phase 2 |

---

## 4. SYSTEM CHARACTERISTICS

Based on the blueprint, the system being built has the following technical characteristics. These must inform all technology choices.

### 4.1 State Machine System

The core runtime is a conversation state machine. Each customer session moves between states:

- **Menu context** — navigating a recursive tree
- **Flow context** — progressing through a linear step sequence
- **Human takeover** — automation suspended

State transitions are triggered by customer messages and business owner actions. The system must reliably track, persist, and resume session state.

### 4.2 Multi-Tenant Platform

Every data entity (businesses, services, menus, flows, requests, sessions) is tenant-scoped. The entire system must enforce tenant isolation at the data layer. A missed tenant filter at any query point constitutes a data leak.

### 4.3 Recursive Tree Engine

The menu system is a recursive tree of arbitrary depth (constrained to 4 levels for MVP publishing). The data model must support self-referencing parent-child relationships. Queries must efficiently fetch subtrees and traverse paths.

### 4.4 Linear Flow Engine

The flow system is a simple, ordered step sequence. Each step collects one piece of input. The engine must track the current step, store partial data, and produce a request upon completion. No branching or conditional logic in MVP.

### 4.5 Request Lifecycle Manager

Requests follow a defined state machine (5 statuses, fixed transitions). The system must enforce valid transitions and prevent invalid ones. Status changes must be driven explicitly by business owner actions.

### 4.6 Assignment & Routing Engine

An optional post-creation layer evaluates rule-based assignment of requests to assignees. The engine must:

- Evaluate active assignment rules (by menu_node, service, or flow trigger) at request creation time
- Apply numeric priority-based resolution: highest `priority` wins; equal priority among matches = unassigned; inactive assignee = unassigned
- Deterministic routing with zero ambiguity — no randomness, no fallback heuristics
- Set assignment fields on the request without modifying request status or lifecycle
- Support a business having zero rules (fully optional)

### 4.7 Webhook-Driven Integration

The WhatsApp layer is webhook-based. The system must:

- Receive incoming webhooks (customer messages)
- Process them through the state machine
- Send outgoing API calls (structured responses)
- Handle human takeover routing

### 4.8 Validation-Heavy Builder

The business panel must enforce WhatsApp UX constraints at creation, edit, and publish time. This means both client-side and server-side validation. The validation rules are deterministic and well-defined.

---

## 5. TECHNICAL REQUIREMENTS SUMMARY

The technology stack must support a system that is:

| Characteristic | Requirement |
|---|---|
| **Stateful** | Persistent session management per customer per business |
| **Multi-tenant** | Full data isolation across businesses from day one |
| **Tree-capable** | Recursive data structures with efficient traversal |
| **Webhook-driven** | Receive and respond to WhatsApp API events |
| **Validation-rich** | Constraint enforcement in the builder UI and on the server |
| **Lifecycle-managed** | State machine for request statuses with enforced transitions |
| **Phased** | Must support incremental build-out across 8 phases |
| **Maintainable** | Clear structure, readable code, AI-assistable |
| **Windows-hosted** | Must run on a Windows VPS environment |
| **Single-deployable** | One application serving all tenants (not per-tenant deployment) |

---

## 6. BUILD ORDER REFERENCE

For context, the locked phase dependency graph from the blueprint:

| Phase | Focus | Depends On |
|---|---|---|
| Phase 1 | Core Data & Structure — tenant model, service entity, base schemas | — |
| Phase 2 | Business Setup — profile, services CRUD, template engine (copy) | Phase 1 |
| Phase 3 | Menu System — node tree, all 4 node types, info content, action buttons | Phase 2 |
| Phase 4 | Flow System — flow + step definitions, flow entry wiring | Phase 3 |
| Phase 5 | Request Lifecycle — request entity, status transitions, business decisions | Phase 4 |
| Phase 5b | Assignment & Routing — assignee entity, assignment rules, routing evaluation logic | Phase 5 |
| Phase 6 | Notifications — in-panel alerts, optional email, assignment-aware routing | Phase 5b |
| Phase 7 | WhatsApp Integration — session management, message rendering, state machine, human takeover | Phase 6 |
| Phase 8 | Testing & Refinement — end-to-end validation | Phase 7 |

**Critical note:** Technology stack decisions for backend, database, and hosting must be resolved before Phase 1 begins. Frontend decisions must be resolved before Phase 2. WhatsApp integration strategy should be investigated early (even if not implemented until Phase 7) to avoid rework.

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
- No hardcoded file paths (e.g., `C:\\...` or `/var/...`)
- No OS-specific path separators (`\\` or `/` literals in path strings)
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

- Hardcoded Windows paths (e.g., `C:\\Users\\...`, `D:\\app\\...`)
- OS-specific shell commands in application code (e.g., `cmd /c`, `bash -c`)
- IIS-only assumptions or IIS-specific configuration in application logic
- Local-machine-only logic (e.g., `localhost`-only bindings without environment override)
- OS-specific line endings enforced in application logic
- Platform-conditional code branches (`process.platform` checks for business logic)

---

**This document is derived from MASTER_SYSTEM_BLUEPRINT.md (FINAL v4) and must not be treated as a standalone source of truth. The blueprint takes precedence in all cases.**
