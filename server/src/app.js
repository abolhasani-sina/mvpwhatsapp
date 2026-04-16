const express = require('express');
const cookieParser = require('cookie-parser');
const businessRoutes = require('./modules/business/business.routes');
const profileRoutes = require('./modules/business/business.profile.routes');
const authRoutes = require('./modules/auth/auth.routes');
const serviceRoutes = require('./modules/service/service.routes');
const templateRoutes = require('./modules/template/template.routes');
const menuRoutes = require('./modules/menu/menu.routes');
const flowRoutes = require('./modules/flow/flow.routes');
const requestRoutes = require('./modules/request/request.routes');
const assigneeRoutes = require('./modules/assignee/assignee.routes');
const assignmentRuleRoutes = require('./modules/assignment-rule/assignment-rule.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const sessionRoutes = require('./modules/whatsapp/session.routes');
const whatsappWebhookRoutes = require('./modules/whatsapp/whatsapp.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Core middleware ---
app.use(express.json());
app.use(cookieParser());

// --- Health check ---
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// --- Public test route (verify external access) ---
app.get('/test', (_req, res) => res.send('SERVER OK'));

// --- Local WhatsApp simulator (no auth, no Meta needed) ---
// Gated: disabled in production for safety
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
// POST /test/whatsapp  { "from": "905392289969", "message": "hello" }
app.post('/test/whatsapp', async (req, res) => {
  try {
    const { from, message, business_id } = req.body;
    if (!from || !message) {
      return res.status(400).json({ error: 'from and message are required' });
    }

    const db = require('./config/database');
    const engine = require('./modules/whatsapp/whatsapp.engine');

    // If business_id provided, use it directly; otherwise fall back to DB lookup
    let businessId = business_id;
    if (!businessId) {
      const account = await db('whatsapp_accounts').where({ is_active: true }).first();
      if (!account) {
        return res.status(500).json({ error: 'No WhatsApp account configured in database' });
      }
      businessId = account.business_id;
    }

    const isNumeric = /^\d+$/.test(message);
    const messageType = isNumeric ? 'interactive' : 'text';

    // Call the SAME engine used by the real webhook
    const responses = await engine.handleIncomingMessage(from, businessId, message, messageType);

    // Extract readable text from WhatsApp API payloads
    const replies = (responses || []).map(msg => {
      if (msg.type === 'text') return msg.text.body;
      if (msg.type === 'interactive') {
        const inter = msg.interactive;
        let text = inter.body.text;
        if (inter.type === 'button' && inter.action.buttons) {
          text += '\n\nButtons: ' + inter.action.buttons.map(b => `[${b.reply.title}]`).join('  ');
        }
        if (inter.type === 'list' && inter.action.sections) {
          const rows = inter.action.sections.flatMap(s => s.rows);
          text += '\n\nList: ' + rows.map(r => `[${r.title}]`).join('  ');
        }
        return text;
      }
      return JSON.stringify(msg);
    });

    console.log('[Test] from:', from, '| message:', message, '| replies:', replies.length);
    res.json({ replies, raw: responses });
  } catch (err) {
    console.error('[Test] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /test/whatsapp/reset — Reset simulator session
app.delete('/test/whatsapp/reset', async (req, res) => {
  try {
    const { phone, business_id } = req.body || {};
    const db = require('./config/database');

    if (phone && business_id) {
      await db('sessions')
        .where({ phone_number: phone, business_id })
        .del();
    } else if (business_id) {
      await db('sessions').where({ business_id }).del();
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[Test] Reset error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /test/whatsapp/publish — Mark business as published + clear sessions
app.post('/test/whatsapp/publish', async (req, res) => {
  try {
    const { business_id } = req.body || {};
    if (!business_id) {
      return res.status(400).json({ error: 'business_id is required' });
    }
    const db = require('./config/database');
    
    // Update published_at
    await db('businesses').where({ id: business_id }).update({ published_at: db.fn.now() });
    
    // Clear all sessions so simulator starts fresh
    await db('sessions').where({ business_id }).del();

    res.json({ ok: true, published_at: new Date().toISOString() });
  } catch (err) {
    console.error('[Test] Publish error:', err);
    res.status(500).json({ error: err.message });
  }
});
} // end if (!isProduction)

// --- Route registration ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/businesses', businessRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/flows', flowRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/assignees', assigneeRoutes);
app.use('/api/v1/assignment-rules', assignmentRuleRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/webhook/whatsapp', whatsappWebhookRoutes);

// --- 404 handler ---
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Global error handler (must be last) ---
app.use(errorHandler);

module.exports = app;
