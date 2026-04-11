# PHASE PLANNING REQUEST

### Project: MVPWhatsapp

### Date: April 11, 2026

### Purpose: Formally request a technology stack recommendation, system architecture design, and phased execution plan for this project.

---

## 1. CONTEXT SUMMARY

This project is a multi-tenant platform that enables businesses to create structured, interactive experiences inside WhatsApp. Customers interact through menus, buttons, and guided flows instead of free-form chat. The system transforms a business's WhatsApp number into a navigable, action-driven interface.

The product is fully defined. The architecture is locked. All functional and non-functional requirements are documented. No ambiguities remain in the product design.

**What is ready:**

- The product definition is complete
- The system architecture is locked (4 cores, 4 node types, 7 flow step types, 5-status request lifecycle, assignment & routing layer)
- All functional requirements are specified and testable
- All non-functional requirements are defined
- All builder constraints (WhatsApp UX rules) are locked
- The phase dependency graph is final (8 phases + Phase 5b sub-phase)
- Working rules for development are established

**What is missing:**

- No technology stack has been chosen
- No system architecture (technical implementation) has been designed
- No execution plan exists for any phase
- Development has not started

---

## 2. EXISTING DOCUMENTS

The following documents are FINAL and LOCKED. They must NOT be modified. All recommendations and plans must align with them.

| Document | Purpose | Status |
|---|---|---|
| MASTER_SYSTEM_BLUEPRINT.md | Single source of truth — complete system definition | FINAL v4, LOCKED |
| PRODUCT_REQUIREMENTS.md | Product-focused requirements (what, why, for whom) | FINAL |
| FUNCTIONAL_REQUIREMENTS.md | Module-by-module functional requirements (what the system must do) | FINAL |
| TECHNICAL_DECISION_INPUTS.md | Constraints and unknowns for tech stack decisions | FINAL |
| NON_FUNCTIONAL_REQUIREMENTS.md | System qualities and constraints (how the system must behave) | FINAL |
| OPEN_DECISIONS.md | All unresolved technical decisions with constraints | FINAL |
| CLAUDE_WORKING_RULES.md | Strict rules for development behavior | FINAL |

---

## 3. WHAT IS ALREADY LOCKED

The following decisions are made and cannot be changed:

### Architecture

- Multi-tenant from day one
- Menu system and Flow system are separate (connected only by Flow Entry Node)
- Templates are data only (one-time deep copy, no runtime role)
- Requests have independent lifecycle (5 statuses, fixed transitions)
- Assignment is a post-creation routing layer (Menu → Flow → Request → Assignment → Notification)
- Human takeover is mandatory (mutually exclusive with automation)
- WhatsApp is the delivery layer only (all logic is server-side)
- Builder enforces WhatsApp UX constraints at creation/edit/publish time

### Data Model

- 4 node types: menu, info, flow_entry, action (no additions)
- 7 flow step types: select_option, select_service, select_date, select_time, text_input, confirmation, summary (no additions)
- 4 action types: show_phone, show_location, open_link, go_back (no additions)
- 5 request statuses: pending, approved, rejected, manual_followup, completed (fixed transitions)
- Assignment fields on Request: assigned_to_id, assignment_rule_id, assigned_at (all nullable)
- Assignment rules: trigger_type (menu_node, service, flow) + trigger_id + assigned_to_id + priority (integer) + is_active (boolean)
- Assignment routing: deterministic priority-based — highest priority wins, equal priority = unassigned, inactive assignee = unassigned
- Assignee entity: name, phone_number, label, status (active/inactive)
- Session key: phone_number + business_id
- Session timeout: 30 minutes
- Request traceability: source_flow_id + entered_from_node_id

### WhatsApp Constraints

- Max 10 children per Menu Node
- Max 4-level menu depth for publish
- Max 3 action buttons per Info Node
- Max 10 selectable options per flow step
- 1–3 options → reply buttons; 4–10 → list message; >10 → blocked

### Phase Order

- Phase 1: Core Data & Structure
- Phase 2: Business Setup
- Phase 3: Menu System
- Phase 4: Flow System
- Phase 5: Request Lifecycle
- Phase 5b: Assignment & Routing
- Phase 6: Notifications
- Phase 7: WhatsApp Integration
- Phase 8: Testing & Refinement

### Environment

- Windows VPS
- VS Code + GitHub Copilot + Claude
- Non-programmer project owner
- Solo AI-assisted development

---

## 4. WHAT NEEDS TO BE DECIDED

The following technical decisions are open (documented in OPEN_DECISIONS.md):

| # | Decision | Blocks |
|---|---|---|
| 1 | **Backend framework** — what runtime and framework will power the API and business logic? | Phase 1 |
| 2 | **Database** — what database system will store all data? | Phase 1 |
| 3 | **Hosting & deployment** — how will the application run on the Windows VPS? | Phase 1 |
| 4 | **Frontend panel** — what technology will power the business panel? | Phase 2 |
| 5 | **Authentication** — how will panel users be authenticated? | Phase 2 |
| 6 | **n8n usage** — should n8n be used, and for what? | Phase 6–7 |
| 7 | **WhatsApp integration approach** — Meta Cloud API direct or third-party provider? | Phase 7 |

**Decisions 1–3 must be resolved before any development can begin.**

---

## 5. EXPLICIT REQUEST

Based on everything documented above, the following deliverables are now requested:

### 5.1 Technology Stack Recommendation

Provide a specific, justified recommendation for:

- **Backend framework** (language + framework)
- **Database** (specific database system)
- **Frontend panel** (framework or approach)
- **Authentication approach** (mechanism)
- **Hosting setup** (how to deploy on Windows VPS)
- **n8n decision** (use or don't use, and for what)
- **WhatsApp integration approach** (which provider/API strategy)

For each recommendation, explain:

- Why this choice fits the project constraints
- Why alternatives were rejected
- Any risks or trade-offs
- Confirmation that the choice is compatible with the locked architecture

### 5.2 System Architecture Design

Provide a technical architecture that maps the locked system blueprint to the chosen tech stack:

- Project folder structure
- Module organization (how the 4 cores map to code)
- API design approach (REST, naming conventions)
- Database schema overview (how the data model maps to tables)
- Session management approach
- Webhook handling pipeline
- Builder validation approach (client + server)
- Multi-tenancy enforcement approach

This must be an architecture design, not implementation code.

### 5.3 Development Execution Plan

Provide a phased execution plan that follows the locked dependency graph:

For each phase (1 through 8, including 5b):

- What specifically will be built
- What entities/tables will be created
- What API endpoints will be created
- What UI components will be created (if applicable)
- What validation rules will be implemented
- What the definition of "done" is for the phase
- Dependencies on prior phases

---

## 6. RULES FOR THE RESPONSE

- Recommendations must strictly align with all locked documents
- No features may be added beyond what the blueprint defines
- No architecture changes may be proposed
- No simplifications that remove required capabilities
- All WhatsApp UX constraints must be accounted for
- Multi-tenancy must be built into every recommendation from the start
- The non-programmer + AI-assisted development context must influence every choice
- Windows VPS compatibility must be confirmed for every recommended technology

---

**This request is now active. Proceed with the deliverables defined in Section 5.**
