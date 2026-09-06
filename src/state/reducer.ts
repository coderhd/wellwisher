import { addDays, format, parseISO } from 'date-fns'

import { arrangeWeek } from '../domain/planning/arrange-week'
import { calculateCapacity } from '../domain/planning/capacity'
import { moveAllocation, pinAllocation } from '../domain/planning/mutations'
import { expandRecurrence } from '../domain/planning/recurrence'
import type {
	Allocation,
	DayPlan,
	FlexibleIntention,
	MoveTarget,
	ProtectedCommitment,
	RhythmAnchor,
	WeekPlan,
} from '../domain/planning/types'

export interface FocusSessionState {
	status: 'idle' | 'running' | 'paused' | 'completed'
	intentionId: string
	elapsedSeconds: number
	targetSeconds: number
}

export interface VoicePreferences {
	muted: boolean
	autoPlay?: boolean
	speed?: number
}

export interface PlanChange {
	description: string
	timestamp: string
	previousAllocations: Allocation[]
	previousProtectedCommitments?: ProtectedCommitment[]
	tradeOff?: string
}

export interface WellwisherState {
	weekStart: string
	anchors: RhythmAnchor[]
	protectedCommitments: ProtectedCommitment[]
	intentions: FlexibleIntention[]
	allocations: Allocation[]
	focusSession: FocusSessionState
	voicePreferences: VoicePreferences
	lastPlanChange: PlanChange | null
}

export type WellwisherAction =
	| { type: 'ADD_ANCHOR'; payload: RhythmAnchor }
	| { type: 'ADD_INTENTION'; payload: FlexibleIntention }
	| { type: 'ARRANGE_WEEK'; payload?: { preserveOpenMinutesPerDay?: number } }
	| {
			type: 'MOVE_ALLOCATION'
			payload: { allocationId: string; target: MoveTarget }
	  }
	| {
			type: 'SUGGEST_INTENTION'
			payload: {
				intentionId: string
				target: {
					date: string
					window?: 'morning' | 'afternoon' | 'evening'
					start?: string
					end?: string
				}
			}
	  }
	| {
			type: 'PIN_ALLOCATION'
			payload: { allocationId: string; start: string }
	  }
	| { type: 'UNDO_PLAN_CHANGE' }
	| {
			type: 'START_FOCUS'
			payload: { intentionId: string; targetSeconds?: number }
	  }
	| { type: 'COMPLETE_FOCUS'; payload?: { elapsedSeconds?: number } }
	| { type: 'SET_VOICE_PREFERENCE'; payload: Partial<VoicePreferences> }
	| { type: 'RESET_STATE'; payload?: WellwisherState }

export function buildWeekPlan (state: WellwisherState): WeekPlan {
	const firstDate = parseISO(state.weekStart)
	const dates = Array.from({ length: 7 }, (_, offset) =>
		format(addDays(firstDate, offset), 'yyyy-MM-dd'),
	)

	const days: DayPlan[] = dates.map((date) => {
		const dayProtected = state.protectedCommitments.filter(
			(commitment) => commitment.date === date || commitment.endDate === date,
		)
		const dayAllocations = state.allocations.filter((allocation) => {
			if (allocation.date === date) {
				return true
			}
			if (
				allocation.endDate &&
				allocation.date <= date &&
				date <= allocation.endDate
			) {
				return true
			}
			return false
		})

		return {
			date,
			protectedCommitments: dayProtected.map((c) => ({ ...c })),
			allocations: dayAllocations.map((a) => ({ ...a })),
		}
	})

	const openWindows = days.flatMap((day) => calculateCapacity(day).openWindows)
	const unplacedIntentions = state.intentions.filter(
		(intention) =>
			!state.allocations.some(
				(allocation) => allocation.intentionId === intention.id,
			),
	)

	return {
		weekStart: state.weekStart,
		days,
		protectedCommitments: state.protectedCommitments.map((c) => ({ ...c })),
		allocations: state.allocations.map((a) => ({ ...a })),
		openWindows,
		...(unplacedIntentions.length > 0
			? { unplacedIntentions: unplacedIntentions.map((i) => ({ ...i })) }
			: {}),
	}
}

