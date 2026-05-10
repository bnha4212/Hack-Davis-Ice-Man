# safeguard-panic — context capsules

**For Cursor / future sessions:** read this file **first** before editing. A project rule (`.cursor/rules/safeguard-panic-capsules.mdc`) auto-applies and points here.

---

## 1. Project overview

- **Stack**: Vite + React in **`apps/client`** (mixed **TypeScript** — `panic/` — and **JavaScript** — screens, map, UI).
- **Name**: Root npm workspace is **`iceman`** (`@iceman/client`); GitHub repo is **Hack-Davis-Ice-Man** (see section 4).
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

- **`apps/client/src/panic/PanicFlow.tsx`** — UI + phase state machine + recording.
- **`apps/client/src/panic/PanicFlow.css`** — panic layout and state styling.
- **`apps/client/src/panic/panicServices.ts`** — **`PanicServices`** adapters + **mock** implementations (TODOs for real Whisper / Claude / Twilio).

**Phases:** `idle` → `recording` → `transcribing` → `confirming` → `responding` → `sent`; `error` ends in a resettable state (**Try again** clears session).

**Services (mocks today):**

- `transcribeAudio` → Whisper (or other STT).
- `composeBilingualResponse` → Claude (or other LLM).
- `sendPanicSms` → Twilio via **your** backend (never expose secrets in the browser).

### Backend (from merged remote)

- **`backend/`** — Express-style API, models, routes, `services/claude.js`, `services/scraper.js`, etc. The **scraper** uses **`textIsRaidOrDetentionSignal`**, skips **`textIsLikelyEditorialOrAnalysis`** (op-eds, editorials, opinion columns), and after Claude drops items where **`impliesNoSpecificEnforcementLocation`** (e.g. “broadly covers … rather than a specific city”). **`parseLocationFromText`** is instructed not to pin statewide/policy-only pieces.

### Map — Nearby signals sheet (`apps/client`)

- **`apps/client/src/components/Map/ReconstructCapsule.jsx`** + **`.css`** — **Nearby signals** sheet opens when the user **taps the heatmap, a pin, or within ~28 km of an actionable scraped pin** (see **`MapView`**). No bottom FAB. Sheet lists **Reddit** / **Google News** items within **`RECON_PROXIMITY_KM`** (30 km) of map center (digest, cards, posted age, expandable text); **`GET /api/reports`** refreshes when opened. **`reportLooksLikeBroadEditorialOrAnalysis`** drops op-eds / “no specific location” items from the list. **Pins** still use **hover popups** in **`MapView.jsx`** / **`MapView.css`**.
- **`apps/client/src/recon/reconManager.js`** — Proximity filter, editorial screen, sort-by-distance, digest, **`formatReportAge`**, source labels, **`reconManager`** namespace.
- **`apps/client/src/store/mapSlice.js`** — **`lng` / `lat` / `zoom`**, plus **`nearbySignalsSheetOpen`** / **`setNearbySignalsSheetOpen`** for sheet visibility.
- **`apps/client/src/components/Map/MapView.jsx`** — Viewport sync; **`click`** opens the sheet via **`setNearbySignalsSheetOpen(true)`** when the click hits pins, heat (if queryable), or is near actionable scraped coordinates.

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
4. **Integrations** — replace mocks in **`apps/client/src/panic/panicServices.ts`**; use **`backend/`** (or a new API) for secrets, Whisper, Claude, Twilio.
5. **Optional** — add `CAPSULES.md` / remote URL tweaks to README for new contributors.
