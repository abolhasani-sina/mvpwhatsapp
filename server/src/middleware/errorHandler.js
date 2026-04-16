/**
 * Global error handler middleware.
 * Must be registered last with app.use(errorHandler).
 * Express identifies 4-param functions as error handlers.
 */
function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  console.error(err);

  // In production, don't leak internal error details for 500s
  const safeMessage = (process.env.NODE_ENV === 'production' && status >= 500)
    ? 'Internal server error'
    : message;

  res.status(status).json({
    error: {
      status,
      message: safeMessage,
    },
  });
}

module.exports = errorHandler;
