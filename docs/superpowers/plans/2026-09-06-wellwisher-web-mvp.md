# Wellwisher Web MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive Wellwisher web/PWA MVP with Today, Week, and Plan surfaces; rhythm anchors; flexible work and leisure intentions; visible allocation trade-offs; focus sessions; and replaceable voice/dictation seams.

**Architecture:** Use a Next.js App Router shell with a pure TypeScript planning domain underneath it. The domain computes protected anchors, suggested allocations, and open capacity without knowing about React, persistence, audio, or route structure. A small client-side reducer persists the personal demo state to local storage, while the UI surfaces consume typed selectors. Speech-to-text, text-to-speech, and future agent-driven UI remain adapter interfaces with a local/mock implementation in the first slice.

**Tech Stack:** Next.js App Router, TypeScript, React, CSS variables with component-scoped CSS, `@dnd-kit/core` for accessible drag-and-drop, `date-fns` for date calculations, `zod` for user-input validation, Vitest and Testing Library (`@testing-library/react`, `@testing-library/dom`, and `@testing-library/user-event`) for unit/component tests, Playwright for browser flows, and a Vercel-compatible PWA manifest.

**Spec:** `docs/superpowers/specs/2026-09-06-wellwisher-visual-product-design.md`

## Global Constraints

- Responsive web app/PWA, deployed to Vercel. Flutter and React Native remain deferred unless native audio behavior later proves essential.
- Today is the default working surface; Week provides day-level context; Day detail uses exact times for real commitments and flexible space elsewhere.
- The Planner uses rhythm anchors, protected commitments, flexible intentions, and open capacity. Flexible work and leisure are suggested by default, not fixed calendar appointments.
- Manual unavailable-time entry is V1. The model must leave a clean seam for future calendar integration.
- Wellwisher makes one clear recommendation with calm authority, explains the reason, shows visible trade-offs, and offers Undo.
- Audio is an enhancement, never a requirement for understanding or completing core work.
- Voice must add perspective rather than repeat visible UI copy. Speech providers, Whisper/native dictation, TTS, AG-UI, authentication, persistence services, and calendar integration are not selected in this plan.
- No billing, teams, multi-tenant administration, generalized configuration, streaks, XP, guilt framing, or gamified pressure.
- Leisure is a first-class intention. Open capacity is allowed to remain open.
- Use the approved Human + Intelligent visual direction refined with Quiet Modern restraint: deep blue-charcoal cockpit surfaces, restrained sage, muted peach, editorial serif companion copy, quiet sans controls, generous spacing, and few meaningful surfaces.

---

## Scope and delivery slices

This plan is divided into independently testable slices:

1. **Foundation:** runnable Next.js/PWA shell, design tokens, test tooling.
2. **Planning core:** domain model, recurrence, capacity calculation, arrangement, reducer, and local persistence.
3. **Product surfaces:** Today, Week, Day detail, and Planner allocation board.
4. **Interaction states:** drag/drop, pinning, rebalancing, Undo, focus session, and completion state.
5. **Voice seam and hardening:** dictation composer, companion voice adapter, accessibility, responsive checks, and Vercel build verification.

Each slice ends with a focused test run and a commit. Do not begin provider integration or backend work until the local-first vertical slice is usable.

## File map

The implementation should create the following focused boundaries:

