import React from 'react'

import styles from './AllocationLegend.module.css'

export interface AllocationLegendProps {
	className?: string
	showPinned?: boolean
}

export function AllocationLegend ({
	className,
	showPinned = false,
}: AllocationLegendProps): React.JSX.Element {
	const containerClass = className
		? `${styles.legend} ${className}`
		: styles.legend

	return (
		<section
			className={containerClass}
			aria-label='Allocation legend'
			role='region'
		>
			<ul className={styles.list}>
				<li className={styles.item}>
					<span
						className={`${styles.dot} ${styles.dotProtected}`}
						aria-hidden='true'
					/>
					<span className={styles.label}>Protected</span>
					<span className={styles.subtext}>(anchors & family)</span>
				</li>
				<li className={styles.item}>
					<span
						className={`${styles.dot} ${styles.dotSuggested}`}
						aria-hidden='true'
					/>
					<span className={styles.label}>Suggested</span>
					<span className={styles.subtext}>(flexible focus)</span>
				</li>
				{showPinned && (
					<li className={styles.item}>
						<span
							className={`${styles.dot} ${styles.dotPinned}`}
							aria-hidden='true'
						/>
						<span className={styles.label}>Pinned</span>
						<span className={styles.subtext}>(exact time)</span>
					</li>
				)}
				<li className={styles.item}>
					<span
						className={`${styles.dot} ${styles.dotOpen}`}
						aria-hidden='true'
					/>
					<span className={styles.label}>Open capacity</span>
					<span className={styles.subtext}>(breathing room)</span>
				</li>
			</ul>
		</section>
	)
}
