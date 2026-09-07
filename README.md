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

## Surfaces & Architecture

### 1. Today (`/today`)
The primary daily operating cockpit. Displays the current recommendation, active focus timer or completion state, day capacity breakdown, and a compact week ribbon.

### 2. Week (`/week`)
Seven-day horizon view displaying daily protected time, suggested allocations, and open capacity across all days without a noisy 24-hour grid.

### 3. Day Detail (`/day/[date]`)
Detailed day timeline showing exact times for anchored commitments and broad windows for suggested intentions.

### 4. Responsive Option C Planner (`/plan`)
Rhythm-aware Allocation Board engineered with a focused single-day canvas and week ribbon:
- **7-Day Ribbon Navigation:** Clean pill-based day switcher displaying daily open capacity; scrolls horizontally with touch support on mobile.
- **Focused Single-Day Canvas:** Spacious morning, afternoon, and evening window zones for the active day, reducing cognitive load compared to crowded multi-day grids.
- **Sidebar Shelf:** Unplaced intentions and rhythm anchors with dynamic badge counts and in-place action triggers.
- **Multi-Modal Placement:** Pointer/touch drag-and-drop powered by `@dnd-kit`, plus an accessible placement dropdown menu on every card for keyboard and screen reader navigation.
- **Exact-Time Pinning:** Move any suggested allocation into a pinned commitment with custom start time.
- **Auto-Arrangement & Undo:** One-click algorithmically arranges unplaced intentions with 90-minute daily open-capacity buffers, backed by single-step reversible Undo.

### 5. Settings & Preferences (`/settings`)
A centralized management console for cockpit personalization and local data hygiene:
- **Master Rhythm Anchors:** Create, edit, and delete recurring anchors with customizable times and repeat patterns (daily, weekdays, or selected days).
- **Day Schedule Boundaries:** Configure earliest available start and latest available end times for daily scheduling windows.
- **Companion Voice Preferences:** Toggle audio mute, auto-play spoken orientation on navigation, and adjust speech playback rates (0.75x to 1.5x).
- **Storage & Data Management:** Export full JSON backups, import/restore previous backups with runtime schema validation (`zod`), or reset to the default demo scenario.

---

## Dynamic In-Context Modals

- **`IntentionModal` (`+ Add Intention` / `Edit Intention`):**
  - Configures title, kind (`work` or `leisure`), duration (15 to 120 min), preferred window (`morning`, `afternoon`, `evening`, or flexible), and priority level (P1–P3).
  - Full keyboard accessibility with Escape dismissal, autofocus, validation, and delete confirmation.
- **`AnchorModal` (`+ Add Anchor` / `Edit Anchor`):**
  - Configures title, start/end clock times (with HH:mm validation and duration checks), repeat pattern (daily, weekdays, selected day-of-week checkboxes), and protected commitment locking.

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
- Alternatively, click the profile avatar (`HD`) in the top navigation and select **Reset demo scenario**, or navigate to `/settings` and click **Reset to Demo Scenario**.
- **No Authentication / Server:** This MVP slice is entirely local-first and does not require credentials or a remote database.

---

## Intentional Architecture Seams

Wellwisher is engineered with clear architectural seams to allow pluggable backend, cloud, and device capabilities:

1. **Google Drive & Cloud Sync Seam (`src/state/persistence.ts` & `src/app/settings/`):**
   - Versioned envelope repository pattern (`PersistedEnvelope`).
   - JSON export and runtime schema validation ready for bidirectional cloud file sync (Google Drive, Dropbox, or iCloud).
   - Cleanly decoupled from React components; ready to be backed by SQLite, CRDTs, or cloud sync adapters.
2. **Voice & Dictation Seam (`src/voice/types.ts`):**
   - Clean `DictationAdapter` and `CompanionVoice` interfaces.
   - Includes a deterministic mock adapter (`mockVoice.ts`) and browser Web Speech API adapter (`browserDictation.ts`).
   - UI components (`VoiceDock`, `InlineComposer`) interact strictly through these interfaces, ready for future Whisper, cloud STT, or ElevenLabs/TTS providers.
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

# Run unit & component test suite with Vitest (185+ tests)
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Run Playwright End-to-End tests (Desktop & Mobile Chrome)
pnpm test:e2e

# Build optimized production bundle & static export
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
