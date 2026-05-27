# Where You At?

A shared Gantt-style calendar for a close friend group (~10 people) to see where everyone is and what trips are coming up. Each person gets a row showing their current location and upcoming trips on a timeline.

**No DMs. No map. No scheduling.** Just: where is everyone, and when?

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Leaflet |
| Backend | Express, Socket.io |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (stateless, Bearer token) |
| Frontend deploy | Vercel |
| Backend deploy | Railway |

Real-time updates are pushed via Socket.io so all open tabs update instantly without polling.

## Project structure

```
where-you-at/
├── client/   # React + Vite frontend
└── server/   # Express + Socket.io backend
```

## Local setup

**Prerequisites:** Node.js 18+, a MongoDB Atlas cluster (free tier works)

**1. Clone and install**

```bash
git clone <repo-url>
cd where-you-at
cd server && npm install
cd ../client && npm install
```

**2. Configure environment variables**

```bash
# server/.env
cp server/.env.example server/.env
# Fill in MONGODB_URI, JWT_SECRET, CLIENT_URL

# client/.env
cp client/.env.example client/.env
# Fill in VITE_API_URL, VITE_MAPBOX_TOKEN
```

**3. Seed the database**

```bash
cd server && node seed.js
```

**4. Run**

```bash
# Terminal 1 — backend (port 4000)
cd server && node index.js

# Terminal 2 — frontend (port 5173)
cd client && npm run dev
```

Open `http://localhost:5173` and log in with `vikram@thegang.co` / `password123`.

## Adding a new user

```bash
cd server && node create-user.js
```

All registered users are friends automatically — no invite/friend-request flow.

## API overview

All routes are under `/api`. Protected routes require `Authorization: Bearer <token>`.

| Route | Description |
|---|---|
| `POST /api/auth/login` | Get a JWT |
| `GET /api/auth/me` | Current user |
| `GET /api/users` | All users |
| `GET /api/trips` | All trips |
| `POST /api/trips` | Create a trip |
| `PATCH /api/trips/:id` | Update a trip |
| `DELETE /api/trips/:id` | Delete a trip |
| `GET /api/health` | Health check |

## Socket.io events

Server broadcasts these to all connected clients on any mutation:

| Event | Payload |
|---|---|
| `trip:created` | `{ trip }` |
| `trip:updated` | `{ trip }` |
| `trip:deleted` | `{ tripId }` |
| `location:updated` | `{ userId, location }` |

## Deployment

**Backend (Railway):** Set the env vars from `server/.env.example`. Railway needs a long-running process for Socket.io — Vercel serverless won't work here.

**Frontend (Vercel):** Set `VITE_API_URL` to your Railway backend URL and `VITE_MAPBOX_TOKEN`. Set `CLIENT_URL` on the server side to your Vercel URL so CORS allows it.
