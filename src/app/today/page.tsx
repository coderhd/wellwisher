import React from 'react'

import { AppShell } from '../../components/shell/AppShell'
import { TodaySurface } from './TodaySurface'

export default function TodayPage (): React.JSX.Element {
	return (
		<AppShell activeSurface='today'>
			<TodaySurface />
		</AppShell>
	)
}
