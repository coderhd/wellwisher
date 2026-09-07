# Planner Responsive Redesign & Dynamic Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Wellwisher from static demo data into a dynamic, rhythm-aware personal planning companion with a spacious, mobile-responsive single-day canvas + 7-day ribbon (Option C), in-context modals for Intention/Anchor CRUD, and a dedicated `/settings` management surface.

**Architecture:** Next.js App Router with TypeScript and CSS modules. State is managed via pure reducers with optimistic local-first persistence (`wellwisher.state.v1`). In-context accessible modals handle rapid intention/anchor creation and editing on `/plan`, while `/settings` provides master rhythm management, schedule boundaries, voice preferences, and JSON backup/restore.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript (strict), Vitest, React Testing Library, `@dnd-kit/core`, `date-fns`, Playwright.

## Global Constraints
- Strictly anti-gamification: NO streaks, NO XP, NO levels, NO confetti, NO guilt framing.
- First-class leisure: Leisure intentions (`kind: 'leisure'`) have equal prominence to work intentions.
- Visual tokens: Dark cockpit palette (`--ww-cockpit`, `--ww-panel`, `--ww-surface`), restrained sage (`--ww-sage`), muted peach (`--ww-peach`), editorial serif typography (`--ww-font-serif`), quiet sans controls (`--ww-font-sans`).
- Responsive: Seamless layout on mobile phone (390px), tablet (768px), and desktop (1440px) viewports with zero horizontal scrolling or clipped text.
- Accessibility: Full keyboard navigation, ARIA dialogs/roles, accessible button names, and visible `:focus-visible` rings.

---

### Task 1: Reducer & Persistence Dynamic CRUD Operations

**Files:**
- Modify: `src/domain/planning/types.ts`
- Modify: `src/state/reducer.ts`
- Modify: `src/state/persistence.ts`
- Modify: `src/state/WellwisherProvider.tsx`
- Test: `tests/state/reducer.test.ts`

**Interfaces:**
- Consumes: `FlexibleIntention`, `RhythmAnchor`, `Allocation`, `WellwisherState` from `src/domain/planning/types.ts` and `src/state/reducer.ts`
- Produces: Reducer actions `ADD_INTENTION`, `UPDATE_INTENTION`, `DELETE_INTENTION`, `ADD_ANCHOR`, `UPDATE_ANCHOR`, `DELETE_ANCHOR`, `UPDATE_SCHEDULE_BOUNDS`, `IMPORT_STATE`

- [ ] **Step 1: Write failing tests in `tests/state/reducer.test.ts`**

