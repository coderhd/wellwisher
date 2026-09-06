'use client'

import React, {
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'
import styles from './InlineComposer.module.css'

export interface InlineComposerProps {
	initialText?: string
	isListening?: boolean
	partialText?: string
	isUnsupported?: boolean
	statusMessage?: string
	onStartListening?: () => void
	onStopListening?: () => void
	onSubmit: (text: string) => void
	onCancel: () => void
}

export function InlineComposer ({
	initialText = '',
	isListening = false,
	partialText = '',
	isUnsupported = false,
	statusMessage,
	onStartListening,
	onStopListening,
	onSubmit,
	onCancel,
}: InlineComposerProps): React.JSX.Element {
	const [text, setText] = useState(initialText)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	// Sync partial transcription into textbox when listening
	useEffect(() => {
		if (partialText && isListening) {
			setText(partialText)
		}
	}, [partialText, isListening])

	useEffect(() => {
		// Focus textarea on mount
		textareaRef.current?.focus()
	}, [])

	const handleTextChange = useCallback(
		(event: React.ChangeEvent<HTMLTextAreaElement>) => {
			setText(event.target.value)
		},
		[],
	)

	const handleToggleListening = useCallback(() => {
		if (isListening) {
			onStopListening?.()
		} else {
			onStartListening?.()
		}
	}, [isListening, onStartListening, onStopListening])

	const handleSubmit = useCallback(
		(event?: React.FormEvent) => {
			event?.preventDefault()
			const trimmed = text.trim()
			if (trimmed.length > 0) {
				onSubmit(trimmed)
			}
		},
		[onSubmit, text],
	)

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault()
				handleSubmit()
			} else if (event.key === 'Escape') {
				event.preventDefault()
				onCancel()
			}
		},
		[handleSubmit, onCancel],
	)

	const canSubmit = text.trim().length > 0

	return (
		<div
			className={styles.composer}
			role='region'
			aria-label='Dictation and command composer'
		>
			<div className={styles.headerRow}>
				<div className={styles.statusIndicator}>
					{isListening ? (
						<>
							<span className={styles.listeningDot} aria-hidden='true' />
							<span>Listening live…</span>
						</>
					) : isUnsupported ? (
						<span className={styles.statusNotice}>
							{statusMessage ??
								'Speech recognition unavailable — type your instruction below'}
						</span>
					) : (
						<span className={styles.statusNotice}>
							{statusMessage ?? 'Review and edit before sending'}
						</span>
					)}
				</div>

				{!isUnsupported && (
					<button
						type='button'
						className={`${styles.micToggleBtn} ${
							isListening ? styles.micToggleBtnActive : ''
						}`}
						onClick={handleToggleListening}
						aria-label={
							isListening ? 'Stop listening' : 'Start listening'
						}
					>
						{isListening ? 'Stop listening' : 'Tap to speak'}
					</button>
				)}
			</div>

			<div className={styles.inputArea}>
				<textarea
					ref={textareaRef}
					className={styles.textarea}
					value={text}
					onChange={handleTextChange}
					onKeyDown={handleKeyDown}
					placeholder='e.g., Protect family time Saturday afternoon or Move AI to Thursday'
					aria-label='Dictation text composer'
					rows={3}
				/>
			</div>

			<div className={styles.footerRow}>
				<button
					type='button'
					className={styles.cancelBtn}
					onClick={onCancel}
					aria-label='Cancel'
				>
					Cancel
				</button>
				<button
					type='button'
					className={styles.sendBtn}
					onClick={() => handleSubmit()}
					disabled={!canSubmit}
					aria-label='Send command'
				>
					Send
				</button>
			</div>
		</div>
	)
}
