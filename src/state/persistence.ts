import { createDemoState } from '../data/demoScenario'
import type { WellwisherState } from './reducer'

export const STORAGE_KEY = 'wellwisher.state.v1'
export const STORAGE_VERSION = 1

export interface PersistedEnvelope {
	version: number
	savedAt: string
	state: WellwisherState
}

function resolveStorage (storage?: Storage): Storage | undefined {
	if (storage !== undefined) {
		return storage
	}
	if (typeof window !== 'undefined' && window.localStorage) {
		return window.localStorage
	}
	return undefined
}

function isValidState (value: unknown): value is WellwisherState {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	const candidate = value as Partial<WellwisherState>
	return (
		typeof candidate.weekStart === 'string' &&
		Array.isArray(candidate.anchors) &&
		Array.isArray(candidate.protectedCommitments) &&
		Array.isArray(candidate.intentions) &&
		Array.isArray(candidate.allocations) &&
		typeof candidate.focusSession === 'object' &&
		candidate.focusSession !== null &&
		typeof candidate.voicePreferences === 'object' &&
		candidate.voicePreferences !== null &&
		(candidate.scheduleBounds === undefined ||
			(typeof candidate.scheduleBounds === 'object' &&
				candidate.scheduleBounds !== null &&
				typeof candidate.scheduleBounds.availableStart === 'string' &&
				typeof candidate.scheduleBounds.availableEnd === 'string'))
	)
}

export function saveState (state: WellwisherState, storage?: Storage): void {
	try {
		const targetStorage = resolveStorage(storage)
		if (!targetStorage) {
			return
		}

		const envelope: PersistedEnvelope = {
			version: STORAGE_VERSION,
			savedAt: new Date().toISOString(),
			state,
		}

		targetStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
	} catch {
		// Suppress any storage exceptions (quota, privacy settings, etc.)
	}
}

export function loadState (storage?: Storage): WellwisherState | null {
	try {
		const targetStorage = resolveStorage(storage)
		if (!targetStorage) {
			return null
		}

		const raw = targetStorage.getItem(STORAGE_KEY)
		if (!raw) {
			return null
		}

		const parsed = JSON.parse(raw) as Partial<PersistedEnvelope>
		if (!parsed || parsed.version !== STORAGE_VERSION || !parsed.state) {
			return null
		}

		if (!isValidState(parsed.state)) {
			return null
		}

		return parsed.state
	} catch {
		return null
	}
}

export function clearState (storage?: Storage): void {
	try {
		const targetStorage = resolveStorage(storage)
		if (!targetStorage) {
			return
		}

		targetStorage.removeItem(STORAGE_KEY)
	} catch {
		// Suppress any storage exceptions
	}
}

export function loadStateOrFallback (storage?: Storage): WellwisherState {
	return loadState(storage) ?? createDemoState()
}
