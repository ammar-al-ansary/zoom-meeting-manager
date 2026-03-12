const axios = require("axios");
const dns = require("dns");

// Prefer IPv4 to avoid connection issues
dns.setDefaultResultOrder("ipv4first");

const ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

let cachedToken = null;
let tokenExpiry = null;

/**
 * Fetch a Server-to-Server OAuth token from Zoom.
 * Tokens are cached until 60 seconds before expiry.
 */
async function getAccessToken() {
  const now = Date.now();

  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;

  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error(
      "Missing Zoom credentials. Check ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET in .env"
    );
  }

  const credentials = Buffer.from(
    `${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const response = await axios.post(
    `${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 30000, // 30 second timeout
    }
  );

  cachedToken = response.data.access_token;
  // Cache token with 60-second buffer before expiry
  tokenExpiry = now + (response.data.expires_in - 60) * 1000;

  return cachedToken;
}

/**
 * Return an axios instance pre-configured with the Zoom Bearer token.
 */
async function zoomClient() {
  const token = await getAccessToken();
  return axios.create({
    baseURL: ZOOM_API_BASE,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 30000, // 30 second timeout
  });
}

/**
 * List all meetings for the authenticated user.
 * type: scheduled | live | upcoming (default: scheduled)
 */
async function listMeetings(userId = "me", type = "scheduled") {
  const client = await zoomClient();
  const response = await client.get(`/users/${userId}/meetings`, {
    params: { type, page_size: 100 },
  });
  return response.data;
}

/**
 * Create a new Zoom meeting.
 * @param {Object} meetingData - { topic, start_time, duration, timezone }
 */
async function createMeeting(userId = "me", meetingData) {
  const client = await zoomClient();
  const payload = {
    topic: meetingData.topic || "New Meeting",
    type: 2, // Scheduled meeting
    start_time: meetingData.start_time, // ISO 8601: "2024-01-15T10:00:00"
    duration: meetingData.duration || 60,
    timezone: meetingData.timezone || "UTC",
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
 */
async function deleteMeeting(meetingId) {
  const client = await zoomClient();
  await client.delete(`/meetings/${meetingId}`);
  return { success: true, meetingId };
}

/**
 * Get details for a single meeting.
 */
async function getMeeting(meetingId) {
  const client = await zoomClient();
  const response = await client.get(`/meetings/${meetingId}`);
  return response.data;
}

module.exports = { listMeetings, createMeeting, deleteMeeting, getMeeting };
