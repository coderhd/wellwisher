import type {
	CompanionSurface,
	CompanionVoice,
	DictationAdapter,
} from './types'

export interface MockDictationOptions {
	supported?: boolean
	defaultPartial?: string
	defaultFinal?: string
}

export class MockDictationAdapter implements DictationAdapter {
	public isListening = false
	public supported = true
	private onPartialCallback: ((text: string) => void) | null = null
	private onFinalCallback: ((text: string) => void) | null = null
	private defaultPartial?: string
	private defaultFinal?: string

	constructor (options?: MockDictationOptions) {
		if (options?.supported !== undefined) {
			this.supported = options.supported
		}
		this.defaultPartial = options?.defaultPartial
		this.defaultFinal = options?.defaultFinal
	}

	public isSupported (): boolean {
		return this.supported
	}

	public setSupported (supported: boolean): void {
		this.supported = supported
	}

	public async start (
		onPartial: (text: string) => void,
		onFinal: (text: string) => void,
	): Promise<void> {
		if (!this.supported) {
			return
		}
		this.isListening = true
		this.onPartialCallback = onPartial
		this.onFinalCallback = onFinal

		if (this.defaultPartial) {
			onPartial(this.defaultPartial)
		}
	}

	public async stop (): Promise<void> {
		if (!this.isListening) {
			return
		}
		this.isListening = false
		if (this.defaultFinal && this.onFinalCallback) {
			this.onFinalCallback(this.defaultFinal)
		}
	}

	public emitPartial (text: string): void {
		if (this.isListening && this.onPartialCallback) {
			this.onPartialCallback(text)
		}
	}

	public emitFinal (text: string): void {
		if (this.onFinalCallback) {
			this.onFinalCallback(text)
		}
		this.isListening = false
	}
}

export class MockCompanionVoice implements CompanionVoice {
	public isSpeaking = false
	public isPaused = false
	public isMuted = false
	public lastSpokenMessage: string | null = null
	public speechHistory: string[] = []

	public async speak (message: string): Promise<void> {
		this.lastSpokenMessage = message
		this.speechHistory.push(message)
		if (!this.isMuted) {
			this.isSpeaking = true
			this.isPaused = false
		}
	}

	public pause (): void {
		this.isSpeaking = false
		this.isPaused = true
	}

	public async replay (): Promise<void> {
		const message =
			this.lastSpokenMessage ?? getCompanionPerspective('today')
		await this.speak(message)
	}

	public mute (): void {
		this.isMuted = true
		this.isSpeaking = false
	}

	public unmute (): void {
		this.isMuted = false
	}

	public setIsSpeaking (isSpeaking: boolean): void {
		this.isSpeaking = isSpeaking
		if (isSpeaking) {
			this.isPaused = false
		}
	}
}

export function getCompanionPerspective (
	surface: CompanionSurface,
	details?: { date?: string; changeDescription?: string },
): string {
	switch (surface) {
		case 'today':
			return 'Morning, Harsh. I\'d like you to start with AI today. It\'s the one with a clock; Lekhan can follow without losing momentum.'

		case 'week':
			return 'Hey Harsh, here\'s your week ahead. Saturday belongs to family, so I\'ve kept the certificate moving earlier. You have room on Thursday—let\'s not fill it yet.'

		case 'plan':
			return 'Here is your planning board. We\'ve protected your recurring anchors; arrange your flexible work into the open windows.'

		case 'day':
			return details?.date
				? `Here is your shape for ${details.date}. Fixed commitments are protected and flexible work sits in open capacity.`
				: 'Here\'s the detail for this day. Fixed commitments are protected, and flexible suggestions are placed in open capacity.'

		case 'plan-change':
			return details?.changeDescription
				? `Okay, I updated your plan: ${details.changeDescription}. Family time remains untouched.`
				: 'Okay, I updated your plan and kept family time untouched. That preserves your commitments while absorbing the change.'

		default:
			return 'Welcome to Wellwisher. Your calm cockpit is ready.'
	}
}
