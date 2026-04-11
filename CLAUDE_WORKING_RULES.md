# CLAUDE WORKING RULES

### Project: MVPWhatsapp

### Date: April 11, 2026

### Purpose: Define strict, non-negotiable rules for how Claude must operate when working on this project. These rules apply to every interaction, every file, and every decision.

---

## 1. GENERAL BEHAVIOR RULES

### 1.1 Do Not Redesign

- Do NOT redesign any part of the system
- Do NOT propose alternative architectures
- Do NOT suggest "better" approaches that deviate from the blueprint
- The system design is FINAL — your role is to implement it, not improve it

### 1.2 Do Not Overengineer

- Do NOT add abstractions that are not required by the current phase
- Do NOT build "future-proof" patterns unless explicitly instructed
- Do NOT add features, fields, or modules that are not defined in the blueprint
- Do NOT create utility functions, helper classes, or base classes unless they serve a specific, immediate need
- If a simple, direct implementation satisfies the requirement, use it

### 1.3 Do Not Overwrite Existing Logic

- Do NOT modify working code from a previous phase unless explicitly instructed
- Do NOT refactor code that is functioning correctly
- Do NOT rename established interfaces, endpoints, or data structures
- If an existing pattern was established in a prior phase, follow it — do not replace it with your own preference

### 1.4 Do Not Assume

- Do NOT assume requirements that are not explicitly stated in the documents
- Do NOT infer features from the problem domain (e.g., "a salon would also need X")
- If a requirement is unclear, ask — do not guess
- If a document is silent on a topic, treat that topic as out of scope

---

## 2. ARCHITECTURE RULES

### 2.1 Menu / Flow Separation

- The Menu system handles NAVIGATION ONLY
- The Flow system handles DATA COLLECTION ONLY
- These systems must NEVER share execution logic
- The only connection is the Flow Entry Node — do not create additional bridges
- Do NOT place flow logic inside menu navigation handlers
- Do NOT place menu rendering inside flow execution handlers

### 2.2 State Machine Design

- The customer session is a state machine with defined contexts (menu, flow) and modes (automated, human_takeover)
- State transitions must follow the defined rules exactly
- Do NOT create ad-hoc state management outside the session model
- Do NOT bypass the state machine with direct manipulation

### 2.3 Multi-Tenancy

- EVERY database query must be scoped to the relevant tenant (business_id)
- EVERY API endpoint must enforce tenant isolation
- There are NO exceptions — no "admin shortcut" queries without tenant filters
- When writing any data access code, the FIRST thing you verify is tenant scoping

### 2.4 Request Lifecycle

- Requests follow exactly 5 statuses: pending, approved, rejected, manual_followup, completed
- Status transitions must follow the defined transition table exactly
- Do NOT add intermediate statuses, temporary flags, or soft-delete patterns
- Do NOT allow transitions that are not explicitly defined

### 2.5 Assignment Layer Isolation

- Assignment is a POST-CREATION layer only — pipeline: Menu → Flow → Request → Assignment → Notification
- Assignment logic must NEVER modify Menu traversal, Flow execution, or Request lifecycle (status transitions)
- Assignment must run AFTER request creation and BEFORE notification dispatch
- Assignment is optional — a request with no matching rule is valid and must proceed normally
- Routing must be DETERMINISTIC — highest `priority` value wins, equal priority = unassigned, inactive assignee = unassigned. No randomness, no fallback heuristics, no trigger-type ordering.
- Do NOT add access control based on assignment — assignment is routing/informational only
- Do NOT implement re-assignment or manual assignment override in MVP
- Do NOT add assignment evaluation at any point other than request creation time

### 2.6 WhatsApp as Delivery Layer

- ALL business logic resides server-side in the main application
- WhatsApp is ONLY the message transport layer
- Do NOT put business logic in WhatsApp message handlers
- Do NOT put business logic in n8n workflows (if n8n is used)
- Message formatting is the ONLY WhatsApp-specific logic

---

## 3. DEVELOPMENT RULES

### 3.1 Phase-by-Phase Execution

- Work on ONE phase at a time
- Complete the current phase before starting the next
- Do NOT implement features from a future phase
- Do NOT skip ahead because something "would be easy to add now"

### 3.2 No Cross-Phase Implementation

- Phase 3 (Menu) must NOT include Flow execution logic (Phase 4)
- Phase 4 (Flow) must NOT include Request lifecycle logic (Phase 5)
- Phase 5 (Request) must NOT include Assignment routing logic (Phase 5b)
- Phase 5b (Assignment) must NOT include Notification dispatch (Phase 6)
- Phase 7 (WhatsApp) builds on Phases 1–6 — it does NOT modify them
- If you need a placeholder for a future phase's interface, use the simplest possible stub

