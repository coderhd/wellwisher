# Wellwisher

> **Personal Rhythm-Aware Cockpit & Intelligent Weekly Planning Companion**

Wellwisher is a responsive, local-first web application designed to bring calm authority and rhythm-first clarity to personal time allocation. It treats energy and leisure as first-class citizens alongside focused work, replaces reactive calendar clutter with spacious open capacity, and provides clear, unhurried guidance without gamification pressure.

---

## Visual & Interaction Philosophy

- **Quiet Modern Restraint:** Deep blue-charcoal cockpit background (`#161922`), warm panel surfaces (`#1f242e`), restrained sage accents (`#6b9080`), and muted peach highlights (`#d4a373`).
- **Rhythm Anchors & Protected Commitments:** Daily habits and non-negotiables (morning rhythms, lunch, sunset walks, gym, dinner) are protected first.
- **Flexible Intentions:** High-priority work tracks (AI Engineering, Lekhan, Software Factory) and restorative leisure (Walking, Reading, Trending learning) are suggested within broad morning, afternoon, or evening windows rather than rigid calendar slots.
- **Single Calm Recommendation:** Today surfaces exactly one high-context focus recommendation with rationale and trade-offs.
- **Restorative Completion:** When focus sessions complete, Wellwisher celebrates completion with spacious affirmation, recommends resting, and eliminates all gamification (no streaks, XP, points, confetti, or guilt framing).
- **Visible Trade-Offs & Undo:** Every arrangement and manual adjustment preserves prior state with full Undo support.

---

## Surfaces

1. **Today (`/today`):** The primary daily operating cockpit. Displays the current recommendation, active focus timer or completion state, day capacity breakdown, and a compact week ribbon.
2. **Week (`/week`):** Seven-day horizon view displaying daily protected time, suggested allocations, and open capacity across all days without a noisy 24-hour grid.
3. **Day Detail (`/day/[date]`):** Detailed day timeline showing exact times for anchored commitments and broad windows for suggested intentions.
4. **Plan (`/plan`):** Rhythm-aware Allocation Board with unplaced intention shelf, recurring rhythm anchors, pointer/touch drag-and-drop, accessible dropdown placement, exact-time pinning, auto-arrangement, and Undo.

---

## Demo Scenario & State Management

Wellwisher runs out-of-the-box with a realistic personal scenario (week of September 7, 2026):

### Protected Anchors
- **Morning rhythm:** 07:30 – 08:30 (Weekdays)
- **Lunch:** 13:30 – 14:30 (Weekdays)
- **Sunset / calm place:** 18:00 – 20:00 (Weekdays)
- **Gym:** 20:00 – 21:00 (Weekdays)
- **Dinner:** 21:00 – 22:00 (Weekdays)

### Flexible Intentions
- **AI Engineering:** 90 min (Work · Priority 1 · Morning)
- **Lekhan:** 45 min (Work · Priority 2 · Morning)
- **Software Factory:** 60 min (Work · Priority 2 · Afternoon)
- **Trending learning:** 45 min (Leisure · Priority 3 · Evening)
- **Walk:** 30 min (Leisure · Priority 3 · Evening)
- **Read:** 30 min (Leisure · Priority 3 · Evening)

### Local Storage & Reset
All state is persisted locally in the browser under the key:
```text
wellwisher.state.v1
```
- **Resetting state:** To restore the original demo state, open browser DevTools Console and run:
  ```js
  localStorage.removeItem('wellwisher.state.v1')
  location.reload()
  ```
- Alternatively, click the profile avatar (`HD`) in the top navigation and select **Reset demo scenario**.
- **No Authentication / Server:** This MVP slice is entirely local-first and does not require credentials or a remote database.

---

## Intentional Architecture Seams

Wellwisher is engineered with clear architectural seams to allow pluggable backend and device capabilities:

1. **Voice & Dictation Seam (`src/voice/types.ts`):**
   - Clean `DictationAdapter` and `CompanionVoice` interfaces.
   - Includes a deterministic mock adapter (`mockVoice.ts`) and browser Web Speech API adapter (`browserDictation.ts`).
   - UI components (`VoiceDock`, `InlineComposer`) interact strictly through these interfaces, ready for future Whisper, cloud STT, or ElevenLabs/TTS providers.
2. **Persistence Seam (`src/state/persistence.ts`):**
   - Versioned envelope repository pattern (`PersistedEnvelope`).
   - Cleanly decoupled from React components; ready to be replaced with SQLite, CRDTs, or cloud sync.
3. **Planning & Recurrence Core (`src/domain/planning/`):**
   - Pure, zero-dependency domain algorithms for recurrence expansion (`recurrence.ts`), capacity math (`capacity.ts`), immutable week arrangement (`arrange-week.ts`), and mutations (`mutations.ts`).
   - Separated from React lifecycle and UI concerns.
4. **Calendar Integration Seam:**
   - Manual unavailable-time entries and protected commitments share the `ProtectedCommitment` domain model, ready for future Google Calendar, Apple Calendar, or CalDAV bi-directional sync.

---

## Local Development & Scripts

### Prerequisites
- Node.js `>= 18.0.0` (v24 LTS recommended)
- `pnpm` (or `npm`)

### Setup & Run
```bash
# Install dependencies
pnpm install

# Start development server on http://localhost:3000
pnpm dev

# Typecheck TypeScript
pnpm typecheck

# Lint with Next.js / ESLint
pnpm lint

# Run unit & component test suite with Vitest
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Run Playwright End-to-End tests (Desktop & Mobile Chrome)
pnpm test:e2e

# Build optimized production bundle
pnpm build

# Run production server
pnpm start
```

---

## Deployment to Vercel

Wellwisher is ready for zero-configuration deployment on [Vercel](https://vercel.com):

1. Push code to your Git repository.
2. Import the repository into Vercel.
3. Framework Preset: **Next.js**.
4. Build Command: `next build` (or `pnpm build`).
5. Output Directory: `.next`.
6. Install Command: `pnpm install` (or `npm install`).

The build generates static and dynamic routes without any server-only APIs in client bundles, fully compliant with Edge and Node runtimes.

---

## License

Private repository. All rights reserved.
