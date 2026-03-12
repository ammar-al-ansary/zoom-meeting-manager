require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {
  listMeetings,
  createMeeting,
  deleteMeeting,
  getMeeting,
} = require("./zoomService");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Helpers ───────────────────────────────────────────────────────────────────
function handleError(res, error) {
  console.error("[Zoom API Error]", error?.response?.data || error.message);

  const status = error?.response?.status || 500;
  const message =
    error?.response?.data?.message ||
    error.message ||
    "An unexpected error occurred";

  res.status(status).json({ error: message });
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// GET /api/meetings — list all scheduled meetings
app.get("/api/meetings", async (req, res) => {
  try {
    const { type = "scheduled" } = req.query;
    const data = await listMeetings("me", type);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
});

// GET /api/meetings/:id — get a single meeting
app.get("/api/meetings/:id", async (req, res) => {
  try {
    const data = await getMeeting(req.params.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
});

// POST /api/meetings — create a new meeting
// Body: { topic, date, time, duration, timezone }
app.post("/api/meetings", async (req, res) => {
  try {
    const { topic, date, time, duration, timezone } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: "date and time are required" });
    }

    // Combine date (YYYY-MM-DD) and time (HH:MM) into ISO 8601
    const start_time = `${date}T${time}:00`;

    const meeting = await createMeeting("me", {
      topic: topic || "New Meeting",
      start_time,
      duration: duration || 60,
      timezone: timezone || "UTC",
    });

    res.status(201).json(meeting);
  } catch (error) {
    handleError(res, error);
  }
});

// DELETE /api/meetings/:id — delete a meeting
app.delete("/api/meetings/:id", async (req, res) => {
  try {
    const result = await deleteMeeting(req.params.id);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Zoom Meeting Manager API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
