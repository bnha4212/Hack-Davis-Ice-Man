# SafeGuard / Hack Davis Ice-Man

Hackathon project — a **browser-based panic flow** (hold-to-record → transcript → bilingual messaging → SMS-style dispatch) plus a **live Mapbox map** with nearby enforcement-related signals, backed by a **Node.js API** with MongoDB, Socket.IO, and scheduled scraping.

**Team:** Brandon, Evan, Zak.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Run locally](#run-locally)
- [Production build (client)](#production-build-client)
- [Contributing & panic UX guardrails](#contributing--panic-ux-guardrails)
- [Troubleshooting](#troubleshooting)

---

## Features

### Panic flow (`apps/client/src/panic/`)

- Press-and-hold recording with reliability-focused UX (pointer capture, mutexes against double-send; see `CAPSULES.md`).
- Transcript review before sending.
- Bilingual response step (demo/mock adapters in `panicServices.ts`; production wiring goes through backend adapters).
- SMS trigger path designed to call your backend (never ship Twilio secrets to the browser).

### Map & signals

- **Mapbox GL** map with pins and heat-style interactions.
- **Nearby signals** sheet (proximity-filtered reports, editorial/no-location filtering on the client side).
- Live updates via **Socket.IO** when new pins arrive.

### Backend (`backend/`)

- **Express** REST API (`/api/reports`, `/api/panic`, etc.).
- **MongoDB** (Mongoose) for persistence.
- **Socket.IO** for realtime events to the client.
- **Scheduled scraper** plus Claude-assisted parsing/filtering (requires `ANTHROPIC_API_KEY` where used).

---

## Tech stack

| Layer | Technologies |
| -------- | ------------- |
| **Client** | React 18, Vite 5, Redux Toolkit, Mapbox GL, Socket.IO client, PWA (vite-plugin-pwa) |
| **Shared** | `packages/shared` — API route fragments, `SERVER_URL`, socket event names |
| **Server** | Node.js (≥18), Express, Mongodb/Mongoose, Socket.IO |
| **Integrations** | Anthropic SDK, OpenAI SDK (routes vary), optional SMS helpers — see `backend/routes/panic.js` |

---

## Repository layout

```
├── apps/client/          # Vite + React app ("Warrant" / SafeGuard UI)
├── packages/shared/      # Shared constants and SERVER_URL (see note below)
├── backend/              # Express API + scraper (own package.json — not an npm workspace member)
├── CAPSULES.md           # Panic-flow architecture & reliability decisions — read before changing panic UX
├── package.json          # npm workspaces: apps/client, packages/shared (apps/server listed but not present)
└── .env.example          # Example env for Mapbox + pointers for backend secrets
```

**API base URL:** The client imports `SERVER_URL` from `@warrant/shared`, currently `http://localhost:3001`. For local development, run the backend on **port 3001** or update `packages/shared/constants.js` (and rebuild) if you use another origin.

---

## Prerequisites

- **Node.js** 18 or newer (backend `engines` specifies `>=18`).
- **npm** (workspaces use npm).
- **MongoDB Atlas URI** (or compatible URI) for the backend — required to start `backend/` (`MONGODB_URI`).
- **Mapbox access token** for the map (`VITE_MAPBOX_TOKEN`). Create a token in the Mapbox dashboard and restrict it by URL in production.

---

## Setup

From the repository root:

```bash
npm install
npm install --prefix backend
```

The root install wires **`apps/client`** and **`packages/shared`**. The **`backend/`** folder is a **separate** Node project (see `backend/package.json`), so it needs its own install as above.

---

## Environment variables

### Frontend (Vite)

Vite is configured with `envDir` pointing at the **repository root**, so place client secrets in a root **`.env`**, **`.env.local`**, or **`apps/client/`** env files — Vite will pick up `VITE_*` variables.

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `VITE_MAPBOX_TOKEN` | Yes (for map) | Mapbox GL access token |

See root `.env.example` for a template.

### Backend

Copy `backend/.env.example` to **`backend/.env`** and fill in values. The server loads `backend/.env` first (see `backend/index.js`).

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `MONGODB_URI` | **Yes** | MongoDB connection string |
| `PORT` | No | Defaults to **3001** |
| `ANTHROPIC_API_KEY` | For Claude/scraper features | Used when calling Anthropic APIs |
| `OPENAI_API_KEY` | If transcribe route uses OpenAI | Panic transcribe path |
| `TEXTBELT_KEY` | Optional | Alternative SMS path in `routes/panic.js` |

Keep production secrets out of git; `.gitignore` should exclude `.env` files.

---

## Run locally

You need **two processes**: the Vite dev server and the backend.

**Terminal 1 — client (from repo root):**

```bash
npm run dev
```

Default URL: **http://localhost:5173/**

**Terminal 2 — backend:**

```bash
npm run dev --prefix backend
```

Default URL: **http://localhost:3001/**

Health check: `GET http://localhost:3001/health` → `{ "ok": true, ... }`.

---

## Production build (client)

```bash
npm run build --workspace=apps/client
```

Preview the static build:

```bash
npm run preview --workspace=apps/client
```

For production you must serve the built assets over HTTPS, configure Mapbox token restrictions, and point `SERVER_URL` in `packages/shared/constants.js` (or refactor to `import.meta.env.VITE_API_URL`) at your deployed API.

---

## Contributing & panic UX guardrails

Before changing the panic button flow or related CSS, read **`CAPSULES.md`** at the repo root. It documents intentional reliability patterns (pointer capture, inflight/finish mutexes, reduced-motion behavior, etc.) that should not be removed casually.

**Git:** Default branch is **`main`**; remote is `https://github.com/bnha4212/Hack-Davis-Ice-Man.git`. Avoid force-push unless the team agrees.

---

## Troubleshooting

| Issue | What to try |
| ----- | ----------- |
| Map is blank / Mapbox errors | Set `VITE_MAPBOX_TOKEN` in root `.env` or `.env.local`; restart Vite. |
| Client cannot reach API | Ensure backend is running and listening on the same host/port as `SERVER_URL` in `packages/shared/constants.js` (default **3001**). |
| `EADDRINUSE` on 3001 or 5173 | Another dev server is still running. Stop other Node processes or change `PORT` / Vite port in config. |
| Backend exits: missing `MONGODB_URI` | Add `MONGODB_URI` to `backend/.env`. |
| Workspace install oddities | Run `npm install` from repo root **and** `npm install --prefix backend`. |

---

## License / usage

Hackathon project — clarify licensing with your team before public redistribution.
