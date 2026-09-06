import { beforeEach, describe, expect, test } from 'vitest'

import { createDemoState } from '../../src/data/demoScenario'
import {
	clearState,
	loadState,
	loadStateOrFallback,
	saveState,
	STORAGE_KEY,
} from '../../src/state/persistence'

describe('persistence', () => {
	let memoryStore: Record<string, string>

	const mockStorage: Storage = {
		getItem: (key: string) => memoryStore[key] ?? null,
		setItem: (key: string, value: string) => {
			memoryStore[key] = value
		},
		removeItem: (key: string) => {
			delete memoryStore[key]
		},
		clear: () => {
			memoryStore = {}
		},
		key: (index: number) => Object.keys(memoryStore)[index] ?? null,
		get length () {
			return Object.keys(memoryStore).length
		},
	}

	beforeEach(() => {
		memoryStore = {}
	})

	test('round-trips state through storage', () => {
		const originalState = createDemoState('2026-09-07')

		saveState(originalState, mockStorage)
		const loaded = loadState(mockStorage)

		expect(loaded).toEqual(originalState)
	})

	test('loadState returns null for uninitialized storage', () => {
		const loaded = loadState(mockStorage)
		expect(loaded).toBeNull()
	})

	test('loadStateOrFallback returns demo state when storage is empty', () => {
		const state = loadStateOrFallback(mockStorage)
		expect(state).toEqual(createDemoState())
	})

	test('loadState returns null for invalid version or corrupted JSON', () => {
		mockStorage.setItem(STORAGE_KEY, 'not-valid-json{')
		expect(loadState(mockStorage)).toBeNull()

		mockStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ version: 999, savedAt: '2026-09-07', state: {} }),
		)
		expect(loadState(mockStorage)).toBeNull()

		// Fallback should yield demo state
		expect(loadStateOrFallback(mockStorage)).toEqual(createDemoState())
	})

	test('loadState returns null for malformed state envelope', () => {
		mockStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				version: 1,
				savedAt: '2026-09-07',
				state: { weekStart: 123 }, // invalid weekStart type
			}),
		)
		expect(loadState(mockStorage)).toBeNull()
	})

	test('clearState removes saved data from storage', () => {
		const state = createDemoState('2026-09-07')
		saveState(state, mockStorage)
		expect(mockStorage.getItem(STORAGE_KEY)).not.toBeNull()

		clearState(mockStorage)
		expect(mockStorage.getItem(STORAGE_KEY)).toBeNull()
		expect(loadState(mockStorage)).toBeNull()
	})

	test('never throws when storage operations throw errors', () => {
		const throwingStorage: Storage = {
			getItem: () => {
				throw new Error('SecurityError: Access Denied')
			},
			setItem: () => {
				throw new Error('QuotaExceededError')
			},
			removeItem: () => {
				throw new Error('Storage disabled')
			},
			clear: () => {},
			key: () => null,
			length: 0,
		}

		const state = createDemoState('2026-09-07')

		expect(() => saveState(state, throwingStorage)).not.toThrow()
		expect(() => loadState(throwingStorage)).not.toThrow()
		expect(loadState(throwingStorage)).toBeNull()
		expect(() => clearState(throwingStorage)).not.toThrow()
		expect(() => loadStateOrFallback(throwingStorage)).not.toThrow()
		expect(loadStateOrFallback(throwingStorage)).toEqual(createDemoState())
	})
})
