'use client'

import React, { useCallback } from 'react'

import { AllocationBoard } from '../../components/planning/AllocationBoard'
import { useWellwisher } from '../../state/WellwisherProvider'

export function PlanSurface (): React.JSX.Element {
	const { state, dispatch, getWeekPlan, getUnplacedIntentions } =
		useWellwisher()

	const weekPlan = getWeekPlan()
	const unplacedIntentions = getUnplacedIntentions()

	const handleSuggest = useCallback(
		(
			intentionId: string,
			target: { date: string; window: 'morning' | 'afternoon' | 'evening' },
		) => {
			dispatch({
				type: 'SUGGEST_INTENTION',
				payload: {
					intentionId,
					target,
				},
			})
		},
		[dispatch],
	)

	const handlePin = useCallback(
		(allocationId: string, start: string) => {
			dispatch({
				type: 'PIN_ALLOCATION',
				payload: {
					allocationId,
					start,
				},
			})
		},
		[dispatch],
	)

	const handleArrange = useCallback(() => {
		dispatch({
			type: 'ARRANGE_WEEK',
			payload: {
				preserveOpenMinutesPerDay: 90,
			},
		})
	}, [dispatch])

	const handleUndo = useCallback(() => {
		dispatch({
			type: 'UNDO_PLAN_CHANGE',
		})
	}, [dispatch])

	return (
		<AllocationBoard
			weekPlan={weekPlan}
			unplacedIntentions={unplacedIntentions}
			intentions={state.intentions}
			anchors={state.anchors}
			lastPlanChange={state.lastPlanChange}
			onSuggest={handleSuggest}
			onPin={handlePin}
			onArrange={handleArrange}
			onUndo={handleUndo}
		/>
	)
}
