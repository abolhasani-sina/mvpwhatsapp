---
name: production-readmap
description: 'V2 BotDesk Production Readiness Roadmap — Phases 6-18. Security hardening, bug fixes, UI polish, SaaS owner controls, channel provisioning, testing, deployment, billing, compliance, release governance, support, analytics, and continuity. Check before and after each phase to verify all tasks complete.'
---

# V2 BotDesk Production Readiness Roadmap — Phases 6-18

> **Goal**: Transform V2 from **40% production-ready MVP** to **production-hardened SaaS** ready for real users and revenue.
> 
> **Timeline**: 12-14 weeks (1-2 weeks per phase, run in parallel where possible)
>
> **Previous Phases**: ✅ Phases 1-5 complete (Telegram Bot, Multi-Channel Renderers, Templates)

---

## PHASE 6: Security Hardening ⚠️ CRITICAL

**Duration**: 1-2 weeks | **Effort**: High | **Risk**: Blocking all production deploy

**Objective**: Implement real authentication, enforce multi-tenancy isolation, add HTTPS/encryption, rate limiting, validate inputs. Remove all fake/mock systems.

---

### 6.1 Real Authentication System

**Current State**: Mock auth via localStorage (`{ email, id: Date.now() }`) — anyone can login as anyone.

**Required Deliverables**:
- [ ] Backend: Implement JWT token system with separate access + refresh tokens
  - [ ] Add `jsonwebtoken` npm package
  - [ ] `POST /api/auth/register` — Create user, hash password with bcrypt, return JWT + refresh token
  - [ ] `POST /api/auth/login` — Validate email/password against bcrypted hash, return JWT + refresh token
  - [ ] `POST /api/auth/refresh` — Accept refresh token, issue new access token
  - [ ] `POST /api/auth/logout` — Blacklist refresh token in DB (or TTL in Redis)
  - [ ] JWT payload: `{ user_id, business_id, email, iat, exp }`
  - [ ] Access token TTL: 15 minutes | Refresh token TTL: 7 days
  - [ ] Store refresh tokens in `refresh_tokens` table: `(id, user_id, token, expires_at, created_at)`

- [ ] Backend: Implement auth middleware
  - [ ] `verifyToken(req, res, next)` — Extract JWT from `Authorization: Bearer <token>` header
  - [ ] Verify signature, expiration, and presence of `user_id` + `business_id`
  - [ ] Reject invalid/expired tokens with 401 Unauthorized
  - [ ] Attach `req.user = { user_id, business_id, email }` to request
  - [ ] Apply to ALL protected routes (everything except `/auth/register`, `/auth/login`, `/api/health`)

- [ ] Frontend: Replace mock auth with real JWT flow
  - [ ] Store JWT in memory (NOT localStorage for security)
  - [ ] On login success: Store JWT + refresh token in httpOnly cookie (backend sets this)
  - [ ] On 401 response: Automatically call refresh endpoint
  - [ ] On 403 or token expired: Redirect to login page
  - [ ] Remove `localStorage` dependency from `auth.jsx`
  - [ ] Add `useAuth()` hook: `{ user, isLoading, login(), logout(), isAuthenticated }`

- [ ] Database: Add users + auth tables
  - [ ] `users` table: `(id, email UNIQUE, password_hash, name, business_id, role, created_at, updated_at)`
  - [ ] `refresh_tokens` table: `(id, user_id FK, token, expires_at, revoked_at, created_at)`
  - [ ] Add indexes: `idx_users_email`, `idx_users_business_id`, `idx_refresh_tokens_user_id`

**Testing After Completion**:
- [ ] Register with valid email → user created, JWT returned
- [ ] Login with correct password → JWT returned, refresh token set in httpOnly cookie
- [ ] Login with wrong password → 401 Unauthorized
- [ ] Access protected endpoint without JWT → 401 Unauthorized
- [ ] Access with expired JWT → 401 Unauthorized; refresh endpoint works
- [ ] Refresh token expired → 401 Unauthorized, redirect to login
- [ ] After logout → refresh token revoked, cannot use it
- [ ] Different user_id cannot access other user's data

---

### 6.2 Multi-Tenancy Enforcement

**Current State**: All queries use single business_id=1; no tenant validation; first user to login "owns" business.

**Required Deliverables**:
- [ ] Backend: Tenant scoping middleware
  - [ ] Add `tenantScope(req, res, next)` middleware
  - [ ] For all routes, verify `req.user.business_id` matches request's business_id (from param or JWT)
  - [ ] If mismatch, reject with 403 Forbidden
  - [ ] Apply AFTER `verifyToken` so `req.user` exists

- [ ] Backend: Audit ALL API routes for tenant filtering
  - [ ] Every SELECT query must include `WHERE business_id = req.user.business_id`
  - [ ] Every INSERT must set `business_id = req.user.business_id`
  - [ ] Every UPDATE/DELETE must filter by business_id
  - [ ] Routes to audit: `/business/:id/builder`, `/business/:id/submissions`, `/business/:id/staff`, `/flows/:flowId/*`, etc.
  - [ ] Document findings in audit log (spreadsheet or comment in code)

- [ ] Database: Add foreign key constraints
  - [ ] All tables with `business_id` column must have: `FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE`
  - [ ] All soft-delete tables must use `business_id` in cascading delete logic
  - [ ] Run migration to add FK constraints (with data validation first)

- [ ] Frontend: Verify business_id in all API calls
  - [ ] Every API function that takes `businessId` parameter must verify it matches `useAuth().user.business_id`
  - [ ] If mismatch, throw error (prevent accidental cross-tenant calls)

**Testing After Completion**:
- [ ] User A logs in, fetches `/api/business/1/builder` → gets own data
- [ ] User A tries to access `/api/business/2/builder` (different business) → 403 Forbidden
- [ ] User A deletes business → all related data (buttons, submissions, staff) cascade deleted
- [ ] Two businesses exist; queries return only respective business data
- [ ] Direct URL manipulation (`businessId` from URL) cannot bypass tenant check

---

### 6.3 Input Validation & Sanitization

**Current State**: Minimal validation; allows invalid data into database.

**Required Deliverables**:
- [ ] Backend: Install validation library
  - [ ] Add `express-validator` or `zod` npm package
  - [ ] Create `validators.js` with reusable schemas

- [ ] Backend: Validate all POST/PUT endpoints
  - [ ] `POST /api/auth/register` — email format, password >= 8 chars, name non-empty
  - [ ] `POST /api/auth/login` — email format, password required
  - [ ] `POST /api/business` — name non-empty, max 100 chars
  - [ ] `PUT /api/business/:id` — name max 100 chars, phone valid format
  - [ ] `POST /api/business/:id/submissions` — data is JSON object, no null values
  - [ ] `POST /api/business/:id/staff` — name required, email valid format, telegram_chat_id valid format
  - [ ] `PUT /api/business/:id/builder` — buttons array non-empty, welcome message required
  - [ ] **Flow builder constraints**:
    - [ ] Button label: max 64 chars
    - [ ] Button count per parent: max 10 (warn at UI; enforce at server)
    - [ ] Menu depth: max 5 levels (recursive check)
    - [ ] Flow step options: 0-10 per step
    - [ ] Text length: max 4096 chars per field

- [ ] Frontend: Client-side validation (for UX, not security)
  - [ ] Show warnings: "Button label too long (max 20 chars for WhatsApp)"
  - [ ] Prevent form submit if required fields empty
  - [ ] Real-time constraint feedback in builder

- [ ] Backend: Return 422 Unprocessable Entity for validation errors
  - [ ] Response format: `{ error: 'Validation failed', violations: [{ field, message }] }`
  - [ ] Example: `{ error: '...', violations: [{ field: 'email', message: 'Invalid email format' }] }`

