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

// --- Public test route (verify external access) ---
// To confirm public access, open: http://SERVER_IP:3001/test
//
// Windows VPS Firewall Setup:
//   1. Open "Windows Defender Firewall with Advanced Security"
//   2. Click "Inbound Rules" → "New Rule..."
//   3. Select "Port" → Next
//   4. Select "TCP", enter port: 3001 → Next
//   5. Select "Allow the connection" → Next
//   6. Check all profiles (Domain, Private, Public) → Next
//   7. Name: "Allow Node.js 3001" → Finish
//
app.get('/test', (_req, res) => res.send('SERVER OK'));

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