```typescript
// Add to tests/state/reducer.test.ts
describe('Dynamic CRUD actions', () => {
	it('supports ADD_INTENTION, UPDATE_INTENTION, and DELETE_INTENTION', () => {
		const initial = createDemoState()
		const newIntention: FlexibleIntention = {
			id: 'custom-art',
			title: 'Painting & Sketching',
			kind: 'leisure',
			durationMinutes: 60,
			preferredWindow: 'evening',
			priority: 2,
		}

		// 1. ADD
		const stateAfterAdd = wellwisherReducer(initial, {
			type: 'ADD_INTENTION',
			payload: newIntention,
		})
		expect(stateAfterAdd.intentions.some((i) => i.id === 'custom-art')).toBe(true)

		// 2. UPDATE
		const updatedIntention: FlexibleIntention = {
			...newIntention,
			title: 'Oil Painting',
			durationMinutes: 90,
		}
		const stateAfterUpdate = wellwisherReducer(stateAfterAdd, {
			type: 'UPDATE_INTENTION',
			payload: updatedIntention,
		})
		const found = stateAfterUpdate.intentions.find((i) => i.id === 'custom-art')
		expect(found?.title).toBe('Oil Painting')
		expect(found?.durationMinutes).toBe(90)

		// 3. DELETE (also removes any allocations referencing this intention)
		const stateWithAlloc = wellwisherReducer(stateAfterUpdate, {
			type: 'SUGGEST_INTENTION',
			payload: { intentionId: 'custom-art', target: { date: initial.weekStart, window: 'evening' } },
		})
		expect(stateWithAlloc.allocations.some((a) => a.intentionId === 'custom-art')).toBe(true)

		const stateAfterDelete = wellwisherReducer(stateWithAlloc, {
			type: 'DELETE_INTENTION',
			payload: { intentionId: 'custom-art' },
		})
		expect(stateAfterDelete.intentions.some((i) => i.id === 'custom-art')).toBe(false)
		expect(stateAfterDelete.allocations.some((a) => a.intentionId === 'custom-art')).toBe(false)
	})

	it('supports ADD_ANCHOR, UPDATE_ANCHOR, and DELETE_ANCHOR with recurrence sync', () => {
		const initial = createDemoState()
		const newAnchor: RhythmAnchor = {
			id: 'evening-tea',
			title: 'Evening Tea & Walk',
			startTime: '17:00',
			endTime: '17:45',
			repeat: { type: 'daily' },
			protected: true,
		}

		// 1. ADD_ANCHOR
		const stateAfterAdd = wellwisherReducer(initial, {
			type: 'ADD_ANCHOR',
			payload: newAnchor,
		})
		expect(stateAfterAdd.anchors.some((a) => a.id === 'evening-tea')).toBe(true)
		expect(stateAfterAdd.protectedCommitments.filter((c) => c.anchorId === 'evening-tea')).toHaveLength(7)

		// 2. UPDATE_ANCHOR
		const updatedAnchor: RhythmAnchor = {
			...newAnchor,
			title: 'Herbal Tea & Garden Walk',
			startTime: '17:15',
			endTime: '18:00',
		}
		const stateAfterUpdate = wellwisherReducer(stateAfterAdd, {
			type: 'UPDATE_ANCHOR',
			payload: updatedAnchor,
		})
		expect(stateAfterUpdate.anchors.find((a) => a.id === 'evening-tea')?.title).toBe('Herbal Tea & Garden Walk')
		const updatedCommitments = stateAfterUpdate.protectedCommitments.filter((c) => c.anchorId === 'evening-tea')
		expect(updatedCommitments).toHaveLength(7)
		expect(updatedCommitments[0]?.startTime).toBe('17:15')

		// 3. DELETE_ANCHOR
		const stateAfterDelete = wellwisherReducer(stateAfterUpdate, {
			type: 'DELETE_ANCHOR',
			payload: { anchorId: 'evening-tea' },
		})
		expect(stateAfterDelete.anchors.some((a) => a.id === 'evening-tea')).toBe(false)
		expect(stateAfterDelete.protectedCommitments.some((c) => c.anchorId === 'evening-tea')).toBe(false)
	})

	it('supports UPDATE_SCHEDULE_BOUNDS and IMPORT_STATE', () => {
		const initial = createDemoState()
		const stateAfterBounds = wellwisherReducer(initial, {
			type: 'UPDATE_SCHEDULE_BOUNDS',
			payload: { availableStart: '07:30', availableEnd: '22:30' },
		})
		expect(stateAfterBounds.scheduleBounds?.availableStart).toBe('07:30')
		expect(stateAfterBounds.scheduleBounds?.availableEnd).toBe('22:30')

		const imported: WellwisherState = {
			...initial,
			weekStart: '2026-10-01',
			intentions: [],
		}
		const stateAfterImport = wellwisherReducer(stateAfterBounds, {
			type: 'IMPORT_STATE',
			payload: imported,
		})
		expect(stateAfterImport.weekStart).toBe('2026-10-01')
		expect(stateAfterImport.intentions).toHaveLength(0)
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH="/Users/harshdave/.nvm/versions/node/v24.19.0/bin:/opt/homebrew/bin:$PATH"; pnpm test -- tests/state/reducer.test.ts`
Expected: FAIL with missing action types and properties.

- [ ] **Step 3: Implement updates in `src/domain/planning/types.ts`, `src/state/reducer.ts`, and `src/state/WellwisherProvider.tsx`**

