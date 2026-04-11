# NON-FUNCTIONAL REQUIREMENTS

### Source: MASTER_SYSTEM_BLUEPRINT.md (FINAL v4), TECHNICAL_DECISION_INPUTS.md

### Date: April 11, 2026

---

## 1. ARCHITECTURE CONSTRAINTS

These constraints are locked by the blueprint and must be satisfied by every part of the system at all times.

### 1.1 Multi-Tenancy

- The system must be multi-tenant from day one
- Every data entity (business, service, menu node, flow, flow step, request, session, assignee, assignment rule) must be scoped to a single tenant
- Every data query must include tenant filtering — there are no cross-tenant operations
- A single deployment must serve all tenants; per-tenant deployments are not permitted
- Tenant isolation must be enforced at the data layer, not only at the application layer

### 1.2 Menu / Flow Separation

- The Menu system (navigation) and the Flow system (data collection) must be architecturally separate
- They must share no execution logic
- The only connection between them is the Flow Entry Node (or equivalent Info Node action button)
- No module, service, or function may mix menu traversal logic with flow step logic

### 1.3 Request Lifecycle Independence

- Requests must have their own independent lifecycle (5 statuses, fixed transitions)
- Request status management must not depend on the menu system or flow system at runtime
- Once a request is created, it is a standalone entity governed only by its lifecycle rules

### 1.4 Assignment Layer Independence

- The assignment & routing layer must operate strictly AFTER request creation
- Pipeline order must be: Menu → Flow → Request → Assignment → Notification
- Assignment must never modify the Menu system, Flow system, or Request lifecycle (status transitions)
- Assignment is an optional, informational routing mechanism — not an access control layer
- The business owner retains full control over all requests regardless of assignment
- Routing logic must be **deterministic** — zero ambiguity at runtime:
  - Higher numeric `priority` wins when multiple rules match
  - Equal priority among matching rules = request remains unassigned
  - Inactive assignee = request remains unassigned
  - No randomness, no guessing, no fallback heuristics

### 1.5 Human Takeover

- The system must support human takeover as a mandatory capability
- Every conversation must be able to transition from automated mode to human takeover mode
- The two modes must be mutually exclusive at all times — a conversation is never in both modes
- The system must not be deployable or considered complete without human takeover support

---

## 2. PERFORMANCE REQUIREMENTS (MVP)

These are MVP-level expectations. The system does not need to handle high-scale traffic at launch, but it must be responsive and reliable for the expected load.

### 2.1 Response Time

| Scenario | Target |
|---|---|
| WhatsApp webhook received → response sent | < 3 seconds |
| Business panel page load | < 2 seconds |
| Menu builder save operation | < 1 second |
| Request status update (approve/reject) | < 1 second |
| Assignment rule evaluation (per request creation) | < 500 ms |

### 2.2 Throughput (MVP)

- The system must handle a small number of concurrent businesses (single-digit to low tens for MVP)
- The system must handle multiple concurrent customer conversations per business without blocking
- Webhook processing must not be single-threaded to the point where one slow response blocks others

### 2.3 Session Handling

- Session state must be reliably persisted between customer messages
- Session lookup (by phone_number + business_id) must be fast and consistent
- Session timeout (30 minutes) must be enforced accurately — not approximately
- Partially collected flow data must survive between messages without loss

---

## 3. SCALABILITY

The MVP is not expected to handle large-scale traffic. However, architectural choices must not prevent future scaling.

### 3.1 Design Principles

- The data model must support growth in number of tenants without schema changes
- The session management approach must be separable from the application server (e.g., could move to external store later)
- The webhook processing pipeline must be structured so it could be parallelized or queued in the future
- The assignment rule evaluation must remain efficient as the number of rules per business grows (query by business_id + is_active, filter by trigger match)
- No hardcoded single-tenant assumptions anywhere in the codebase

### 3.2 What Is NOT Required for MVP

