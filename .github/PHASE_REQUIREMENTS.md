# Phase Requirements — What You Need Before You Build

> **Purpose**: For each phase, this file lists every **external dependency** you must obtain, create, sign up for, or configure **before** you can start implementation. If a phase says "nothing external needed" — you can start coding immediately with what you already have.
>
> **Format**: ✅ = already available in the project | 🔑 = you need to get this | 💳 = requires payment/account | 📝 = document/decision you must prepare

---

## PHASE 6: Security Hardening

### NPM Packages to Install (Server)

| Package | Why | Install |
|---|---|---|
| 🔑 `jsonwebtoken` | JWT token creation + verification | `npm i jsonwebtoken` |
| 🔑 `bcrypt` | Password hashing (never store plaintext) | `npm i bcrypt` |
| 🔑 `express-validator` or `zod` | Input validation on all endpoints | `npm i express-validator` or `npm i zod` |
| 🔑 `helmet` | Security headers (HSTS, CSP, X-Frame, etc.) | `npm i helmet` |
| 🔑 `express-rate-limit` | Rate limiting / brute-force protection | `npm i express-rate-limit` |
| 🔑 `dotenv` | Load `.env` file for secrets | `npm i dotenv` |

### Secrets / Credentials You Must Generate

| Secret | How to Generate | Where to Store |
|---|---|---|
| 🔑 `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` | `.env` file (never commit) |
| 🔑 `ENCRYPTION_KEY` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | `.env` file (never commit) |

### SSL/TLS Certificate

