/**
 * Global Express error-handling middleware.
 * Catches any error passed to next(err) and returns a uniform JSON response.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err?.response?.status || err.status || 500;
  const message =
    err?.response?.data?.message || err.message || "An unexpected error occurred";

  console.error(`[ERROR] ${req.method} ${req.path} → ${status}: ${message}`);

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
