import React from 'react'
import { AppShell } from '../../components/shell/AppShell'

export default function PlanPage (): React.JSX.Element {
	return (
		<AppShell activeSurface='plan'>
			<section data-testid='plan-surface' aria-label='Plan surface'>
				<h1>Plan</h1>
				<p>Allocation board and rhythm anchors</p>
			</section>
		</AppShell>
	)
}
