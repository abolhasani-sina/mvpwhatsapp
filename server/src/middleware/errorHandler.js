/**
 * Global error handler middleware.
 * Must be registered last with app.use(errorHandler).
 * Express identifies 4-param functions as error handlers.
 */
function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(status).json({
    error: {
      status,
      message,
    },
  });
}

module.exports = errorHandler;
