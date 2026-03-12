# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack Zoom Meeting Manager that lists, creates, and deletes Zoom meetings using the Zoom REST API with Server-to-Server OAuth 2.0.

**Tech Stack:**
- Backend: Node.js + Express (port 3001)
- Frontend: React 18 via Create React App (port 3000)
- Auth: Zoom Server-to-Server OAuth with token caching

## Development Commands

### Initial Setup
```bash
# Install all dependencies (root + backend + frontend)
npm run install:all

# Or install individually:
npm install                   # Root (concurrently)
npm install --prefix backend  # Backend deps
npm install --prefix frontend # Frontend deps
```

### Environment Configuration
Before running, create `backend/.env` from `backend/.env.example` with Zoom credentials:
```
ZOOM_ACCOUNT_ID=...
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
PORT=3001
```

### Running the Application
```bash
# Run both servers concurrently (recommended)
npm run dev

# Or run separately:
npm start --prefix backend   # Backend only (port 3001)
npm start --prefix frontend  # Frontend only (port 3000)

# Backend with auto-reload
npm run dev --prefix backend  # Uses nodemon
```

### Building
```bash
# Build frontend for production
npm run build --prefix frontend
```

## Architecture

### Monorepo Structure
```
├── backend/          # Express API server
│   ├── server.js     # Main Express app, API routes
│   ├── zoomService.js # Zoom API client with token caching
│   └── .env          # Credentials (not committed)
├── frontend/         # React SPA
│   ├── src/App.js    # Single-file React app
│   └── package.json  # Proxies API requests to localhost:3001
└── package.json      # Root scripts for running both
```

### Backend API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/meetings?type=scheduled` | List meetings (type: scheduled/upcoming/live) |
| GET | `/api/meetings/:id` | Get single meeting |
| POST | `/api/meetings` | Create meeting (body: topic, date, time, duration, timezone) |
| DELETE | `/api/meetings/:id` | Delete meeting |

### Zoom OAuth Token Management
**IMPORTANT:** `zoomService.js` implements OAuth token caching:
- Tokens are cached in memory (`cachedToken`, `tokenExpiry`)
- Tokens are reused until 60 seconds before expiry
- The `getAccessToken()` function handles automatic refresh
- All API calls go through `zoomClient()` which ensures a valid token

When modifying Zoom API calls, always use the `zoomClient()` function rather than making direct axios calls.

### Frontend-Backend Communication
- Frontend runs on port 3000
- Backend runs on port 3001
- `frontend/package.json` includes `"proxy": "http://localhost:3001"`
- Frontend makes relative API calls (e.g., `/api/meetings`) which CRA proxies to the backend
- CORS is enabled in backend for development

### React Application Structure
`frontend/src/App.js` is a single-file React application containing:
- API helper functions (`apiFetch`)
- Utility functions (date formatting, status calculation)
- Sub-components: `Toast`, `Spinner`, `EmptyState`, `MeetingCard`, `InfoPill`, `CreateMeetingForm`
- Main `App` component with state management

The app uses inline styles (no CSS files) with a dark theme.

## Key Implementation Details

### Meeting Creation Flow
1. Frontend form collects: topic, date (YYYY-MM-DD), time (HH:MM), duration, timezone
2. Backend combines date + time into ISO 8601: `${date}T${time}:00`
3. Zoom API requires `start_time` in ISO 8601 format with timezone
4. Meeting type is hardcoded to `2` (scheduled meeting)

### Meeting Status Logic
Meetings are categorized by start time:
- **Past**: start_time < now
- **Soon**: start_time within 1 hour
- **Upcoming**: start_time > 1 hour from now

Status is calculated client-side in `getMeetingStatus()`.

### Error Handling
- Backend: `handleError()` function extracts error messages from Zoom API responses
- Frontend: Toast notifications display success/error messages
- All errors include proper HTTP status codes

## Required Zoom Scopes

The Zoom Server-to-Server OAuth app must have these scopes activated:
- `meeting:read:list_meetings:admin` (or `meeting:read` for non-admins)
- `meeting:write:meeting:admin` (or `meeting:write`)
- `meeting:delete:meeting:admin` (or `meeting:delete`)

The app must be **Activated** in Zoom Marketplace after adding scopes.

## Common Issues

**Backend fails to start**: Check that `backend/.env` exists with all three Zoom credentials (ACCOUNT_ID, CLIENT_ID, CLIENT_SECRET).

**401/403 from Zoom**: Verify credentials are correct and app is activated with proper scopes.

**Frontend can't reach backend**: Ensure backend is running on port 3001. The proxy in `frontend/package.json` handles routing during development.

**Token errors**: The token caching logic automatically refreshes tokens. If you see persistent token errors, check that the Zoom credentials haven't been revoked.
