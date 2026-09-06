import React from 'react'
import styles from './AppShell.module.css'
import { HeaderNav } from './HeaderNav'

export interface AppShellProps {
	children: React.ReactNode
	activeSurface: 'today' | 'week' | 'plan'
}

export function AppShell ({
	children,
	activeSurface,
}: AppShellProps): React.JSX.Element {
	return (
		<div className={styles.shell}>
			<a href='#main-content' className={styles.skipLink}>
				Skip to content
			</a>
			<HeaderNav activeSurface={activeSurface} />
			<main id='main-content' className={styles.main} tabIndex={-1}>
				{children}
			</main>
		</div>
	)
}
