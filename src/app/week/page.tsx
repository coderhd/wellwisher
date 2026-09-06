import React from 'react'
import { AppShell } from '../../components/shell/AppShell'

export default function WeekPage (): React.JSX.Element {
	return (
		<AppShell activeSurface='week'>
			<section data-testid='week-surface' aria-label='Week surface'>
				<h1>Week</h1>
				<p>Seven-day allocation view</p>
			</section>
		</AppShell>
	)
}
