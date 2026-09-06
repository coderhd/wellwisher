import { describe, expect, it } from 'vitest'

import {
	cancelSession,
	completeSession,
	createInitialFocusState,
	formatFocusTimer,
	getProgressPercentage,
	getRemainingSeconds,
	pauseSession,
	resumeSession,
	startSession,
	tickSession,
} from '../../../src/domain/focus/session'
import type { FocusSessionState } from '../../../src/domain/focus/types'

describe('Focus Session pure state machine', () => {
	it('creates initial idle focus state', () => {
		const initial = createInitialFocusState(5400)

		expect(initial).toEqual({
			status: 'idle',
			intentionId: '',
			elapsedSeconds: 0,
			targetSeconds: 5400,
		})
	})

	it('startSession transitions to running with given intention and target', () => {
		const initial = createInitialFocusState()
		const started = startSession(initial, 'ai-engineering', 5400)

		expect(started).toEqual({
			status: 'running',
			intentionId: 'ai-engineering',
			elapsedSeconds: 0,
			targetSeconds: 5400,
		})
	})

	it('pauseSession transitions running session to paused and preserves elapsed time', () => {
		const running: FocusSessionState = {
			status: 'running',
			intentionId: 'ai-engineering',
			elapsedSeconds: 1200,
			targetSeconds: 5400,
		}

		const paused = pauseSession(running)

		expect(paused.status).toBe('paused')
		expect(paused.elapsedSeconds).toBe(1200)
		expect(paused.intentionId).toBe('ai-engineering')
		expect(paused.targetSeconds).toBe(5400)
	})

	it('pauseSession is a no-op on non-running sessions', () => {
		const idle = createInitialFocusState()
		expect(pauseSession(idle)).toEqual(idle)
	})

	it('resumeSession transitions paused session back to running', () => {
		const paused: FocusSessionState = {
			status: 'paused',
			intentionId: 'ai-engineering',
			elapsedSeconds: 1200,
			targetSeconds: 5400,
		}

		const resumed = resumeSession(paused)

		expect(resumed.status).toBe('running')
		expect(resumed.elapsedSeconds).toBe(1200)
		expect(resumed.intentionId).toBe('ai-engineering')
	})

	it('resumeSession is a no-op on non-paused sessions', () => {
		const running: FocusSessionState = {
			status: 'running',
			intentionId: 'ai-engineering',
			elapsedSeconds: 100,
			targetSeconds: 5400,
		}

		expect(resumeSession(running)).toEqual(running)
	})

	it('tickSession increments elapsed seconds when running', () => {
		const running: FocusSessionState = {
			status: 'running',
			intentionId: 'ai-engineering',
			elapsedSeconds: 10,
			targetSeconds: 5400,
		}

		const ticked = tickSession(running, 5)
		expect(ticked.elapsedSeconds).toBe(15)
		expect(ticked.status).toBe('running')
	})

	it('tickSession does not increment elapsed seconds when paused or idle', () => {
		const paused: FocusSessionState = {
			status: 'paused',
			intentionId: 'ai-engineering',
			elapsedSeconds: 10,
			targetSeconds: 5400,
		}

		expect(tickSession(paused, 5)).toEqual(paused)
	})

	it('completeSession records completed intention without creating new obligations', () => {
		const running: FocusSessionState = {
			status: 'running',
			intentionId: 'ai-engineering',
			elapsedSeconds: 5400,
			targetSeconds: 5400,
		}

		const completed = completeSession(running)

		expect(completed.status).toBe('completed')
		expect(completed.intentionId).toBe('ai-engineering')
		expect(completed.elapsedSeconds).toBe(5400)
		expect(completed.targetSeconds).toBe(5400)
	})

	it('cancelSession resets to idle state', () => {
		const running: FocusSessionState = {
			status: 'running',
			intentionId: 'ai-engineering',
			elapsedSeconds: 300,
			targetSeconds: 5400,
		}

		const cancelled = cancelSession(running)

		expect(cancelled.status).toBe('idle')
		expect(cancelled.elapsedSeconds).toBe(0)
		expect(cancelled.intentionId).toBe('')
	})

	it('formatFocusTimer formats seconds into mm:ss and hh:mm:ss correctly', () => {
		expect(formatFocusTimer(0)).toBe('00:00')
		expect(formatFocusTimer(65)).toBe('01:05')
		expect(formatFocusTimer(1500)).toBe('25:00')
		expect(formatFocusTimer(5400)).toBe('1:30:00')
	})

	it('getRemainingSeconds calculates remaining duration clamped at zero', () => {
		const state: FocusSessionState = {
			status: 'running',
			intentionId: 'ai-engineering',
			elapsedSeconds: 5000,
			targetSeconds: 5400,
		}

		expect(getRemainingSeconds(state)).toBe(400)

		const overtimeState: FocusSessionState = {
			...state,
			elapsedSeconds: 6000,
		}
		expect(getRemainingSeconds(overtimeState)).toBe(0)
	})

	it('getProgressPercentage computes percentage clamped between 0 and 100', () => {
		expect(
			getProgressPercentage({
				status: 'running',
				intentionId: 'ai',
				elapsedSeconds: 2700,
				targetSeconds: 5400,
			}),
		).toBe(50)

		expect(
			getProgressPercentage({
				status: 'running',
				intentionId: 'ai',
				elapsedSeconds: 6000,
				targetSeconds: 5400,
			}),
		).toBe(100)
	})
})
