import React, { useCallback, useEffect } from 'react'

import {
	formatFocusTimer,
	getProgressPercentage,
	getRemainingSeconds,
} from '../../domain/focus/session'
import type { FocusSessionState } from '../../domain/focus/types'
import type { FlexibleIntention } from '../../domain/planning/types'
import styles from './FocusSession.module.css'

export interface FocusSessionProps {
	session: FocusSessionState
	intention?: FlexibleIntention
	reason?: string
	onPause?: () => void
	onResume?: () => void
	onComplete?: () => void
	onCancel?: () => void
	onTick?: (deltaSeconds: number) => void
	className?: string
}

export function FocusSession ({
	session,
	intention,
	reason,
	onPause,
	onResume,
	onComplete,
	onCancel,
	onTick,
	className,
}: FocusSessionProps): React.JSX.Element {
	const isRunning = session.status === 'running'
	const isPaused = session.status === 'paused'

	useEffect(() => {
		if (!isRunning) {
			return
		}

		const intervalId = setInterval(() => {
			if (onTick) {
				onTick(1)
			}
		}, 1000)

		return () => {
			clearInterval(intervalId)
		}
	}, [isRunning, onTick])

	const handlePause = useCallback(() => {
		if (onPause) {
			onPause()
		}
	}, [onPause])

	const handleResume = useCallback(() => {
		if (onResume) {
			onResume()
		}
	}, [onResume])

	const handleComplete = useCallback(() => {
		if (onComplete) {
			onComplete()
		}
	}, [onComplete])

	const handleCancel = useCallback(() => {
		if (onCancel) {
			onCancel()
		}
	}, [onCancel])

	const remainingSeconds = getRemainingSeconds(session)
	const progressPercent = getProgressPercentage(session)
	const formattedElapsed = formatFocusTimer(session.elapsedSeconds)
	const formattedRemaining = formatFocusTimer(remainingSeconds)
	const formattedTarget = formatFocusTimer(session.targetSeconds)

	const title = intention?.title ?? 'Focus Intention'
	const compactReason =
		reason ??
		'Dedicated focus time protected for your current priority.'

	const panelClassName = className
		? `${styles.panel} ${className}`
		: styles.panel

	return (
		<section
			className={panelClassName}
			aria-label='Active focus session'
			role='region'
		>
			<div className={styles.header}>
				<span className={styles.kicker}>Focus Session</span>
				<div
					className={`${styles.statusBadge} ${isPaused ? styles.statusBadgePaused : ''}`}
				>
					<span
						className={`${styles.pulseDot} ${isPaused ? styles.pulseDotPaused : ''}`}
						aria-hidden='true'
					/>
					<span>{isPaused ? 'Paused' : 'In progress'}</span>
				</div>
			</div>

			<div className={styles.titleGroup}>
				<h2 className={styles.title}>{title}</h2>
				<p className={styles.reason}>{compactReason}</p>
			</div>

			<div className={styles.timerSection}>
				<div className={styles.timerReadouts}>
					<div className={styles.mainTimer}>
						<span
							className={styles.timerDigits}
							aria-label={`Time remaining: ${formattedRemaining}`}
						>
							{formattedRemaining}
						</span>
						<span className={styles.timerLabel}>remaining</span>
					</div>

					<div className={styles.subReadout}>
						<span>Elapsed: {formattedElapsed}</span>
						<span>·</span>
						<span>Target: {formattedTarget}</span>
					</div>
				</div>

				<div
					className={styles.progressTrack}
					role='progressbar'
					aria-valuenow={progressPercent}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label='Session progress'
				>
					<div
						className={`${styles.progressBar} ${isPaused ? styles.progressBarPaused : ''}`}
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
			</div>

			<div className={styles.actionsRow}>
				{isRunning ? (
					<button
						type='button'
						className={styles.secondaryButton}
						onClick={handlePause}
						aria-label='Pause session'
					>
						Pause
					</button>
				) : (
					<button
						type='button'
						className={styles.primaryButton}
						onClick={handleResume}
						aria-label='Resume session'
					>
						Resume
					</button>
				)}

				<button
					type='button'
					className={styles.primaryButton}
					onClick={handleComplete}
					aria-label='Complete session'
				>
					Complete session
				</button>

				<button
					type='button'
					className={styles.dangerButton}
					onClick={handleCancel}
					aria-label='Cancel session'
				>
					Cancel session
				</button>
			</div>
		</section>
	)
}
