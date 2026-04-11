# PRODUCT REQUIREMENTS

### Source: MASTER_SYSTEM_BLUEPRINT.md (FINAL v4)

### Date: April 11, 2026

---

## 1. PRODUCT OVERVIEW

### What the Product Is

A multi-tenant platform that enables businesses to create structured, interactive experiences inside WhatsApp. Instead of free-form chat, end customers interact through menus, buttons, and guided step-by-step flows. The platform transforms a business's WhatsApp number into a structured, navigable, and action-driven interface.

### What the Product Does

- Provides businesses with a web panel to configure their WhatsApp interaction structure
- Presents end customers with navigable menus and information pages via WhatsApp
- Guides customers through structured data-collection flows (e.g., booking an appointment)
- Generates structured requests from completed flows
- Delivers those requests to business owners for review and decision
- Supports seamless transition from automated interaction to human conversation

### What the Product Is NOT

- **Not a chatbot.** There is no natural language processing, no AI conversation, no free-text interpretation. Interactions are menu-driven and flow-driven.
- **Not a pure booking system.** Booking is one use case, but the platform is a general-purpose structured interaction engine.
- **Not a basic form builder.** The system combines tree-based navigation with linear data collection and a request lifecycle — it is not simply collecting form submissions.

---

## 2. PROBLEM STATEMENT

### Problems Faced by Businesses Today

| Problem | Impact |
|---|---|
| Repetitive manual replies | Business owners spend excessive time answering the same questions |
| Unstructured conversations | Customer messages are disorganized and hard to act on |
| Incomplete customer requests | Customers fail to provide all necessary information |
| Time-consuming communication | Back-and-forth messaging wastes time for both sides |
| Poor customer experience | Customers face slow, inconsistent, and frustrating interactions |

### How the System Solves These Problems

| Solution | Mechanism |
|---|---|
| Structuring interactions | Menus and guided flows replace free-text conversations |
| Guiding customers step-by-step | Flows collect all required information in order |
| Standardizing requests | Every completed flow produces a structured, complete request |
| Reducing manual workload | Automation handles navigation and data collection; humans handle decisions and edge cases |

---

## 3. TARGET USERS

### A. Platform Owner

- **Who:** The organization or individual that owns and operates the platform
- **Responsibilities:**
  - Manage the multi-tenant platform
  - Define subscription plans
  - Manage tenant businesses (create, suspend, delete)
  - Control templates and platform-level settings
  - Drive system evolution and updates

### B. Business Owner

- **Who:** A business (e.g., a salon) that subscribes to the platform to serve its customers via WhatsApp
- **Responsibilities:**
  - Onboard their business (sign up, configure profile, define services)
  - Select and customize an industry template
  - Build and maintain their menu structure
  - Define data-collection flows
  - Review incoming customer requests
  - Make decisions on requests (approve, reject, follow up)
  - Take over conversations manually when needed
  - Connect and manage their own WhatsApp business number

### C. End Customer

- **Who:** A person who contacts a business via WhatsApp
- **Responsibilities:**
  - Send an initial message to the business's WhatsApp number
  - Navigate the menu to browse services and information
  - Enter guided flows to submit structured requests (e.g., book an appointment)
  - Receive responses from the business (automated or human)

---

## 4. CORE USER JOURNEYS

### Journey 1: Business Onboarding

1. Business owner signs up on the platform
2. Provides basic business information (name, phone, location, description)
3. Defines the services they offer
4. Selects an industry template (e.g., salon template)
5. Template is applied — pre-built menus, flows, and services are copied into the business's configuration
6. Business customizes the menu structure, info pages, and flows
7. Business connects their WhatsApp number
8. Configuration is validated against WhatsApp UX constraints
9. Business publishes their configuration — it goes live on WhatsApp

### Journey 2: Customer Interaction

1. Customer sends a message to the business's WhatsApp number
2. System responds with the main menu (e.g., "Services", "Book Appointment", "Contact Us")
3. Customer selects a menu option
4. System navigates to the selected node:
   - **Menu Node** → shows sub-options (children)
   - **Info Node** → displays service details (title, description, price, duration) with optional action buttons
   - **Action Node** → executes immediate action (show phone, show location, open link, go back)
   - **Flow Entry Node** → begins a guided data-collection flow