- Horizontal scaling (multiple application instances)
- Load balancing
- Database sharding
- CDN or edge caching
- Rate limiting (beyond WhatsApp's own limits)

---

## 4. MAINTAINABILITY

Given the project owner is a non-programmer relying on AI-assisted development, maintainability is a critical quality attribute.

### 4.1 Code Structure

- Codebase must follow a clear, predictable folder and file structure
- Modules must be organized by domain (business setup, menu, flow, request, assignment, session, whatsapp)
- Each module must have clear boundaries — no tangled cross-module dependencies
- File naming and organization must be self-documenting

### 4.2 AI-Assisted Development Compatibility

- Code must be written in a straightforward style that AI tools (Claude, Copilot) can read, understand, and modify
- Avoid deeply nested abstractions, metaprogramming, or "magic" patterns that obscure intent
- Prefer explicit over implicit — make data flow and control flow visible
- Each function/method should have a single, clear responsibility

### 4.3 Documentation

- Key architectural decisions must be documented (this document set fulfills that requirement)
- Complex business rules (e.g., status transitions, validation rules) should be expressed declaratively where possible (e.g., as configuration or lookup tables, not buried in nested if-else chains)
- No inline documentation is required for self-evident code, but non-obvious logic must be commented

### 4.4 Phased Development Support

- The codebase must be structured so that each phase can be developed, tested, and deployed incrementally
- Phase N must not require tearing apart Phase N-1 code
- Interfaces between phases should be stable — later phases add on top, not refactor underneath

---

## 5. RELIABILITY

### 5.1 Webhook Handling

- Incoming WhatsApp webhooks must be processed reliably — messages must not be silently dropped
- If webhook processing fails, the failure must be logged
- The system must respond to webhook verification challenges correctly (WhatsApp requires this)
- Duplicate webhook deliveries (WhatsApp may retry) must be handled gracefully (idempotent processing or deduplication)

### 5.2 State Persistence

- Customer session state must be persisted to durable storage (not in-memory only)
- A server restart must not lose active session state
- Partially completed flow data must survive server restarts
- Request data must never be lost after creation

### 5.3 Data Integrity

- Request status transitions must be atomic — a request must never be in an undefined or intermediate state
- Menu tree operations (add/remove/reorder nodes) must maintain tree integrity (no orphaned nodes, no broken parent references)
- Template application (deep copy) must be atomic — partial copies that leave the business in an inconsistent state must not occur

### 5.4 Error Handling

- Errors during webhook processing must not crash the application
- Errors must be logged with sufficient context for debugging (business_id, phone_number, session state, error details)
- The system must return graceful error messages to customers when possible (e.g., "Something went wrong, please try again") rather than silence

---

## 6. SECURITY (MVP)

MVP-level security requirements. The system must not have obvious vulnerabilities, but enterprise-grade security hardening is not in scope.

### 6.1 Tenant Isolation

- A business owner must only be able to access their own data
- API endpoints must enforce tenant scoping — no endpoint may return data from another tenant
- Direct object references (e.g., request IDs, node IDs) must be validated for tenant ownership before any operation

### 6.2 Authentication

- The business panel must require authentication for access
- Unauthenticated requests to panel APIs must be rejected
- End customers do NOT authenticate — they are identified by phone number only

### 6.3 Input Validation

- All user input from the business panel (menu builder, flow builder, profile editing) must be validated server-side
- WhatsApp webhook payloads must be validated for expected structure before processing
- Webhook signature verification must be implemented if supported by the chosen WhatsApp provider

### 6.4 Data Protection

- Phone numbers and business data must be stored securely
- Database credentials and API keys must not be hardcoded in source code
- Secrets must be managed via environment variables or a secure configuration mechanism

### 6.5 What Is NOT Required for MVP

- OAuth / SSO integration
- Two-factor authentication
- Audit logging beyond basic error logs
- Data encryption at rest (beyond database defaults)
- Penetration testing

---

## 7. WHATSAPP UX CONSTRAINTS

These are non-functional in the sense that they define constraints on the builder's output, not features of the builder itself. The system must guarantee that no published configuration can violate WhatsApp interaction limits.

### 7.1 Constraint Enforcement Guarantee

- It must be impossible for a business to publish a configuration that violates any WhatsApp constraint
- Validation must occur at creation, edit, and publish time
- Publish must be blocked and violations must be clearly reported

### 7.2 Constraint Boundaries

| Constraint | Limit | Enforcement |
|---|---|---|
| Options rendering (reply buttons) | 1–3 options | Automatic format selection |
| Options rendering (list message) | 4–10 options | Automatic format selection |
| Options overflow | >10 options | Blocked — must restructure |
| Menu Node children | Maximum 10 | Hard builder validation |
| Menu tree depth | Maximum 4 levels | Hard builder validation at publish |
| Info Node action buttons | Maximum 3 | Hard builder validation |
| Flow step selectable options | Maximum 10 | Hard builder validation |

### 7.3 Runtime Assumption

- The WhatsApp message formatting layer may assume all published configurations are valid
- Runtime re-validation of constraints is NOT required (validation is a builder responsibility)
- If an invalid configuration somehow reaches runtime, the system should log an error but not crash

---

## 8. DEPLOYMENT CONSTRAINTS

### 8.1 Environment

- The system must run on a Windows VPS
- All chosen technologies (backend runtime, database, reverse proxy) must be Windows-compatible
- The system must be deployable as a single instance (single server) for MVP

### 8.2 Process Management

- The application must be restartable without data loss
- The application should start automatically on server boot (or be easily configured to do so)
- Crashes must not leave the system in an unrecoverable state

### 8.3 HTTPS

- The system must support HTTPS for webhook endpoints (WhatsApp API requires HTTPS callbacks)
- The business panel should be served over HTTPS

### 8.4 What Is NOT Required for MVP

- CI/CD pipeline (manual deployment is acceptable)
- Containerization (Docker is optional, not required)
- Blue-green deployments or zero-downtime deploys

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
- Multi-region hosting

---

**This document is derived from MASTER_SYSTEM_BLUEPRINT.md (FINAL v4) and TECHNICAL_DECISION_INPUTS.md. These source documents take precedence in all cases.**
