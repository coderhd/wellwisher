import type { FocusSessionState } from './types'

/**
 * Creates an initial idle focus session state.
 */
export function createInitialFocusState (
	defaultTargetSeconds: number = 0,
): FocusSessionState {
	return {
		status: 'idle',
		intentionId: '',
		elapsedSeconds: 0,
		targetSeconds: defaultTargetSeconds,
	}
}

/**
 * Pure transition to start a focus session.
 */
export function startSession (
	stateOrIntentionId: FocusSessionState | string,
	intentionIdOrTarget?: string | number,
	targetSeconds?: number,
): FocusSessionState {
	if (typeof stateOrIntentionId === 'string') {
		const intentionId = stateOrIntentionId
		const target =
			typeof intentionIdOrTarget === 'number' ? intentionIdOrTarget : 0

		return {
			status: 'running',
			intentionId,
			elapsedSeconds: 0,
			targetSeconds: Math.max(0, target),
		}
	}

	const intentionId =
		typeof intentionIdOrTarget === 'string'
			? intentionIdOrTarget
			: stateOrIntentionId.intentionId
	const target =
		typeof targetSeconds === 'number'
			? targetSeconds
			: stateOrIntentionId.targetSeconds

	return {
		...stateOrIntentionId,
		status: 'running',
		intentionId,
		elapsedSeconds: 0,
		targetSeconds: Math.max(0, target),
	}
}

/**
 * Pure transition to pause a running focus session.
 */
export function pauseSession (state: FocusSessionState): FocusSessionState {
	if (state.status !== 'running') {
		return state
	}

	return {
		...state,
		status: 'paused',
	}
}

/**
 * Pure transition to resume a paused focus session.
 */
export function resumeSession (state: FocusSessionState): FocusSessionState {
	if (state.status !== 'paused') {
		return state
	}

	return {
		...state,
		status: 'running',
	}
}

/**
 * Pure transition to advance elapsed time in a running session.
 */
export function tickSession (
	state: FocusSessionState,
	deltaSeconds: number = 1,
): FocusSessionState {
	if (state.status !== 'running') {
		return state
	}

	return {
		...state,
		elapsedSeconds: Math.max(0, state.elapsedSeconds + deltaSeconds),
	}
}

/**
 * Pure transition to complete a focus session without creating new obligations.
 */
export function completeSession (
	state: FocusSessionState,
	elapsedSeconds?: number,
): FocusSessionState {
	const finalElapsed =
		elapsedSeconds ??
		(state.targetSeconds > 0 && state.elapsedSeconds === 0
			? state.targetSeconds
			: state.elapsedSeconds)

	return {
		...state,
		status: 'completed',
		elapsedSeconds: finalElapsed,
	}
}

/**
 * Pure transition to cancel or reset a focus session.
 */
export function cancelSession (state?: FocusSessionState): FocusSessionState {
	return {
		status: 'idle',
		intentionId: '',
		elapsedSeconds: 0,
		targetSeconds: state?.targetSeconds ?? 0,
	}
}

/**
 * Formats a duration in seconds into MM:SS or H:MM:SS format.
 */
export function formatFocusTimer (seconds: number): string {
	const safeSeconds = Math.max(0, Math.floor(seconds))
	if (safeSeconds >= 3600) {
		const hours = Math.floor(safeSeconds / 3600)
		const minutes = Math.floor((safeSeconds % 3600) / 60)
		const secs = safeSeconds % 60
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

	const minutes = Math.floor(safeSeconds / 60)
	const secs = safeSeconds % 60
	return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Computes remaining seconds before target duration is reached.
 */
export function getRemainingSeconds (state: FocusSessionState): number {
	return Math.max(0, state.targetSeconds - state.elapsedSeconds)
}

/**
 * Computes progress percentage (0 to 100).
 */
export function getProgressPercentage (state: FocusSessionState): number {
	if (state.targetSeconds <= 0) {
		return 0
	}

	return Math.min(
		100,
		Math.max(0, Math.round((state.elapsedSeconds / state.targetSeconds) * 100)),
	)
}