**Testing After Completion**:
- [ ] Submit form with invalid email → 422 with error message
- [ ] Create button with label > 64 chars → 422 rejected
- [ ] Create flow with 11 options → 422 rejected
- [ ] Create menu with 6 nesting levels → 422 rejected
- [ ] All valid payloads accept → 200 OK

---

### 6.4 HTTPS/TLS & Security Headers

**Current State**: HTTP only; no encryption; credentials sent in plaintext.

**Required Deliverables**:
- [ ] Server: Enable HTTPS
  - [ ] **For local dev**: Use self-signed cert (or skip HTTPS, allow localhost)
  - [ ] **For staging/production**: Obtain Let's Encrypt cert (automated renewal)
  - [ ] Configure Express to redirect HTTP → HTTPS
  - [ ] Test: `curl https://localhost:4000/api/health` works; HTTP redirects

- [ ] Server: Add security headers middleware
  - [ ] Install `helmet` npm package
  - [ ] Add to Express: `app.use(helmet())`
  - [ ] Headers added:
    - [ ] `Strict-Transport-Security: max-age=31536000` (HSTS)
    - [ ] `X-Content-Type-Options: nosniff`
    - [ ] `X-Frame-Options: DENY` (prevent clickjacking)
    - [ ] `Content-Security-Policy: default-src 'self'`
    - [ ] `X-XSS-Protection: 1; mode=block`

- [ ] Cookies: Set secure flags
  - [ ] JWT cookies: `HttpOnly`, `Secure`, `SameSite=Strict`
  - [ ] Telegram token in DB: Consider encryption-at-rest

- [ ] Frontend: Enforce HTTPS
  - [ ] API base URL: Use `https://` scheme
  - [ ] Warn on console if running on HTTP (dev only)

**Testing After Completion**:
- [ ] HTTP requests redirect to HTTPS
- [ ] HTTPS requests work
- [ ] Browser dev tools show `Secure` flag on cookies
- [ ] `curl -I https://localhost:4000/api/health` shows security headers
- [ ] CSP allows only same-origin resources

---

### 6.5 Rate Limiting & DDoS Protection

**Current State**: No throttling; anyone can hammer any endpoint.

**Required Deliverables**:
- [ ] Backend: Install rate limiter
  - [ ] Add `express-rate-limit` npm package
  - [ ] Add `redis` npm package (or use in-memory store for MVP)

- [ ] Backend: Create rate limit middleware
  - [ ] Global limit: 100 requests per IP per minute (after 100, 429 Too Many Requests)
  - [ ] Auth endpoints limit: 5 requests per IP per minute (login/register brute-force protection)
  - [ ] Telegram polling: 1 request per second per business (prevent duplicate polling)
  - [ ] Submission endpoint: 100 per IP per hour (spam protection)

- [ ] Backend: Apply rate limiters to routes
  - [ ] `POST /api/auth/login` — 5/min per IP
  - [ ] `POST /api/auth/register` — 5/min per IP
  - [ ] `POST /api/business/:id/submissions` — 100/hour per IP
  - [ ] All other endpoints — 100/min per IP (or per user if authenticated)

- [ ] Backend: Graceful error on rate limit
  - [ ] Return 429 with: `{ error: 'Too many requests. Try again in 60 seconds.' }`

- [ ] Telegram polling resilience
  - [ ] Add exponential backoff: 1s, 2s, 4s, 8s, 16s max on failures
  - [ ] Max retry: 5 attempts, then log error and pause for 5 min
  - [ ] Test: Manually crash polling, verify auto-restart after backoff

**Testing After Completion**:
- [ ] Send 101 requests to `/api/health` in 1 minute → 100 successful, 1 returns 429
- [ ] Send 6 login attempts in 1 minute → 5 successful, 6th returns 429
- [ ] Telegram API error → polling retries with backoff (no instant crash)
- [ ] Redis state persists across restarts (if using Redis)

---

### 6.6 Database Encryption at Rest (Sensitive Fields)

**Current State**: Telegram bot tokens stored in plaintext in DB.

**Required Deliverables**:
- [ ] Add encryption library
  - [ ] Install `crypto` (built-in Node.js) or `argon2` + `libsodium`

- [ ] Encrypt sensitive fields
  - [ ] `settings.telegram_bot_token` — encrypt with server secret
  - [ ] `settings.business_email` (optional) — can stay plaintext or encrypt
  - [ ] **Never** store: passwords (only hash), refresh tokens (use TTL), API keys in logs

- [ ] Encryption strategy
  - [ ] Use server-level encryption key (stored in `.env` as `ENCRYPTION_KEY`)
  - [ ] On insert: plaintext → encrypt → store in DB
  - [ ] On select: encrypted → decrypt → return plaintext to app memory
  - [ ] Rotation: If key compromised, re-encrypt all data with new key

- [ ] Backend: Add encrypt/decrypt utilities
  - [ ] Function: `encryptField(plaintext, key)` → ciphertext
  - [ ] Function: `decryptField(ciphertext, key)` → plaintext
  - [ ] Use in `settings` table: getters/setters for telegram_bot_token

**Testing After Completion**:
- [ ] Insert telegram bot token → verify DB stores encrypted value (not plaintext)
- [ ] Query token and decrypt → matches original
- [ ] Rotate key → re-encrypt all tokens
- [ ] Logging never outputs plaintext tokens (sanitize logs)

---

## PHASE 7: Critical Bug Fixes & Core Reliability 🔴

**Duration**: 1 week | **Effort**: High | **Risk**: Breaks user experience

**Objective**: Fix double-click bug, duplicate message bug, session timeouts, error recovery. Ensure core flows are rock-solid.

---

### 7.1 Fix Double-Click Response Bug

**Issue**: User clicks button twice (or rapidly) → bot responds twice → 2 submissions created.

**Root Cause**: No debounce on frontend; backend processes same callback_data twice.

**Required Deliverables**:

#### Frontend (Client)
- [ ] PhoneMockup.jsx: Add click debounce
  - [ ] Install `lodash-es` or use native debounce
  - [ ] Wrap button click handler in `useMemo(useCallback(...), [])`
  - [ ] Debounce delay: 300ms
  - [ ] Disable button during pending (add `disabled` state)
  - [ ] Disable all buttons during response loading

#### Backend (Server)
- [ ] Bot engine: Add request deduplication
  - [ ] Create `processed_callbacks` table: `(id, business_id, channel, customer_id, callback_data, processed_at, created_at)`
  - [ ] On incoming message: Check if `(channel, customer_id, callback_data)` exists in table within last 5 seconds
  - [ ] If exists (duplicate), log it and skip re-processing
  - [ ] If new, add to table and process normally
  - [ ] Cleanup job: Delete records older than 5 minutes

- [ ] Telegram-bot.js: Add message ID tracking
  - [ ] Track `update.update_id` → prevent re-processing same update if webhook called twice
  - [ ] Create `telegram_updates` table: `(id, business_id, update_id, processed_at)`
  - [ ] Check: If `update_id` already processed, skip this update

**Testing After Completion**:
- [ ] Rapid click button twice → only 1 message sent
- [ ] Single slow click → 1 message sent
- [ ] Load test: 100 users clicking simultaneously → no duplicates
- [ ] Telegram: Send same update twice → processed only once

---

### 7.2 Fix Duplicate Message Bug

**Issue**: Single click on "Book Service" button causes follow-up message "Great choice! What's your name?" to appear twice in chat.

**Root Cause**: Bot engine generating message twice, or socket sending same message twice, or renderer outputting duplicates.

**Required Deliverables**:

#### Audit Bot Engine (`bot-engine.js`)
- [ ] Function `processIncoming()` — Add logging at each step
  - [ ] Log: Start of function + all parameters
  - [ ] Log: Before message building
  - [ ] Log: After each `responses.push()`
  - [ ] Log: Before return statement with full response array
  - [ ] Capture: `{ timestamp, businessId, customerId, step, responseCount, responseNames }`

