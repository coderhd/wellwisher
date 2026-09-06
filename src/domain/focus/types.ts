/**
 * Focus session status lifecycle.
 */
export type FocusSessionStatus = 'idle' | 'running' | 'paused' | 'completed'

/**
 * State representing an active or completed focus session in Wellwisher.
 */
export interface FocusSessionState {
	status: FocusSessionStatus
	intentionId: string
	elapsedSeconds: number
	targetSeconds: number
	startedAt?: string
	completedAt?: string
}

/**
 * Focus session interval settings.
 */
export interface FocusInterval {
	workMinutes: number
	breakMinutes?: number
}