In `src/domain/planning/types.ts`, add `scheduleBounds?: { availableStart: string; availableEnd: string }` if needed.
In `src/state/reducer.ts`:
- Extend `WellwisherState` with `scheduleBounds?: { availableStart: string; availableEnd: string }`.
- Add action types:
  ```typescript
  | { type: 'ADD_INTENTION'; payload: FlexibleIntention }
  | { type: 'UPDATE_INTENTION'; payload: FlexibleIntention }
  | { type: 'DELETE_INTENTION'; payload: { intentionId: string } }
  | { type: 'ADD_ANCHOR'; payload: RhythmAnchor }
  | { type: 'UPDATE_ANCHOR'; payload: RhythmAnchor }
  | { type: 'DELETE_ANCHOR'; payload: { anchorId: string } }
  | { type: 'UPDATE_SCHEDULE_BOUNDS'; payload: { availableStart?: string; availableEnd?: string } }
  | { type: 'IMPORT_STATE'; payload: WellwisherState }
  ```
- Implement reducer handlers:
  - `UPDATE_INTENTION`: replace matching intention in `state.intentions`; update `durationMinutes` in matching allocations.
  - `DELETE_INTENTION`: filter out intention and associated allocations.
  - `UPDATE_ANCHOR`: replace matching anchor in `state.anchors`; remove old protected commitments for that anchor and expand new recurrence commitments if `protected: true`.
  - `DELETE_ANCHOR`: filter out anchor and associated protected commitments.
  - `UPDATE_SCHEDULE_BOUNDS`: merge `scheduleBounds`.
  - `IMPORT_STATE`: return payload.

- [ ] **Step 4: Run tests to verify they pass**

Run: `export PATH="/Users/harshdave/.nvm/versions/node/v24.19.0/bin:/opt/homebrew/bin:$PATH"; pnpm test -- tests/state/reducer.test.ts`
Expected: PASS (all tests green).

- [ ] **Step 5: Commit**

```bash
git add src/domain/planning/types.ts src/state/reducer.ts src/state/persistence.ts src/state/WellwisherProvider.tsx tests/state/reducer.test.ts
git commit -m "feat: add dynamic crud and import reducer actions"
```

---

### Task 2: Build `IntentionModal` and `AnchorModal` Components

**Files:**
- Create: `src/components/modals/IntentionModal.tsx`
- Create: `src/components/modals/IntentionModal.module.css`
- Create: `src/components/modals/AnchorModal.tsx`
- Create: `src/components/modals/AnchorModal.module.css`
- Test: `tests/components/IntentionModal.test.tsx`
- Test: `tests/components/AnchorModal.test.tsx`

**Interfaces:**
- Consumes: `FlexibleIntention`, `RhythmAnchor` from `src/domain/planning/types.ts`
- Produces:
  - `IntentionModal`: Props `{ isOpen: boolean; initialIntention?: FlexibleIntention | null; onSave: (intention: FlexibleIntention) => void; onDelete?: (intentionId: string) => void; onClose: () => void }`
  - `AnchorModal`: Props `{ isOpen: boolean; initialAnchor?: RhythmAnchor | null; onSave: (anchor: RhythmAnchor) => void; onDelete?: (anchorId: string) => void; onClose: () => void }`

- [ ] **Step 1: Write failing component tests**

Create `tests/components/IntentionModal.test.tsx`:
- Test rendering with form fields (Title, Kind work/leisure, Duration, Preferred Window, Priority).
- Test validation (cannot submit empty title).
- Test calling `onSave` with new intention object.
- Test editing mode calling `onSave` and `onDelete`.
- Test dismissal on Escape or Close button.

