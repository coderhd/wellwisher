export interface DictationAdapter {
	start (
		onPartial: (text: string) => void,
		onFinal: (text: string) => void,
	): Promise<void>
	stop (): Promise<void>
	isSupported (): boolean
}

export interface CompanionVoice {
	speak (message: string): Promise<void>
	pause (): void
	replay (): Promise<void>
	mute (): void
	unmute (): void
	lastSpokenMessage?: string | null
}

export type CompanionSurface =
	| 'today'
	| 'week'
	| 'plan'
	| 'day'
	| 'plan-change'
