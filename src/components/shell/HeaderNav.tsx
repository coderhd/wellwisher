import Link from 'next/link'
import React from 'react'
import styles from './HeaderNav.module.css'
import { ProfileMenu } from './ProfileMenu'

export interface HeaderNavProps {
	activeSurface?: 'today' | 'week' | 'plan' | 'settings'
}

export function HeaderNav ({
	activeSurface,
}: HeaderNavProps): React.JSX.Element {
	return (
		<header className={styles.header} role='banner'>
			<div className={styles.inner}>
				<div className={styles.brandGroup}>
					<Link href='/today' className={styles.wordmark}>
						Wellwisher
					</Link>
					<div className={styles.metadata} aria-hidden='true'>
						<span className={styles.metadataDivider}>/</span>
						<span>Personal Cockpit</span>
					</div>
				</div>

				<nav className={styles.navGroup} aria-label='Main Navigation'>
					<Link
						href='/today'
						className={`${styles.navLink} ${
							activeSurface === 'today' ? styles.navLinkActive : ''
						}`}
						aria-current={activeSurface === 'today' ? 'page' : undefined}
					>
						Today
					</Link>
					<Link
						href='/week'
						className={`${styles.navLink} ${
							activeSurface === 'week' ? styles.navLinkActive : ''
						}`}
						aria-current={activeSurface === 'week' ? 'page' : undefined}
					>
						Week
					</Link>
					<Link
						href='/plan'
						className={`${styles.navLink} ${
							activeSurface === 'plan' ? styles.navLinkActive : ''
						}`}
						aria-current={activeSurface === 'plan' ? 'page' : undefined}
					>
						Plan
					</Link>
				</nav>

				<div className={styles.actionsGroup}>
					<ProfileMenu />
				</div>
			</div>
		</header>
	)
}
