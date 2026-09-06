# Wellwisher visual and product design

**Status:** Design approved in conversation; awaiting written-spec review  
**Date:** 2026-09-06  
**Scope:** V1 product personality, visual direction, information architecture, and core interaction model. This document intentionally does not approve production implementation, backend architecture, AG-UI integration, or a specific speech/voice technology.

## 1. Product thesis

Wellwisher is a personal well-wisher, not a taskmaster.

It helps Harsh stay oriented toward the outcomes that matter—AI Engineering, Lekhan, and Software Factory—while respecting family commitments and the variability of real life. It optimizes for honest progress and recoverability, not streaks, guilt, or filling every available minute.

The product should feel like:

> A calm personal cockpit with a familiar companion who has enough backbone to interrupt drift.

The app recommends; the user decides. When the user decides differently, Wellwisher updates the plan visibly and carries the trade-off forward.

## 2. Approved visual direction

### 2.1 Visual world

The chosen direction is **Human + Intelligent**, refined with the restraint of **Quiet Modern**:

- dark, calm primary surfaces for the working cockpit;
- restrained sage for orientation, stability, and supportive context;
- warm peach as a sparing action/accent color;
- editorial serif typography for personal statements and companion perspective;
- clean sans-serif typography for controls, metadata, and schedule information;
- a cursive or italic editorial wordmark for “Wellwisher”;
- generous spacing and few, meaningful surfaces rather than a grid of productivity cards.

This should feel personal and intelligent without becoming mystical, whimsical, or like a generic AI dashboard.

### 2.2 Token direction

These are design-direction tokens, not yet a production token file:

| Role | Direction | Approximate value |
|---|---|---:|
| Cockpit background | Deep blue-charcoal | `#202A2E` |
| Elevated panel | Soft blue-charcoal | `#2C393D` |
| Supportive sage | Muted green | `#9FB9AA` |
| Sage surface | Pale green | `#D9E7DC` |
| Human accent | Muted peach | `#DFA18D` |
| Warm page ground | Soft stone | `#F4F2EC` |
| Primary text | Warm off-white | `#F2F3EF` |

The accent palette should remain quiet. Color communicates state and hierarchy; it should not create gamified urgency.

### 2.3 Type roles

- **Companion/display:** an editorial serif with warmth and restraint.
- **Wordmark:** cursive or italic treatment used only for the Wellwisher identity.
- **Interface:** highly legible sans-serif for controls, dates, durations, and labels.
- **Data/utility:** compact mono or tabular styling only where scanning exact times is useful.

The contrast expresses the product premise: human intention alongside machine reasoning.

## 3. Information architecture

### Primary surfaces

1. **Today** — the default landing surface. It answers: “What would be good to do now?”
2. **Week** — a one-tap view of the week ahead. It answers: “How is the week shaped, and what changed?”

### Secondary surfaces

- **Goals and priorities:** edit the outcomes, deadlines, and relative importance that shape recommendations.
- **Availability:** add or correct manually entered unavailable time.
- **Settings:** voice controls, display preferences, and other low-frequency configuration.

Goals, availability, and settings should not compete with Today and Week in the primary navigation for V1.

## 4. Screen hierarchy and behavior

### 4.1 Today

Today is the product’s strongest surface and should open with:

- a brief personal greeting or orientation;
- one clear recommendation;
- the reason that recommendation is first;
- the current day’s anchored commitments;
- flexible space after the current recommendation;
- an easy path to the full Week view;
- the ambient companion voice, subject to mute/replay controls.

Today should not look like a task list. It should feel like a considered briefing that ends in one next action.

### 4.2 Week

Week provides context without becoming a conventional calendar:

- allocations are day-level, not hour-by-hour;
- family and other unavailable periods are visible as protected time;
- course pacing and important deadlines remain legible;
- changes caused by a decision are shown as a visible before/after impact;
- the view makes it easy to open a particular day.

Week is where the user sees the shape of the plan. It is not where every work minute is pre-committed.

### 4.3 Day detail

Day detail uses the approved **anchored hybrid** model:

- exact times for unavailable commitments;
- an exact or current placement for the recommended session;
- flexible work blocks elsewhere;
- open space represented honestly rather than filled with invented tasks;
- a clear end-of-day posture that does not demand recovery work by default.

The detail view should make reality legible, not turn every hour into a promise.

## 5. Recommendation and re-planning model

### 5.1 Recommendation voice

Wellwisher should make one clear recommendation when the evidence supports one. It can be authoritative without being controlling:

> “Start with AI Engineering. It is the only track with a hard deadline. Lekhan has momentum already; Software Factory can wait until Thursday.”

The authority comes from remembered context and visible trade-offs, not from confidence theater or generalized wisdom.

### 5.2 Choosing differently

When the user chooses another activity:

1. Apply the choice immediately.
2. Update the relevant day/week state.
3. Show what changed elsewhere.
4. Keep unchanged commitments visibly unchanged.
5. Offer a small Undo affordance.

