'use client'

import React, { useCallback } from 'react'

import { AllocationBoard } from '../../components/planning/AllocationBoard'
import type {
	FlexibleIntention,
	RhythmAnchor,
} from '../../domain/planning/types'
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

	const handleAddIntention = useCallback(
		(intention: FlexibleIntention) => {
			dispatch({
				type: 'ADD_INTENTION',
				payload: intention,
			})
		},
		[dispatch],
	)

	const handleEditIntention = useCallback(
		(intention: FlexibleIntention) => {
			dispatch({
				type: 'UPDATE_INTENTION',
				payload: intention,
			})
		},
		[dispatch],
	)

	const handleDeleteIntention = useCallback(
		(intentionId: string) => {
			dispatch({
				type: 'DELETE_INTENTION',
				payload: { intentionId },
			})
		},
		[dispatch],
	)

	const handleAddAnchor = useCallback(
		(anchor: RhythmAnchor) => {
			dispatch({
				type: 'ADD_ANCHOR',
				payload: anchor,
			})
		},
		[dispatch],
	)

	const handleEditAnchor = useCallback(
		(anchor: RhythmAnchor) => {
			dispatch({
				type: 'UPDATE_ANCHOR',
				payload: anchor,
			})
		},
		[dispatch],
	)

	const handleDeleteAnchor = useCallback(
		(anchorId: string) => {
			dispatch({
				type: 'DELETE_ANCHOR',
				payload: { anchorId },
			})
		},
		[dispatch],
	)

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
			onAddIntention={handleAddIntention}
			onEditIntention={handleEditIntention}
			onDeleteIntention={handleDeleteIntention}
			onAddAnchor={handleAddAnchor}
			onEditAnchor={handleEditAnchor}
			onDeleteAnchor={handleDeleteAnchor}
		/>
	)
}
