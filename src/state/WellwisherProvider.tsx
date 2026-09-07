'use client'

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useReducer,
} from 'react'

import { createDemoState } from '../data/demoScenario'
import { calculateCapacity } from '../domain/planning/capacity'
import type {
	Allocation,
	CapacitySummary,
	DayPlan,
	FlexibleIntention,
	WeekPlan,
} from '../domain/planning/types'
import { loadState, saveState } from './persistence'
import {
	buildWeekPlan,
	type WellwisherAction,
	wellwisherReducer,
	type WellwisherState,
} from './reducer'

export interface Recommendation {
	intention: FlexibleIntention
	allocation?: Allocation
	reason: string
	suggestedWindow?: 'morning' | 'afternoon' | 'evening'
	durationMinutes: number
}

export interface DaySummary {
	date: string
	protectedMinutes: number
	suggestedMinutes: number
	openMinutes: number
}

export interface WeekSummary {
	totalProtectedMinutes: number
	totalSuggestedMinutes: number
	totalOpenMinutes: number
	days: DaySummary[]
}

export interface WellwisherContextValue {
	state: WellwisherState
	dispatch: React.Dispatch<WellwisherAction>
	getTodayPlan: (todayDate?: string) => DayPlan
	getDayPlan: (date: string) => DayPlan
	getWeekPlan: () => WeekPlan
	getUnplacedIntentions: () => FlexibleIntention[]
	getRecommendation: (date?: string) => Recommendation | null
	getCapacity: (date?: string) => CapacitySummary
	getWeekSummary: () => WeekSummary
}

const WellwisherContext = createContext<WellwisherContextValue | null>(null)

export interface WellwisherProviderProps {
	children?: React.ReactNode
	initialState?: WellwisherState
}

export function WellwisherProvider ({
	children,
	initialState,
}: WellwisherProviderProps): React.JSX.Element {
	const [state, dispatch] = useReducer(
		wellwisherReducer,
		undefined,
		() => initialState ?? loadState() ?? createDemoState(),
	)

	useEffect(() => {
		saveState(state)
	}, [state])

	const getWeekPlanSelector = useCallback((): WeekPlan => {
		return buildWeekPlan(state)
	}, [state])

	const getDayPlanSelector = useCallback(
		(date: string): DayPlan => {
			const week = buildWeekPlan(state)
			return (
				week.days.find((day) => day.date === date) ?? {
					date,
					protectedCommitments: [],
					allocations: [],
					...(state.scheduleBounds
						? {
								availableStart: state.scheduleBounds.availableStart,
								availableEnd: state.scheduleBounds.availableEnd,
							}
						: {}),
				}
			)
		},
		[state],
	)

	const getTodayPlanSelector = useCallback(
		(todayDate?: string): DayPlan => {
			const targetDate = todayDate ?? state.weekStart
			return getDayPlanSelector(targetDate)
		},
		[getDayPlanSelector, state.weekStart],
	)

	const getUnplacedIntentionsSelector = useCallback((): FlexibleIntention[] => {
		return state.intentions.filter(
			(intention) =>
				!state.allocations.some(
					(allocation) => allocation.intentionId === intention.id,
				),
		)
	}, [state.allocations, state.intentions])

	const getCapacitySelector = useCallback(
		(date?: string): CapacitySummary => {
			const targetDate = date ?? state.weekStart
			const day = getDayPlanSelector(targetDate)
			return calculateCapacity(day)
		},
		[getDayPlanSelector, state.weekStart],
	)

	const getWeekSummarySelector = useCallback((): WeekSummary => {
		const week = buildWeekPlan(state)
		const days: DaySummary[] = week.days.map((day) => {
			const cap = calculateCapacity(day)
			return {
				date: day.date,
				protectedMinutes: cap.protectedMinutes,
				suggestedMinutes: cap.suggestedMinutes,
				openMinutes: cap.openMinutes,
			}
		})

		return {
			totalProtectedMinutes: days.reduce(
				(total, day) => total + day.protectedMinutes,
				0,
			),
			totalSuggestedMinutes: days.reduce(
				(total, day) => total + day.suggestedMinutes,
				0,
			),
			totalOpenMinutes: days.reduce(
				(total, day) => total + day.openMinutes,
				0,
			),
			days,
		}
	}, [state])

	const getRecommendationSelector = useCallback(
		(date?: string): Recommendation | null => {
			const targetDate = date ?? state.weekStart
			const dayAllocations = state.allocations.filter(
				(allocation) => allocation.date === targetDate,
			)

			const matched = dayAllocations
				.map((allocation) => ({
					allocation,
					intention: state.intentions.find(
						(i) => i.id === allocation.intentionId,
					),
				}))
				.filter(
					(
						candidate,
					): candidate is {
						allocation: Allocation
						intention: FlexibleIntention
					} => candidate.intention !== undefined,
				)
				.sort((left, right) => left.intention.priority - right.intention.priority)

			if (matched.length > 0) {
				const top = matched[0]
				const reason =
					top.intention.id === 'ai-engineering'
						? 'Start with AI Engineering. It is the only track with a hard deadline. Lekhan has momentum already; Software Factory can wait until Thursday.'
						: `Start with ${top.intention.title}. It is prioritized for today's focus.`

				return {
					intention: top.intention,
					allocation: top.allocation,
					reason,
					suggestedWindow: top.allocation.window ?? top.intention.preferredWindow,
					durationMinutes: top.allocation.durationMinutes,
				}
			}

			const unplaced = state.intentions
				.filter(
					(intention) =>
						!state.allocations.some(
							(allocation) => allocation.intentionId === intention.id,
						),
				)
				.sort((left, right) => left.priority - right.priority)

			if (unplaced.length > 0) {
				const topUnplaced = unplaced[0]
				return {
					intention: topUnplaced,
					reason: `Consider placing ${topUnplaced.title} into an open window today.`,
					suggestedWindow: topUnplaced.preferredWindow,
					durationMinutes: topUnplaced.durationMinutes,
				}
			}

			return null
		},
		[state.allocations, state.intentions, state.weekStart],
	)

	const contextValue = useMemo<WellwisherContextValue>(
		() => ({
			state,
			dispatch,
			getTodayPlan: getTodayPlanSelector,
			getDayPlan: getDayPlanSelector,
			getWeekPlan: getWeekPlanSelector,
			getUnplacedIntentions: getUnplacedIntentionsSelector,
			getRecommendation: getRecommendationSelector,
			getCapacity: getCapacitySelector,
			getWeekSummary: getWeekSummarySelector,
		}),
		[
			state,
			dispatch,
			getTodayPlanSelector,
			getDayPlanSelector,
			getWeekPlanSelector,
			getUnplacedIntentionsSelector,
			getRecommendationSelector,
			getCapacitySelector,
			getWeekSummarySelector,
		],
	)

	return (
		<WellwisherContext.Provider value={contextValue}>
			{children}
		</WellwisherContext.Provider>
	)
}

export function useWellwisher (): WellwisherContextValue {
	const context = useContext(WellwisherContext)
	if (!context) {
		throw new Error('useWellwisher must be used within a WellwisherProvider')
	}
	return context
}
