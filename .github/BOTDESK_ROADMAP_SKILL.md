---
name: botdesk-roadmap
description: 'BotDesk SaaS development roadmap phases 1-5. Check this BEFORE starting any phase to verify prerequisites are met and AFTER completing a phase to verify all tasks are done.'
---

# BotDesk SaaS Roadmap — Phases 1-5

## PHASE 1: Foundation Hardening ✅ CHECKLIST
- [ ] Fix `advanceFlow` stale closure bug (WhatsAppTester.jsx useCallback empty deps)
- [ ] Add try/catch to `PUT /builder` transaction (routes.js)
- [ ] Add try/catch to `POST /apply-template` transaction (routes.js)
- [ ] Fix template switch data loss (flow_destinations cascade-deleted)
- [ ] Environment variables: `VITE_API_URL` in client, `PORT`/`CORS_ORIGINS` in server
- [ ] Error handling: loading/error states on StaffManager
- [ ] Error handling: loading/error states on SubmissionsList
- [ ] Error handling: loading/error states on Dashboard
- [ ] Input validation: button label max 20 chars warning in editor
- [ ] Input validation: welcome message required
- [ ] Input validation: WhatsApp limits shown in editor (button count, text length)
- [ ] Fix media re-attachment on builder save for newly added buttons
- [ ] TEST: Server starts without crash
- [ ] TEST: Builder load/save works
- [ ] TEST: Template switch preserves staff + settings
- [ ] TEST: WhatsApp Tester full flow works (welcome → menu → info → booking → confirmation)
- [ ] TEST: Media displays correctly in tester
- [ ] TEST: Submissions list loads with error handling
- [ ] TEST: Staff manager loads with error handling

## PHASE 2: Template Polish + Media ✅ CHECKLIST
- [ ] Beauty Salon template: professional descriptions, proper flow, all services
- [ ] Medical Clinic template: professional descriptions, proper flow, all services
- [ ] Restaurant template: professional descriptions, proper flow, all items
- [ ] Real Estate template: professional descriptions, proper flow, all listings
- [ ] Each template fully testable in WhatsApp Tester end-to-end
- [ ] Template preview before applying (show structure/description)
- [ ] TEST: Each template loads correctly
- [ ] TEST: Each template navigates fully in Tester (every path)
- [ ] TEST: Booking flow completes for each template
- [ ] TEST: Submissions created correctly for each template

## PHASE 3: Multi-Channel Renderer Architecture ✅ CHECKLIST
- [ ] Create `renderers/` folder structure
- [ ] Refactor `whatsapp-renderer.js` → `renderers/whatsapp.js`
- [ ] Create `renderers/telegram.js` (universal bot → Telegram Bot API format)
- [ ] Create `renderers/instagram.js` (universal bot → Instagram Messaging API format)
- [ ] Create `renderers/base.js` (shared rendering logic)
- [ ] Channel selection in Builder UI (preview selector)
- [ ] Channel-specific validation warnings
- [ ] WhatsApp preview API uses new renderer path
- [ ] TEST: WhatsApp renderer produces same output as before
- [ ] TEST: Telegram renderer produces valid Telegram Bot API payloads
- [ ] TEST: Instagram renderer produces valid Instagram API payloads
- [ ] TEST: Channel switching in builder works

## PHASE 4: Multi-Channel Testers ✅ CHECKLIST
- [ ] Telegram Tester: phone mockup with Telegram-style UI
- [ ] Instagram Tester: phone mockup with Instagram DM style
- [ ] Channel switcher tabs on Tester page (WhatsApp / Telegram / Instagram)
- [ ] All testers share same flow engine (createEngine)
- [ ] Channel-specific bubble styles and layouts
- [ ] TEST: Telegram Tester full flow works
- [ ] TEST: Instagram Tester full flow works
- [ ] TEST: Channel switching preserves nothing (fresh conversation per channel)
- [ ] TEST: Each channel tester respects that channel's limits

## PHASE 5: Telegram Bot (First Live Channel) ✅ CHECKLIST
- [ ] `conversations` table (id, business_id, channel, customer_identifier, state JSON, current_step, created_at, updated_at)
- [ ] `customers` table (id, business_id, channel, channel_user_id, display_name, created_at)
- [ ] Server-side flow engine (port from frontend createEngine to server)
- [ ] Telegram webhook/polling receiver endpoint
- [ ] Telegram incoming message handler → flow engine → reply
- [ ] Media sending via Telegram `sendPhoto` API
- [ ] Booking completion → Submission creation + Staff notification
- [ ] Conversation state persistence (resume if customer returns)
- [ ] Admin can see active conversations
- [ ] TEST: Telegram bot responds to /start
- [ ] TEST: Full flow works via real Telegram (welcome → menu → info → booking)
- [ ] TEST: Submission created on booking completion
- [ ] TEST: Staff gets Telegram notification
- [ ] TEST: Customer can resume conversation after closing app
- [ ] TEST: Multiple customers can chat simultaneously