export function wellwisherReducer (
	state: WellwisherState,
	action: WellwisherAction,
): WellwisherState {
	switch (action.type) {
		case 'ADD_ANCHOR': {
			const nextAnchors = [...state.anchors, action.payload]
			const addedCommitments = action.payload.protected
				? expandRecurrence(action.payload, state.weekStart)
				: []

			return {
				...state,
				anchors: nextAnchors,
				protectedCommitments: [
					...state.protectedCommitments,
					...addedCommitments,
				],
			}
		}

		case 'ADD_INTENTION': {
			return {
				...state,
				intentions: [...state.intentions, action.payload],
			}
		}

		case 'ARRANGE_WEEK': {
			const arrangedPlan = arrangeWeek({
				anchors: state.anchors,
				intentions: state.intentions,
				weekStart: state.weekStart,
				preserveOpenMinutesPerDay:
					action.payload?.preserveOpenMinutesPerDay ?? 90,
			})

			return {
				...state,
				allocations: arrangedPlan.allocations.map((a) => ({ ...a })),
				protectedCommitments: arrangedPlan.protectedCommitments.map((c) => ({
					...c,
				})),
				lastPlanChange: {
					description: 'Arranged week allocations',
					timestamp: new Date().toISOString(),
					previousAllocations: state.allocations.map((a) => ({ ...a })),
					previousProtectedCommitments: state.protectedCommitments.map((c) => ({
						...c,
					})),
				},
			}
		}

		case 'MOVE_ALLOCATION': {
			const currentPlan = buildWeekPlan(state)
			const movedPlan = moveAllocation(
				currentPlan,
				action.payload.allocationId,
				action.payload.target,
			)

			let nextAllocations = movedPlan.allocations
			const hasChanged =
				JSON.stringify(movedPlan.allocations) !==
				JSON.stringify(state.allocations)

			if (!hasChanged) {
				const intention = state.intentions.find(
					(i) => i.id === action.payload.allocationId,
				)
				if (
					intention &&
					!state.allocations.some((a) => a.intentionId === intention.id)
				) {
					const newAllocation: Allocation = {
						id: `${intention.id}:${action.payload.target.date}`,
						intentionId: intention.id,
						date: action.payload.target.date,
						window:
							action.payload.target.window ??
							intention.preferredWindow ??
							'morning',
						mode: 'suggested',
						durationMinutes: intention.durationMinutes,
					}
					nextAllocations = [...state.allocations, newAllocation]
				} else {
					return state
				}
			}

			return {
				...state,
				allocations: nextAllocations.map((a) => ({ ...a })),
				lastPlanChange: {
					description: `Moved allocation ${action.payload.allocationId} to ${action.payload.target.date}`,
					timestamp: new Date().toISOString(),
					previousAllocations: state.allocations.map((a) => ({ ...a })),
					previousProtectedCommitments: state.protectedCommitments.map((c) => ({
						...c,
					})),
				},
			}
		}

		case 'SUGGEST_INTENTION': {
			const intention = state.intentions.find(
				(i) => i.id === action.payload.intentionId,
			)
			if (!intention) {
				return state
			}

			const existingAllocation = state.allocations.find(
				(a) => a.intentionId === intention.id,
			)

			const allocationId =
				existingAllocation?.id ??
				`${intention.id}:${action.payload.target.date}`
			const newAllocation: Allocation = {
				id: allocationId,
				intentionId: intention.id,
				date: action.payload.target.date,
				window:
					action.payload.target.window ??
					intention.preferredWindow ??
					'morning',
				mode: 'suggested',
				durationMinutes: intention.durationMinutes,
				...(action.payload.target.start
					? {
							start: action.payload.target.start,
							end: action.payload.target.end,
							mode: 'pinned' as const,
						}
					: {}),
			}

			const nextAllocations = existingAllocation
				? state.allocations.map((a) =>
						a.id === existingAllocation.id ? newAllocation : a,
					)
				: [...state.allocations, newAllocation]

			return {
				...state,
				allocations: nextAllocations,
				lastPlanChange: {
					description: `Suggested ${intention.title} on ${action.payload.target.date}`,
					timestamp: new Date().toISOString(),
					previousAllocations: state.allocations.map((a) => ({ ...a })),
					previousProtectedCommitments: state.protectedCommitments.map((c) => ({
						...c,
					})),
				},
			}
		}

		case 'PIN_ALLOCATION': {
			const currentPlan = buildWeekPlan(state)
			const pinnedPlan = pinAllocation(
				currentPlan,
				action.payload.allocationId,
				action.payload.start,
			)

			const hasChanged =
				JSON.stringify(pinnedPlan.allocations) !==
				JSON.stringify(state.allocations)
			if (!hasChanged) {
				return state
			}

			return {
				...state,
				allocations: pinnedPlan.allocations.map((a) => ({ ...a })),
				lastPlanChange: {
					description: `Pinned allocation ${action.payload.allocationId} at ${action.payload.start}`,
					timestamp: new Date().toISOString(),
					previousAllocations: state.allocations.map((a) => ({ ...a })),
					previousProtectedCommitments: state.protectedCommitments.map((c) => ({
						...c,
					})),
				},
			}
		}

		case 'UNDO_PLAN_CHANGE': {
			if (!state.lastPlanChange) {
				return state
			}

			const restoredAllocations =
				state.lastPlanChange.previousAllocations.map((a) => ({ ...a }))
			const restoredProtected =
				state.lastPlanChange.previousProtectedCommitments
					? state.lastPlanChange.previousProtectedCommitments.map((c) => ({
							...c,
						}))
					: state.protectedCommitments

			return {
				...state,
				allocations: restoredAllocations,
				protectedCommitments: restoredProtected,
				lastPlanChange: null,
			}
		}

		case 'START_FOCUS': {
			const targetIntention = state.intentions.find(
				(i) => i.id === action.payload.intentionId,
			)
			const defaultSeconds = targetIntention
				? targetIntention.durationMinutes * 60
				: 90 * 60

			return {
				...state,
				focusSession: {
					status: 'running',
					intentionId: action.payload.intentionId,
					elapsedSeconds: 0,
					targetSeconds: action.payload.targetSeconds ?? defaultSeconds,
				},
			}
		}

		case 'COMPLETE_FOCUS': {
			return {
				...state,
				focusSession: {
					...state.focusSession,
					status: 'completed',
					elapsedSeconds:
						action.payload?.elapsedSeconds ?? state.focusSession.targetSeconds,
				},
			}
		}

		case 'SET_VOICE_PREFERENCE': {
			return {
				...state,
				voicePreferences: {
					...state.voicePreferences,
					...action.payload,
				},
			}
		}

		case 'RESET_STATE': {
			if (action.payload) {
				return action.payload
			}
			return state
		}

		default: {
			return state
		}
	}
}