```text
src/
  app/
    layout.tsx                 # Root metadata, fonts, provider boundary
    page.tsx                   # Redirect or link to Today
    today/page.tsx             # Today route
    week/page.tsx              # Full Week allocation route
    plan/page.tsx              # Planner route
    day/[date]/page.tsx        # Day-detail route
    globals.css                # Global reset and design tokens only
  components/
    shell/AppShell.tsx         # Responsive frame and primary navigation
    shell/HeaderNav.tsx        # Today / Week / Plan and profile/settings
    voice/VoiceDock.tsx        # Bottom-centre dictation entry point
    voice/InlineComposer.tsx    # Editable live-transcription composer
    planning/AllocationLegend.tsx
    planning/WeekRibbon.tsx
    planning/CapacityPanel.tsx
    planning/AllocationBoard.tsx
    planning/IntentionCard.tsx
    planning/RhythmAnchorCard.tsx
    planning/DayLanes.tsx
    focus/FocusSession.tsx
    focus/TodayCompletion.tsx
  domain/planning/
    types.ts                   # Pure domain types and discriminated unions
    recurrence.ts              # Repeat-pattern expansion
    capacity.ts                # Capacity and open-window calculation
    arrange-week.ts            # Suggested allocation algorithm
    mutations.ts               # Pure move/pin/undo-compatible transformations
  domain/focus/
    types.ts
    session.ts                 # Pure focus-session state transitions
  state/
    WellwisherProvider.tsx     # React context and selectors
    reducer.ts                 # Typed state transitions
    persistence.ts             # Versioned localStorage repository
  data/demoScenario.ts         # Harsh-specific local demo data
  voice/
    types.ts                   # STT/TTS adapter interfaces
    mockVoice.ts               # Deterministic test/demo adapter
    browserDictation.ts        # Optional browser adapter behind interface
  styles/
    surface.css               # Surface-level layout styles
    planner.css               # Planner-specific grid and drag states
    focus.css                 # Focus and completion states
tests/
  domain/planning/*.test.ts
  domain/focus/*.test.ts
  state/*.test.ts
  components/*.test.tsx
e2e/
  today-week-plan.spec.ts
  focus-completion.spec.ts
public/
  manifest.webmanifest
  icons/
```

---

### Task 1: Scaffold the responsive Next.js/PWA shell

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `public/manifest.webmanifest`
- Create: `src/app/page.test.tsx`

**Interfaces:**
- Produces a runnable Next.js app with `npm run dev`, `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:e2e` scripts.
- `src/app/page.tsx` renders a temporary Today route link; later tasks replace the placeholder with the real surface.

- [ ] **Step 1: Create the app manifest and testable scripts**

Use these scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Install only the dependencies required by the stack: `next`, `react`, `react-dom`, `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@dnd-kit/core`, `date-fns`, `zod`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@playwright/test`, `eslint`, and `eslint-config-next`.

- [ ] **Step 2: Add the initial failing smoke test**

```tsx
import { render, screen } from '@testing-library/react'
import Home from './page'

test('home offers the Today entry point', () => {
  render(<Home />)
  expect(screen.getByRole('link', { name: /today/i })).toHaveAttribute('href', '/today')
})
```

- [ ] **Step 3: Run the smoke test and confirm it fails**

Run: `npm test -- src/app/page.test.tsx`

Expected: FAIL because the page and test configuration are not implemented.

- [ ] **Step 4: Add the minimal shell and token foundation**

Define CSS variables for the approved visual roles, including `--ww-cockpit`, `--ww-panel`, `--ww-sage`, `--ww-sage-surface`, `--ww-peach`, `--ww-stone`, `--ww-text`, `--ww-muted`, and spacing/radius variables. Keep all colors in `src/app/globals.css`; do not scatter hex values across components.

- [ ] **Step 5: Run the foundation checks**

Run: `npm test -- src/app/page.test.tsx && npm run typecheck && npm run build`

Expected: PASS for the smoke test, typecheck, and production build.

- [ ] **Step 6: Commit the runnable foundation**

```bash
git add package.json next.config.ts tsconfig.json vitest.config.ts playwright.config.ts src public
git commit -m "chore: scaffold wellwisher web app"
```

### Task 2: Define the planning domain and recurrence model

**Files:**
- Create: `src/domain/planning/types.ts`
- Create: `src/domain/planning/recurrence.ts`
- Create: `src/domain/planning/capacity.ts`
- Create: `src/domain/planning/arrange-week.ts`
- Create: `src/domain/planning/mutations.ts`
- Create: `tests/domain/planning/recurrence.test.ts`
- Create: `tests/domain/planning/capacity.test.ts`
- Create: `tests/domain/planning/arrange-week.test.ts`
- Create: `tests/domain/planning/mutations.test.ts`

**Interfaces:**
- `RhythmAnchor`, `ProtectedCommitment`, `FlexibleIntention`, `Allocation`, `OpenWindow`, and `WeekPlan` are pure serializable types.
- `expandRecurrence(anchor: RhythmAnchor, weekStart: string): ProtectedCommitment[]` expands an anchor into concrete date instances.
- `calculateCapacity(day: DayPlan): CapacitySummary` returns protected minutes, suggested minutes, open minutes, and open windows.
- `arrangeWeek(input: ArrangeWeekInput): WeekPlan` returns a new plan without mutating input.
- `moveAllocation(plan: WeekPlan, allocationId: string, target: MoveTarget): WeekPlan` preserves protected blocks and changes only flexible allocations.
- `pinAllocation(plan: WeekPlan, allocationId: string, start: string): WeekPlan` converts a suggested placement into a user-pinned placement.

Use these discriminated unions:

```ts
export type ItemKind = 'work' | 'leisure'
export type AllocationMode = 'protected' | 'suggested' | 'pinned'
export type RepeatPattern =
  | { type: 'daily' }
  | { type: 'weekdays' }
  | { type: 'selected-days'; days: number[] }

