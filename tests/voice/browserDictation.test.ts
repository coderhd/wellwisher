import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserDictationAdapter } from '../../src/voice/browserDictation'

interface MockSpeechRecognitionInstance {
	continuous: boolean
	interimResults: boolean
	lang: string
	onresult: ((event: unknown) => void) | null
	onerror: ((event: unknown) => void) | null
	onend: (() => void) | null
	start: ReturnType<typeof vi.fn>
	stop: ReturnType<typeof vi.fn>
	abort: ReturnType<typeof vi.fn>
}

describe('BrowserDictationAdapter', () => {
	const originalSpeechRecognition = (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition
	const originalWebkitSpeechRecognition = (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition

	let mockInstance: MockSpeechRecognitionInstance | null = null

	beforeEach(() => {
		mockInstance = {
			continuous: false,
			interimResults: false,
			lang: '',
			onresult: null,
			onerror: null,
			onend: null,
			start: vi.fn(),
			stop: vi.fn(),
			abort: vi.fn(),
		}

		const MockRecognitionConstructor = vi.fn(function () {
			return mockInstance
		})

		;(window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = MockRecognitionConstructor
		;(window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = undefined
	})

	afterEach(() => {
		;(window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = originalSpeechRecognition
		;(window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = originalWebkitSpeechRecognition
		vi.restoreAllMocks()
	})

	it('reports supported when SpeechRecognition or webkitSpeechRecognition exists', () => {
		const adapter = new BrowserDictationAdapter()
		expect(adapter.isSupported()).toBe(true)
	})

	it('reports unsupported when neither SpeechRecognition nor webkitSpeechRecognition exists', () => {
		;(window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = undefined
		;(window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = undefined

		const adapter = new BrowserDictationAdapter()
		expect(adapter.isSupported()).toBe(false)
	})

	it('initializes speech recognition with continuous and interim results on start', async () => {
		const adapter = new BrowserDictationAdapter()
		const onPartial = vi.fn()
		const onFinal = vi.fn()

		await adapter.start(onPartial, onFinal)

		expect(mockInstance).not.toBeNull()
		expect(mockInstance?.continuous).toBe(true)
		expect(mockInstance?.interimResults).toBe(true)
		expect(mockInstance?.start).toHaveBeenCalledTimes(1)
	})

	it('dispatches partial and final transcript callbacks from recognition results', async () => {
		const adapter = new BrowserDictationAdapter()
		const onPartial = vi.fn()
		const onFinal = vi.fn()

		await adapter.start(onPartial, onFinal)

		// Simulate interim speech event
		const interimEvent = {
			resultIndex: 0,
			results: [
				[
					{
						transcript: 'Protect family time',
					},
				],
			],
		}
		Object.assign(interimEvent.results[0], { isFinal: false })

		mockInstance?.onresult?.(interimEvent)
		expect(onPartial).toHaveBeenCalledWith('Protect family time')
		expect(onFinal).not.toHaveBeenCalled()

		// Simulate final speech event
		const finalEvent = {
			resultIndex: 0,
			results: [
				[
					{
						transcript: 'Protect family time Saturday afternoon',
					},
				],
			],
		}
		Object.assign(finalEvent.results[0], { isFinal: true })

		mockInstance?.onresult?.(finalEvent)
		expect(onFinal).toHaveBeenCalledWith(
			'Protect family time Saturday afternoon',
		)
	})

	it('stops active recognition cleanly when stop is called', async () => {
		const adapter = new BrowserDictationAdapter()
		const onPartial = vi.fn()
		const onFinal = vi.fn()

		await adapter.start(onPartial, onFinal)
		await adapter.stop()

		expect(mockInstance?.stop).toHaveBeenCalledTimes(1)
	})

	it('handles recognition errors gracefully without unhandled exceptions', async () => {
		const adapter = new BrowserDictationAdapter()
		const onPartial = vi.fn()
		const onFinal = vi.fn()

		await adapter.start(onPartial, onFinal)

		expect(() => {
			mockInstance?.onerror?.({ error: 'not-allowed' })
		}).not.toThrow()
	})

	it('resolves safely on start and stop when recognition is unsupported', async () => {
		;(window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = undefined
		;(window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = undefined

		const adapter = new BrowserDictationAdapter()
		const onPartial = vi.fn()
		const onFinal = vi.fn()

		await expect(adapter.start(onPartial, onFinal)).resolves.toBeUndefined()
		await expect(adapter.stop()).resolves.toBeUndefined()
	})
})
