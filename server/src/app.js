const express = require('express');
const cookieParser = require('cookie-parser');
const businessRoutes = require('./modules/business/business.routes');
const profileRoutes = require('./modules/business/business.profile.routes');
const authRoutes = require('./modules/auth/auth.routes');
const serviceRoutes = require('./modules/service/service.routes');
const templateRoutes = require('./modules/template/template.routes');
const menuRoutes = require('./modules/menu/menu.routes');
const flowRoutes = require('./modules/flow/flow.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Core middleware ---
app.use(express.json());
app.use(cookieParser());

// --- Route registration ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/businesses', businessRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/flows', flowRoutes);

// --- 404 handler ---
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Global error handler (must be last) ---
app.use(errorHandler);

module.exports = app;
