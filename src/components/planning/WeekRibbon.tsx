import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import React from 'react'

import { useWellwisher } from '../../state/WellwisherProvider'
import { formatDurationHours } from './CapacityPanel'
import styles from './WeekRibbon.module.css'

export interface WeekRibbonProps {
	activeDate?: string
	className?: string
}

export function WeekRibbon ({
	activeDate,
	className,
}: WeekRibbonProps): React.JSX.Element {
	const { getWeekPlan, getCapacity } = useWellwisher()
	const weekPlan = getWeekPlan()
	const selectedDate = activeDate ?? weekPlan.weekStart

	const containerClass = className
		? `${styles.ribbonContainer} ${className}`
		: styles.ribbonContainer

	return (
		<section
			className={containerClass}
			aria-label='This week'
			role='region'
		>
			<div className={styles.header}>
				<h3 className={styles.title}>This week</h3>
				<Link
					href='/week'
					className={styles.fullWeekLink}
				>
					View full week &rarr;
				</Link>
			</div>

			<div className={styles.daysGrid}>
				{weekPlan.days.map((day) => {
					const dateObj = parseISO(day.date)
					const dayName = format(dateObj, 'EEE')
					const dayNumber = format(dateObj, 'd')
					const isCurrent = day.date === selectedDate
					const capacity = getCapacity(day.date)

					const protectedCount = day.protectedCommitments.length
					const suggestedCount = day.allocations.length

					return (
						<Link
							key={day.date}
							href={`/day/${day.date}`}
							className={`${styles.dayCard} ${isCurrent ? styles.dayCardActive : ''}`}
							aria-label={`${format(dateObj, 'EEEE, MMMM d')}: ${formatDurationHours(capacity.openMinutes)} open capacity`}
						>
							<span className={styles.dayName}>{dayName}</span>
							<span className={styles.dayNumber}>{dayNumber}</span>

							<div
								className={styles.dayPills}
								aria-hidden='true'
							>
								{protectedCount > 0 && (
									<span
										className={`${styles.pillDot} ${styles.pillProtected}`}
										title={`${protectedCount} protected`}
									/>
								)}
								{suggestedCount > 0 && (
									<span
										className={`${styles.pillDot} ${styles.pillSuggested}`}
										title={`${suggestedCount} suggested`}
									/>
								)}
							</div>

							<span className={styles.dayOpenHours}>
								{formatDurationHours(capacity.openMinutes)} open
							</span>
						</Link>
					)
				})}
			</div>
		</section>
	)
}
