import React from 'react'
import { AppShell } from '../../components/shell/AppShell'

export default function TodayPage (): React.JSX.Element {
	return (
		<AppShell activeSurface='today'>
			<section data-testid='today-surface' aria-label='Today surface'>
				<h1>Today</h1>
				<p>Today briefing and recommendation</p>
			</section>
		</AppShell>
	)
}