Create `tests/components/AnchorModal.test.tsx`:
- Test rendering with fields (Title, Start Time, End Time, Repeat Pattern, Protected checkbox).
- Test validation (End Time must be after Start Time).
- Test calling `onSave` and `onDelete`.

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH="/Users/harshdave/.nvm/versions/node/v24.19.0/bin:/opt/homebrew/bin:$PATH"; pnpm test -- tests/components/IntentionModal.test.tsx tests/components/AnchorModal.test.tsx`
Expected: FAIL with modules not found.

- [ ] **Step 3: Implement `IntentionModal` and `AnchorModal`**

- Create `src/components/modals/IntentionModal.tsx` with dialog wrapper, focus trap / escape handler, accessible `aria-modal="true"`, styled input controls with `--ww-panel` backdrop and `--ww-sage` / `--ww-peach` accents.
- Create `src/components/modals/IntentionModal.module.css`.
- Create `src/components/modals/AnchorModal.tsx` with start/end time pickers, repeat pattern selector (Daily, Weekdays), protected toggle.
- Create `src/components/modals/AnchorModal.module.css`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `export PATH="/Users/harshdave/.nvm/versions/node/v24.19.0/bin:/opt/homebrew/bin:$PATH"; pnpm test -- tests/components/IntentionModal.test.tsx tests/components/AnchorModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/modals/ tests/components/IntentionModal.test.tsx tests/components/AnchorModal.test.tsx
git commit -m "feat: add accessible intention and anchor modals"
```

---

### Task 3: Redesign Planner to Option C (7-Day Ribbon + Focused Single-Day Canvas)

**Files:**
- Modify: `src/components/planning/AllocationBoard.tsx`
- Modify: `src/app/plan/PlanSurface.tsx`
- Modify: `src/components/planning/IntentionCard.tsx`
- Modify: `src/components/planning/RhythmAnchorCard.tsx`
- Modify: `src/styles/planner.css`
- Test: `tests/components/AllocationBoard.test.tsx`

**Interfaces:**
- Consumes: `WeekPlan`, `FlexibleIntention`, `RhythmAnchor`, `PlanChange`
- Produces:
  - Responsive Option C Planner layout:
    1. Top: 7-Day Ribbon with swipeable/clickable day selector pills showing capacity stats and active day indicator.
    2. Focused Single-Day Canvas: Morning, Afternoon, Evening drop zones for the selected day with clean spacing and clear time windows.
    3. Shelf: Work & Leisure unplaced intentions with "+ Add Intention" button, and Rhythm Anchors with "+ Add Anchor" button.
    4. In-context triggers for `IntentionModal` and `AnchorModal` for rapid create/edit/delete.

- [ ] **Step 1: Update tests in `tests/components/AllocationBoard.test.tsx`**

Update `tests/components/AllocationBoard.test.tsx`:
- Verify 7-day ribbon renders day selector tabs/pills with capacity summaries.
- Verify clicking a day in the ribbon switches the focused day drop zones to that date.
- Verify "+ New Intention" button opens intention creation modal.
- Verify editing/deleting an intention triggers respective callbacks.
- Verify dragging an intention into the focused day's Morning/Afternoon/Evening zone dispatches `onSuggest`.
- Verify mobile viewport layout classes and accessible names.

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH="/Users/harshdave/.nvm/versions/node/v24.19.0/bin:/opt/homebrew/bin:$PATH"; pnpm test -- tests/components/AllocationBoard.test.tsx`
Expected: FAIL with ribbon and single-day canvas mismatches.

- [ ] **Step 3: Implement Option C in `AllocationBoard.tsx`, `PlanSurface.tsx`, and `planner.css`**

- In `AllocationBoard.tsx`:
  - Add internal state `selectedDate` defaulting to `weekPlan.weekStart` or today.
  - Render interactive 7-Day Ribbon: `<nav aria-label="Days of the week" className="plannerRibbon">` with buttons for each day showing `EEE`, `MMM d`, and open capacity.
  - Render focused single-day drop zones for `selectedDate` (Morning, Afternoon, Evening) with ample breathing room.
  - Add "+ Add Intention" and "+ Add Anchor" triggers.
  - Support `onEditIntention`, `onDeleteIntention`, `onAddIntention`, `onEditAnchor`, `onDeleteAnchor`, `onAddAnchor`.
- In `IntentionCard.tsx` and `RhythmAnchorCard.tsx`:
  - Add edit & delete action buttons/menu items.
- In `PlanSurface.tsx`:
  - Connect callbacks to `useWellwisher().dispatch` with new CRUD actions.
- In `src/styles/planner.css`:
  - Implement mobile-first responsive layout (single column on mobile, horizontal scrolling ribbon pills, clean padding, no narrow 130px columns).

