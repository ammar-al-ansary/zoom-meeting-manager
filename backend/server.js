const config = require("./config");
const express = require("express");
const cors = require("cors");

const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const meetingRoutes = require("./routes/meetingRoutes");

const app = express();

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/meetings", meetingRoutes);

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`✅ Zoom Meeting Manager API running on http://localhost:${config.port}`);
  console.log(`   Health check: http://localhost:${config.port}/api/health`);
});
