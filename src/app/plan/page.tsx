import React from 'react'

import { AppShell } from '../../components/shell/AppShell'
import { PlanSurface } from './PlanSurface'

export default function PlanPage (): React.JSX.Element {
	return (
		<AppShell activeSurface='plan'>
			<PlanSurface />
		</AppShell>
	)
}
