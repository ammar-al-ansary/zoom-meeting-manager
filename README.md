# Zoom Meeting Manager

A full-stack web application to **list**, **create**, and **delete** Zoom meetings using the Zoom REST API (Server-to-Server OAuth).

---

## Tech Stack

| Layer    | Technology                      |
|----------|---------------------------------|
| Backend  | Node.js · Express               |
| Frontend | React 18 (Create React App)     |
| Auth     | Zoom Server-to-Server OAuth 2.0 |

---

## Project Structure

```
zoom-meeting-manager/
├── backend/
│   ├── server.js          # Express API server
│   ├── zoomService.js     # Zoom API wrapper (token cache, CRUD)
│   ├── .env.example       # Environment variable template
│   └── package.json
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── index.js
│   │   └── App.js         # Full React UI
│   └── package.json
├── package.json           # Root scripts (optional)
└── README.md
```

---

## Prerequisites

- **Node.js** v18 or later
- A **Zoom account** (free tier works)
- A **Zoom Server-to-Server OAuth app** (see below)

---

## Step 1 — Create a Zoom Server-to-Server OAuth App

1. Go to [https://marketplace.zoom.us/develop/create](https://marketplace.zoom.us/develop/create)
2. Choose **Server-to-Server OAuth** → click **Create**
3. Give it any name (e.g. `Meeting Manager`)
4. From the **App Credentials** tab, copy:
   - **Account ID**
   - **Client ID**
   - **Client Secret**
5. In the **Scopes** tab, add these scopes:
   - `meeting:read:list_meetings:admin`
   - `meeting:write:meeting:admin`
   - `meeting:delete:meeting:admin`
   - Or use the user-level equivalents if you are not an admin:
     `meeting:read`, `meeting:write`
6. Click **Activate** your app

---

## Step 2 — Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
ZOOM_ACCOUNT_ID=your_account_id_here
ZOOM_CLIENT_ID=your_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here
PORT=3001
```

---

## Step 3 — Install Dependencies

```bash
# From project root
npm install                         # installs concurrently
npm install --prefix backend        # installs Express, axios, dotenv, cors
npm install --prefix frontend       # installs React
```

Or all at once:

```bash
npm run install:all
```

---

## Step 4 — Run the Application

### Option A — Run both servers together (recommended)

```bash
npm run dev
```

This starts:
- Backend on **http://localhost:3001**
- Frontend on **http://localhost:3000**

### Option B — Run separately

```bash
# Terminal 1 — Backend
npm start --prefix backend

# Terminal 2 — Frontend
npm start --prefix frontend
```

Open **http://localhost:3000** in your browser.

---

## API Endpoints

| Method | Path                  | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/health`         | Health check             |
| GET    | `/api/meetings`       | List meetings            |
| GET    | `/api/meetings/:id`   | Get a single meeting     |
| POST   | `/api/meetings`       | Create a meeting         |
| DELETE | `/api/meetings/:id`   | Delete a meeting         |

### POST `/api/meetings` — Request Body

```json
{
  "topic": "Team Standup",
  "date": "2025-02-01",
  "time": "10:00",
  "duration": 60,
  "timezone": "America/New_York"
}
```

---

## Features

- **List Meetings** — View all scheduled meetings with topic, date/time, duration, and status badge (Past / Soon / Upcoming)
- **Create Meeting** — Form with topic, date picker, time picker, duration selector, and timezone selector
- **Delete Meeting** — Delete any meeting with a confirmation prompt
- **Auto-refresh** — Manual refresh button in the header
- **Filter tabs** — Switch between Scheduled / Upcoming / Live views
- **Token caching** — OAuth tokens are reused until 60 seconds before expiry (no redundant auth calls)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Missing Zoom credentials` error | Check that `backend/.env` exists and has the three Zoom values |
| `401 Unauthorized` from Zoom | Verify your Client ID & Secret; make sure the app is **Activated** |
| `403 Forbidden` / missing scopes | Add the required scopes in Zoom Marketplace and reactivate |
| Frontend can't reach backend | Ensure backend is running on port 3001; the React proxy is pre-configured |
| Meetings not appearing | Zoom may return an empty list for brand-new accounts — try creating one first |
