'use client'

import { format, parseISO } from 'date-fns'
import React, { useCallback } from 'react'

import { AllocationLegend } from '../../components/planning/AllocationLegend'
import { CapacityPanel } from '../../components/planning/CapacityPanel'
import { DayLanes } from '../../components/planning/DayLanes'
import { WeekRibbon } from '../../components/planning/WeekRibbon'
import { useWellwisher } from '../../state/WellwisherProvider'
import styles from './TodaySurface.module.css'

export function TodaySurface (): React.JSX.Element {
	const {
		state,
		dispatch,
		getTodayPlan,
		getRecommendation,
	} = useWellwisher()

	const todayDate = state.weekStart
	const todayPlan = getTodayPlan(todayDate)
	const recommendation = getRecommendation(todayDate)
	const isMuted = state.voicePreferences.muted
	const isFocusActive =
		state.focusSession.status === 'running' &&
		state.focusSession.intentionId === recommendation?.intention.id

	const handleToggleVoice = useCallback(() => {
		dispatch({
			type: 'SET_VOICE_PREFERENCE',
			payload: { muted: !isMuted },
		})
	}, [dispatch, isMuted])

	const handleStartFocus = useCallback(() => {
		if (recommendation) {
			dispatch({
				type: 'START_FOCUS',
				payload: {
					intentionId: recommendation.intention.id,
					targetSeconds: recommendation.durationMinutes * 60,
				},
			})
		}
	}, [dispatch, recommendation])

	const dateObj = parseISO(todayDate)
	const formattedDate = format(dateObj, 'EEEE, MMMM d')

	return (
		<div className={styles.surface}>
			<header className={styles.header}>
				<div className={styles.headerLeft}>
					<p className={styles.kicker}>Today&apos;s Orientation</p>
					<h1 className={styles.title}>{formattedDate}</h1>
				</div>

				<div className={styles.companionVoice}>
					<button
						type='button'
						className={styles.voiceButton}
						onClick={handleToggleVoice}
						aria-label={isMuted ? 'Unmute companion audio' : 'Mute companion audio'}
					>
						<span
							className={`${styles.voiceIndicator} ${isMuted ? styles.voiceIndicatorMuted : ''}`}
							aria-hidden='true'
						/>
						<span>{isMuted ? 'Voice muted' : 'Voice active'}</span>
					</button>
				</div>
			</header>

			{/* Companion Perspective */}
			<section
				className={styles.perspectiveCard}
				aria-label='Companion perspective'
			>
				<p className={styles.perspectiveText}>
					&ldquo;Morning, Harsh. I&apos;d like you to start with AI today. It&apos;s the one with a clock; Lekhan can follow without losing momentum.&rdquo;
				</p>
			</section>

			{/* Recommendation Card */}
			{recommendation && (
				<section
					className={styles.recommendationCard}
					aria-label="Today's recommendation"
					role='region'
				>
					<div className={styles.recommendationHeader}>
						<span className={styles.recKicker}>Recommended Focus</span>
						<div className={styles.badgesGroup}>
							<span className={styles.badgePill}>
								{recommendation.suggestedWindow
									? `${recommendation.suggestedWindow.charAt(0).toUpperCase() + recommendation.suggestedWindow.slice(1)} window`
									: 'Flexible'}
							</span>
							<span className={styles.badgePill}>
								{recommendation.durationMinutes} min
							</span>
						</div>
					</div>

					<h2 className={styles.recommendationTitle}>
						{recommendation.intention.title}
					</h2>

					<p className={styles.recommendationReason}>
						{recommendation.reason}
					</p>

					<div className={styles.actionsRow}>
						<button
							type='button'
							className={`${styles.focusButton} ${isFocusActive ? styles.focusActiveButton : ''}`}
							onClick={handleStartFocus}
						>
							{isFocusActive
								? 'Focus in progress'
								: `Start focus · ${recommendation.durationMinutes} min`}
						</button>
					</div>
				</section>
			)}

			{/* Schedule & Capacity Details */}
			<div className={styles.scheduleSection}>
				<CapacityPanel
					date={todayDate}
					title="Today's capacity"
				/>
				<DayLanes
					dayPlan={todayPlan}
					showOpenWindows={false}
				/>
			</div>

			{/* Compact Non-repetitive Week Ribbon */}
			<WeekRibbon activeDate={todayDate} />

			{/* Legend */}
			<div className={styles.legendFooter}>
				<AllocationLegend />
			</div>
		</div>
	)
}