export interface FlexibleIntention {
  id: string
  title: string
  kind: ItemKind
  durationMinutes: number
  preferredWindow?: 'morning' | 'afternoon' | 'evening'
  priority: 1 | 2 | 3
}

export interface RhythmAnchor {
  id: string
  title: string
  startTime: string
  endTime: string
  repeat: RepeatPattern
  protected: boolean
}

export interface Allocation {
  id: string
  intentionId?: string
  commitmentId?: string
  date: string
  mode: AllocationMode
  start?: string
  end?: string
  durationMinutes: number
}
```

- [ ] **Step 1: Write recurrence tests**

Cover daily anchors, weekdays, selected days, and anchors that cross midnight. Assert that each expanded commitment preserves the source anchor id and exact local time.

- [ ] **Step 2: Run recurrence tests and confirm failure**

Run: `npm test -- tests/domain/planning/recurrence.test.ts`

Expected: FAIL because the recurrence module does not exist.

- [ ] **Step 3: Implement recurrence expansion**

Use `date-fns` date arithmetic. Treat the supplied week start as an ISO date string and return only instances within the seven-day range.

- [ ] **Step 4: Write capacity tests**

Assert that protected time is subtracted from the day, suggested allocations do not eliminate open capacity unless pinned, and the result retains at least one open window when spare time exists.

- [ ] **Step 5: Implement capacity calculation**

Sort concrete blocks by start time, merge overlapping protected ranges, and return open windows between them. Suggested allocations are reported separately from protected capacity.

- [ ] **Step 6: Write arrangement tests**

Assert that `arrangeWeek`:

```ts
const plan = arrangeWeek({
  anchors: [lunchAt1330, sunsetAt18, gymAt20, dinnerAt21],
  intentions: [aiEngineering, lekhan, factory, sunsetLearning],
  weekStart: '2026-09-07',
  preserveOpenMinutesPerDay: 90
})

