# Planner Responsive Redesign & Dynamic Management Spec

Date: 2026-09-07

## 1. Problem Statement
1. **7-Column Weekly Clutter**: The Planner (`/plan`) displays 7 narrow vertical columns (~130px each) simultaneously, repeating all 5 rhythm anchors in every column. This creates heavy visual noise, text wrapping, and fails on mobile phone screens (390px).
2. **Static Data & Lack of CRUD**: Intentions and rhythm anchors are static fixtures. Users cannot add, edit, or delete custom intentions or rhythm anchors through the UI.
3. **Missing Settings Route**: While the Profile Menu links to "Settings", there is no dedicated `/settings` page for managing master rhythm anchors, schedule boundaries, voice preferences, and JSON data backup/reset.

## 2. Goals & Product Direction
- **Option C Responsive Planner**: Transform `/plan` into a focused single-day allocation canvas paired with an interactive 7-Day Week Ribbon at the top. On mobile, the ribbon is a smooth date pill strip and the day schedule stacks vertically without cramped columns.
- **Dynamic CRUD for Intentions & Anchors**: Provide in-context modals (`IntentionModal`, `AnchorModal`) to quickly add, edit, and delete flexible work/leisure intentions and protected rhythm anchors directly from the Planner and Day views.
- **Dedicated Settings Surface (`/settings`)**: A serene, organized management hub for Master Rhythm Anchors, Day Schedule Boundaries, Voice Preferences, and Local State Import/Export/Reset.
- **Preserve Brand & Design Invariants**: Deep blue-charcoal cockpit surfaces, restrained sage, muted peach for protected anchors, editorial serif companion perspective, calm authority, visible trade-offs, and zero gamification (no streaks, points, XP).

## 3. Component Architecture & Data Flow

### 3.1 Planner Surface (`/plan`) — Option C
- **Interactive 7-Day Week Ribbon**: Displays Monday to Sunday pills with allocation counts (e.g. `4.5h planned · 3.5h open`), active day highlight, and instant day switching.
- **Focused Day Canvas**: Displays Morning (`08:00–12:00`), Afternoon (`12:00–18:00`), and Evening (`18:00–22:00`) drop zones for the selected day.
- **Unplaced Intentions Shelf**: Displays Work & Leisure items with "+ New Intention" button, drag handles, edit/delete actions, and accessible keyboard placement menus.
- **Rhythm Anchors Panel**: Summary of recurring commitments with "+ New Anchor" button.

### 3.2 Modals & Slide-overs
- **`IntentionModal`**:
  - Fields: Title (string), Kind (`'work'` | `'leisure'`), Duration in minutes (15, 30, 45, 60, 90, 120), Priority (1–3), Preferred Window (`'morning'` | `'afternoon'` | `'evening'`).
  - Modes: Create & Edit.
- **`AnchorModal`**:
  - Fields: Title (string), Start Time (`HH:mm`), End Time (`HH:mm`), Repeat Pattern (`'daily'` | `'weekdays'` | `'selected-days'`), Protected (boolean).
  - Modes: Create & Edit.

### 3.3 Settings Surface (`/settings`)
- **Rhythm Anchors Hub**: Master list of recurring routines with add/edit/delete triggers.
- **Schedule Boundaries**: Default day start/end times (`availableStart`, `availableEnd`).
- **Voice Preferences**: Mute toggle, auto-speak preferences.
- **Data Management**: Export state to JSON, Import state from JSON, Reset to Harsh demo scenario.

### 3.4 State Reducer Updates
- New Action Types:
  - `ADD_INTENTION`: `{ type: 'ADD_INTENTION'; payload: FlexibleIntention }`
  - `UPDATE_INTENTION`: `{ type: 'UPDATE_INTENTION'; payload: FlexibleIntention }`
  - `DELETE_INTENTION`: `{ type: 'DELETE_INTENTION'; payload: { intentionId: string } }`
  - `ADD_ANCHOR`: `{ type: 'ADD_ANCHOR'; payload: RhythmAnchor }`
  - `UPDATE_ANCHOR`: `{ type: 'UPDATE_ANCHOR'; payload: RhythmAnchor }`
  - `DELETE_ANCHOR`: `{ type: 'DELETE_ANCHOR'; payload: { anchorId: string } }`
  - `UPDATE_SCHEDULE_BOUNDS`: `{ type: 'UPDATE_SCHEDULE_BOUNDS'; payload: { availableStart?: string; availableEnd?: string } }`
  - `IMPORT_STATE`: `{ type: 'IMPORT_STATE'; payload: WellwisherState }`

## 4. Verification Plan
- Unit tests for new reducer actions in `tests/state/reducer.test.ts`.
- Component tests for `AllocationBoard`, `IntentionModal`, `AnchorModal`, and `SettingsSurface`.
- Playwright E2E browser tests for creating an intention, placing it on the focused day canvas, modifying an anchor, and navigating `/settings`.
- Next.js static export build verification.
