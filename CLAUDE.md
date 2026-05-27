# Where You At?

A private web app for a close friend group (~10 people) to track each other's locations and trips.

## What it does

The app is a shared Gantt-style calendar. Each person has a row showing where they are right now and a timeline of their upcoming trips. That's it — no DMs, no map, no scheduling.

## Monorepo layout

```
where-you-at/
├── client/   React + Vite frontend (deploy to Vercel)
└── server/   Express + Socket.io backend (deploy to Railway)
```

## Stack decisions

- **JWT (not sessions)** — stateless, works cleanly across Vercel/Railway split
- **Socket.io** — server broadcasts on any trip/location mutation so all open tabs update instantly without polling
- **MongoDB Atlas** — single collection per entity, simple enough that Mongoose is fine
- **Railway** — backend needs a long-running process for Socket.io; Vercel serverless wouldn't work

## Key conventions

### Dates
- Stored in MongoDB as ISO `Date` objects (`startDate`, `endDate`)
- Displayed in UI as `"Jun 9"` format — use `fmtDate()` from `client/src/lib/dateUtils.js`
- Calendar window is computed client-side from today; no fixed year baked into the DB

### Trips
- `going[]` always includes the creator's own user ID
- `color` on a trip is the creator's avatar color (used for Gantt bar coloring)
- Current location for a user = trip `destination` if there's an active trip, else their `baseLocation`

### Users
- All registered users are friends — there's no follow/friend-request flow (invite-only app)
- `initials` = first letter of first + last name, e.g. "Vikram Khanna" → "VK"
- `color` = assigned from a fixed 10-color palette at registration time

### API
- All routes under `/api/...`
- Auth routes: `/api/auth/login`, `/api/auth/me`
- Protected routes require `Authorization: Bearer <token>` header
- JWT secret lives in `server/.env` as `JWT_SECRET`

### Socket.io events (server → all clients)
- `trip:created` `{ trip }` — populated trip object
- `trip:updated` `{ trip }` — populated trip object
- `trip:deleted` `{ tripId }` — just the ID
- `location:updated` `{ userId, location }` — user updated their base location

### Environment variables
**server/.env**
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
PORT=4000
```

**client/.env**
```
VITE_API_URL=http://localhost:4000
VITE_MAPBOX_TOKEN=...
```

## Running locally

```bash
# Terminal 1 — backend
cd server && npm install && node seed.js && node index.js

# Terminal 2 — frontend
cd client && npm install && npm run dev
```

Login with `vikram@thegang.co` / `password123` after seeding.