expect(plan.allocations.every((item) => item.mode !== 'pinned')).toBe(true)
expect(plan.protectedCommitments).toContainEqual(expect.objectContaining({ title: 'Lunch' }))
expect(plan.openWindows.some((window) => window.durationMinutes >= 90)).toBe(true)
```

- [ ] **Step 7: Implement arrangement and pure mutations**

Place flexible intentions into the best available broad window using preferred window, priority, and remaining capacity. Do not assign exact start/end times to suggested work unless the user explicitly pins it. Keep open capacity visible and return a new immutable plan from every mutation.

- [ ] **Step 8: Run domain tests and commit**

Run: `npm test -- tests/domain/planning`

Expected: PASS for recurrence, capacity, arrangement, move, and pin behavior.

```bash
git add src/domain/planning tests/domain/planning
git commit -m "feat: add rhythm-aware planning domain"
```

### Task 3: Add demo data, reducer state, and local persistence

**Files:**
- Create: `src/data/demoScenario.ts`
- Create: `src/state/reducer.ts`
- Create: `src/state/WellwisherProvider.tsx`
- Create: `src/state/persistence.ts`
- Create: `tests/state/reducer.test.ts`
- Create: `tests/state/persistence.test.ts`

**Interfaces:**
- `WellwisherState` contains `weekStart`, `anchors`, `protectedCommitments`, `intentions`, `allocations`, `focusSession`, `voicePreferences`, and `lastPlanChange`.
- Actions are `ADD_ANCHOR`, `ADD_INTENTION`, `ARRANGE_WEEK`, `MOVE_ALLOCATION`, `PIN_ALLOCATION`, `UNDO_PLAN_CHANGE`, `START_FOCUS`, `COMPLETE_FOCUS`, and `SET_VOICE_PREFERENCE`.
- `loadState(): WellwisherState | null` and `saveState(state: WellwisherState): void` use a versioned local-storage envelope.

- [ ] **Step 1: Create the Harsh demo scenario**

Seed working-day anchors for morning rhythm, lunch at 13:30, sunset/calm place 18:00–20:00, gym at 20:00, and dinner 21:00–22:00. Seed flexible intentions for AI Engineering, Lekhan, Software Factory, Trending learning, Walk, and Read. Mark leisure items as `kind: 'leisure'`, not as rewards.

- [ ] **Step 2: Write reducer tests**

Test that arranging creates suggested allocations, moving a flexible allocation leaves protected commitments unchanged, pinning changes only the chosen allocation mode, Undo restores the previous plan, and completing focus records the completion state.

- [ ] **Step 3: Implement the reducer and provider**

Keep all planning mutations delegated to the pure domain functions. The provider exposes selectors such as `getTodayPlan()`, `getWeekPlan()`, `getUnplacedIntentions()`, and `getRecommendation()` so components do not reconstruct planning rules.

- [ ] **Step 4: Write persistence tests**

Assert that a state round-trips through JSON, invalid or old versions fall back to the demo scenario, and the persistence layer never throws when local storage is unavailable.

- [ ] **Step 5: Implement versioned local persistence**

Use a key such as `wellwisher.state.v1`. Serialize dates as ISO strings. Keep the repository behind `loadState` and `saveState` so a future server-backed repository can replace it without changing components.

- [ ] **Step 6: Run state tests and commit**

Run: `npm test -- tests/state`

Expected: PASS with reducer and persistence coverage.

```bash
git add src/data src/state tests/state
git commit -m "feat: add local wellwisher planning state"
```

### Task 4: Build the responsive shell and navigation

**Files:**
- Create: `src/components/shell/AppShell.tsx`
- Create: `src/components/shell/HeaderNav.tsx`
- Create: `src/components/shell/ProfileMenu.tsx`
- Create: `src/components/shell/AppShell.module.css`
- Create: `src/components/shell/HeaderNav.module.css`
- Modify: `src/app/layout.tsx`
- Create: `tests/components/AppShell.test.tsx`

**Interfaces:**
- `AppShell({ children, activeSurface }: { children: React.ReactNode; activeSurface: 'today' | 'week' | 'plan' }): JSX.Element` renders the responsive frame.
- `HeaderNav` exposes links to `/today`, `/week`, and `/plan`; Settings is available from the profile menu rather than a persistent sidebar.

- [ ] **Step 1: Write shell tests**

Assert that Today, Week, and Plan links have accessible names, the active surface is announced, Settings is reachable from the profile control, and the shell does not render a desktop-only sidebar.

- [ ] **Step 2: Implement the shell**

Use the approved visual tokens and a single top navigation. On narrow screens, keep the same information hierarchy and collapse secondary metadata without hiding core controls.

- [ ] **Step 3: Add the app routes**

Create route pages for `/today`, `/week`, `/plan`, and `/day/[date]`, each initially rendering a labeled surface placeholder inside `AppShell`.

- [ ] **Step 4: Run shell tests and commit**

Run: `npm test -- tests/components/AppShell.test.tsx && npm run typecheck`

Expected: PASS.

```bash
git add src/app src/components/shell tests/components/AppShell.test.tsx
git commit -m "feat: add responsive wellwisher shell"
```

### Task 5: Implement Today, Week, and Day detail surfaces

**Files:**
- Create: `src/components/planning/AllocationLegend.tsx`
- Create: `src/components/planning/WeekRibbon.tsx`
- Create: `src/components/planning/CapacityPanel.tsx`
- Create: `src/components/planning/DayLanes.tsx`
- Create: `src/app/today/TodaySurface.tsx`
- Create: `src/app/week/WeekSurface.tsx`
- Create: `src/app/day/[date]/DaySurface.tsx`
- Create: component-scoped CSS files alongside each surface
- Create: `tests/components/TodaySurface.test.tsx`
- Create: `tests/components/WeekSurface.test.tsx`
- Create: `tests/components/DaySurface.test.tsx`

**Interfaces:**
- Today consumes `getRecommendation()`, `getTodayPlan()`, `getCapacity()`, and `getWeekSummary()`.
- Week consumes `getWeekPlan()` and renders seven day-level allocation columns without an hour-by-hour calendar grid.
- Day consumes `getDayPlan(date)` and renders protected exact commitments, the current recommendation, flexible allocations, and honest open space.

- [ ] **Step 1: Write Today tests**

Assert that Today shows exactly one recommendation, displays its reason, shows protected time, exposes the Week link, and renders a compact non-repetitive week ribbon with allocation summaries rather than repeated recommendation cards.

- [ ] **Step 2: Implement Today**

Use the companion perspective as a short separate message. Show the recommendation and focus action first, then capacity and the week ribbon. Keep audio controls subordinate to the recommendation.

- [ ] **Step 3: Write Week tests**

Assert that each day shows protected, suggested, and open states; flexible work is not presented as a fixed appointment; clicking a day navigates to `/day/YYYY-MM-DD`; and the view includes planned/open/protected summary counts.

- [ ] **Step 4: Implement Week**

Use the approved Allocation board as the visual base. Render protected blocks in muted peach, suggested blocks in sage/blue, and open capacity as visible breathing room. Do not repeat the Today recommendation inside each day column.

- [ ] **Step 5: Write Day tests and implement Day detail**

Assert exact times only for protected commitments and pinned/current recommendation placement. Suggested work remains movable and open capacity remains visible.

- [ ] **Step 6: Run surface tests and commit**

Run: `npm test -- tests/components/TodaySurface.test.tsx tests/components/WeekSurface.test.tsx tests/components/DaySurface.test.tsx`

Expected: PASS.

```bash
git add src/app/today src/app/week src/app/day src/components/planning tests/components
git commit -m "feat: add today week and day planning surfaces"
```

### Task 6: Implement the Planner allocation board

**Files:**
- Create: `src/components/planning/AllocationBoard.tsx`
- Create: `src/components/planning/IntentionCard.tsx`
- Create: `src/components/planning/RhythmAnchorCard.tsx`
- Create: `src/app/plan/PlanSurface.tsx`
- Create: `src/styles/planner.css`
- Create: `tests/components/AllocationBoard.test.tsx`

**Interfaces:**
- `AllocationBoard` accepts `WeekPlan`, `unplacedIntentions`, and callbacks `onSuggest`, `onPin`, `onArrange`, and `onUndo`.
- `onSuggest(intentionId, target: { date: string; window: 'morning' | 'afternoon' | 'evening' }): void` creates a flexible suggestion.
- `onPin(allocationId, start: string): void` explicitly converts a suggestion into a pinned placement.

- [ ] **Step 1: Write interaction tests**

Test with keyboard and pointer semantics that an intention can be dragged to a day/window, the resulting allocation is marked Suggested, dropping into an exact-time affordance requires an explicit pin action, protected anchors cannot be moved, leisure items appear beside work items, and Undo restores the prior board.

- [ ] **Step 2: Implement the intention shelf and rhythm anchors**

Show Work and Leisure unplaced intentions, recurring anchors, protected commitments, and open capacity. Include the user-facing copy “These are suggestions, not commitments. Pin to a time after placing.”

- [ ] **Step 3: Add drag-and-drop with accessible fallback**

Use `@dnd-kit/core` for pointer and keyboard sensors. Every draggable intention must also have a menu action such as “Suggest on Tuesday morning” so the planner remains usable without dragging.

- [ ] **Step 4: Add Arrange my week, Pin to a time, and Undo**

`Arrange my week` dispatches one explicit action and shows the resulting changes. It must preserve anchors, leave configured open capacity, and expose Undo. `Pin to a time` requires a concrete start time and visibly changes the allocation mode.

- [ ] **Step 5: Run Planner tests and commit**

Run: `npm test -- tests/components/AllocationBoard.test.tsx`

Expected: PASS for pointer and keyboard interaction coverage.

```bash
git add src/app/plan src/components/planning src/styles/planner.css tests/components/AllocationBoard.test.tsx
git commit -m "feat: add rhythm-aware allocation planner"
```

### Task 7: Add focus sessions and the completed-Today state

**Files:**
- Create: `src/domain/focus/types.ts`
- Create: `src/domain/focus/session.ts`
- Create: `src/components/focus/FocusSession.tsx`
- Create: `src/components/focus/TodayCompletion.tsx`
- Create: `tests/domain/focus/session.test.ts`
- Create: `tests/components/FocusSession.test.tsx`
- Create: `tests/components/TodayCompletion.test.tsx`

**Interfaces:**
- `FocusSessionState` is `{ status: 'idle' | 'running' | 'paused' | 'completed'; intentionId: string; elapsedSeconds: number; targetSeconds: number }`.
- `startSession`, `pauseSession`, `resumeSession`, and `completeSession` are pure transitions.
- Completion renders “Rest now” as the recommended action and “Choose something else” as an optional action.

- [ ] **Step 1: Write focus transition tests**

Assert that starting creates a running session, pausing preserves elapsed time, resuming returns to running, and completing records the associated intention without creating a new obligation.

- [ ] **Step 2: Implement the pure focus state machine**

Support Pomodoro-like intervals without requiring a particular interval length or making the timer the product’s primary identity.

- [ ] **Step 3: Implement the focus panel**

Start from Today’s recommendation. Show elapsed/remaining time, pause/resume, complete, and a compact reason for the session.

- [ ] **Step 4: Implement completion**

Keep the completed work visible as evidence, show the next protected commitment, quiet the week context, and offer Rest now / Choose something else. Do not show streaks, XP, confetti, or an automatic next task.

- [ ] **Step 5: Run focus tests and commit**

Run: `npm test -- tests/domain/focus tests/components/FocusSession.test.tsx tests/components/TodayCompletion.test.tsx`

Expected: PASS.

```bash
git add src/domain/focus src/components/focus tests/domain/focus tests/components/FocusSession.test.tsx tests/components/TodayCompletion.test.tsx
git commit -m "feat: add focus and completion states"
```

### Task 8: Add voice and dictation seams without choosing providers

**Files:**
- Create: `src/voice/types.ts`
- Create: `src/voice/mockVoice.ts`
- Create: `src/voice/browserDictation.ts`
- Create: `src/components/voice/VoiceDock.tsx`
- Create: `src/components/voice/InlineComposer.tsx`
- Create: `tests/components/VoiceDock.test.tsx`
- Create: `tests/voice/browserDictation.test.ts`

**Interfaces:**

```ts
export interface DictationAdapter {
  start(onPartial: (text: string) => void, onFinal: (text: string) => void): Promise<void>
  stop(): Promise<void>
  isSupported(): boolean
}