5. Customer may navigate freely within the menu tree
6. At any point, if inactive for 30 minutes, the session resets to the main menu

### Journey 3: Request Lifecycle

1. Customer enters a flow (via Flow Entry Node or Info Node action button)
2. System presents flow steps one-by-one in strict linear order
3. Customer completes all steps (select service, date, time, name, notes, confirm)
4. System creates a structured request with all collected data
5. System evaluates assignment rules — if a matching rule exists, the request is automatically assigned to the designated assignee
6. Business owner is notified (in-panel, optionally via email); notification indicates the assigned assignee if applicable
7. Business owner reviews the request and decides:
   - **Approve** → request moves to approved, then eventually to completed
   - **Reject** → request is closed (terminal state)
   - **Manual follow-up** → business takes over the conversation to handle the case directly; can later approve, reject, or complete
8. Each request is independent — a customer can have multiple active requests

---

## 5. MVP SCOPE

### In Scope (MVP)

| Area | Details |
|---|---|
| Industry focus | Salon use case |
| Business panel | Full web panel with onboarding, profile, services, menu builder, flow builder, request management, notifications, WhatsApp connection |
| Menu system | Recursive tree with 4 node types (menu, info, flow entry, action), max 4-level depth, max 10 children per node |
| Info nodes | Structured content display (title, description, price, duration) with up to 3 action buttons |
| Flow system | Linear step-based flows (7 step types), no branching or conditions |
| Request system | Structured requests with full lifecycle (5 statuses), traceability to source flow and menu entry point, optional rule-based assignment to assignees |
| Notifications | In-panel notifications (required), email (optional) |
| Human takeover | Per-conversation takeover, mutually exclusive with automation |
| Assignment & routing | Optional rule-based request routing to assignees (by menu node, service, or flow); assignee management via panel |
| Template system | One-time copy of industry template during onboarding (salon) |
| WhatsApp constraints | Builder-enforced validation at creation/edit/publish time |
| Multi-tenancy | Supported from day one |

### Out of Scope (MVP)

| Area | Reason |
|---|---|
| Advanced AI / NLP | Not part of the product identity; interactions are menu/flow-driven |
| Full automation booking | Business owner must review and decide on requests |
| Complex UI builders | Flow builder is simple/linear; menu builder is tree-based only |
| Multi-industry expansion | MVP focuses on salon; templates for other industries deferred |
| Advanced integrations | No third-party calendar, payment, or CRM integrations in MVP |
| Customer accounts/profiles | Customers are identified by phone number only |
| Push notifications | Not required |
| WhatsApp notifications to business owner | Not required |
| Template reapply/sync | Templates are one-time copy only |

---

## 6. VALUE PROPOSITION

### For Business Owners

| Value | How |
|---|---|
| Save time | Automation handles repetitive questions and data collection |
| Get complete requests | Flows ensure every required field is collected before submission |
| Stay in control | Business owner reviews every request and makes the final decision |
| Route requests to the right person | Priority-based assignment rules automatically direct requests to designated staff members based on menu entry point, service selected, or flow — supporting salon, clinic, automotive, and lead-routing workflows |
| Keep personal touch | Human takeover allows stepping into any conversation at any time |
| Easy setup | Industry templates provide a ready-to-use starting point |
| Use own WhatsApp number | Customers interact with a number they already know and trust |
| Professional experience | Structured menus and flows present the business in a polished, organized way |

### For End Customers

| Value | How |
|---|---|
| Fast interaction | Menu-driven navigation is faster than typing and waiting for replies |
| Clear options | Customer always sees exactly what's available |
| Complete information | Info nodes show service details (price, duration, description) upfront |
| Easy requests | Guided flows walk the customer through each step without confusion |
| Familiar channel | Everything happens inside WhatsApp — no app downloads, no websites |
| Consistent experience | Every interaction follows the same reliable structure |

---

**This document is derived from MASTER_SYSTEM_BLUEPRINT.md (FINAL v4) and must not be treated as a standalone source of truth. The blueprint takes precedence in all cases.**