### 3.3 Always Refer to the Blueprint

- Before implementing any module, re-read the relevant section of MASTER_SYSTEM_BLUEPRINT.md
- Before implementing any requirement, verify it against FUNCTIONAL_REQUIREMENTS.md
- Before making any design choice, check it against NON_FUNCTIONAL_REQUIREMENTS.md
- If any conflict exists between your understanding and the documents, the documents win

### 3.4 Dependency Graph Compliance

- Follow the locked phase dependency graph strictly:
  - Phase 1: Core Data & Structure
  - Phase 2: Business Setup
  - Phase 3: Menu System
  - Phase 4: Flow System
  - Phase 5: Request Lifecycle
  - Phase 5b: Assignment & Routing
  - Phase 6: Notifications
  - Phase 7: WhatsApp Integration
  - Phase 8: Testing & Refinement
- Do NOT reorder phases
- Do NOT merge phases

---

## 4. CODE RULES

### 4.1 Clarity Over Complexity

- Write code that is immediately readable without specialized knowledge
- Prefer explicit logic over clever shortcuts
- Prefer verbose-but-clear over compact-but-cryptic
- Name variables, functions, and files descriptively

### 4.2 Modular Structure

- Organize code by domain module: business, service, menu, flow, request, assignment, session, notification, whatsapp
- Each module must have clear boundaries
- Cross-module dependencies must flow in one direction (downstream in the phase graph)
- No circular dependencies between modules

### 4.3 No Unnecessary Abstractions

- Do NOT create base classes unless multiple concrete classes actually exist
- Do NOT create factory patterns for single implementations
- Do NOT create generic frameworks for specific problems
- Do NOT create "plugin" architectures
- If there is only one implementation, write it directly

### 4.4 Consistent Patterns

- Once a pattern is established (e.g., how an API endpoint is structured, how validation is done), follow it consistently across all modules
- Do NOT introduce a new pattern to solve the same category of problem a prior pattern already handles
- If a pattern needs to change, it should change everywhere or not at all

### 4.5 Error Handling

- Handle errors at system boundaries (API endpoints, webhook handlers, database operations)
- Do NOT add defensive error handling inside internal functions that receive trusted data
- Log errors with context (business_id, phone_number, module, operation)
- Never swallow errors silently

---

## 5. VALIDATION RULES

### 5.1 WhatsApp Constraint Enforcement

- The builder (business panel) must enforce all WhatsApp UX constraints
- Validation must occur at creation, edit, and publish time
- Invalid configurations must be blocked with clear error messages
- Constraint rules:
  - Menu Node: maximum 10 children
  - Menu depth: maximum 4 levels (publish-time validation)
  - Info Node: maximum 3 action buttons
  - Flow step options: maximum 10 selectable options
  - Options >10: must be restructured — never allowed

### 5.2 Server-Side Validation

- ALL validation rules must be enforced server-side, regardless of whether client-side validation exists
- Client-side validation is a UX convenience — server-side is the enforcement layer
- No API endpoint may accept data that violates defined constraints

### 5.3 Publish Blocking

- The publish operation must run a complete validation pass
- If ANY violation exists, publish must be blocked
- Violations must be clearly reported (which node/step, what rule, what limit)

---

## 6. CHANGE CONTROL

### 6.1 No Autonomous Changes

- Do NOT change architecture, data models, or system behavior without explicit instruction from the user
- Do NOT add fields to existing models
- Do NOT modify status enums
- Do NOT add new node types
- Do NOT change the phase order

### 6.2 Scope of Permitted Work

- You may ONLY work on what is explicitly requested
- If a task requires changes outside its scope, report the dependency — do not make the change
- If you discover an inconsistency in the documents, report it — do not "fix" it

### 6.3 Document Hierarchy

When in doubt, the following precedence applies:

1. **MASTER_SYSTEM_BLUEPRINT.md** — ultimate source of truth
2. **FUNCTIONAL_REQUIREMENTS.md** — what the system must do
3. **NON_FUNCTIONAL_REQUIREMENTS.md** — how the system must behave
4. **TECHNICAL_DECISION_INPUTS.md** — constraints for tech choices
5. **OPEN_DECISIONS.md** — what is not yet decided
6. **This document** — how Claude must work

No document lower in this list may override one higher in the list.

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

**These rules are non-negotiable and apply to every interaction on this project.**
