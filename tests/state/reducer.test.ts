import { act, renderHook } from '@testing-library/react'
import React from 'react'
import { describe, expect, test } from 'vitest'

import { createDemoState } from '../../src/data/demoScenario'
import type { FlexibleIntention, RhythmAnchor } from '../../src/domain/planning/types'
import {
	type WellwisherAction,
	wellwisherReducer,
	type WellwisherState,
} from '../../src/state/reducer'
import {
	useWellwisher,
	WellwisherProvider,
} from '../../src/state/WellwisherProvider'

describe('wellwisherReducer', () => {
	test('initial demo state contains expected Harsh scenario structure', () => {
		const state = createDemoState('2026-09-07')

		expect(state.weekStart).toBe('2026-09-07')
		expect(state.anchors.length).toBeGreaterThanOrEqual(5)
		expect(state.intentions.length).toBeGreaterThanOrEqual(6)
		expect(state.protectedCommitments.length).toBeGreaterThan(0)
		expect(state.allocations.length).toBeGreaterThan(0)
		expect(state.focusSession).toEqual({
			status: 'idle',
			intentionId: '',
			elapsedSeconds: 0,
			targetSeconds: 5400,
		})
		expect(state.voicePreferences).toEqual({
			muted: false,
		})
		expect(state.lastPlanChange).toBeNull()

		// Verify leisure items are marked as leisure, not work
		const leisureIntentions = state.intentions.filter(
			(item) => item.kind === 'leisure',
		)
		expect(leisureIntentions.length).toBeGreaterThanOrEqual(3)
		expect(leisureIntentions.some((item) => item.title === 'Trending learning')).toBe(true)
		expect(leisureIntentions.some((item) => item.title === 'Walk')).toBe(true)
		expect(leisureIntentions.some((item) => item.title === 'Read')).toBe(true)
	})

	test('ARRANGE_WEEK creates suggested allocations without pinning', () => {
		const initialState: WellwisherState = {
			...createDemoState('2026-09-07'),
			allocations: [],
			protectedCommitments: [],
			lastPlanChange: null,
		}

		const action: WellwisherAction = {
			type: 'ARRANGE_WEEK',
			payload: { preserveOpenMinutesPerDay: 90 },
		}

		const nextState = wellwisherReducer(initialState, action)

		expect(nextState.allocations.length).toBeGreaterThan(0)
		expect(nextState.allocations.every((a) => a.mode === 'suggested')).toBe(true)
		expect(nextState.allocations.every((a) => a.start === undefined && a.end === undefined)).toBe(true)
		expect(nextState.protectedCommitments.length).toBeGreaterThan(0)
		expect(nextState.lastPlanChange).not.toBeNull()
		expect(nextState.lastPlanChange?.previousAllocations).toEqual([])
	})

	test('MOVE_ALLOCATION leaves protected commitments unchanged and updates allocation date', () => {
		const state = createDemoState('2026-09-07')
		const initialCommitments = structuredClone(state.protectedCommitments)
		const targetAllocation = state.allocations[0]

		expect(targetAllocation).toBeDefined()

		const newDate = '2026-09-08'
		const action: WellwisherAction = {
			type: 'MOVE_ALLOCATION',
			payload: {
				allocationId: targetAllocation.id,
				target: { date: newDate, window: 'afternoon' },
			},
		}

		const nextState = wellwisherReducer(state, action)
		const updatedAllocation = nextState.allocations.find((a) => a.id === targetAllocation.id)

		expect(updatedAllocation?.date).toBe(newDate)
		expect(updatedAllocation?.window).toBe('afternoon')
		expect(updatedAllocation?.mode).toBe('suggested')
		expect(nextState.protectedCommitments).toEqual(initialCommitments)
		expect(nextState.lastPlanChange).not.toBeNull()
		expect(nextState.lastPlanChange?.previousAllocations).toEqual(state.allocations)
	})

	test('PIN_ALLOCATION changes only chosen allocation mode to pinned with exact start/end', () => {
		const state = createDemoState('2026-09-07')
		const targetAllocation = state.allocations.find(
			(a) => a.mode === 'suggested',
		)

		expect(targetAllocation).toBeDefined()

		const action: WellwisherAction = {
			type: 'PIN_ALLOCATION',
			payload: {
				allocationId: targetAllocation!.id,
				start: '09:00',
			},
		}

		const nextState = wellwisherReducer(state, action)
		const pinned = nextState.allocations.find((a) => a.id === targetAllocation!.id)

		expect(pinned?.mode).toBe('pinned')
		expect(pinned?.start).toBe('09:00')
		expect(pinned?.end).toBeDefined()
		expect(nextState.lastPlanChange).not.toBeNull()
	})

	test('UNDO_PLAN_CHANGE restores previous allocations and clears lastPlanChange', () => {
		const state = createDemoState('2026-09-07')
		const originalAllocations = structuredClone(state.allocations)
		const targetAllocation = state.allocations[0]

		const moveAction: WellwisherAction = {
			type: 'MOVE_ALLOCATION',
			payload: {
				allocationId: targetAllocation.id,
				target: { date: '2026-09-09', window: 'evening' },
			},
		}

		const movedState = wellwisherReducer(state, moveAction)
		expect(movedState.allocations).not.toEqual(originalAllocations)
		expect(movedState.lastPlanChange).not.toBeNull()

		const undoAction: WellwisherAction = {
			type: 'UNDO_PLAN_CHANGE',
		}

		const revertedState = wellwisherReducer(movedState, undoAction)
		expect(revertedState.allocations).toEqual(originalAllocations)
		expect(revertedState.lastPlanChange).toBeNull()
	})

	test('START_FOCUS starts running session for chosen intention', () => {
		const state = createDemoState('2026-09-07')
		const action: WellwisherAction = {
			type: 'START_FOCUS',
			payload: {
				intentionId: 'ai-engineering',
				targetSeconds: 5400,
			},
		}

		const nextState = wellwisherReducer(state, action)

		expect(nextState.focusSession).toEqual({
			status: 'running',
			intentionId: 'ai-engineering',
			elapsedSeconds: 0,
			targetSeconds: 5400,
		})
	})

	test('COMPLETE_FOCUS records completed state for focus session', () => {
		const state = createDemoState('2026-09-07')
		const startedState = wellwisherReducer(state, {
			type: 'START_FOCUS',
			payload: {
				intentionId: 'ai-engineering',
				targetSeconds: 5400,
			},
		})

		const completeAction: WellwisherAction = {
			type: 'COMPLETE_FOCUS',
			payload: { elapsedSeconds: 5400 },
		}

		const completedState = wellwisherReducer(startedState, completeAction)

		expect(completedState.focusSession).toEqual({
			status: 'completed',
			intentionId: 'ai-engineering',
			elapsedSeconds: 5400,
			targetSeconds: 5400,
		})
	})

	test('ADD_ANCHOR adds rhythm anchor and expands protected commitments', () => {
		const state = createDemoState('2026-09-07')
		const initialCount = state.protectedCommitments.length
		const newAnchor: RhythmAnchor = {
			id: 'family-dinner',
			title: 'Family Dinner',
			startTime: '19:00',
			endTime: '20:00',
			repeat: { type: 'selected-days', days: [6] }, // Saturday
			protected: true,
		}

		const nextState = wellwisherReducer(state, {
			type: 'ADD_ANCHOR',
			payload: newAnchor,
		})

		expect(nextState.anchors).toContainEqual(newAnchor)
		expect(nextState.protectedCommitments.length).toBe(initialCount + 1)
		expect(nextState.protectedCommitments).toContainEqual(
			expect.objectContaining({
				title: 'Family Dinner',
				anchorId: 'family-dinner',
				date: '2026-09-12',
			}),
		)
	})

	test('ADD_INTENTION adds new flexible intention to state', () => {
		const state = createDemoState('2026-09-07')
		const newIntention: FlexibleIntention = {
			id: 'meditation',
			title: 'Meditation',
			kind: 'leisure',
			durationMinutes: 20,
			preferredWindow: 'morning',
			priority: 3,
		}

		const nextState = wellwisherReducer(state, {
			type: 'ADD_INTENTION',
			payload: newIntention,
		})

		expect(nextState.intentions).toContainEqual(newIntention)
	})

	test('SET_VOICE_PREFERENCE updates voice preferences', () => {
		const state = createDemoState('2026-09-07')
		expect(state.voicePreferences.muted).toBe(false)

		const nextState = wellwisherReducer(state, {
			type: 'SET_VOICE_PREFERENCE',
			payload: { muted: true },
		})

		expect(nextState.voicePreferences.muted).toBe(true)
	})

	test('RESET_STATE resets state to payload or default demo state', () => {
		const customDemo = createDemoState('2026-09-14')
		const modifiedState: WellwisherState = {
			...createDemoState('2026-09-07'),
			intentions: [],
		}

		const resetWithPayload = wellwisherReducer(modifiedState, {
			type: 'RESET_STATE',
			payload: customDemo,
		})
		expect(resetWithPayload.weekStart).toBe('2026-09-14')
		expect(resetWithPayload.intentions.length).toBeGreaterThan(0)

		const resetWithoutPayload = wellwisherReducer(modifiedState, {
			type: 'RESET_STATE',
		})
		expect(resetWithoutPayload.intentions.length).toBeGreaterThan(0)
	})
})

