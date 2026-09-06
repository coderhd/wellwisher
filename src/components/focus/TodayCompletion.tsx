import React, { useCallback } from 'react'

import type { FocusSessionState } from '../../domain/focus/types'
import type {
	FlexibleIntention,
	ProtectedCommitment,
} from '../../domain/planning/types'
import styles from './TodayCompletion.module.css'

export interface TodayCompletionProps {
	session?: FocusSessionState
	intention?: FlexibleIntention
	nextCommitment?: ProtectedCommitment
	onRestNow?: () => void
	onChooseAnother?: () => void
	className?: string
}

export function TodayCompletion ({
	session,
	intention,
	nextCommitment,
	onRestNow,
	onChooseAnother,
	className,
}: TodayCompletionProps): React.JSX.Element {
	const handleRestNow = useCallback(() => {
		if (onRestNow) {
			onRestNow()
		}
	}, [onRestNow])

	const handleChooseAnother = useCallback(() => {
		if (onChooseAnother) {
			onChooseAnother()
		}
	}, [onChooseAnother])

	const durationDisplay = intention?.durationMinutes
		? `${intention.durationMinutes} min`
		: session?.elapsedSeconds
			? `${Math.round(session.elapsedSeconds / 60)} min`
			: 'Session'

	const intentionTitle = intention?.title ?? 'Primary Intention'

	const cardClassName = className
		? `${styles.card} ${className}`
		: styles.card

	return (
		<section
			className={cardClassName}
			aria-label="Today's completion"
			role='region'
		>
			<div className={styles.header}>
				<span className={styles.kicker}>Today&apos;s Completion</span>
				<div className={styles.completedBadge}>
					<span aria-hidden='true'>✓</span>
					<span>Complete</span>
				</div>
			</div>

			<div className={styles.affirmationGroup}>
				<h2 className={styles.affirmationTitle}>
					You&apos;ve completed your focus intention for today.
				</h2>
				<p className={styles.affirmationBody}>
					The core work you set out to protect is finished. The rest of the day
					is open for breathing room and scheduled rhythms.
				</p>
			</div>

			{/* Evidence of completed work */}
			<div className={styles.evidenceBox}>
				<div className={styles.evidenceLeft}>
					<span className={styles.evidenceLabel}>Honored Focus</span>
					<h3 className={styles.evidenceTitle}>{intentionTitle}</h3>
				</div>
				<span className={styles.evidenceDuration}>
					{durationDisplay} focused
				</span>
			</div>

			{/* Next protected rhythm */}
			{nextCommitment && (
				<div className={styles.protectedAnchorSection}>
					<div className={styles.protectedAnchorHeader}>
						<span className={styles.protectedLabel}>Next Protected Anchor</span>
						<span className={styles.anchorTime}>
							{nextCommitment.startTime} - {nextCommitment.endTime}
						</span>
					</div>
					<h4 className={styles.anchorTitle}>{nextCommitment.title}</h4>
					<p className={styles.anchorNote}>
						This time is held safely for you on your schedule.
					</p>
				</div>
			)}

			<div className={styles.actionsSection}>
				<div className={styles.primaryActionRow}>
					<button
						type='button'
						className={styles.restButton}
						onClick={handleRestNow}
						aria-label='Rest now (recommended)'
					>
						<span>Rest now</span>
						<span className={styles.recommendedTag}>Recommended</span>
					</button>

					<button
						type='button'
						className={styles.chooseAnotherButton}
						onClick={handleChooseAnother}
						aria-label='Choose something else'
					>
						Choose something else
					</button>
				</div>

				<p className={styles.quietSummary}>
					No extra tasks have been added. Your day&apos;s core focus is complete.
				</p>
			</div>
		</section>
	)
}
