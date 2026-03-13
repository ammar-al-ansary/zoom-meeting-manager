const axios = require("axios");
const dns = require("dns");

// Prefer IPv4 to avoid connection issues on some systems
dns.setDefaultResultOrder("ipv4first");

const ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

let cachedToken = null;
let tokenExpiry = null;

/**
 * Fetch a Server-to-Server OAuth token from Zoom.
 * Tokens are cached in memory and reused until 60 seconds before expiry.
 */
async function getAccessToken() {
  const now = Date.now();

  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  const { zoom } = require("../config");

  const credentials = Buffer.from(`${zoom.clientId}:${zoom.clientSecret}`).toString("base64");

  const response = await axios.post(
    `${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${zoom.accountId}`,
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 30000,
    }
  );

  cachedToken = response.data.access_token;
  tokenExpiry = now + (response.data.expires_in - 60) * 1000;

  console.log("[ZoomService] Access token refreshed");
  return cachedToken;
}

/**
 * Returns an axios instance pre-configured with the current Bearer token.
 */
async function zoomClient() {
  const token = await getAccessToken();
  return axios.create({
    baseURL: ZOOM_API_BASE,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });
}

/**
 * List meetings for a user.
 * @param {string} userId - Zoom user ID or "me"
 * @param {string} type   - "scheduled" | "upcoming" | "live"
 */
async function listMeetings(userId = "me", type = "scheduled") {
  const client = await zoomClient();
  const response = await client.get(`/users/${userId}/meetings`, {
    params: { type, page_size: 100 },
  });
  return response.data;
}

/**
 * Get details for a single meeting.
 * @param {string|number} meetingId
 */
async function getMeeting(meetingId) {
  const client = await zoomClient();
  const response = await client.get(`/meetings/${meetingId}`);
  return response.data;
}

/**
 * Create a new scheduled Zoom meeting.
 * @param {string} userId
 * @param {{ topic, start_time, duration, timezone }} meetingData
 */
async function createMeeting(userId = "me", meetingData) {
  const client = await zoomClient();
  const payload = {
    topic: meetingData.topic,
    type: 2, // Scheduled meeting
    start_time: meetingData.start_time, // ISO 8601: "2025-06-01T10:00:00"
    duration: meetingData.duration,
    timezone: meetingData.timezone,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      waiting_room: true,
    },
  };

  const response = await client.post(`/users/${userId}/meetings`, payload);
  return response.data;
}

/**
 * Delete a Zoom meeting by ID.
 * @param {string|number} meetingId
 */
async function deleteMeeting(meetingId) {
  const client = await zoomClient();
  await client.delete(`/meetings/${meetingId}`);
  return { success: true, meetingId };
}

module.exports = { listMeetings, getMeeting, createMeeting, deleteMeeting };
