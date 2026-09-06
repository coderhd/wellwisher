import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { FocusSession } from '../../src/components/focus/FocusSession'
import type { FocusSessionState } from '../../src/domain/focus/types'
import type { FlexibleIntention } from '../../src/domain/planning/types'

describe('FocusSession component', () => {
	const sampleIntention: FlexibleIntention = {
		id: 'ai-engineering',
		title: 'AI Engineering',
		kind: 'work',
		durationMinutes: 90,
		preferredWindow: 'morning',
		priority: 1,
	}

	const runningSession: FocusSessionState = {
		status: 'running',
		intentionId: 'ai-engineering',
		elapsedSeconds: 1500, // 25 min elapsed
		targetSeconds: 5400, // 90 min target
	}

	it('renders intention title, reason, and timer displays', () => {
		render(
			<FocusSession
				session={runningSession}
				intention={sampleIntention}
				reason='Start with AI Engineering. Only track with a hard deadline.'
			/>,
		)

		expect(
			screen.getByRole('heading', { name: /ai engineering/i }),
		).toBeInTheDocument()
		expect(
			screen.getByText(
				/start with ai engineering\. only track with a hard deadline\./i,
			),
		).toBeInTheDocument()

		// Displays elapsed time (25:00) and remaining time (1:05:00)
		expect(screen.getByText(/25:00/)).toBeInTheDocument()
		expect(screen.getByText(/1:05:00/)).toBeInTheDocument()
	})

	it('calls onPause when pause button is clicked during running session', async () => {
		const user = userEvent.setup()
		const handlePause = vi.fn()

		render(
			<FocusSession
				session={runningSession}
				intention={sampleIntention}
				onPause={handlePause}
			/>,
		)

		const pauseBtn = screen.getByRole('button', { name: /pause/i })
		expect(pauseBtn).toBeInTheDocument()

		await user.click(pauseBtn)
		expect(handlePause).toHaveBeenCalledTimes(1)
	})

	it('renders resume button and calls onResume when paused', async () => {
		const user = userEvent.setup()
		const handleResume = vi.fn()
		const pausedSession: FocusSessionState = {
			...runningSession,
			status: 'paused',
		}

		render(
			<FocusSession
				session={pausedSession}
				intention={sampleIntention}
				onResume={handleResume}
			/>,
		)

		const resumeBtn = screen.getByRole('button', { name: /resume/i })
		expect(resumeBtn).toBeInTheDocument()

		await user.click(resumeBtn)
		expect(handleResume).toHaveBeenCalledTimes(1)
	})

	it('calls onComplete when complete button is clicked', async () => {
		const user = userEvent.setup()
		const handleComplete = vi.fn()

		render(
			<FocusSession
				session={runningSession}
				intention={sampleIntention}
				onComplete={handleComplete}
			/>,
		)

		const completeBtn = screen.getByRole('button', { name: /complete/i })
		expect(completeBtn).toBeInTheDocument()

		await user.click(completeBtn)
		expect(handleComplete).toHaveBeenCalledTimes(1)
	})

	it('calls onCancel when cancel/dismiss button is clicked', async () => {
		const user = userEvent.setup()
		const handleCancel = vi.fn()

		render(
			<FocusSession
				session={runningSession}
				intention={sampleIntention}
				onCancel={handleCancel}
			/>,
		)

		const cancelBtn = screen.getByRole('button', {
			name: /cancel|end session|dismiss/i,
		})
		expect(cancelBtn).toBeInTheDocument()

		await user.click(cancelBtn)
		expect(handleCancel).toHaveBeenCalledTimes(1)
	})

	it('ticks elapsed time via onTick when running', () => {
		vi.useFakeTimers()
		const handleTick = vi.fn()

		render(
			<FocusSession
				session={runningSession}
				intention={sampleIntention}
				onTick={handleTick}
			/>,
		)

		act(() => {
			vi.advanceTimersByTime(3000)
		})

		expect(handleTick).toHaveBeenCalled()
		vi.useRealTimers()
	})

	it('does not tick when paused', () => {
		vi.useFakeTimers()
		const handleTick = vi.fn()
		const pausedSession: FocusSessionState = {
			...runningSession,
			status: 'paused',
		}

		render(
			<FocusSession
				session={pausedSession}
				intention={sampleIntention}
				onTick={handleTick}
			/>,
		)

		act(() => {
			vi.advanceTimersByTime(3000)
		})

		expect(handleTick).not.toHaveBeenCalled()
		vi.useRealTimers()
	})
})