The preferred interaction is **visible trade-off** rather than silent recalculation or a confirmation dialog. The user has already made the decision; Wellwisher’s job is to make the consequences legible and carry the plan forward.

## 6. Ambient companion voice

### 6.1 Role

The voice is an accompanying presence that arrives with the screen. It is not a read-aloud layer and not a persistent chatbot transcript.

When entering the app or any meaningful working screen—Today, Week, Day detail, goals/priorities, or availability—or after a meaningful plan change, Wellwisher should speak one short, specific orientation and perspective. Low-value settings surfaces should remain quiet unless the user explicitly asks for help or a setting change has meaningful consequences:

- Week entry: “Hey Harsh, here’s your week ahead. Saturday belongs to family, so I’ve kept the certificate moving earlier. You have room on Thursday—let’s not fill it yet.”
- Day entry: “Morning, Harsh. I’d like you to start with AI today. It’s the one with a clock; Lekhan can follow without losing momentum.”
- After change: “Okay, I moved AI to Thursday and kept family time untouched. That costs us 35 minutes later in the week, but it’s a trade-off we can absorb.”

The voice should add interpretation, confidence, and companionship. It must not repeat the card text above it.

### 6.2 Controls and fallback

- Voice can be paused, replayed, or muted.
- The exact plan and transcript remain available visually.
- The app remains fully understandable and usable without audio.
- Audio should be brief and bounded; it should not narrate every minor UI transition.
- The V1 speech-to-text and text-to-speech implementations remain behind replaceable interfaces. Native/local Whisper is an attractive option but is not a current architectural commitment.

### 6.3 Dictation interaction

The voice drawer is entered through a bottom-centre dictation control:

1. The control is visible but subordinate to the current recommendation.
2. Tap once to start listening; tap again to stop.
3. The control expands into an inline bottom composer.
4. Live transcription appears inline while listening.
5. The transcript is editable before sending.
6. After sending, Wellwisher responds with perspective and a proposed state change; it does not merely repeat the transcript.

## 7. Unavailable-time entry

V1 uses manual unavailable-time entry, with two paths:

### Primary path: natural voice

The user can say:

> “Family function Saturday afternoon.”

Wellwisher should extract a proposed window, show what it heard, and let the user apply it to the week.

### Fallback path: quick manual form

The user can correct or enter the essentials through a small “Protect time” form:

- label or short description;
- start and end date/time;
- repeat behavior is out of V1 unless the personal use case proves it necessary.

Both paths must create the same internal unavailable-time concept. This preserves a clean seam for future calendar integration without requiring calendar integration now.

## 8. Product language

### Use

- Specific references to the user’s actual week.
- “I recommend…”, “I’ve moved…”, “Here’s what changed…”.
- Clear consequences and recoverable trade-offs.
- Personal, direct, calm phrasing.

### Avoid

- Streaks, XP, guilt, or failure framing.
- Generic wisdom and motivational slogans.
- “You can do anything” language.
- Chat taking over the main surface.
- A dashboard full of interchangeable cards.
- Pretending to know the user’s emotional state without evidence.

## 9. V1 boundaries

### In scope for the visual/product direction

- Today and Week primary surfaces.
- Day-level Week allocations.
- Anchored hybrid Day detail.
- Clear recommendation with calm authority.
- Immediate visible re-planning with trade-off and Undo.
- Ambient companion voice on primary-screen entry and meaningful plan changes.
- Bottom-centre dictation control with inline transcription and editable send state.
- Manual unavailable-time entry via voice plus quick form.

### Explicitly not decided yet

- Exact data storage and persistence architecture.
- Authentication or multi-user behavior.
- AG-UI protocol/library choice.
- Native/local Whisper versus another speech-to-text provider.
- Text-to-speech provider and voice identity.
- Calendar integration implementation.
- Notifications, reminders, analytics, billing, or SaaS concerns.

## 10. Design success criteria

The visual/product direction is successful if a user can:

1. Open Wellwisher and understand the next right action within seconds.
2. See the week ahead without opening a calendar-like management surface.
3. Recognize family commitments as part of the plan, not interruptions to it.
4. Understand why a recommendation was made.
5. Choose differently without losing trust or needing a confirmation ceremony.
6. Hear a personal perspective that adds value instead of repeating the screen.
7. Add unavailable time naturally and correct it quickly.
8. Use the product comfortably with audio muted.

## 11. Prototype record

The visual exploration was conducted as throwaway browser mockups using the approved visual companion workflow and Impeccable design guidance. The prototypes are exploratory artifacts, not production UI:

- visual directions;
- personal voice variants;
- authority refinement;
- day-detail anatomy;
- visible re-planning states;
- voice-entry states;
- ambient companion voice states;
- unavailable-time entry paths.

The visual direction is now approved. Production implementation should begin only after this written spec is reviewed and a separate implementation plan is approved.
