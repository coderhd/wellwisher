'use client'

import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import React from 'react'

import { AllocationLegend } from '../../../components/planning/AllocationLegend'
import { CapacityPanel } from '../../../components/planning/CapacityPanel'
import { DayLanes } from '../../../components/planning/DayLanes'
import { useWellwisher } from '../../../state/WellwisherProvider'
import styles from './DaySurface.module.css'

export interface DaySurfaceProps {
	date: string
}

export function DaySurface ({ date }: DaySurfaceProps): React.JSX.Element {
	const { getDayPlan } = useWellwisher()
	const dayPlan = getDayPlan(date)

	const dateObj = parseISO(date)
	const formattedDate = format(dateObj, 'EEEE, MMMM d, yyyy')

	return (
		<div
			className={styles.surface}
			data-testid='day-surface'
		>
			<nav
				className={styles.navRow}
				aria-label='Day navigation'
			>
				<Link
					href='/today'
					className={styles.backLink}
				>
					&larr; Back to Today
				</Link>
				<Link
					href='/week'
					className={styles.backLink}
				>
					&larr; Week Overview
				</Link>
			</nav>

			<header className={styles.header}>
				<p className={styles.kicker}>Day Detail</p>
				<h1 className={styles.title}>{formattedDate}</h1>
				<p className={styles.subtitle}>
					Anchored rhythm commitments and flexible allocations
				</p>
			</header>

			<div className={styles.contentGrid}>
				<CapacityPanel
					date={date}
					title='Day capacity'
				/>
				<DayLanes
					dayPlan={dayPlan}
					showOpenWindows={true}
				/>
			</div>

			<div className={styles.legendFooter}>
				<AllocationLegend />
			</div>
		</div>
	)
}
