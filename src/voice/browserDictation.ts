import type { DictationAdapter } from './types'

// Web Speech API interface definitions for browser compatibility
interface SpeechRecognitionResultItem {
	transcript: string
	confidence: number
}

interface SpeechRecognitionResultLike {
	isFinal: boolean
	length: number
	item (index: number): SpeechRecognitionResultItem
	[index: number]: SpeechRecognitionResultItem
}

interface SpeechRecognitionEventLike {
	resultIndex: number
	results: {
		length: number
		item (index: number): SpeechRecognitionResultLike
		[index: number]: SpeechRecognitionResultLike
	}
}

interface SpeechRecognitionErrorEventLike {
	error: string
	message?: string
}

interface SpeechRecognitionInstanceLike {
	continuous: boolean
	interimResults: boolean
	lang: string
	onresult: ((event: SpeechRecognitionEventLike) => void) | null
	onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
	onend: (() => void) | null
	start (): void
	stop (): void
	abort (): void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstanceLike

export class BrowserDictationAdapter implements DictationAdapter {
	private recognition: SpeechRecognitionInstanceLike | null = null
	private isListening = false

	public isSupported (): boolean {
		if (typeof window === 'undefined') {
			return false
		}

		const windowWithSpeech = window as unknown as {
			SpeechRecognition?: SpeechRecognitionConstructor
			webkitSpeechRecognition?: SpeechRecognitionConstructor
		}

		return Boolean(
			windowWithSpeech.SpeechRecognition ||
				windowWithSpeech.webkitSpeechRecognition,
		)
	}

	public async start (
		onPartial: (text: string) => void,
		onFinal: (text: string) => void,
	): Promise<void> {
		if (!this.isSupported()) {
			return
		}

		const windowWithSpeech = window as unknown as {
			SpeechRecognition?: SpeechRecognitionConstructor
			webkitSpeechRecognition?: SpeechRecognitionConstructor
		}

		const RecognitionConstructor =
			windowWithSpeech.SpeechRecognition ??
			windowWithSpeech.webkitSpeechRecognition

		if (!RecognitionConstructor) {
			return
		}

		try {
			this.recognition = new RecognitionConstructor()
			this.recognition.continuous = true
			this.recognition.interimResults = true
			this.recognition.lang = 'en-US'

			this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
				let interimTranscript = ''
				let finalTranscript = ''

				for (let i = event.resultIndex; i < event.results.length; i++) {
					const result = event.results[i]
					const transcriptText = result[0]?.transcript ?? ''

					if (result.isFinal) {
						finalTranscript += transcriptText
					} else {
						interimTranscript += transcriptText
					}
				}

				if (finalTranscript.trim().length > 0) {
					onFinal(finalTranscript.trim())
				} else if (interimTranscript.trim().length > 0) {
					onPartial(interimTranscript.trim())
				}
			}

			this.recognition.onerror = () => {
				this.isListening = false
			}

			this.recognition.onend = () => {
				this.isListening = false
			}

			this.recognition.start()
			this.isListening = true
		} catch {
			this.isListening = false
		}
	}

	public async stop (): Promise<void> {
		if (this.recognition && this.isListening) {
			try {
				this.recognition.stop()
			} catch {
				// Ignore if already stopped
			}
		}
		this.isListening = false
	}
}