export interface CompanionVoice {
  speak(message: string): Promise<void>
  pause(): void
  replay(): Promise<void>
  mute(): void
}
```

- [ ] **Step 1: Write voice control tests**

Assert tap-to-start, tap-to-stop, inline partial transcription, editable final text, send/cancel, mute, pause, replay, and full usability when the adapter reports unsupported.

- [ ] **Step 2: Implement the mock adapter**

Use deterministic injected transcripts and companion messages in tests and demo mode. Do not call an external provider.

- [ ] **Step 3: Implement the browser adapter behind the interface**

Use the browser’s available recognition API only when present. If unavailable or permission is denied, leave the editable composer usable for typed input and show a concise non-blocking status.

- [ ] **Step 4: Implement VoiceDock and InlineComposer**

Keep the bottom-centre control subordinate to the main recommendation. Expand into an inline composer, show live transcription, allow editing, and dispatch a typed intent/anchor command through the same domain action path used by manual entry.

- [ ] **Step 5: Add companion voice controls**

Use mock perspective messages for Today, Week, Plan, Day, and meaningful plan changes. Never generate a message by concatenating all visible card text.

- [ ] **Step 6: Run voice tests and commit**

Run: `npm test -- tests/components/VoiceDock.test.tsx tests/voice/browserDictation.test.ts`

Expected: PASS with unsupported-audio fallback coverage.

```bash
git add src/voice src/components/voice tests/components/VoiceDock.test.tsx tests/voice/browserDictation.test.ts
git commit -m "feat: add replaceable voice and dictation seams"
```

### Task 9: Add responsive/PWA/accessibility hardening

**Files:**
- Modify: `public/manifest.webmanifest`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: component CSS files under `src/components` and `src/styles`
- Create: `tests/components/accessibility.test.tsx`

- [ ] **Step 1: Add manifest metadata**

Set the app name to Wellwisher, standalone display, a deep blue-charcoal theme/background, and icons at 192px and 512px.

- [ ] **Step 2: Add keyboard and reduced-motion behavior**

Ensure all drag/drop actions have keyboard alternatives, visible focus styles, readable contrast, labeled icon buttons, and reduced-motion behavior for focus/session transitions.

- [ ] **Step 3: Add responsive checks**

At minimum verify 390px-wide mobile, 768px tablet, and 1440px desktop layouts. On mobile, stack the Planner shelf above the day board, keep Today/Week/Plan reachable, and keep the dictation control bottom-centre without obscuring content.

- [ ] **Step 4: Run accessibility checks**

Run: `npm test -- tests/components/accessibility.test.tsx`

Expected: PASS for landmark, label, keyboard, and muted-audio usability checks.

- [ ] **Step 5: Commit hardening changes**

```bash
git add public src tests/components/accessibility.test.tsx
git commit -m "feat: harden pwa accessibility and responsive behavior"
```

### Task 10: Verify the end-to-end vertical slice and prepare Vercel delivery

**Files:**
- Create: `e2e/today-week-plan.spec.ts`
- Create: `e2e/focus-completion.spec.ts`
- Create: `README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Write the primary browser flow**

