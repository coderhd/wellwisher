import React from 'react'

import type { DayPlan } from '../../domain/planning/types'
import { useWellwisher } from '../../state/WellwisherProvider'
import { formatDurationHours } from './CapacityPanel'
import styles from './DayLanes.module.css'

export interface DayLanesProps {
	dayPlan: DayPlan
	className?: string
	showOpenWindows?: boolean
}

export function DayLanes ({
	dayPlan,
	className,
	showOpenWindows = true,
}: DayLanesProps): React.JSX.Element {
	const { state, getCapacity } = useWellwisher()
	const capacity = getCapacity(dayPlan.date)

	const containerClass = className
		? `${styles.lanesContainer} ${className}`
		: styles.lanesContainer

	return (
		<section
			className={containerClass}
			aria-label='Day schedule'
			role='region'
		>
			<h3 className={styles.sectionTitle}>Day Schedule</h3>

			<ul className={styles.itemsList}>
				{/* 1. Protected Commitments */}
				{dayPlan.protectedCommitments.map((commitment) => (
					<li
						key={commitment.id}
						className={`${styles.laneItem} ${styles.itemProtected}`}
					>
						<div className={styles.itemLeft}>
							<span className={styles.itemTitle}>{commitment.title}</span>
							<span className={styles.itemTiming}>
								{commitment.startTime} - {commitment.endTime} ({formatDurationHours(commitment.durationMinutes)})
							</span>
						</div>
						<div className={styles.itemRight}>
							<span className={styles.badge}>Protected</span>
						</div>
					</li>
				))}

				{/* 2. Suggested & Pinned Allocations */}
				{dayPlan.allocations.map((allocation) => {
					const intention = state.intentions.find(
						(i) => i.id === allocation.intentionId,
					)
					const title = intention?.title ?? 'Flexible intention'
					const kind = intention?.kind ?? 'work'
					const isPinned = allocation.mode === 'pinned'

					const windowLabel = allocation.window
						? allocation.window.charAt(0).toUpperCase() + allocation.window.slice(1)
						: intention?.preferredWindow
							? intention.preferredWindow.charAt(0).toUpperCase() + intention.preferredWindow.slice(1)
							: 'Flexible'

					return (
						<li
							key={allocation.id}
							className={`${styles.laneItem} ${isPinned ? styles.itemPinned : styles.itemSuggested}`}
						>
							<div className={styles.itemLeft}>
								<span className={styles.itemTitle}>
									{title}
									<span className={styles.kindBadge}>{kind}</span>
								</span>
								<span className={styles.itemTiming}>
									{isPinned && allocation.start
										? `${allocation.start}${allocation.end ? ` - ${allocation.end}` : ''} · Pinned`
										: `${windowLabel} window · ${formatDurationHours(allocation.durationMinutes)}`}
								</span>
							</div>
							<div className={styles.itemRight}>
								<span className={styles.badge}>
									{isPinned ? 'Pinned' : 'Suggested'}
								</span>
							</div>
						</li>
					)
				})}

				{/* 3. Open Breathing Windows */}
				{showOpenWindows &&
					capacity.openWindows &&
					capacity.openWindows.map((win) => (
						<li
							key={`open-${win.start}-${win.end}`}
							className={`${styles.laneItem} ${styles.itemOpen}`}
						>
							<div className={styles.itemLeft}>
								<span className={styles.itemTitle}>Open breathing space</span>
								<span className={styles.itemTiming}>
									{win.start} - {win.end} ({formatDurationHours(win.durationMinutes)})
								</span>
							</div>
							<div className={styles.itemRight}>
								<span className={styles.badge}>Open space</span>
							</div>
						</li>
					))}
			</ul>
		</section>
	)
}
