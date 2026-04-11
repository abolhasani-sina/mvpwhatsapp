# FUNCTIONAL REQUIREMENTS

### Source: MASTER_SYSTEM_BLUEPRINT.md (FINAL v4)

### Date: April 11, 2026

---

## 1. BUSINESS ONBOARDING

- System must provide a step-by-step onboarding wizard for new businesses
- System must collect business information during onboarding (name, phone, location, description)
- System must allow the business to define their services during onboarding
- System must present available industry templates for selection
- System must apply the selected template by deep-copying all template data (menu tree, services, flows, info content) into the business's own entities
- Template application must occur exactly once during onboarding
- After template application, no live link between template and business data may exist
- Template reapply must NOT be allowed in MVP
- System must allow the business to proceed to customization after template application
- System must allow the business to connect their WhatsApp number during or after onboarding

---

## 2. BUSINESS PROFILE MANAGEMENT

- System must allow the business owner to view their business profile
- System must allow the business owner to edit their business information
- Business profile must be scoped to the owning tenant (multi-tenant isolation)
- Business profile data must be separate from service data and menu data

---

## 3. SERVICES MANAGEMENT

- System must allow the business owner to create services
- System must allow the business owner to edit existing services
- System must allow the business owner to delete services
- System must allow the business owner to list all their services
- Services must be scoped to the owning business (tenant-isolated)
- Services must be referenceable by Info Nodes (for display) and Flow steps (for selection)

---

## 4. MENU SYSTEM

### Structure

- System must store menus as a recursive tree of nodes
- Each business must have exactly one root menu node
- The root menu node must be the entry point for all customer interactions
- Menu nodes must support self-referencing parent-child relationships (recursive)
- A Menu Node must always have at least one child node
- Child nodes may be of any of the 4 node types: menu, info, flow_entry, action

### Node Types

- System must support exactly 4 node types: Menu Node, Info Node, Flow Entry Node, Action Node
- No additional node types may be added in MVP

### Menu Node

- Must render its child nodes as selectable options to the customer
- Must always contain at least one child

### Info Node

- Must display structured content: title (required), description (required), price (optional), duration (optional)
- May contain action buttons (maximum 3 per Info Node)
- Action buttons that trigger flows must behave identically to Flow Entry Nodes (same session transition)
- Action buttons that trigger immediate actions must behave identically to Action Nodes (same action type enum)
- Action buttons are inline configurations on the Info Node, not separate node entities

### Flow Entry Node

- Must link to exactly one Flow
- Must transition the customer session from menu context into flow context
- Must be a leaf node in the menu tree (no children)
- A single Flow may be referenced by multiple Flow Entry Nodes

### Action Node

- Must execute one immediate action and be a leaf node (no children)
- Allowed action types in MVP (fixed enum):
  - `show_phone` — display the business phone number
  - `show_location` — display the business location/address
  - `open_link` — open a URL
  - `go_back` — navigate to parent menu node
- No other action types are permitted in MVP

### Navigation Behavior

