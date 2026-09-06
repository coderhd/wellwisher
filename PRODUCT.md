# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Responsive web app/PWA, deployed to Vercel. Flutter and React Native are deferred unless native audio behavior later proves essential.

## Users

The primary user is Harsh, using Wellwisher as a personal planning companion during a career transition. His active tracks are AI Engineering, Lekhan, and Software Factory, alongside family commitments and other real-life obligations.

## Product Purpose

Wellwisher helps Harsh stay oriented toward the outcomes that matter and decide what would be good to do next. It plans around real life rather than expecting life to fit a rigid plan, protects family commitments, recommends sustainable progress, and helps recover when plans change.

Success means making the next right action clear while consuming less attention than the work it supports.

## Positioning

Wellwisher is a personal well-wisher, not a taskmaster. Its differentiating mechanism is a visible, explainable recommendation that adapts to real-life constraints and preserves the user’s agency. It optimizes for outcomes and recoverability rather than streaks, guilt, or filling every available minute.

## Operating Context

- The user balances AI Engineering certificate progress, Lekhan, Software Factory work, and family life.
- Family events and other unavailable periods are first-class planning inputs.
- V1 uses manual unavailable-time entry; future calendar integration should be possible without changing the user’s mental model.
- Today is the default working surface; Week provides day-level context; Day detail shows anchored commitments and flexible work space.
- The user may interact by typing or voice. Voice should accompany meaningful screen entry and plan changes with a short perspective, while the UI remains the source of exact detail.
- The app must work comfortably from both a phone and a laptop through a responsive web/PWA experience.

## Capabilities and Constraints

- Primary surfaces are Today and Week; Goals/priorities, Availability, and Settings are secondary.
- Week view uses day-level allocations, not an hour-by-hour calendar.
- Day detail uses an anchored hybrid: exact times for real commitments and the current recommendation, flexible work blocks elsewhere.
- Wellwisher makes one clear recommendation with calm authority and explains the reason.
- Choosing differently updates the plan immediately, shows the visible trade-off, and offers Undo.
- Unavailable time can be expressed naturally through voice or corrected through a small manual form; both paths create the same concept.
- Ambient companion voice should not read the interface aloud. It should add orientation, interpretation, and perspective, with pause/replay/mute controls.
- Dictation uses tap once to start and tap again to stop; transcription is shown inline and editable before sending.
- The exact speech-to-text, text-to-speech, AG-UI, persistence, authentication, and calendar-integration technologies remain undecided.
- The product remains understandable and usable with audio muted.
- No premature SaaS concerns such as billing, teams, multi-tenant administration, or generalized configuration are in scope.

## Brand Commitments

- Product name: Wellwisher.
- Personality: personal, calm, specific, collaborative, and willing to interrupt drift.
- The voice should feel like a familiar companion with backbone, not a lecturer or motivational coach.
- Use specific references to the user’s actual context and explain trade-offs plainly.
- Avoid streaks, XP, guilt, generic wisdom, motivational slogans, and dashboard-like productivity pressure.

## Evidence on Hand

- Approved visual/product design spec: `docs/superpowers/specs/2026-09-06-wellwisher-visual-product-design.md`.
- Throwaway browser mockups from the visual exploration session under `.superpowers/brainstorm/`.
- Confirmed user context and decisions from the referenced “App Progress Check” conversation.
- No production UI, customer research, analytics, testimonials, or external proof assets exist yet. Future work must not fabricate them.

## Product Principles

1. Plan around life, not against it.
2. Optimize for outcomes and recoverability, not streaks.
3. Recommend clearly; leave the decision with the user.
4. Make agent reasoning and plan changes visible.
5. Keep the app smaller and less demanding than the work it supports.

## Accessibility & Inclusion

- Audio is an enhancement, never a requirement for understanding or completing core work.
- Exact plans, transcripts, consequences, and controls must remain available visually.
- The responsive web/PWA must support phone and laptop use.
- A formal accessibility standard and device matrix remain open implementation decisions.
