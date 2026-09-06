'use client'

import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import React from 'react'

import { AllocationLegend } from '../../components/planning/AllocationLegend'
import { formatDurationHours } from '../../components/planning/CapacityPanel'
import { useWellwisher } from '../../state/WellwisherProvider'
import styles from './WeekSurface.module.css'

export function WeekSurface (): React.JSX.Element {
	const { state, getWeekPlan, getWeekSummary, getCapacity } = useWellwisher()
	const weekPlan = getWeekPlan()
	const weekSummary = getWeekSummary()

	const startDate = parseISO(weekPlan.weekStart)
	const endDate = parseISO(weekPlan.days[weekPlan.days.length - 1]?.date ?? weekPlan.weekStart)
	const dateRangeLabel = `${format(startDate, 'MMMM d')} – ${format(endDate, 'MMMM d, yyyy')}`

	return (
		<div className={styles.surface}>
			<header className={styles.header}>
				<div className={styles.headerLeft}>
					<p className={styles.kicker}>Seven-Day Horizon</p>
					<h1 className={styles.title}>Week Ahead</h1>
					<p className={styles.dayDateLabel}>{dateRangeLabel}</p>
				</div>
			</header>

			{/* Week Summary Banner */}
			<section
				className={styles.summaryBanner}
				aria-label='Week allocation summary'
				role='region'
			>
				<div className={styles.summaryCard}>
					<span className={styles.summaryLabel}>Total Protected</span>
					<span className={`${styles.summaryValue} ${styles.protectedValue}`}>
						{formatDurationHours(weekSummary.totalProtectedMinutes)}
					</span>
				</div>
				<div className={styles.summaryCard}>
					<span className={styles.summaryLabel}>Total Suggested</span>
					<span className={`${styles.summaryValue} ${styles.suggestedValue}`}>
						{formatDurationHours(weekSummary.totalSuggestedMinutes)}
					</span>
				</div>
				<div className={styles.summaryCard}>
					<span className={styles.summaryLabel}>Total Open Capacity</span>
					<span className={`${styles.summaryValue} ${styles.openValue}`}>
						{formatDurationHours(weekSummary.totalOpenMinutes)}
					</span>
				</div>
			</section>

			{/* 7-Column Day Allocation Grid */}
			<div className={styles.columnsContainer}>
				{weekPlan.days.map((day) => {
					const dateObj = parseISO(day.date)
					const dayName = format(dateObj, 'EEEE')
					const dateShort = format(dateObj, 'MMM d')
					const capacity = getCapacity(day.date)

					return (
						<div
							key={day.date}
							className={styles.dayColumn}
							data-testid={`day-column-${day.date}`}
						>
							<Link
								href={`/day/${day.date}`}
								className={styles.columnHeader}
								aria-label={`View day detail for ${dayName}, ${dateShort}`}
							>
								<div className={styles.dayHeaderTop}>
									<span className={styles.dayTitle}>{dayName}</span>
									<span className={styles.dayDateLabel}>{dateShort}</span>
								</div>
								<span className={styles.dayCapacityPill}>
									{formatDurationHours(capacity.openMinutes)} open
								</span>
							</Link>

							<div className={styles.columnBody}>
								{/* Protected Commitments */}
								{day.protectedCommitments.map((commitment) => (
									<div
										key={commitment.id}
										className={`${styles.blockCard} ${styles.blockProtected}`}
									>
										<span className={styles.blockTitle}>
											{commitment.title}
										</span>
										<div className={styles.blockMeta}>
											<span>{commitment.startTime} - {commitment.endTime}</span>
											<span>Protected</span>
										</div>
									</div>
								))}

								{/* Suggested Flexible Allocations */}
								{day.allocations.map((allocation) => {
									const intention = state.intentions.find(
										(i) => i.id === allocation.intentionId,
									)
									const title = intention?.title ?? 'Flexible intention'
									const windowLabel = allocation.window
										? allocation.window.charAt(0).toUpperCase() + allocation.window.slice(1)
										: intention?.preferredWindow
											? intention.preferredWindow.charAt(0).toUpperCase() + intention.preferredWindow.slice(1)
											: 'Flexible'

									return (
										<div
											key={allocation.id}
											className={`${styles.blockCard} ${styles.blockSuggested}`}
										>
											<span className={styles.blockTitle}>{title}</span>
											<div className={styles.blockMeta}>
												<span>{windowLabel} · {formatDurationHours(allocation.durationMinutes)}</span>
												<span>Suggested</span>
											</div>
										</div>
									)
								})}

								{/* Open capacity breathing room */}
								<div className={styles.blockOpen}>
									<span>{formatDurationHours(capacity.openMinutes)} open capacity</span>
								</div>
							</div>
						</div>
					)
				})}
			</div>

			{/* Allocation Legend */}
			<div className={styles.legendFooter}>
				<AllocationLegend />
			</div>
		</div>
	)
}
