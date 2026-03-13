const zoomService = require("../services/zoomService");

/**
 * GET /api/meetings
 * List all meetings (type validated & defaulted by middleware).
 */
async function index(req, res, next) {
  try {
    const data = await zoomService.listMeetings("me", req.query.type);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/meetings/:id
 * Get a single meeting by ID.
 */
async function show(req, res, next) {
  try {
    const data = await zoomService.getMeeting(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/meetings
 * Create a new meeting (body validated by middleware).
 */
async function create(req, res, next) {
  try {
    const { topic, date, time, duration, timezone } = req.body;
    const start_time = `${date}T${time}:00`;

    const meeting = await zoomService.createMeeting("me", {
      topic,
      start_time,
      duration,
      timezone,
    });

    res.status(201).json(meeting);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/meetings/:id
 * Delete a meeting by ID.
 */
async function destroy(req, res, next) {
  try {
    const result = await zoomService.deleteMeeting(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { index, show, create, destroy };