- [ ] **Step 4: Run tests to verify they pass**

Run: `export PATH="/Users/harshdave/.nvm/versions/node/v24.19.0/bin:/opt/homebrew/bin:$PATH"; pnpm test -- tests/components/AllocationBoard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/planning/ src/app/plan/ src/styles/planner.css tests/components/AllocationBoard.test.tsx
git commit -m "feat: redesign planner to option c focused single-day canvas and ribbon"
```

---

### Task 4: Implement Dedicated Settings Surface (`/settings`) & Profile Integration

**Files:**
- Create: `src/app/settings/page.tsx`
- Create: `src/app/settings/SettingsSurface.tsx`
- Create: `src/app/settings/SettingsSurface.module.css`
- Modify: `src/components/shell/ProfileMenu.tsx`
- Test: `tests/components/SettingsSurface.test.tsx`

**Interfaces:**
- Consumes: `useWellwisher()` state and dispatch
- Produces: `/settings` route with 4 sections:
  1. Master Rhythm Anchors (CRUD management)
  2. Day Schedule Boundaries (`availableStart`, `availableEnd`)
  3. Voice Preferences (Mute, auto-speak, speech rate)
  4. Data Management (Export JSON, Import JSON, Reset to Demo Scenario)

- [ ] **Step 1: Write failing tests in `tests/components/SettingsSurface.test.tsx`**

- Test rendering all 4 sections with proper headings and accessibility landmarks.
- Test editing a master rhythm anchor.
- Test changing schedule bounds.
- Test exporting JSON state (triggering download).
- Test importing JSON state (replacing state).
- Test resetting state.
- Test `ProfileMenu.tsx` navigation link to `/settings`.

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH="/Users/harshdave/.nvm/versions/node/v24.19.0/bin:/opt/homebrew/bin:$PATH"; pnpm test -- tests/components/SettingsSurface.test.tsx`
Expected: FAIL with missing component.

- [ ] **Step 3: Implement `SettingsSurface.tsx`, `src/app/settings/page.tsx`, and wire `ProfileMenu.tsx`**

- Create `src/app/settings/SettingsSurface.tsx` and `src/app/settings/SettingsSurface.module.css`.
- Wire `IntentionModal` / `AnchorModal` for anchor editing in settings.
- Provide JSON file input for state import with schema validation.
- Update `src/components/shell/ProfileMenu.tsx` to use `<Link href="/settings">` for Settings and Voice preferences.

- [ ] **Step 4: Run tests to verify they pass**

Run: `export PATH="/Users/harshdave/.nvm/versions/node/v24.19.0/bin:/opt/homebrew/bin:$PATH"; pnpm test -- tests/components/SettingsSurface.test.tsx tests/components/AppShell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/settings/ src/components/shell/ProfileMenu.tsx tests/components/SettingsSurface.test.tsx
git commit -m "feat: add settings surface and profile menu navigation"
```

---

### Task 5: End-to-End Verification, Playwright Specs & Static Export

**Files:**
- Create / Modify: `e2e/dynamic-management.spec.ts`
- Modify: `e2e/today-week-plan.spec.ts`
- Modify: `README.md`
- Verification: Full test suites, linting, typechecking, build.

- [ ] **Step 1: Create Playwright E2E test `e2e/dynamic-management.spec.ts`**

Cover full user flows:
- Create custom intention via "+ Add Intention" modal.
- Place intention on focused day canvas via drag or action menu.
- Open Settings page, modify rhythm anchor, verify sync on Planner ribbon & canvas.
- Test responsive mobile layout (390px viewport).

- [ ] **Step 2: Run all verification commands**

Run:
```bash
export PATH="/Users/harshdave/.nvm/versions/node/v24.19.0/bin:/opt/homebrew/bin:$PATH"
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```
Expected: All linters, TypeScript checks, unit test suites (100% pass), E2E tests, and static export build succeed cleanly.

- [ ] **Step 3: Update documentation and commit**

Update `README.md` with dynamic intention/anchor features and `/settings` overview.
Commit:
```bash
git add e2e/ README.md
git commit -m "test: verify dynamic management and responsive option c planner e2e"
```
