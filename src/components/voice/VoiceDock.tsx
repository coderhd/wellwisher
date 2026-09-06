'use client'

import React, {
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react'
import { useWellwisher } from '../../state/WellwisherProvider'
import { BrowserDictationAdapter } from '../../voice/browserDictation'
import {
	getCompanionPerspective,
	MockCompanionVoice,
} from '../../voice/mockVoice'
import type {
	CompanionSurface,
	CompanionVoice,
	DictationAdapter,
} from '../../voice/types'
import { InlineComposer } from './InlineComposer'
import styles from './VoiceDock.module.css'

export interface VoiceDockProps {
	dictationAdapter?: DictationAdapter
	companionVoice?: CompanionVoice
	activeSurface?: CompanionSurface
	onCommandSubmit?: (text: string) => void
}

export function VoiceDock ({
	dictationAdapter: customDictationAdapter,
	companionVoice: customCompanionVoice,
	activeSurface = 'today',
	onCommandSubmit,
}: VoiceDockProps): React.JSX.Element {
	const { state, dispatch } = useWellwisher()

	const defaultDictationAdapter = useMemo(
		() => new BrowserDictationAdapter(),
		[],
	)
	const defaultCompanionVoice = useMemo(() => new MockCompanionVoice(), [])

	const dictation = customDictationAdapter ?? defaultDictationAdapter
	const companion = customCompanionVoice ?? defaultCompanionVoice

	const isSupported = dictation.isSupported()
	const isMuted = state.voicePreferences.muted

	const [isComposerOpen, setIsComposerOpen] = useState(false)
	const [isListening, setIsListening] = useState(false)
	const [partialText, setPartialText] = useState('')
	const [isSpeaking, setIsSpeaking] = useState(false)

	// Keep companion voice mute in sync with context preference
	useEffect(() => {
		if (isMuted) {
			companion.mute()
		} else {
			companion.unmute()
		}
	}, [companion, isMuted])

	const handleStartDictation = useCallback(async () => {
		setIsComposerOpen(true)
		if (!isSupported) {
			setIsListening(false)
			return
		}

		setIsListening(true)
		await dictation.start(
			(partial: string) => {
				setPartialText(partial)
			},
			(final: string) => {
				setPartialText(final)
				setIsListening(false)
			},
		)
	}, [dictation, isSupported])

	const handleStopListening = useCallback(async () => {
		setIsListening(false)
		await dictation.stop()
	}, [dictation])

	const handleCancelComposer = useCallback(async () => {
		if (isListening) {
			await dictation.stop()
			setIsListening(false)
		}
		setIsComposerOpen(false)
		setPartialText('')
	}, [dictation, isListening])

	const handleSubmitCommand = useCallback(
		async (commandText: string) => {
			if (isListening) {
				await dictation.stop()
				setIsListening(false)
			}

			setIsComposerOpen(false)
			setPartialText('')

			if (onCommandSubmit) {
				onCommandSubmit(commandText)
				return
			}

			// Default natural command processing into domain actions
			const lower = commandText.toLowerCase()
			if (
				lower.includes('protect') ||
				lower.includes('unavailable') ||
				lower.includes('family') ||
				lower.includes('doctor')
			) {
				dispatch({
					type: 'ADD_ANCHOR',
					payload: {
						id: `custom-anchor-${Date.now()}`,
						title: commandText,
						startTime: '14:00',
						endTime: '18:00',
						repeat: {
							type: 'selected-days',
							days: [6], // default Saturday if mentioned
						},
						protected: true,
					},
				})
			} else {
				dispatch({
					type: 'ADD_INTENTION',
					payload: {
						id: `custom-intention-${Date.now()}`,
						title: commandText,
						kind: 'work',
						durationMinutes: 60,
						priority: 3,
					},
				})
			}

			const feedback = getCompanionPerspective('plan-change', {
				changeDescription: commandText,
			})
			await companion.speak(feedback)
		},
		[companion, dictation, dispatch, isListening, onCommandSubmit],
	)

	const handleToggleMute = useCallback(() => {
		const nextMuted = !isMuted
		dispatch({
			type: 'SET_VOICE_PREFERENCE',
			payload: { muted: nextMuted },
		})
		if (nextMuted) {
			companion.mute()
			setIsSpeaking(false)
		} else {
			companion.unmute()
		}
	}, [companion, dispatch, isMuted])

	const handleReplayOrientation = useCallback(async () => {
		const message = getCompanionPerspective(activeSurface)
		if (!companion.lastSpokenMessage) {
			await companion.speak(message)
		}
		setIsSpeaking(true)
		await companion.replay()
	}, [activeSurface, companion])

	const handlePauseAudio = useCallback(() => {
		companion.pause()
		setIsSpeaking(false)
	}, [companion])

	return (
		<div
			className={styles.dockWrapper}
			role='region'
			aria-label='Companion voice and dictation'
		>
			{isComposerOpen ? (
				<div className={styles.composerContainer}>
					<InlineComposer
						initialText={partialText}
						partialText={partialText}
						isListening={isListening}
						isUnsupported={!isSupported}
						statusMessage={
							!isSupported
								? 'Speech recognition unavailable — type your instruction below'
								: undefined
						}
						onStartListening={handleStartDictation}
						onStopListening={handleStopListening}
						onSubmit={handleSubmitCommand}
						onCancel={handleCancelComposer}
					/>
				</div>
			) : (
				<div className={styles.dockContainer}>
					<button
						type='button'
						className={styles.dictateBtn}
						onClick={handleStartDictation}
						aria-label={
							isSupported ? 'Start dictation' : 'Type command'
						}
					>
						<svg
							className={styles.dictateIcon}
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
							aria-hidden='true'
						>
							<path d='M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z' />
							<path d='M19 10v2a7 7 0 0 1-14 0v-2' />
							<line x1='12' x2='12' y1='19' y2='22' />
						</svg>
						<span>{isSupported ? 'Dictate' : 'Command'}</span>
					</button>

					<div
						className={styles.companionControls}
						aria-label='Companion audio controls'
					>
						<button
							type='button'
							className={`${styles.controlBtn} ${
								isMuted ? styles.controlBtnMuted : ''
							}`}
							onClick={handleToggleMute}
							aria-label={
								isMuted ? 'Unmute companion audio' : 'Mute companion audio'
							}
						>
							{isMuted ? 'Unmute' : 'Mute'}
						</button>

						{isSpeaking ? (
							<button
								type='button'
								className={`${styles.controlBtn} ${styles.controlBtnActive}`}
								onClick={handlePauseAudio}
								aria-label='Pause companion audio'
							>
								Pause
							</button>
						) : (
							<button
								type='button'
								className={styles.controlBtn}
								onClick={handleReplayOrientation}
								aria-label='Replay orientation'
							>
								Replay
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
