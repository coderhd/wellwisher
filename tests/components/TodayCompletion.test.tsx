import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { TodayCompletion } from '../../src/components/focus/TodayCompletion'
import type { FocusSessionState } from '../../src/domain/focus/types'
import type {
	FlexibleIntention,
	ProtectedCommitment,
} from '../../src/domain/planning/types'

describe('TodayCompletion component', () => {
	const completedIntention: FlexibleIntention = {
		id: 'ai-engineering',
		title: 'AI Engineering',
		kind: 'work',
		durationMinutes: 90,
		preferredWindow: 'morning',
		priority: 1,
	}

	const completedSession: FocusSessionState = {
		status: 'completed',
		intentionId: 'ai-engineering',
		elapsedSeconds: 5400,
		targetSeconds: 5400,
	}

	const nextCommitment: ProtectedCommitment = {
		id: 'lunch-2026-09-07',
		anchorId: 'lunch',
		title: 'Lunch',
		date: '2026-09-07',
		startTime: '13:30',
		endTime: '14:30',
		durationMinutes: 60,
		protected: true,
	}

	it('renders completed work as visible evidence with title and duration', () => {
		render(
			<TodayCompletion
				session={completedSession}
				intention={completedIntention}
				nextCommitment={nextCommitment}
			/>,
		)

		expect(
			screen.getByRole('region', {
				name: /today('s)? completion|completed focus|restorative completion/i,
			}),
		).toBeInTheDocument()

		// Title of completed intention
		expect(
			screen.getByRole('heading', { name: /ai engineering/i }),
		).toBeInTheDocument()

		// Evidence of completed duration
		expect(screen.getByText(/90 min|90m|1:30:00/i)).toBeInTheDocument()
	})

	it('displays the next protected commitment with time anchoring', () => {
		render(
			<TodayCompletion
				session={completedSession}
				intention={completedIntention}
				nextCommitment={nextCommitment}
			/>,
		)

		expect(screen.getByText(/lunch/i)).toBeInTheDocument()
		expect(screen.getByText(/13:30 - 14:30/i)).toBeInTheDocument()
	})

	it('renders "Rest now" as the primary recommended action', async () => {
		const user = userEvent.setup()
		const handleRest = vi.fn()

		render(
			<TodayCompletion
				session={completedSession}
				intention={completedIntention}
				nextCommitment={nextCommitment}
				onRestNow={handleRest}
			/>,
		)

		const restButton = screen.getByRole('button', {
			name: /rest now/i,
		})
		expect(restButton).toBeInTheDocument()

		await user.click(restButton)
		expect(handleRest).toHaveBeenCalledTimes(1)
	})

	it('renders "Choose something else" as an optional action', async () => {
		const user = userEvent.setup()
		const handleChooseAnother = vi.fn()

		render(
			<TodayCompletion
				session={completedSession}
				intention={completedIntention}
				nextCommitment={nextCommitment}
				onChooseAnother={handleChooseAnother}
			/>,
		)

		const chooseButton = screen.getByRole('button', {
			name: /choose something else/i,
		})
		expect(chooseButton).toBeInTheDocument()

		await user.click(chooseButton)
		expect(handleChooseAnother).toHaveBeenCalledTimes(1)
	})

	it('does NOT render streaks, XP, gamification badges, or guilt framing', () => {
		render(
			<TodayCompletion
				session={completedSession}
				intention={completedIntention}
				nextCommitment={nextCommitment}
			/>,
		)

		// Assert absence of streak / XP / confetti / gamified badges
		expect(screen.queryByText(/streak/i)).not.toBeInTheDocument()
		expect(screen.queryByText(/xp/i)).not.toBeInTheDocument()
		expect(screen.queryByText(/points/i)).not.toBeInTheDocument()
		expect(screen.queryByText(/confetti/i)).not.toBeInTheDocument()
		expect(screen.queryByText(/level up/i)).not.toBeInTheDocument()
	})
})
