import React from 'react'
import { VoiceDock } from '../voice/VoiceDock'
import styles from './AppShell.module.css'
import { HeaderNav } from './HeaderNav'

export interface AppShellProps {
	children: React.ReactNode
	activeSurface: 'today' | 'week' | 'plan'
	showVoiceDock?: boolean
}

export function AppShell ({
	children,
	activeSurface,
	showVoiceDock = true,
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
			{showVoiceDock && <VoiceDock activeSurface={activeSurface} />}
		</div>
	)
}

