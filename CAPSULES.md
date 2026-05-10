# safeguard-panic — context capsules

**For Cursor / future sessions:** read this file **first** before editing. A project rule (`.cursor/rules/safeguard-panic-capsules.mdc`) auto-applies and points here.

---

## 1. Project overview

- **Stack**: Vite + React + TypeScript (frontend).
- **Name**: `safeguard-panic` (npm / app name); GitHub repo is **Hack-Davis-Ice-Man** (see §4).
- **Goal**: Panic-button **demo** for **Hack Davis** — SafeGuard flow in the browser.
- **Main feature** (end-to-end story):
  1. **Hold-to-record** audio (mic).
  2. **Transcript** (mock STT) → user **confirms / edits**.
  3. **Bilingual response** (mock LLM: EN + ES).
  4. **SMS trigger** (mock; real Twilio expected via backend later).
- **Also in repo**: **`backend/`** — Node server (reports, scraper, Claude service, etc.) merged from `origin/main`; coordinate frontend mocks with this backend when wiring production APIs.

---

## 2. Current implementation

### Panic UI (primary demo surface)

- **`src/panic/PanicFlow.tsx`** — UI + phase state machine + recording.
- **`src/panic/PanicFlow.css`** — panic layout and state styling.
- **`src/panic/panicServices.ts`** — **`PanicServices`** adapters + **mock** implementations (TODOs for real Whisper / Claude / Twilio).

**Phases:** `idle` → `recording` → `transcribing` → `confirming` → `responding` → `sent`; `error` ends in a resettable state (**Try again** clears session).

**Services (mocks today):**

- `transcribeAudio` → Whisper (or other STT).
- `composeBilingualResponse` → Claude (or other LLM).
- `sendPanicSms` → Twilio via **your** backend (never expose secrets in the browser).

### Backend (from merged remote)

- **`backend/`** — Express-style API, models, routes, `services/claude.js`, `services/scraper.js`, etc. Treat as the integration home for server-side keys and Twilio later.

### Map — Reconstruct capsule (`apps/client`)

- **`ReconstructCapsule.jsx`** + **`ReconstructCapsule.css`** — When the map viewport is **zoomed in** (zoom ≥ 9) and **scraped** reports (**Reddit** / **Google News** via backend scraper) fall within **~30 km** of the map center, a **Reconstruct** control appears above the nav bar. It opens a sheet with a **combined digest** of Claude summaries plus **per-item cards** (summary + expandable **original scraped text**). Data is refreshed from **`GET /api/reports`** when the sheet opens so descriptions stay consistent with MongoDB.
- **`mapSlice`** — Stores **`lng` / `lat` / `zoom`** from Mapbox (`moveend` / `zoomend`, throttled); **`MapView.jsx`** keeps it in sync for proximity checks.

---

## 3. Reliability decisions (do not regress casually)

- **Pointer capture** on the hold button so lift/stop tracks the same pointer on touch.
- **`inflightRef`** — prevents overlapping “start recording” while `getUserMedia` is pending.
- **`finishMutexRef`** — prevents double **finish** / duplicate stop handling.
- **`stopBeforeStartRef`** — if the user releases **before** recording actually starts, abort the pending start and drop the stream.
- **Window-level `pointerup` / `pointercancel` (capture)** while `recording` — fallback if capture behavior differs by browser.
- **`confirmSendMutexRef`** — prevents double **Confirm & send** / parallel pipeline calls.
- **`prefers-reduced-motion`** — recording badge pulse and spinner respect reduced motion in CSS.
- **Mobile touch** — tap highlight / callout tweaks on the hold control in CSS.
- **Accessibility** — e.g. `aria-describedby` on hold control, region landmark, error copy for **Try again** (session reset).

---

## 4. Git / GitHub status

- **`origin`**: `https://github.com/bnha4212/Hack-Davis-Ice-Man.git`
- **Default branch**: **`main`** (local tracks `origin/main` after publish).
- **Unrelated histories**: Local Safeguard/Vite history and remote **Ice Man** history were merged with **`git merge origin/main --allow-unrelated-histories`**.
- **`README.md`**: **add/add** conflict was resolved once (kept detailed safeguard-panic README); completed in merge commit.
- **Push**: **`main`** has been pushed to **`origin`** with a **normal** push (**no force push** policy).
- **Ongoing**: Run `git fetch origin` and `git status` before sessions; merge or rebase if `origin/main` moves.

---

## 5. Next steps

1. **`git fetch origin`** / **`git status`** — confirm `main` matches `origin/main` when starting work.
2. **Stash** — if you use `git stash` for panic WIP, **`git stash apply`** or **`pop`** after pulling; resolve conflicts only in touched files.
3. **Manual QA** — `npm run dev`, full panic flow (mic, short hold, confirm, sent, error + Try again).
4. **Integrations** — replace mocks in `panicServices.ts`; use **`backend/`** (or a new API) for secrets, Whisper, Claude, Twilio.
5. **Optional** — add `CAPSULES.md` / remote URL tweaks to README for new contributors.
