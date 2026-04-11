const express = require('express');
const businessRoutes = require('./modules/business/business.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Core middleware ---
app.use(express.json());

// --- Route registration ---
app.use('/api/v1/businesses', businessRoutes);

// --- 404 handler ---
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Global error handler (must be last) ---
app.use(errorHandler);

module.exports = app;