#### Audit Telegram Bot (`telegram-bot.js`)
- [ ] Function `sendInternalMessages()` — Add logging
  - [ ] Log: Incoming message array length
  - [ ] Log: For each message, log send attempt
  - [ ] Track: Which messages were sent, in order
  - [ ] Verify: No duplicate **sends** happening

#### Fix: Message Deduplication
- [ ] After `processIncoming()` returns array, deduplicate by message signature
  - [ ] Signature: `hash(type + body + buttons)`
  - [ ] If two consecutive messages have same signature → remove duplicate
  - [ ] Log removals for debugging

#### Fix: Transaction Wrapping
- [ ] Wrap state transitions in database transactions
  - [ ] If flow completes: 
    - [ ] 1. Update conversation state
    - [ ] 2. Create submission 
    - [ ] 3. Send response messages
    - [ ] All 3 atomic (commit or rollback together)
  - [ ] If any fails, rollback all 3 (don't send partial messages)

**Testing After Completion**:
- [ ] Click "Book Service" once → single follow-up message in chat
- [ ] Verify logs show: 1 response message (not 2)
- [ ] Database shows: 1 submission created (not 2)
- [ ] Rapid clicks → 1 submission per unique click

---

### 7.3 Session Timeout Enforcement

**Issue**: Sessions stored with `last_activity` timestamp but never cleaned up; old sessions linger in DB.

**Required Deliverables**:
- [ ] Database: Add sessions table (if not exists)
  - [ ] `sessions`: `(id, business_id, customer_identifier, channel, state_json, last_activity, created_at, updated_at)`
  - [ ] `state_json` contains full conversation state (current menu, flow progress, etc.)

- [ ] Backend: Check timeout on every message
  - [ ] `bot-engine.js` — Load session, check `(now - last_activity) > 30 min`
  - [ ] If expired: Clear state, send "Session expired. Starting fresh." message, reset to welcome
  - [ ] Update `last_activity = now` on every new message

- [ ] Backend: Add cleanup cron job
  - [ ] Every 5 minutes: Delete sessions where `last_activity < now - 30 min`
  - [ ] Log: "Cleaned up N stale sessions"
  - [ ] Use `node-schedule` or `node-cron` npm packages

- [ ] Frontend (Tester): Add timeout indicator
  - [ ] If no message for 30 min, show "Session expired. Reload to restart."

**Testing After Completion**:
- [ ] Start conversation, wait 31 minutes, send message → "Session expired" response
- [ ] Cron job runs → stale sessions deleted from DB
- [ ] Concurrent conversations → each has independent timeout

---

### 7.4 Telegram Message Send Failure Recovery

**Issue**: If Telegram API fails, message is lost; no retry; customer never gets response.

**Required Deliverables**:
- [ ] Add message queue table
  - [ ] `message_queue`: `(id, business_id, chat_id, message_json, status, attempt_count, next_retry_at, error_message, created_at, processed_at)`
  - [ ] Status: `pending`, `sent`, `failed`, `exhausted`

- [ ] Backend: Queue messages before sending
  - [ ] `sendInternalMessages()` — Insert message into queue instead of direct send
  - [ ] Separate worker: Poll queue every 5 seconds
  - [ ] Worker logic:
    - [ ] Find all `status = 'pending'` where `next_retry_at <= now`
    - [ ] Try to send via Telegram API
    - [ ] If success: `status = 'sent'`, `processed_at = now`
    - [ ] If failure: `attempt_count++`, exponential backoff: `next_retry_at = now + (2^attempt_count) seconds`
    - [ ] If attempt_count > 5: `status = 'exhausted'`, log alert

- [ ] Monitoring: Alert if queue grows
  - [ ] If pending queue > 100 messages: Log error (Telegram API down?)
  - [ ] If failed queue > 50: Manual investigation needed

- [ ] Cleanup: Archive sent/exhausted messages
  - [ ] Monthly job: Move processed messages to `message_queue_archive` table (keep DB lean)

**Testing After Completion**:
- [ ] Telegram API returns 500 error → message queued, retry after 2s
- [ ] Retry succeeds → message sent, moved to `sent` status
- [ ] 5 retries all fail → message moved to `exhausted`, alert logged
- [ ] Queue worker restarts → picks up pending messages and retries

---

### 7.5 Bot Builder Mockup Channel Rendering (UI Fix)

**Issue**: Bot Builder's phone mockup shows same rendering regardless of selected channel (WhatsApp/Telegram/Instagram tabs).

**Root Cause**: PhoneMockup component not reading `selectedChannel` prop or not re-rendering on change.

**Required Deliverables**:
- [ ] Frontend: Identify selected channel in BuilderPage
  - [ ] Add state: `const [selectedChannel, setSelectedChannel] = useState('whatsapp')`
  - [ ] Add channel tabs: WhatsApp, Telegram, Instagram (same as Bot Tester)
  - [ ] Pass `selectedChannel` to `PhoneMockup` component

- [ ] Frontend: Update PhoneMockup to use `selectedChannel`
  - [ ] Props: Accept `selectedChannel` parameter
  - [ ] In render logic: Conditional button rendering per channel
    - [ ] WhatsApp: 1-3 buttons → reply buttons; 4-10 → list menu
    - [ ] Telegram: All buttons → inline keyboard (no reply buttons)
    - [ ] Instagram: Buttons → quick reply bubbles
  - [ ] Use theme lookup: `CHANNEL_THEMES[selectedChannel]` for colors/fonts

- [ ] Frontend: Test channel switching
  - [ ] Switch to Telegram → inline keyboard rendering
  - [ ] Switch to WhatsApp → reply/list buttons rendering
  - [ ] Switch back → correct rendering maintained

**Testing After Completion**:
- [ ] Click Telegram tab → phone shows inline keyboard style
- [ ] Click WhatsApp tab → phone shows reply/list button style
- [ ] Click Instagram tab → phone shows quick reply bubble style
- [ ] Switching tabs multiple times → correct rendering each time

---

## PHASE 8: Observability & Monitoring 📊

**Duration**: 1 week | **Effort**: Medium | **Risk**: Production blindness

**Objective**: Implement structured logging, metrics, alerts, and health checks. Achieve visibility into production behavior.

---

### 8.1 Structured Logging System

**Current State**: `console.log()` with inconsistent formats; impossible to debug production issues.

**Required Deliverables**:
- [ ] Backend: Install logging library
  - [ ] Add `winston` or `pino` npm package
  - [ ] Configure logger with file output: `application.log`, `error.log`, `audit.log`

- [ ] Create logger middleware
  - [ ] Log every API request: `{ timestamp, method, path, status, duration_ms, user_id, business_id }`
  - [ ] Log every state transition: `{ timestamp, businessId, customerId, channel, oldStep, newStep }`
  - [ ] Log every error: `{ timestamp, error, stack, context: { path, user_id, business_id } }`

- [ ] Structured log format
  - [ ] JSON: `{ timestamp: ISO8601, level, message, context, error?, stack? }`
  - [ ] Example: `{ timestamp: "2026-04-18T10:30:45Z", level: "error", message: "Telegram send failed", context: { businessId: 1, chatId: 123, error: "Rate limited" } }`

- [ ] Log levels
  - [ ] `info`: Normal operations (POST created, user logged in, etc.)
  - [ ] `warn`: Recoverable issues (retrying, fallback used)
  - [ ] `error`: Errors (failed send, invalid input)
  - [ ] `debug`: Detailed trace (disabled in production)

- [ ] Sensitive data masking
  - [ ] Logs must NEVER include: passwords, JWT tokens, Telegram bot tokens, full credit cards
  - [ ] Create `sanitize()` function to strip sensitive fields before logging
  - [ ] Test: Verify no passwords/tokens in logs

- [ ] Log rotation
  - [ ] Daily rotation: `application-2026-04-18.log`
  - [ ] Keep 30 days of logs locally; archive to S3 weekly
  - [ ] Max file size: 100MB per file

**Testing After Completion**:
- [ ] API request logged with duration
- [ ] Error logged with stack trace
- [ ] Logs contain no sensitive data (grep for token regex)
- [ ] Log files rotated daily
- [ ] Logs readable with `tail -f application.log`

---

### 8.2 Metrics & Monitoring

**Current State**: No visibility into performance, error rates, or system health.

**Required Deliverables**:
- [ ] Backend: Install metrics library
  - [ ] Add `prom-client` (Prometheus client for Node.js)

- [ ] Create metrics middleware
  - [ ] `http_request_duration_seconds` (histogram): Response time per endpoint
  - [ ] `http_requests_total` (counter): Request count by method/path/status
  - [ ] `http_errors_total` (counter): Error count by type
  - [ ] `telegram_polling_messages_received_total` (counter)
  - [ ] `telegram_polling_errors_total` (counter)
  - [ ] `submissions_created_total` (counter)
  - [ ] `submissions_failed_total` (counter)
  - [ ] `message_queue_length` (gauge): Current pending messages

- [ ] Add `/metrics` endpoint
  - [ ] Returns Prometheus-compatible output
  - [ ] Example: `http_request_duration_seconds_bucket{le="0.1",path="/api/business"} 5`

- [ ] Define SLA targets
  - [ ] API response p99 < 200ms
  - [ ] Error rate < 0.5%
  - [ ] Telegram polling uptime > 99.5%
  - [ ] Message queue depth < 50 (average)

**Testing After Completion**:
- [ ] `curl http://localhost:4000/metrics` returns Prometheus format
- [ ] Make API calls → metrics show request count increase
- [ ] Make 100 API calls → p99 latency calculated and visible in metrics
- [ ] Telegram API error → error counter increments

---

### 8.3 Health Checks

**Current State**: No way to know if app is alive.

**Required Deliverables**:
- [ ] Backend: Add `/api/health` endpoint (no auth required)
  - [ ] Returns: `{ status: "healthy"|"degraded"|"unhealthy", timestamp, checks: { database, telegram, messageQueue } }`
  - [ ] Checks performed:
    - [ ] Database: Can query `SELECT 1` in < 500ms?
    - [ ] Telegram polling: Last update received within last 5 minutes?
    - [ ] Message queue: Pending messages < 1000?
  - [ ] Status logic:
    - [ ] All checks OK → "healthy" (200)
    - [ ] 1 check failing → "degraded" (200)
    - [ ] >1 checks failing → "unhealthy" (503)

- [ ] Docker/PM2: Configure liveness probes
  - [ ] Health check every 30 seconds
  - [ ] If 3 consecutive failures → restart container/process

- [ ] Monitoring: Set up alerts
  - [ ] Alert if `/api/health` returns 503 for > 5 minutes
  - [ ] Alert if response time > 1 second
  - [ ] Send to ops Slack channel

**Testing After Completion**:
- [ ] `curl http://localhost:4000/api/health` returns `{ status: "healthy" }`
- [ ] Stop database → `status: "degraded"` then `"unhealthy"`
- [ ] Restart database → back to `"healthy"`
- [ ] PM2 restarts app if health check fails

---

### 8.4 Error Tracking & Reporting

**Current State**: Errors logged but no centralized tracking or alerting.

**Required Deliverables**:
- [ ] Backend: Catch all unhandled errors
  - [ ] Global error handler: `app.use((err, req, res, next) => {...})`
  - [ ] Log with full context: path, method, user_id, business_id, stack
  - [ ] Return 500 with generic message (never expose internal errors to client)

- [ ] Optional: Integrate error tracking service
  - [ ] Install `sentry` (free tier available) or similar
  - [ ] On every error: Send to Sentry with context
  - [ ] Sentry dashboards show: error rate, affected users, stack traces

- [ ] Create error response format
  - [ ] `{ error: "Internal server error", errorId: "uuid-123", timestamp }`
  - [ ] User can reference errorId in support tickets

- [ ] Frontend: Catch React errors
  - [ ] Error boundary component: Wraps entire app
  - [ ] On error: Log to backend, show user-friendly message
  - [ ] Link error to support chat/form

**Testing After Completion**:
- [ ] Trigger error in API route → logged with full stack trace
- [ ] Unhandled promise rejection → caught and logged
- [ ] React component error → error boundary catches it
- [ ] Error appears in Sentry (if integrated)

---

## PHASE 9: UI Polish (Public + Admin) 🎨

**Duration**: 1 week | **Effort**: Medium | **Risk**: User churn and weak conversion

**Objective**: Upgrade visual quality and usability of Landing, Login, Register, and Business Admin Panel so the product looks premium, consistent, and conversion-focused.

---

### 9.1 Landing Page Polish

**Required Deliverables**:
- [ ] Visual system and design tokens
  - [ ] Define color variables (primary, neutral, semantic states)
  - [ ] Define typography scale (H1-H6, body, caption)
  - [ ] Define spacing system (4/8px grid)
  - [ ] Add reusable UI primitives (buttons, cards, badges)

- [ ] Improve conversion-focused structure
  - [ ] Hero with clear value proposition + CTA
  - [ ] Social proof section (testimonials/logo row)
  - [ ] Features with real product screenshots
  - [ ] Pricing teaser + "Start free" CTA
  - [ ] FAQ section + final CTA strip

- [ ] Improve quality details
  - [ ] Better responsive behavior (mobile-first and tablet)
  - [ ] Accessible color contrast (WCAG AA)
  - [ ] Reduced motion support for users with preferences
  - [ ] SEO metadata (title, description, social preview tags)

**Testing After Completion**:
- [ ] Lighthouse performance >= 85 (mobile)
- [ ] Lighthouse accessibility >= 90
- [ ] CTA visible and usable on all viewport sizes
- [ ] No layout shift on first load (CLS < 0.1)

---

### 9.2 Login/Register UX Polish

**Required Deliverables**:
- [ ] Shared auth layout and visual consistency
  - [ ] Use same card shell for Login and Register
  - [ ] Clear field labels + helper text
  - [ ] Consistent error and success states

- [ ] Better auth UX
  - [ ] Inline validation messages per field
  - [ ] Password strength hint on register
  - [ ] Loading states for submit buttons
  - [ ] Friendly empty/error copy (not raw backend errors)

- [ ] Security and trust cues
  - [ ] Add terms/privacy links
  - [ ] Add brief security note (encrypted/auth protected)
  - [ ] Ensure no sensitive value is echoed back in UI

**Testing After Completion**:
- [ ] Register form prevents weak/invalid input before submit
- [ ] Login failures show human-readable error copy
- [ ] Keyboard-only navigation works end-to-end
- [ ] Screen reader labels present for all inputs/buttons

---

### 9.3 Business Admin Panel Polish

**Required Deliverables**:
- [ ] Improve information hierarchy
  - [ ] Normalize page headers and breadcrumbs
  - [ ] Add compact summary cards on dashboard
  - [ ] Add clear empty states for all major modules

- [ ] Improve usability
  - [ ] Table search/filter/sort for submissions and staff
  - [ ] Sticky action bars in long forms (save/cancel)
  - [ ] Confirmation modals for destructive actions
  - [ ] Toast notifications for successful actions

- [ ] Performance polish
  - [ ] Skeleton loading states for data-heavy pages
  - [ ] Prevent jank while switching builder/tester tabs
  - [ ] Improve first-contentful paint for admin pages

**Testing After Completion**:
- [ ] Business owner can complete top 5 tasks without confusion
- [ ] Core panel pages load with skeletons, no blank flash
- [ ] Form and table actions return visible feedback
- [ ] Mobile admin minimum support at 360px width

---

## PHASE 10: SaaS Owner Panel + Channel Provisioning Control 🧭

**Duration**: 1 week | **Effort**: High | **Risk**: Revenue and support operations

**Objective**: Add platform-owner controls for plans, tenants, approvals, and enforce one-time business channel setup for Telegram Bot, WhatsApp Number, and Instagram Page.

---

### 10.1 Platform Owner SaaS Panel

**Required Deliverables**:
- [ ] Add platform-owner role and protected routes
  - [ ] Role: `platform_owner`
  - [ ] Dedicated owner area: `/owner/*`
  - [ ] Business users cannot access owner APIs/pages

- [ ] Tenant management module
  - [ ] List all businesses (status, plan, created date)
  - [ ] View business profile and usage snapshot
  - [ ] Suspend/reactivate tenant (soft status)

- [ ] Plan management module
  - [ ] CRUD plan catalog (name, monthly price, limits)
  - [ ] Assign/change plan per tenant
  - [ ] Track plan change history (audit)

- [ ] Revenue and operations module
  - [ ] Basic MRR/active tenant counters
  - [ ] Trial/expired plan visibility
  - [ ] Support queue visibility for channel-change requests

**Testing After Completion**:
- [ ] Platform owner can manage plans and tenant status
- [ ] Business owner cannot access owner panel or APIs
- [ ] Plan changes are auditable with who/when metadata

---

### 10.2 One-Time Channel Setup Per Business

**Business Rule (Locked)**:
- [ ] Each business can set these integration identifiers only once from self-service UI:
  - [ ] Telegram Bot Token
  - [ ] WhatsApp Number/Phone Number ID
  - [ ] Instagram Page ID (or account binding)
- [ ] Any second change requires support intervention and owner approval.

**Required Deliverables**:
- [ ] Database schema for channel configuration governance
  - [ ] Add fields: `telegram_set_at`, `whatsapp_set_at`, `instagram_set_at`
  - [ ] Add fields: `telegram_locked`, `whatsapp_locked`, `instagram_locked` (boolean)
  - [ ] Add `channel_change_requests` table:
    - [ ] `(id, business_id, channel, requested_value_masked, reason, status, requested_by, approved_by, approved_at, created_at)`

- [ ] Business panel UX and API behavior
  - [ ] First-time set: allowed and persisted
  - [ ] After first save: field becomes read-only with lock label
  - [ ] Show CTA: "Need to change? Contact support"
  - [ ] Endpoint returns 409 Conflict on second direct update attempt

- [ ] Support workflow
  - [ ] Business owner can create channel change request ticket
  - [ ] Platform owner can approve/reject request from owner panel
  - [ ] On approval: unlock channel once, apply new value, re-lock
  - [ ] All actions logged in audit trail

- [ ] Security and masking
  - [ ] Mask sensitive values in UI and logs
  - [ ] Never expose full bot tokens after first save

**Testing After Completion**:
- [ ] Business can set each channel exactly once from self-service UI
- [ ] Second update attempt blocked with clear error + support path
- [ ] Approved support request updates value once and re-locks field
- [ ] Audit log records request lifecycle and approver identity

---

### 10.3 Plan-Based Feature Gates

**Required Deliverables**:
- [ ] Define per-plan limits:
  - [ ] Number of active flows
  - [ ] Number of staff members
  - [ ] Monthly submission cap
  - [ ] Channel availability by plan (if needed)

- [ ] Enforce limits in backend
  - [ ] Return 403/402-style error when over plan limit
  - [ ] Include actionable upgrade message

- [ ] Enforce limits in frontend
  - [ ] Disable over-limit actions with clear rationale
  - [ ] Show usage counters in settings/billing page

**Testing After Completion**:
- [ ] Plan limits enforced consistently in API and UI
- [ ] Upgrade messaging is shown before hard blocks when possible
- [ ] Owner panel can override limits only with audit trail

---

## PHASE 11: Testing & Quality Assurance 🧪

**Duration**: 1 week | **Effort**: High | **Risk**: Missing critical bugs

**Objective**: Implement automated tests, manual testing checklist, performance benchmarks, security review. Achieve > 60% code coverage.

---

### 11.1 Unit Tests

**Required Deliverables**:
- [ ] Setup Jest testing framework
  - [ ] Add `jest`, `@babel/preset-react` npm packages
  - [ ] Create `jest.config.js` with proper setup

- [ ] Backend tests: `server/src/__tests__/`
  - [ ] `auth.test.js` — JWT generation, refresh, expiration
  - [ ] `validation.test.js` — Input validators (email, password, button label, etc.)
  - [ ] `bot-engine.test.js` — State transitions, message building, deduplication
  - [ ] `encrypt.test.js` — Encryption/decryption of fields
  - [ ] **Minimum**: 15 test cases per file; > 60% coverage goal

- [ ] Frontend tests: `client/src/__tests__/`
  - [ ] `auth.test.js` — Login/logout flow, JWT handling
  - [ ] `api.test.js` — API client (mocking fetch)
  - [ ] `PhoneMockup.test.js` — Rendering per channel, debounce
  - [ ] `BuilderPage.test.js` — Save/load flow, validation warnings

**Test Command**:
```bash
cd server && npm test
cd ../client && npm test
```

**Testing After Completion**:
- [ ] `npm test` runs all tests successfully
- [ ] Coverage report shows > 60%
- [ ] Tests pass on CI/CD (GitHub Actions)

---

### 11.2 Integration Tests

**Required Deliverables**:
- [ ] Backend: Database integration tests
  - [ ] `api.integration.test.js` — Test full API flows
    - [ ] Register → Login → Create business → Load builder → Save builder → List submissions
    - [ ] Use SQLite in-memory DB for speed
  
- [ ] Backend: Bot engine integration
  - [ ] `bot-engine.integration.test.js` — Full conversation flows
    - [ ] Welcome → Menu selection → Info → Flow entry → Step 1 → Step 2 → Submission
    - [ ] Telegram message → processed → response → queued → sent

- [ ] Frontend: Component integration
  - [ ] `app.integration.test.js` — Login flow → Dashboard → Create business → Builder

**Test Command**:
```bash
npm run test:integration
```

---

### 11.3 End-to-End Tests

**Required Deliverables**:
- [ ] E2E test framework: `cypress` or `playwright`
  - [ ] Add `cypress` npm package

- [ ] Critical user journeys
  - [ ] `e2e/auth.cy.js` — Register → Login → Logout
  - [ ] `e2e/builder.cy.js` — Create business → Load template → Save → Publish
  - [ ] `e2e/submission.cy.js` — Customer flow (tester) → Complete booking → Submission created
  - [ ] `e2e/staff.cy.js` — Add staff → Assign submission → Update status

**Test Command**:
```bash
npm run test:e2e
```

---

### 11.4 Performance Testing

**Required Deliverables**:
- [ ] Benchmark critical endpoints
  - [ ] Load builder: < 2 seconds
  - [ ] Save builder: < 2 seconds
  - [ ] List submissions (100 items): < 1 second
  - [ ] Submit form: < 1 second
  - [ ] Telegram send: < 3 seconds

- [ ] Load test: Simulate concurrent users
  - [ ] Tool: `k6` or `artillery`
  - [ ] Scenario: 100 users submitting forms concurrently
  - [ ] Verify: No errors, response time < 5s p99

**Test Command**:
```bash
k6 run load-test.js --vus 100 --duration 5m
```

---

### 11.5 Security Testing Checklist

**Required Deliverables**:
- [ ] OWASP Top 10 Review
  - [ ] A1: Injection — All inputs validated? No SQL injection possible? ✅
  - [ ] A2: Broken Authentication — JWT secure? Refresh tokens rotated? ✅
  - [ ] A3: Sensitive Data Exposure — Passwords hashed? Tokens encrypted? HTTPS only? ✅
  - [ ] A4: XML External Entities (XXE) — N/A (no XML parsing)
  - [ ] A5: Broken Access Control — Tenant isolation enforced? Users can't access other user's data? ✅
  - [ ] A6: Security Misconfiguration — No debug mode in prod? Dependencies up-to-date? ✅
  - [ ] A7: XSS — React auto-escapes? No innerHTML? ✅
  - [ ] A8: Insecure Deserialization — Not deserializing untrusted JSON? ✅
  - [ ] A9: Using Components with Known Vulnerabilities — No known CVEs in deps? ✅
  - [ ] A10: Insufficient Logging & Monitoring — Errors logged? Alerts set? ✅

- [ ] Manual penetration testing
  - [ ] Try to access `/api/business/2` as user 1 → 403? ✅
  - [ ] Try SQL injection in name field → rejected? ✅
  - [ ] Try XSS payload in button label → escaped in UI? ✅
  - [ ] Try to use expired JWT → 401? ✅
  - [ ] Try to brute-force login (10 attempts/sec) → rate limited to 401? ✅

- [ ] Dependency audit
  - [ ] Run `npm audit` — Fix all high/critical vulnerabilities
  - [ ] Keep dependencies up-to-date (monthly reviews)

**Testing After Completion**:
- [ ] `npm audit` shows 0 vulnerabilities
- [ ] All OWASP checks pass
- [ ] Penetration test results documented

---

## PHASE 12: Operations & Deployment 🚀

**Duration**: 1 week | **Effort**: Medium | **Risk**: Production outages

**Objective**: Package app for production, set up monitoring, create runbooks, establish deployment process.

---

### 12.1 Docker Containerization

**Required Deliverables**:
- [ ] Create `Dockerfile` for server
  - [ ] Base image: `node:18-alpine`
  - [ ] Install dependencies, copy code, set working directory
  - [ ] Expose port 4000
  - [ ] Health check: `curl http://localhost:4000/api/health`
  - [ ] Entrypoint: `node src/server.js`

- [ ] Create `Dockerfile` for client
  - [ ] Build stage: `npm run build` → generate `/dist/`
  - [ ] Serve stage: Nginx to serve `/dist/` on port 80
  - [ ] Return `/index.html` for all routes (React SPA)

- [ ] Create `docker-compose.yml`
  - [ ] Services: `server`, `client`, `db` (if using external DB; skip for SQLite)
  - [ ] Volumes: Mount `/data/` for database persistence
  - [ ] Networks: Internal network for server-client communication
  - [ ] Environment: Pass `.env` vars

- [ ] Test locally
  - [ ] `docker-compose up` → both services start
  - [ ] Visit `http://localhost:3000` (client) → can login, use app
  - [ ] API calls work: `curl http://localhost:4000/api/health`

---

### 12.2 Production Environment Setup

**Required Deliverables**:
- [ ] Create `.env.example`
  - [ ] List all required vars with descriptions
  - [ ] Example values (safe for public view)
  - [ ] Document: Which are secrets (never commit)

- [ ] Create `.env.production` (local, never commit)
  - [ ] Actual values for production
  - [ ] Secrets: Telegram bot token, encryption key, JWT secret

- [ ] Create `config.js` or use process.env
  - [ ] Load env vars on startup
  - [ ] Validate all required vars present
  - [ ] Error if missing

**Environment Variables**:
```
Node:
- NODE_ENV=production|staging|development
- PORT=4000
- LOG_LEVEL=info|debug
- CORS_ORIGINS=https://app.example.com

Encryption:
- ENCRYPTION_KEY=<hex-string-32-chars>
- JWT_SECRET=<random-secret>

Telegram:
- TELEGRAM_BOT_TOKEN=<bot-token> (optional; can also be per-business)

Database:
- DATABASE_URL=sqlite:///data/data.db (or PostgreSQL for scale)

Backups:
- BACKUP_S3_BUCKET=botdesk-backups
- BACKUP_S3_REGION=us-east-1
- AWS_ACCESS_KEY_ID=...
- AWS_SECRET_ACCESS_KEY=...
```

---

### 12.3 Database Backups

**Required Deliverables**:
- [ ] Create backup script: `scripts/backup.js`
  - [ ] Checkpoint SQLite database
  - [ ] Compress to `.tar.gz`
  - [ ] Upload to S3 with timestamp: `botdesk-backup-2026-04-18-10-30-45.tar.gz`
  - [ ] Keep last 30 days locally; archive older to cheaper storage

- [ ] Schedule backups
  - [ ] Daily at 2 AM UTC via cron: `0 2 * * * /usr/local/bin/backup.sh`
  - [ ] Before deploys: Manual backup before any production change

- [ ] Test restores
  - [ ] Weekly: Download backup → restore to staging DB → verify data intact
  - [ ] Document restore procedure

- [ ] Backup verification
  - [ ] Check backup file size (should be > 100KB for active DB)
  - [ ] Verify can decompress
  - [ ] Spot-check data (query sample records)

---

### 12.4 Monitoring & Alerting Setup

**Required Deliverables**:
- [ ] Configure monitoring dashboards
  - [ ] Tool: Grafana (open source) or DataDog (SaaS)
  - [ ] Dashboards:
    - [ ] Request rate, error rate, response times (per endpoint)
    - [ ] Telegram polling status, message send success rate
    - [ ] Database size, query performance, connection count
    - [ ] Message queue depth, failed messages
    - [ ] CPU, memory, disk usage

- [ ] Set up alerting rules
  - [ ] Alert if `/api/health` returns 503 for > 5 min → Slack #ops-alerts
  - [ ] Alert if error rate > 1% for > 5 min → Slack
  - [ ] Alert if response p99 > 1s for > 10 min → Slack
  - [ ] Alert if message queue > 100 → Slack
  - [ ] Alert if disk usage > 80% → Slack
  - [ ] Alert if backup fails → Email ops team

- [ ] Integrate with Slack
  - [ ] Webhook URL for alerts
  - [ ] Rich notification format with links to dashboards

---

### 12.5 Deployment Process

**Required Deliverables**:
- [ ] Create deployment checklist (before every production release)
  - [ ] [ ] All tests pass locally (`npm test`, `npm run test:e2e`)
  - [ ] [ ] No uncommitted changes
  - [ ] [ ] Create backup (manual)
  - [ ] [ ] Deploy to staging first (test there)
  - [ ] [ ] Verify `/api/health` returns healthy on staging
  - [ ] [ ] Run smoke tests on staging
  - [ ] [ ] Get approval from 2nd set of eyes
  - [ ] [ ] Deploy to production
  - [ ] [ ] Monitor logs for errors (first 10 minutes)
  - [ ] [ ] Manually test critical flows (login, submit form, check submission)
  - [ ] [ ] Alert team in Slack: "Deployment complete"

- [ ] Create rollback plan
  - [ ] If production error: Stop container, restore previous version, restore latest backup
  - [ ] Keep last 2 Docker images tagged
  - [ ] Procedure: `docker stop app && docker run prev-image ...`

- [ ] Create deployment script (optional automation)
  - [ ] `scripts/deploy.sh` — Pulls latest code, runs tests, builds images, restarts containers
  - [ ] Safety: Requires manual approval between each step

---

### 12.6 Operational Runbooks

**Required Deliverables**:
- [ ] Create `docs/RUNBOOKS.md`
  - [ ] Scenario: "App not responding"
    - [ ] Check logs: `tail -f /var/log/app/error.log`
    - [ ] Check `/api/health`: `curl https://app.example.com/api/health`
    - [ ] Restart app: `docker restart botdesk-server`
    - [ ] Check Telegram status: "Last polling update 5 min ago?"
  
  - [ ] Scenario: "Database corrupted"
    - [ ] Restore from latest backup: `scripts/restore-backup.sh 2026-04-18.tar.gz`
    - [ ] Verify data: Spot-check dashboard, submissions list
    - [ ] Alert team, post-mortem
  
  - [ ] Scenario: "Telegram bot stopped responding"
    - [ ] Check bot token valid: `curl https://api.telegram.org/botTOKEN/getMe`
    - [ ] Restart polling: `pm2 restart telegram-bot`
    - [ ] Check rate limit: "Polling too fast?"
    - [ ] Escalate to Telegram support if API issue
  
  - [ ] Scenario: "Message queue growing (> 100 pending)"
    - [ ] Check Telegram API status
    - [ ] Restart telegram-bot: `pm2 restart telegram-bot`
    - [ ] Check logs for errors
    - [ ] If persists, disable polling (manual mode) + alert customer

- [ ] Create incident response procedures
  - [ ] Post-mortem template (what failed, why, how to prevent)
  - [ ] Who to notify (ops, engineering, customer support)
  - [ ] Status page updates

---

### 12.7 Documentation

**Required Deliverables**:
- [ ] API Documentation
  - [ ] Generate from code: swagger/OpenAPI (optional but recommended)
  - [ ] Or manually: `docs/API.md` with every endpoint, params, response examples

- [ ] Deployment Guide
  - [ ] How to deploy locally for dev
  - [ ] How to deploy to staging
  - [ ] How to deploy to production

- [ ] Architecture Diagram
  - [ ] Data flow: Client → API → DB → Telegram
  - [ ] Deployment architecture: Load balancer → app instances → DB

- [ ] User Guide
  - [ ] How to create a bot (screenshots)
  - [ ] How to connect Telegram
  - [ ] How to manage submissions

- [ ] FAQ
  - [ ] Common issues + solutions
  - [ ] Performance tips
  - [ ] Troubleshooting

---

## PHASE 13: Billing, Plans & Revenue Ops 💳

**Duration**: 1 week | **Effort**: High | **Risk**: Revenue leakage and plan abuse

**Objective**: Implement complete subscription lifecycle and billing operations so plan enforcement, payment status, and revenue reporting are trustworthy.

---

### 13.1 Subscription Lifecycle

**Required Deliverables**:
- [ ] Define lifecycle statuses: `trial`, `active`, `grace`, `past_due`, `suspended`, `cancelled`
- [ ] Add `subscriptions` table with status history and renewal dates
- [ ] Add trial rules (start/end date, one-time trial per business)
- [ ] Add grace period rules for failed payments (e.g., 7 days)

**Testing After Completion**:
- [ ] New business starts in correct default status
- [ ] Expired trial transitions correctly
- [ ] Past due transitions to suspended after grace period

---

### 13.2 Payment Webhooks & Reconciliation

**Required Deliverables**:
- [ ] Verify and store payment provider webhooks idempotently
- [ ] Add `billing_events` table with unique provider event id
- [ ] Reconcile payment events to subscription status updates
- [ ] Add retry worker for failed webhook processing

**Testing After Completion**:
- [ ] Duplicate webhook event does not double-apply state changes
- [ ] Failed webhook processing retries and succeeds
- [ ] Paid invoice always results in active subscription

---

### 13.3 Plan Enforcement and Invoices

**Required Deliverables**:
- [ ] Enforce plan caps by API middleware (hard limits)
- [ ] Add warning thresholds at 80% and 95% usage (soft limits)
- [ ] Store invoice metadata and downloadable links
- [ ] Add billing page in business panel (plan, usage, invoices)

**Testing After Completion**:
- [ ] Over-limit behavior consistent across UI and API
- [ ] Invoice list is visible to authorized users only
- [ ] Upgrade immediately increases usable limits

---

## PHASE 14: Compliance, Privacy & Data Governance 🛡️

**Duration**: 1 week | **Effort**: Medium | **Risk**: Legal and trust exposure

**Objective**: Add policy-driven data handling, privacy workflows, and immutable auditability.

---

### 14.1 Data Retention & Deletion Policy

**Required Deliverables**:
- [ ] Define retention windows for sessions, submissions, logs, and media
- [ ] Add scheduled cleanup jobs per data category
- [ ] Add legal hold flag to prevent accidental cleanup
- [ ] Document policy in `docs/DATA_POLICY.md`

**Testing After Completion**:
- [ ] Expired records are deleted/archived on schedule
- [ ] Legal-hold records remain untouched

---

### 14.2 Privacy Requests (Export/Delete)

**Required Deliverables**:
- [ ] Add customer data export endpoint (JSON package)
- [ ] Add customer data delete/anonymize endpoint
- [ ] Add request workflow with owner approval and audit logs
- [ ] Return signed download URLs for exports with short TTL

**Testing After Completion**:
- [ ] Export includes all scoped customer records
- [ ] Delete/anonymize removes identifiable data correctly
- [ ] Every request is audited end-to-end

---

### 14.3 Compliance Controls

**Required Deliverables**:
- [ ] Enforce consent capture and policy versioning
- [ ] Add immutable audit log chain for security-sensitive actions
- [ ] Add PII masking defaults in logs and UI
- [ ] Add periodic compliance review checklist (monthly)

**Testing After Completion**:
- [ ] Policy version tied to each consent event
- [ ] Audit log tampering is detectable
- [ ] PII not exposed in logs under normal operations

---

## PHASE 15: Release Management & Environment Governance 🚦

**Duration**: 1 week | **Effort**: Medium | **Risk**: Unsafe releases and regressions

**Objective**: Standardize safe change rollout across dev/staging/production with approvals and feature flags.

---

### 15.1 Environment Separation

**Required Deliverables**:
- [ ] Separate credentials and databases for dev/staging/prod
- [ ] Enforce environment-specific secrets and config validation
- [ ] Add startup guard to prevent accidental prod writes from non-prod

**Testing After Completion**:
- [ ] Staging cannot access production credentials/data
- [ ] Misconfigured environment fails fast on startup

---

### 15.2 Release Gates

**Required Deliverables**:
- [ ] Add mandatory migration review checklist before deploy
- [ ] Add protected branch + PR approvals for release branches
- [ ] Add deployment approval matrix by change type
- [ ] Add canary rollout for high-risk changes

**Testing After Completion**:
- [ ] High-risk deploy requires explicit approvals
- [ ] Canary rollback works without full outage

---

### 15.3 Feature Flags

**Required Deliverables**:
- [ ] Implement feature flag table + cache
- [ ] Scope flags by tenant and environment
- [ ] Add kill-switch flags for risky integrations
- [ ] Owner panel section for flag management (audited)

**Testing After Completion**:
- [ ] Feature can be enabled for one tenant only
- [ ] Kill-switch disables target flow without redeploy

---

## PHASE 16: Support Operations & SLA Management 🎧

**Duration**: 1 week | **Effort**: Medium | **Risk**: Poor customer retention

**Objective**: Build formal support process, SLA targets, and escalation procedures.

---

### 16.1 SLA Framework

**Required Deliverables**:
- [ ] Define incident severities: P1/P2/P3/P4
- [ ] Define response and resolution targets per severity
- [ ] Define ownership matrix (on-call, engineering, product)
- [ ] Add SLA dashboard in owner panel

**Testing After Completion**:
- [ ] New incidents automatically get severity + SLA timer
- [ ] Breaches are visible in dashboard metrics

---

### 16.2 In-App Support Workflow

**Required Deliverables**:
- [ ] Add support ticket creation in business panel
- [ ] Auto-attach business id, plan, and environment metadata
- [ ] Add ticket status lifecycle: `open`, `in_progress`, `blocked`, `resolved`
- [ ] Add escalation rules for P1/P2 tickets

**Testing After Completion**:
- [ ] Business owners can submit and track tickets
- [ ] Escalations route correctly based on severity

---

### 16.3 Incident Communications

**Required Deliverables**:
- [ ] Add customer incident communication templates
- [ ] Add status update cadence checklist during incidents
- [ ] Add postmortem template with action owner + due date

**Testing After Completion**:
- [ ] Incident timeline updates are consistently recorded
- [ ] Postmortem actions are tracked to completion

---

## PHASE 17: Product Analytics & Growth Instrumentation 📈

**Duration**: 1 week | **Effort**: Medium | **Risk**: Low visibility into growth

**Objective**: Instrument key funnels and SaaS KPIs for product and growth decisions.

---

### 17.1 Activation & Funnel Tracking

**Required Deliverables**:
- [ ] Track funnel: signup → first bot publish → first live submission
- [ ] Add event taxonomy and naming standard
- [ ] Add analytics dashboard for conversion rates by step
- [ ] Track drop-offs by template and channel

**Testing After Completion**:
- [ ] Funnel numbers match database truth for sample tenants
- [ ] Drop-off points visible by week and channel

---

### 17.2 SaaS KPI Reporting

**Required Deliverables**:
- [ ] Add MRR, churn, expansion, ARPA metrics
- [ ] Segment KPIs by plan and cohort
- [ ] Add retention reports (week 1, 4, 8)
- [ ] Add owner panel KPI cards + trends

**Testing After Completion**:
- [ ] KPI calculations validated against billing records
- [ ] Cohort retention updates correctly over time

---

### 17.3 Channel Performance Analytics

**Required Deliverables**:
- [ ] Track response success rates per channel
- [ ] Track conversion rates by channel and template
- [ ] Add failed-message attribution dashboard
- [ ] Add exportable reports for business owners

**Testing After Completion**:
- [ ] Channel metrics align with message logs and submissions
- [ ] Reports export correctly with tenant scoping

---

## PHASE 18: Business Continuity & Disaster Recovery 🌐

**Duration**: 1 week | **Effort**: Medium | **Risk**: High impact during outages

**Objective**: Formalize resilience targets and prove recovery capabilities through drills.

---

### 18.1 Recovery Objectives

**Required Deliverables**:
- [ ] Define RTO and RPO targets by service component
- [ ] Classify critical vs non-critical services
- [ ] Map dependency tree (Meta, Telegram, payment, storage)
- [ ] Publish continuity playbook

**Testing After Completion**:
- [ ] RTO/RPO documented and approved by owner team
- [ ] Dependency mapping validated during tabletop exercise

---

### 18.2 Disaster Recovery Drills

**Required Deliverables**:
- [ ] Run quarterly restore drill from backups
- [ ] Simulate provider outage (Meta/Telegram) and execute fallback
- [ ] Measure recovery duration and data loss
- [ ] Track corrective actions from each drill

**Testing After Completion**:
- [ ] Restore drill meets RTO/RPO targets
- [ ] Outage simulation proves fallback communication path

---

### 18.3 Resilience Hardening

**Required Deliverables**:
- [ ] Add fail-safe modes (read-only owner panel during severe incident)
- [ ] Add circuit breakers for unstable external APIs
- [ ] Add degraded-mode UX messaging in business panel
- [ ] Add emergency contacts + escalation runbook updates

**Testing After Completion**:
- [ ] Circuit breaker prevents cascading failures
- [ ] Degraded mode keeps core visibility available
- [ ] Escalation contacts and runbook are current

---

## SUMMARY: Pre-Launch Checklist

**Before any production access (Week 14):**

### CRITICAL ✅ MUST PASS
- [ ] Authentication: Real JWT, passwords hashed
- [ ] Multi-tenancy: 2 businesses tested, data isolated
- [ ] Double-click bug fixed: Tested with rapid clicks
- [ ] Duplicate message bug fixed: Single click = 1 response
- [ ] HTTPS enforced: All traffic encrypted
- [ ] Rate limiting active: Spam prevented
- [ ] Input validation: All fields validated
- [ ] Database backups: Daily automated backups to S3
- [ ] Logging: Structured JSON logs, no secrets leaked
- [ ] Health check: `/api/health` endpoint working
- [ ] Monitoring: Alerts set for key metrics

### HIGH 🟡 RECOMMENDED
- [ ] Tests pass: > 60% coverage
- [ ] No vulnerabilities: `npm audit` clean
- [ ] Documentation: API docs complete
- [ ] Load tested: Can handle 100 concurrent users
- [ ] Error tracking: Sentry or similar integrated
- [ ] Runbooks: Ops team trained

### LAUNCH GO/NO-GO 🚀
```
IF (CRITICAL + HIGH) ALL PASS:
  ✅ LAUNCH TO PRODUCTION
  ELSE:
  ❌ DELAY — Fix failures first
```

---

## PHASE DEPENDENCIES

```
Phase 6 (Security) ← Must complete first
    ↓
Phase 7 (Bug fixes) ← Depends on Phase 6
    ↓
Phase 8 (Observability) ← Can run parallel with Phase 7
    ↓
Phase 9 (UI Polish) ← Depends on Phase 6 baseline auth
  ↓
Phase 10 (Owner Panel + Channel Lock) ← Depends on Phase 6 + 9
  ↓
Phase 11 (Testing) ← Depends on Phase 6-10
    ↓
Phase 12 (Deployment) ← Depends on Phase 6-11
  ↓
Phase 13 (Billing) ← Depends on Phase 10 + 12
  ↓
Phase 14 (Compliance) ← Depends on Phase 13
  ↓
Phase 15 (Release Governance) ← Depends on Phase 12
  ↓
Phase 16 (Support + SLA) ← Depends on Phase 12 + 15
  ↓
Phase 17 (Analytics) ← Depends on Phase 13 + 16
  ↓
Phase 18 (Continuity) ← Depends on Phase 12-17
```

**Parallel possible**: 6, then (7+8+9 together), then 10, then 11, then 12, then (13+15), then 14, then 16, then 17, then 18

---

## RESOURCE ESTIMATES

| Phase | Duration | Dev Hours | QA Hours | Deployment |
|---|---|---|---|---|
| 6 (Security) | 2 weeks | 60 | 20 | 4 |
| 7 (Bugs) | 1 week | 30 | 15 | 2 |
| 8 (Observability) | 1 week | 25 | 10 | 2 |
| 9 (UI Polish) | 1 week | 30 | 15 | 2 |
| 10 (Owner Panel + Channel Lock) | 1 week | 40 | 20 | 2 |
| 11 (Testing) | 1 week | 40 | 30 | 2 |
| 12 (Operations) | 1 week | 20 | 10 | 8 |
| 13 (Billing + Revenue Ops) | 1 week | 30 | 15 | 2 |
| 14 (Compliance + Data Governance) | 1 week | 25 | 15 | 2 |
| 15 (Release Governance) | 1 week | 20 | 10 | 4 |
| 16 (Support + SLA Ops) | 1 week | 20 | 15 | 2 |
| 17 (Analytics + Growth) | 1 week | 25 | 15 | 2 |
| 18 (Continuity + DR) | 1 week | 20 | 15 | 4 |
| **TOTAL** | **~14 weeks** | **~385 hours** | **~205 hours** | **~38 hours** |

**Recommended**: 2-3 developers, 1 QA, 1 DevOps engineer

---

**Next Step**: Start Phase 6 — Security Hardening. If budget/timeline is tight, start with 6.1 (Authentication) + 6.2 (Multi-tenancy) as absolute minimum before any production deploy.

Feel free to reference this roadmap after each phase to verify all checklist items complete.