The Playwright flow must:

1. Open `/today` and verify one recommendation.
2. Open Week and select a day.
3. Open Plan and add a leisure intention.
4. Drag it to a suggested window using pointer input.
5. Verify it remains suggested, not pinned.
6. Pin one allocation explicitly and verify the mode changes.
7. Use Undo and verify the previous state returns.

- [ ] **Step 2: Write the focus/completion browser flow**

Use the mock timer controls to start and complete AI Engineering. Verify Today shows the completion state, Rest now is recommended, Choose something else remains available, and no replacement obligation appears.

- [ ] **Step 3: Run the complete verification suite**

Run:

```bash
npm run lint
npm run typecheck
npm test -- --coverage
npm run test:e2e
npm run build
```

Expected: all commands pass; the build completes without server-only APIs in client components; the browser flows pass at desktop and mobile projects.

- [ ] **Step 4: Document local and Vercel usage**

README must include the local commands, the demo scenario, the local-storage reset key, the intentional provider seams, and the fact that no authentication or server persistence exists in this MVP.

- [ ] **Step 5: Commit the verified vertical slice**

```bash
git add e2e README.md .gitignore
git commit -m "test: verify wellwisher mvp vertical slice"
```

## Spec coverage review

- Today-first hierarchy, Week context, and Day detail: Tasks 4–5.
- Allocation-board Planner with work/leisure intentions and drag/drop: Task 6.
- Rhythm anchors, protected commitments, flexible suggestions, and open capacity: Tasks 2–3 and 6.
- Visible trade-offs and Undo: Tasks 3, 6, and 10.
- Focus/Pomodoro-like session and restorative completion: Task 7.
- Ambient companion voice and editable dictation: Task 8.
- Manual unavailable-time seam and future calendar seam: Tasks 2–3 and 8.
- Responsive PWA and audio-muted usability: Task 9.
- No premature SaaS/provider commitments: Global Constraints and Task 8.

## Execution handoff

Implementation should start with Task 1 in a fresh isolated worktree. Use `superpowers:using-git-worktrees` before touching production files, then use `superpowers:subagent-driven-development` for the task-by-task execution and `superpowers:verification-before-completion` before claiming the MVP is complete.
