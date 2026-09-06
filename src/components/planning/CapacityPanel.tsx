import React from 'react'

import type { CapacitySummary } from '../../domain/planning/types'
import { useWellwisher } from '../../state/WellwisherProvider'
import styles from './CapacityPanel.module.css'

export interface CapacityPanelProps {
	capacity?: CapacitySummary
	date?: string
	title?: string
	className?: string
}

export function formatDurationHours (minutes: number): string {
	const hrs = Math.floor(minutes / 60)
	const mins = minutes % 60
	if (hrs === 0) {
		return `${mins}m`
	}
	if (mins === 0) {
		return `${hrs}h`
	}
	return `${hrs}h ${mins}m`
}

export function CapacityPanel ({
	capacity: directCapacity,
	date,
	title = 'Day capacity',
	className,
}: CapacityPanelProps): React.JSX.Element {
	const { getCapacity } = useWellwisher()
	const capacity = directCapacity ?? getCapacity(date)

	const totalTrackedMinutes =
		capacity.protectedMinutes +
		capacity.suggestedMinutes +
		capacity.openMinutes
	const baseMinutes = Math.max(totalTrackedMinutes, 24 * 60)

	const protectedPercent = (capacity.protectedMinutes / baseMinutes) * 100
	const suggestedPercent = (capacity.suggestedMinutes / baseMinutes) * 100
	const openPercent = (capacity.openMinutes / baseMinutes) * 100

	const containerClass = className
		? `${styles.panel} ${className}`
		: styles.panel

	return (
		<section
			className={containerClass}
			aria-label={title}
			role='region'
		>
			<div className={styles.header}>
				<h3 className={styles.title}>{title}</h3>
				<span className={styles.openValue}>
					{formatDurationHours(capacity.openMinutes)} open
				</span>
			</div>

			<div className={styles.metrics}>
				<div className={styles.metricCard}>
					<span className={styles.metricLabel}>Protected</span>
					<span className={`${styles.metricValue} ${styles.protectedValue}`}>
						{formatDurationHours(capacity.protectedMinutes)}
					</span>
				</div>
				<div className={styles.metricCard}>
					<span className={styles.metricLabel}>Suggested</span>
					<span className={`${styles.metricValue} ${styles.suggestedValue}`}>
						{formatDurationHours(capacity.suggestedMinutes)}
					</span>
				</div>
				<div className={styles.metricCard}>
					<span className={styles.metricLabel}>Open capacity</span>
					<span className={`${styles.metricValue} ${styles.openValue}`}>
						{formatDurationHours(capacity.openMinutes)}
					</span>
				</div>
			</div>

			<div
				className={styles.barTrack}
				aria-label='Capacity distribution'
				role='img'
			>
				<div
					className={`${styles.barSegment} ${styles.barProtected}`}
					style={{ width: `${protectedPercent}%` }}
					title={`Protected: ${formatDurationHours(capacity.protectedMinutes)}`}
				/>
				<div
					className={`${styles.barSegment} ${styles.barSuggested}`}
					style={{ width: `${suggestedPercent}%` }}
					title={`Suggested: ${formatDurationHours(capacity.suggestedMinutes)}`}
				/>
				<div
					className={`${styles.barSegment} ${styles.barOpen}`}
					style={{ width: `${openPercent}%` }}
					title={`Open: ${formatDurationHours(capacity.openMinutes)}`}
				/>
			</div>

			{capacity.openWindows && capacity.openWindows.length > 0 && (
				<div className={styles.openWindows}>
					<span>Breathing windows:</span>
					<ul className={styles.openWindowsList}>
						{capacity.openWindows.map((win) => (
							<li
								key={`${win.start}-${win.end}`}
								className={styles.openWindowTag}
							>
								{win.start} - {win.end} ({formatDurationHours(win.durationMinutes)})
							</li>
						))}
					</ul>
				</div>
			)}
		</section>
	)
}