describe('WellwisherProvider and selectors', () => {
	test('useWellwisher throws outside of provider', () => {
		expect(() => {
			renderHook(() => useWellwisher())
		}).toThrow('useWellwisher must be used within a WellwisherProvider')
	})

	test('provides selectors and updates on dispatch', () => {
		const { result } = renderHook(() => useWellwisher(), {
			wrapper: ({ children }: { children?: React.ReactNode }) =>
				React.createElement(
					WellwisherProvider,
					{ initialState: createDemoState('2026-09-07') },
					children,
				),
		})

		const weekPlan = result.current.getWeekPlan()
		expect(weekPlan.weekStart).toBe('2026-09-07')
		expect(weekPlan.days).toHaveLength(7)

		const todayPlan = result.current.getTodayPlan('2026-09-07')
		expect(todayPlan.date).toBe('2026-09-07')
		expect(todayPlan.protectedCommitments.length).toBeGreaterThan(0)

		const capacity = result.current.getCapacity('2026-09-07')
		expect(capacity.openMinutes).toBeGreaterThan(0)
		expect(capacity.protectedMinutes).toBeGreaterThan(0)

		const summary = result.current.getWeekSummary()
		expect(summary.days).toHaveLength(7)
		expect(summary.totalProtectedMinutes).toBeGreaterThan(0)
		expect(summary.totalOpenMinutes).toBeGreaterThan(0)

		const recommendation = result.current.getRecommendation('2026-09-07')
		if (recommendation) {
			expect(recommendation.intention).toBeDefined()
			expect(recommendation.reason).toBeTruthy()
		}

		// Dispatch an action and verify update
		act(() => {
			result.current.dispatch({
				type: 'SET_VOICE_PREFERENCE',
				payload: { muted: true },
			})
		})

		expect(result.current.state.voicePreferences.muted).toBe(true)
	})
})

describe('Dynamic CRUD actions', () => {
	test('supports ADD_INTENTION, UPDATE_INTENTION, and DELETE_INTENTION', () => {
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
			payload: {
				intentionId: 'custom-art',
				target: { date: initial.weekStart, window: 'evening' },
			},
		})
		expect(stateWithAlloc.allocations.some((a) => a.intentionId === 'custom-art')).toBe(true)

		const stateAfterDelete = wellwisherReducer(stateWithAlloc, {
			type: 'DELETE_INTENTION',
			payload: { intentionId: 'custom-art' },
		})
		expect(stateAfterDelete.intentions.some((i) => i.id === 'custom-art')).toBe(false)
		expect(stateAfterDelete.allocations.some((a) => a.intentionId === 'custom-art')).toBe(false)
	})

	test('supports ADD_ANCHOR, UPDATE_ANCHOR, and DELETE_ANCHOR with recurrence sync', () => {
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

	test('supports UPDATE_SCHEDULE_BOUNDS and IMPORT_STATE', () => {
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

