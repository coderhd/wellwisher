import React from 'react'

import { AppShell } from '../../components/shell/AppShell'
import { WeekSurface } from './WeekSurface'

export default function WeekPage (): React.JSX.Element {
	return (
		<AppShell activeSurface='week'>
			<WeekSurface />
		</AppShell>
	)
}