| Environment | What You Need | How to Get It |
|---|---|---|
| 🔑 Local Dev | Self-signed cert (optional — can skip HTTPS on localhost) | `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out cert.pem` |
| 🔑 Staging/Production | Real SSL certificate | Free via [Let's Encrypt](https://letsencrypt.org/) + Certbot auto-renewal |

### Files You Must Create

| File | Purpose |
|---|---|
| 🔑 `.env` | Store all secrets (JWT_SECRET, ENCRYPTION_KEY, etc.) |
| 🔑 `.env.example` | Template with placeholder values (safe to commit) |
| 🔑 `.gitignore` entry | Add `.env` to `.gitignore` so secrets never get committed |

### Nothing External Needed For

- ✅ `crypto` module — built into Node.js (for encryption at rest)
- ✅ `better-sqlite3` — already installed (for new auth tables)
- ✅ `express` — already installed (for middleware)

---

## PHASE 7: Critical Bug Fixes

### NPM Packages to Install

| Package | Why | Install |
|---|---|---|
| 🔑 `lodash-es` (or none) | Debounce for double-click fix (optional — can use native `setTimeout`) | `npm i lodash-es` (client) |
| 🔑 `node-cron` or `node-schedule` | Session cleanup cron job | `npm i node-cron` (server) |

### External Dependencies

**None.** All bug fixes are internal code changes using existing database and bot engine.

- ✅ `better-sqlite3` — already installed (for dedup tables, message queue)
- ✅ Telegram Bot API — already integrated (just adding retry logic)

---

## PHASE 8: Observability & Monitoring

### NPM Packages to Install (Server)

| Package | Why | Install |
|---|---|---|
| 🔑 `winston` or `pino` | Structured JSON logging with file rotation | `npm i winston` or `npm i pino` |
| 🔑 `prom-client` | Prometheus-compatible metrics endpoint | `npm i prom-client` |

### External Services (Optional but Recommended)

| Service | Why | How to Get |
|---|---|---|
| 💳 [Sentry](https://sentry.io) | Centralized error tracking + alerting | Free tier: 5K errors/month. Sign up → get DSN key → `npm i @sentry/node` |
| 💳 [Grafana Cloud](https://grafana.com) | Metrics dashboards (reads from `/metrics` endpoint) | Free tier: 10K series. Sign up → configure Prometheus scraper |
| 🔑 Slack Webhook URL | Alert notifications to Slack channel | Slack → Apps → Incoming Webhooks → Create → Copy URL |

### Secrets / Credentials

| Secret | Where to Get | Where to Store |
|---|---|---|
| 🔑 `SENTRY_DSN` (if using Sentry) | Sentry dashboard → Project Settings → DSN | `.env` |
| 🔑 `SLACK_WEBHOOK_URL` (if using Slack alerts) | Slack → Incoming Webhooks | `.env` |

### If You Skip External Services

You can run Phase 8 with **zero external accounts** — just use:
- `winston` for local log files (`application.log`, `error.log`)
- `prom-client` for a `/metrics` endpoint (query manually with `curl`)
- Console alerts instead of Slack

---

## PHASE 9: UI Polish

### External Dependencies

**None.** This phase is purely frontend CSS/component work.

- ✅ `tailwindcss` — already installed
- ✅ `lucide-react` — already installed (icons)
- ✅ `react` + `vite` — already installed

### Optional Design Assets

| Asset | Why | Where to Get |
|---|---|---|
| 📝 Product screenshots | For landing page features section | Take screenshots of your own app |
| 📝 Testimonial content | Social proof on landing page | Write placeholder quotes or collect from beta users |
| 📝 Logo / Brand assets | For landing hero + favicon | Create with [Figma](https://figma.com) (free) or any design tool |

---

## PHASE 10: SaaS Owner Panel + Channel Provisioning

### Channel API Credentials (Per Business — Not Per Developer)

> **Important**: These are what each **business customer** provides when they set up their channels. You (the developer) don't need them to build the feature — you need them to **test** it.

| Channel | What's Needed | How Business Gets It |
|---|---|---|
| 🔑 Telegram Bot Token | Token string from Telegram | Business talks to [@BotFather](https://t.me/BotFather) on Telegram → `/newbot` → copy token |
| 🔑 WhatsApp Phone Number ID | WABA Phone Number ID + Access Token | Business applies at [Meta Business Suite](https://business.facebook.com/) → WhatsApp → API Setup → Get Phone Number ID + Permanent Token |
| 🔑 Instagram Page ID | Instagram Business Account ID | Business connects Instagram to Facebook Page → [Meta Graph API](https://developers.facebook.com/docs/instagram-api/) → Get Page ID |

### Meta Business API (WhatsApp — Your Platform Account)

| Requirement | Status | What to Do |
|---|---|---|
| 🔑 Meta Developer Account | You need this | Sign up at [developers.facebook.com](https://developers.facebook.com/) |
| 🔑 Meta Business Verification | Pending approval | Submit business docs at Meta Business Settings → Security Center → Verification |
| 🔑 WhatsApp Business API Access | Pending approval | Apply via Meta Business Suite → WhatsApp → Request API Access |
| 🔑 System User Token | After approval | Meta Business Settings → System Users → Generate Token with `whatsapp_business_messaging` permission |
| 🔑 Webhook Verify Token | You generate this | Any random string — used to verify Meta webhook callbacks |
| 🔑 Webhook URL | Your public HTTPS endpoint | `https://yourdomain.com/api/whatsapp/webhook` (must be HTTPS, publicly reachable) |

### While Waiting for Meta Approval

You can build the entire Owner Panel + Channel Lock feature **without** Meta approval:
- Use Telegram (already working) for live testing
- Build WhatsApp UI flows with mock data
- Use Meta's test phone number (available in Meta Developer Dashboard even before full approval)

### NPM Packages (if not already installed)

No new packages needed — uses existing Express + SQLite.

---

## PHASE 11: Testing & QA

### NPM Packages to Install

| Package | Side | Why | Install |
|---|---|---|---|
| 🔑 `jest` | Server + Client | Test runner | `npm i -D jest` |
| 🔑 `@babel/preset-env` | Server | Transpile ES modules for Jest | `npm i -D @babel/preset-env` |
| 🔑 `@babel/preset-react` | Client | Transpile JSX for Jest | `npm i -D @babel/preset-react` |
| 🔑 `@testing-library/react` | Client | React component testing | `npm i -D @testing-library/react` |
| 🔑 `@testing-library/jest-dom` | Client | DOM assertion matchers | `npm i -D @testing-library/jest-dom` |
| 🔑 `cypress` or `playwright` | Client | End-to-end browser tests | `npm i -D cypress` or `npm i -D @playwright/test` |
| 🔑 `supertest` | Server | HTTP endpoint testing | `npm i -D supertest` |

### Load Testing Tool (Optional)

| Tool | Why | Install |
|---|---|---|
| 🔑 `k6` | Load/performance testing | Download from [k6.io](https://k6.io/docs/get-started/installation/) (standalone binary, not npm) |
| 🔑 `artillery` (alternative) | Load testing via npm | `npm i -D artillery` |

### External Dependencies

**None.** All tests run locally against SQLite in-memory database.

---

## PHASE 12: Operations & Deployment

### Software to Install on Your Machine / Server

| Software | Why | How to Get |
|---|---|---|
| 🔑 Docker Desktop | Containerize server + client | [docker.com/get-started](https://www.docker.com/get-started/) (free for personal/small business) |
| 🔑 Docker Compose | Multi-container orchestration | Included with Docker Desktop |
| 🔑 PM2 (alternative to Docker) | Node.js process manager | `npm i -g pm2` |
| 🔑 Nginx | Reverse proxy + serve client static files | `apt install nginx` (Linux) or Docker image `nginx:alpine` |

### Cloud Accounts & Services

| Service | Why | How to Get | Cost |
|---|---|---|---|
| 💳 AWS Account (for S3 backups) | Database backup storage | [aws.amazon.com](https://aws.amazon.com/) → Create Account | Free tier: 5GB S3 |
| 🔑 S3 Bucket | Store daily `.tar.gz` backups | AWS Console → S3 → Create Bucket | ~$0.023/GB/month |
| 💳 VPS / Cloud Server | Host the production app | [DigitalOcean](https://digitalocean.com/), [Hetzner](https://hetzner.com/), [Railway](https://railway.app/), or [Render](https://render.com/) | $5-20/month |
| 🔑 Domain Name | Production URL (e.g., `app.botdesk.io`) | [Namecheap](https://namecheap.com/), [Cloudflare](https://cloudflare.com/) | ~$10/year |
| 🔑 DNS Provider | Point domain to server IP | Usually included with domain registrar or use Cloudflare (free) | Free |

### Secrets / Credentials for Deployment

| Secret | Where to Get | Where to Store |
|---|---|---|
| 🔑 `AWS_ACCESS_KEY_ID` | AWS Console → IAM → Create User → Access Key | `.env.production` |
| 🔑 `AWS_SECRET_ACCESS_KEY` | Same as above | `.env.production` |
| 🔑 `BACKUP_S3_BUCKET` | Name of S3 bucket you created | `.env.production` |
| 🔑 `BACKUP_S3_REGION` | AWS region (e.g., `us-east-1`) | `.env.production` |

### Files You Must Create

| File | Purpose |
|---|---|
| 🔑 `Dockerfile` (server) | Container image for backend |
| 🔑 `Dockerfile` (client) | Container image for frontend (build + Nginx) |
| 🔑 `docker-compose.yml` | Orchestrate both containers |
| 🔑 `.env.production` | Production secrets (never commit) |
| 🔑 `.env.example` | Template showing all required env vars |
| 🔑 `scripts/backup.js` | Automated backup script |
| 🔑 `nginx.conf` | Nginx config for client serving + reverse proxy |

### If You Don't Want AWS

You can use alternatives for backups:
- **Backblaze B2** — S3-compatible, cheaper ($0.005/GB)
- **Local disk** — Copy `.db` file to another folder (not recommended for production)
- **rsync to another server** — Simple but manual

---

## PHASE 13: Billing, Plans & Revenue Ops

### Payment Provider Account

| Provider | Why | How to Get | Cost |
|---|---|---|---|
| 💳 [Stripe](https://stripe.com/) | Payment processing, subscriptions, invoices | Sign up at stripe.com → Activate account → Get API keys | 2.9% + $0.30 per transaction |
| 💳 [Paddle](https://paddle.com/) (alternative) | Merchant of record (handles tax + compliance) | Sign up at paddle.com | ~5% per transaction |
| 💳 [LemonSqueezy](https://lemonsqueezy.com/) (alternative) | Simple SaaS billing | Sign up at lemonsqueezy.com | 5% + $0.50 per transaction |

### If Using Stripe (Recommended)

| Requirement | How to Get | Where to Store |
|---|---|---|
| 🔑 `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys → Secret Key | `.env` |
| 🔑 `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys → Publishable Key | `.env` (safe for frontend) |
| 🔑 `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → Add Endpoint → Signing Secret | `.env` |
| 🔑 Stripe Product + Price IDs | Stripe Dashboard → Products → Create Products for each plan | Store in DB or config |

### NPM Packages to Install

| Package | Why | Install |
|---|---|---|
| 🔑 `stripe` | Stripe Node.js SDK | `npm i stripe` (server) |

### Decisions You Must Make First

| Decision | Options | Impact |
|---|---|---|
| 📝 Plan tiers | Free / Starter / Pro / Enterprise? | Determines pricing page, feature gates, revenue model |
| 📝 Trial length | 7 days? 14 days? 30 days? | Impacts conversion funnel |
| 📝 Billing cycle | Monthly only? Monthly + Annual? | Annual = discount but delayed revenue |
| 📝 Per-plan limits | How many flows, staff, submissions per plan? | Determines feature gate enforcement |
| 📝 Grace period | How many days after failed payment before suspension? | 3-7 days typical |

---

## PHASE 14: Compliance, Privacy & Data Governance

### Legal Documents You Must Prepare

| Document | Why | How to Get |
|---|---|---|
| 📝 Privacy Policy | Required by law (GDPR, CCPA) — explains data collection | Write yourself using [TermsFeed](https://termsfeed.com/) (paid) or [Iubenda](https://iubenda.com/) (free basic) or hire a lawyer |
| 📝 Terms of Service | Legal contract between you and users | Same as above |
| 📝 Data Processing Agreement (DPA) | Required for EU customers (GDPR) | Template from [GDPR.eu](https://gdpr.eu/data-processing-agreement/) |
| 📝 Cookie Policy | If using cookies (JWT cookies count) | Auto-generate from Iubenda or similar |
| 📝 Data Retention Policy | Internal doc: what data is kept, how long, when deleted | Write internally — see `docs/DATA_POLICY.md` |

### Decisions You Must Make First

| Decision | Options | Impact |
|---|---|---|
| 📝 Data retention window (sessions) | 24h? 7 days? 30 days? | Storage cost + privacy compliance |
| 📝 Data retention window (submissions) | 90 days? 1 year? Forever? | Storage cost + GDPR right to deletion |
| 📝 Data retention window (logs) | 30 days? 90 days? | Debugging vs. privacy |
| 📝 Customer data export format | JSON? CSV? Both? | Engineering effort for export endpoint |
| 📝 Who handles privacy requests? | Owner? Support? Automated? | Workflow design |

### External Dependencies

**None for code.** This phase is mostly policy + code to enforce it. No new npm packages or APIs needed.

---

## PHASE 15: Release Management & Environment Governance

### Infrastructure / Accounts

| Requirement | Why | How to Get |
|---|---|---|
| 🔑 GitHub Repository (private) | Source control + PR reviews + branch protection | Already have it or create at [github.com](https://github.com/) |
| 🔑 GitHub Actions (CI/CD) | Automated tests on every push/PR | Free for public repos; 2,000 min/month for private (free tier) |
| 🔑 Staging Server | Separate environment for pre-prod testing | Same VPS provider as production, separate instance or namespace |
| 🔑 Staging Database | Separate SQLite file or separate DB instance | Create `data-staging.db` or use Docker volume |

### Decisions You Must Make First

| Decision | Options | Impact |
|---|---|---|
| 📝 Branch strategy | `main` + `develop` + feature branches? Trunk-based? | Merge flow + review process |
| 📝 Release cadence | Weekly? Bi-weekly? On-demand? | Team coordination |
| 📝 Who approves deploys? | 1 reviewer? 2 reviewers? Owner only? | Speed vs. safety |
| 📝 Feature flag system | DB-backed? Config file? LaunchDarkly? | Cost vs. complexity |

### NPM Packages (Optional)

| Package | Why | Install |
|---|---|---|
| 🔑 `dotenv-flow` (optional) | Load env files per environment (`.env.development`, `.env.staging`, `.env.production`) | `npm i dotenv-flow` |

---

## PHASE 16: Support Operations & SLA Management

### External Services (Choose One)

| Service | Why | Cost |
|---|---|---|
| 💳 [Crisp](https://crisp.chat/) | Live chat + support inbox | Free (2 seats) / $25/mo (4 seats) |
| 💳 [Intercom](https://intercom.com/) | Full support suite | $74/mo+ |
| 💳 [Freshdesk](https://freshdesk.com/) | Ticket-based support | Free (10 agents) |
| 📝 **Self-built** (recommended for MVP) | Build ticket system in your own app (Phase 16.2 already defines this) | $0 — just dev time |

### If Self-Building Support (Recommended)

**No external services needed.** You build the ticket system directly into the business panel + owner panel using your existing Express + SQLite stack.

### Decisions You Must Make First

| Decision | Options | Impact |
|---|---|---|
| 📝 SLA response times | P1: 1h? P2: 4h? P3: 24h? P4: 72h? | Customer expectations + staffing |
| 📝 Support channel | In-app only? Email? WhatsApp? | Integration complexity |
| 📝 On-call rotation | Solo founder? Team rotation? | Burnout risk |
| 📝 Incident severity definitions | What qualifies as P1 vs P2? | Clear escalation paths |

---

## PHASE 17: Product Analytics & Growth

### External Services (Choose One)

| Service | Why | Cost |
|---|---|---|
| 💳 [Mixpanel](https://mixpanel.com/) | Event-based product analytics | Free (100K events/mo) |
| 💳 [PostHog](https://posthog.com/) | Open-source product analytics (self-host or cloud) | Free (1M events/mo self-hosted) |
| 💳 [Amplitude](https://amplitude.com/) | Product analytics + funnels | Free (10M events/mo) |
| 📝 **Self-built** (if budget is tight) | Track events in your own DB + build dashboard in owner panel | $0 — just dev time |

### If Using PostHog (Recommended — Free + Self-Hostable)

| Requirement | How to Get | Where to Store |
|---|---|---|
| 🔑 PostHog API Key | Sign up at [posthog.com](https://posthog.com/) → Project Settings → API Key | `.env` |

### NPM Packages (If Using External Service)

| Package | Why | Install |
|---|---|---|
| 🔑 `posthog-node` | Server-side event tracking | `npm i posthog-node` (server) |
| 🔑 `posthog-js` | Client-side event tracking | `npm i posthog-js` (client) |

### If Self-Building Analytics

**No external services needed.** Create `analytics_events` table in SQLite, log events server-side, build charts in owner panel.

### Decisions You Must Make First

| Decision | Options | Impact |
|---|---|---|
| 📝 Event taxonomy | What events to track? Naming convention? | Data consistency |
| 📝 KPI definitions | How to calculate MRR, churn, ARPA exactly? | Reporting accuracy |
| 📝 Retention windows | Week 1, Week 4, Week 8? | Cohort analysis depth |

---

## PHASE 18: Business Continuity & Disaster Recovery

### Infrastructure

| Requirement | Why | How to Get |
|---|---|---|
| 🔑 Backup storage (from Phase 12) | Restore database from backup | Already set up in Phase 12 (S3 bucket) |
| 🔑 Secondary server (optional) | Failover if primary goes down | Second VPS in different region |
| 🔑 DNS failover (optional) | Auto-switch to backup if primary is down | Cloudflare Load Balancing ($5/mo) or AWS Route 53 health checks |

### Decisions You Must Make First

| Decision | Options | Impact |
|---|---|---|
| 📝 RTO (Recovery Time Objective) | 1h? 4h? 24h? | How fast you must be back online |
| 📝 RPO (Recovery Point Objective) | 1h? 24h? | How much data loss is acceptable |
| 📝 DR drill frequency | Monthly? Quarterly? | Team readiness |
| 📝 Fallback communication | Email? SMS? Status page? | How customers know you're down |

### External Dependencies

**Mostly depends on Phase 12.** If backups and deployment are done, DR is primarily process + documentation + practice drills.

---

## QUICK REFERENCE: All External Accounts Needed

> **Summary of every external account/service across all phases**, so you can sign up for everything at once.

### Must-Have (Free or Minimal Cost)

| # | Service | Used In | Sign Up | Cost |
|---|---|---|---|---|
| 1 | **Meta Developer Account** | Phase 10 (WhatsApp) | [developers.facebook.com](https://developers.facebook.com/) | Free |
| 2 | **Telegram @BotFather** | Phase 10 (Telegram setup) | Already using — talk to [@BotFather](https://t.me/BotFather) | Free |
| 3 | **Domain Name** | Phase 12 (Production URL) | Namecheap, Cloudflare, etc. | ~$10/year |
| 4 | **VPS / Cloud Server** | Phase 12 (Hosting) | DigitalOcean, Hetzner, Railway, Render | $5-20/month |
| 5 | **Let's Encrypt SSL** | Phase 6 + 12 (HTTPS) | [letsencrypt.org](https://letsencrypt.org/) | Free |
| 6 | **Stripe** | Phase 13 (Billing) | [stripe.com](https://stripe.com/) | 2.9% + $0.30/tx |
| 7 | **GitHub** (private repo + Actions) | Phase 15 (CI/CD) | [github.com](https://github.com/) | Free (2,000 min/mo) |

### Recommended (Free Tier Available)

| # | Service | Used In | Cost |
|---|---|---|---|
| 8 | **Sentry** | Phase 8 (Error tracking) | Free: 5K errors/mo |
| 9 | **Grafana Cloud** | Phase 8 + 12 (Dashboards) | Free: 10K metrics series |
| 10 | **Slack** (workspace + webhook) | Phase 8 + 12 (Alerts) | Free |
| 11 | **PostHog** or **Mixpanel** | Phase 17 (Analytics) | Free tier available |
| 12 | **AWS S3** | Phase 12 (Backups) | Free: 5GB |

### Optional (Can Self-Build Instead)

| # | Service | Used In | Self-Build Alternative |
|---|---|---|---|
| 13 | Crisp / Freshdesk | Phase 16 (Support) | Build ticket system in your app |
| 14 | Amplitude | Phase 17 (Analytics) | Build analytics in owner panel |
| 15 | Cloudflare DNS failover | Phase 18 (DR) | Manual DNS switch |

---

## QUICK REFERENCE: All NPM Packages to Install

> **Every package you'll need across all phases, grouped by side.**

### Server Packages (`v2/server/`)

```bash
# Phase 6 — Security
npm i jsonwebtoken bcrypt helmet express-rate-limit dotenv
npm i express-validator   # or: npm i zod

# Phase 7 — Bug Fixes
npm i node-cron

# Phase 8 — Observability
npm i winston prom-client
npm i @sentry/node        # optional

# Phase 13 — Billing
npm i stripe              # or your chosen payment provider SDK

# Phase 17 — Analytics (if using external service)
npm i posthog-node        # optional
```

### Server Dev Packages (`v2/server/`)

```bash
# Phase 11 — Testing
npm i -D jest @babel/preset-env supertest
```

### Client Packages (`v2/client/`)

```bash
# Phase 17 — Analytics (if using external service)
npm i posthog-js          # optional
```

### Client Dev Packages (`v2/client/`)

```bash
# Phase 11 — Testing
npm i -D jest @babel/preset-react @testing-library/react @testing-library/jest-dom
npm i -D cypress          # or: npm i -D @playwright/test
```

### Global / Standalone Tools

```bash
# Phase 11 — Load Testing
# Download k6 from https://k6.io (standalone binary)
# Or: npm i -D artillery

# Phase 12 — Deployment
npm i -g pm2              # Node.js process manager (alternative to Docker)
```

---

## QUICK REFERENCE: All `.env` Variables

> **Every environment variable across all phases.** Copy this to your `.env.example`.

```env
# ── Phase 6: Security ──────────────────────────────
NODE_ENV=development                    # development | staging | production
PORT=4000                              # Server port
CORS_ORIGINS=http://localhost:5174     # Comma-separated allowed origins
JWT_SECRET=                            # Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
ENCRYPTION_KEY=                        # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ── Phase 8: Observability ─────────────────────────
LOG_LEVEL=info                         # debug | info | warn | error
SENTRY_DSN=                            # Optional: from Sentry dashboard
SLACK_WEBHOOK_URL=                     # Optional: from Slack Incoming Webhooks

# ── Phase 10: Channel Credentials (per-business, or global fallback) ──
TELEGRAM_BOT_TOKEN=                    # From @BotFather (already used)
WHATSAPP_PHONE_NUMBER_ID=             # From Meta Business Suite (after approval)
WHATSAPP_ACCESS_TOKEN=                # From Meta System User Token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=        # Any string you choose
INSTAGRAM_PAGE_ID=                     # From Meta Graph API

# ── Phase 12: Deployment ───────────────────────────
DATABASE_URL=sqlite:///data/data.db   # Or path to SQLite file
BACKUP_S3_BUCKET=                     # AWS S3 bucket name
BACKUP_S3_REGION=us-east-1            # AWS region
AWS_ACCESS_KEY_ID=                    # AWS IAM access key
AWS_SECRET_ACCESS_KEY=                # AWS IAM secret key

# ── Phase 13: Billing ─────────────────────────────
STRIPE_SECRET_KEY=                    # Stripe Dashboard → API Keys
STRIPE_PUBLISHABLE_KEY=              # Stripe Dashboard → API Keys (safe for frontend)
STRIPE_WEBHOOK_SECRET=               # Stripe Dashboard → Webhooks → Signing Secret

# ── Phase 17: Analytics (optional) ─────────────────
POSTHOG_API_KEY=                      # PostHog project API key
POSTHOG_HOST=https://app.posthog.com # Or self-hosted URL
```

---

> **Bottom line**: Phase 6, 7, 9 — you can start **right now** with zero external sign-ups. Phase 8, 11 — just `npm install`. The first real external dependency is Phase 10 (Meta API for WhatsApp) and Phase 12 (hosting + domain). Phase 13 (Stripe) is the first paid external service.