- When a customer sends an initial message, the system must display the main menu (root node's children)
- When a customer selects a Menu Node, the system must display that node's children
- When a customer selects an Info Node, the system must display the info content and available action buttons
- When a customer selects a Flow Entry Node, the system must transition the session into the linked flow
- When a customer selects an Action Node, the system must execute the configured action

---

## 5. INFO NODE BEHAVIOR

- System must render Info Node content as a structured message: title, description, and optionally price and duration
- System must render action buttons below the info content (maximum 3 buttons)
- Each action button must have a label and a behavior type
- Behavior type `trigger_flow` must reference a specific Flow and initiate flow execution (identical to Flow Entry Node behavior)
- Behavior type `action` must reference an action type from the Action Node enum (show_phone, show_location, open_link, go_back)
- Info Node must be a leaf node in the menu tree (no child nodes)

---

## 6. FLOW SYSTEM

### Structure

- Flows must be strictly linear sequences of steps (no branching, no conditional logic, no loops in MVP)
- Each flow must have an ordered list of steps
- Each flow step must have: step_type, order (integer), and configuration (step-specific)
- A flow must be triggerable from multiple entry points (multiple Flow Entry Nodes or Info Node buttons)

### Step Types

- System must support exactly 7 step types in MVP (fixed enum):
  - `select_option` — present a list of predefined options for selection
  - `select_service` — present the business's services for selection
  - `select_date` — present a date picker
  - `select_time` — present a time picker
  - `text_input` — accept free-text input (e.g., name, notes)
  - `confirmation` — present a yes/no confirmation
  - `summary` — display all collected data for review before final confirmation

### Execution

- System must present flow steps to the customer one at a time, in order
- System must collect and store the customer's response for each step before advancing
- System must track the customer's current position within the flow (current step)
- System must store partially collected flow data in the session (for recovery within timeout)
- Upon completion of all steps, the system must create exactly one Request
- After request creation, the session must return to menu context

---

## 7. REQUEST SYSTEM

### Creation

- System must create exactly one request per completed flow execution
- Request must not be created until the flow is fully completed

### Required Fields

- `id` — unique identifier (system-generated)
- `business_id` — reference to the owning business
- `source_flow_id` — reference to the Flow that generated the request
- `entered_from_node_id` — reference to the MenuNode from which the customer entered the flow
- `phone_number` — customer's WhatsApp phone number
- `service` — the selected service
- `date` — the selected date
- `time` — the selected time
- `status` — request status (default: `pending`)
- `created_at` — timestamp of request creation

### Optional Fields

- `notes` — free-text notes from the customer- `assigned_to_id` — reference to the Assignee assigned via routing rules (nullable)
- `assignment_rule_id` — reference to the AssignmentRule that matched (nullable)
- `assigned_at` — timestamp of assignment (nullable)
### Multiple Requests

- A customer may have multiple requests simultaneously with the same business
- Each request must be fully independent (no cross-request logic)

---

## 8. REQUEST LIFECYCLE

### Statuses (fixed — 5 total)

- `pending` — initial state after request creation
- `approved` — business owner has approved the request
- `rejected` — business owner has rejected the request (terminal state)
- `manual_followup` — business owner has flagged the request for manual handling
- `completed` — request has been fulfilled (terminal state)

### Allowed Status Transitions

- `pending` → `approved`, `rejected`, `manual_followup`
- `approved` → `completed`
- `rejected` → (no further transitions — terminal)
- `manual_followup` → `approved`, `rejected`, `completed`
- `completed` → (no further transitions — terminal)

### Business Actions

- System must allow business owner to approve a pending request
- System must allow business owner to reject a pending request
- System must allow business owner to mark a pending request for manual follow-up
- System must allow business owner to complete an approved request
- System must allow business owner to approve, reject, or complete a request in manual_followup status
- System must NOT allow any status transition not defined above
- System must NOT allow modification of requests in terminal states (rejected, completed)

---

## 9. HUMAN TAKEOVER

- System must support a conversation mode for each customer session: `automated` or `human_takeover`
- Modes must be mutually exclusive — a session is NEVER in both modes simultaneously
- System must allow the business owner to activate human takeover for a specific conversation
- When human takeover is activated:
  - All automation must stop for that conversation
  - The system must not process incoming messages from that customer automatically
  - Incoming messages must be routed to the business owner for manual response
- System must allow the business owner to deactivate human takeover and return to automated mode
- When returning to automated mode, the customer session must reset to the main menu
- Human takeover scope is per conversation (identified by phone_number + business_id)

---

## 10. SESSION MANAGEMENT

### Session Identity

- Each session must be uniquely identified by the composite key: `phone_number` + `business_id`
- One customer (phone number) interacting with one business = one session

### Session State

- System must track the following per session:
  - `current_menu_node_id` — current position in the menu tree
  - `current_flow_id` — the active flow (null if in menu context)
  - `current_flow_step` — current step position within the active flow (null if in menu context)
  - `mode` — `automated` or `human_takeover`
  - `last_activity` — timestamp of the most recent interaction
  - `flow_data` — partially collected flow responses (null if not in a flow)

### Context Rules

- A customer must be in EITHER menu context OR flow context at any given moment, never both
- Entering a flow (via Flow Entry Node or Info Node button) transitions the session from menu context to flow context
- Completing a flow transitions the session from flow context back to menu context

### Timeout

- If a customer is inactive for 30 minutes, the session must reset completely
- After reset, the next message from the customer must present the main menu
- Timeout applies to both automated and human_takeover modes

---

## 11. NOTIFICATIONS

### Required (MVP)

- System must send an in-panel notification to the business owner when a new request is created (status = `pending`)
- In-panel notifications must be visible within the business panel (Requests Panel or dedicated notifications area)
- If a request is assigned to an assignee, the notification must indicate the assigned assignee
- Business owner must always receive notifications for all requests, regardless of assignment status

### Optional (MVP)

- System may send an email notification to the business owner when a new request is created, if implementation effort is low

### Not Required (MVP)

- WhatsApp notification to the business owner — not required
- Push notifications — not required
- Email to assignee — not required (future consideration)

---

## 12. WHATSAPP INTERACTION LAYER

### Role

- WhatsApp is the delivery and interaction layer only
- All business logic resides server-side
- WhatsApp is not a logic layer

### Requirements

- System must use the business's own WhatsApp number
- System must receive incoming messages from customers via WhatsApp
- System must send structured responses (menus, info pages, flow steps) to customers via WhatsApp
- System must format outgoing messages according to WhatsApp message types:
  - 1–3 options → reply buttons
  - 4–10 options → list message
- System must support human takeover by routing messages to the business owner when takeover is active
- System must manage WhatsApp connection configuration per business

### Runtime Assumptions

- All published business configurations are assumed to be valid (builder-enforced)
- Runtime message formatting does not re-validate constraints — validation is a builder responsibility

---

## 13. BUILDER CONSTRAINTS (WHATSAPP UX RULES)

All constraints below are derived from WhatsApp Business API interaction limitations and must be enforced by the business panel (builder).

### Option Rendering

- 1–3 selectable options must be rendered as WhatsApp reply buttons
- 4–10 selectable options must be rendered as a WhatsApp list message
- More than 10 selectable options must NOT be allowed — builder must block and require restructuring

### Menu Builder Constraints

- A Menu Node may have a maximum of 10 direct children (hard validation rule)
- If a business attempts to add an 11th child, the builder must block the action
- Maximum allowed menu depth for MVP publishing: 4 levels (hard validation rule)
- Main menu should contain 3–5 top-level options (UX guidance only, not hard-enforced)

### Info Node Constraints

- Maximum 3 action buttons per Info Node (hard validation rule)

### Flow Builder Constraints

- Any flow step presenting selectable options must follow the same option rendering rules
- Flow steps must not allow more than 10 selectable options (hard validation rule)

### Validation Timing

- Constraints must be checked at creation time (prevent invalid structures from being built)
- Constraints must be checked at edit time (prevent edits that violate constraints)
- Constraints must be checked at publish time (final gate before configuration goes live)

### Publish Blocking

- If any part of a business configuration violates the constraints above, the menu and/or flow cannot be published until all violations are resolved
- The builder must clearly indicate which nodes/steps are in violation
- Validation must run on save AND on publish

---

## 14.1 ASSIGNEE MANAGEMENT

### Entity

- System must allow the business owner to create assignees within their business
- System must allow the business owner to edit existing assignees
- System must allow the business owner to deactivate assignees (set `status` = `inactive`)
- System must allow the business owner to reactivate assignees (set `status` = `active`)
- System must allow the business owner to list all their assignees
- Assignees must be scoped to the owning business (tenant-isolated)

### Required Fields

- `id` — unique identifier (system-generated)
- `business_id` — reference to the owning business
- `name` — display name of the assignee
- `phone_number` — assignee's phone number

### Optional Fields

- `label` — role or specialty label (e.g., "Nail Specialist", "Manager")

### Status

- `status` — enum: `active` | `inactive`, default `active`
- `created_at` — timestamp of creation
- `updated_at` — timestamp of last update
- Only active assignees may be targeted by assignment rules
- Deactivating an assignee does NOT remove existing assignments on past requests

### Constraints

- Assignees are NOT user accounts — they do not log into the system in MVP
- Deleting an assignee who is referenced by existing requests or rules must be handled gracefully (soft-deactivate preferred)

---

## 14.2 ASSIGNMENT RULES

### Entity

- System must allow the business owner to create assignment rules
- System must allow the business owner to edit existing assignment rules
- System must allow the business owner to deactivate assignment rules (set `is_active` = false)
- System must allow the business owner to reactivate assignment rules
- System must allow the business owner to list all their assignment rules
- Assignment rules must be scoped to the owning business (tenant-isolated)

### Required Fields

- `id` — unique identifier (system-generated)
- `business_id` — reference to the owning business
- `trigger_type` — enum: `menu_node`, `service`, `flow`
- `trigger_id` — reference to the entity identified by `trigger_type` (MenuNode, Service, or Flow)
- `assigned_to_id` — reference to an active Assignee
- `priority` — integer (determines precedence when multiple rules match; higher value wins)
- `is_active` — boolean, default `true`
- `created_at` — timestamp of creation
- `updated_at` — timestamp of last update

### Trigger Types

- `menu_node` — matches the request's `entered_from_node_id`
- `service` — matches the request's `service` field
- `flow` — matches the request's `source_flow_id`

### Mapping Capability

The business owner must be able to map:
- Menu Nodes → Assignees
- Services → Assignees
- Flows → Assignees

### Validation

- `trigger_id` must reference a valid entity of the type specified by `trigger_type` within the same business
- `assigned_to_id` must reference an active Assignee within the same business
- `priority` must be a valid integer
- System must validate these references at rule creation and edit time

---

## 14.3 ASSIGNMENT ROUTING LOGIC

### Pipeline

- Assignment routing runs AFTER request creation, BEFORE notification dispatch
- Pipeline: Request Created → Assignment Evaluation → Notification

### Evaluation

- System must evaluate all `is_active` assignment rules for the business when a new request is created
- All matching rules are collected across all trigger types (`menu_node`, `service`, `flow`)
- Routing resolution:
  1. **If exactly ONE rule matches** → assign request to that rule’s assignee
  2. **If MULTIPLE rules match** → the rule with the highest `priority` value wins
  3. **If multiple matching rules share the same highest `priority`** → system must NOT guess — request remains **unassigned**
  4. **If NO rule matches** → request remains unassigned (this is valid and expected)
  5. **If the matched assignee is `inactive`** → request remains **unassigned**
- If assignment succeeds, the system must set `assigned_to_id`, `assignment_rule_id`, and `assigned_at` on the request

### Determinism Requirement

- The routing logic MUST be deterministic — zero ambiguity at runtime
- Equal-priority tie = unassigned (never random selection)
- Inactive assignee = unassigned (never assigned to inactive)

### Constraints

- Assignment evaluation must happen exactly once per request, at creation time
- Re-assignment is NOT supported in MVP
- Assignment must NOT change the request status — the request remains `pending` after assignment
- Assignment must NOT modify any existing Menu, Flow, or Request lifecycle logic
- The business owner retains full control over all requests regardless of assignment (assignment is routing/informational, not access control)

---

## 15. TEMPLATE SYSTEM

- System must provide industry-specific templates (salon template for MVP)
- Templates must contain pre-built: menu tree, services, flows and their steps, info content
- Template application must deep-copy all template data into the business's own entities
- After application, no live link may exist between the template and the business's data
- Business must be able to fully customize, modify, or delete any copied structure
- Template reapply must NOT be allowed in MVP
- Template sync must NOT exist — templates are static starting points only

---

**This document is derived from MASTER_SYSTEM_BLUEPRINT.md (FINAL v4) and must not be treated as a standalone source of truth. The blueprint takes precedence in all cases.**
