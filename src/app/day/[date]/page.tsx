import React from 'react'

import { AppShell } from '../../../components/shell/AppShell'
import { DaySurface } from './DaySurface'

export interface DayPageProps {
	params: Promise<{
		date: string
	}>
}

export default async function DayPage ({
	params,
}: DayPageProps): Promise<React.JSX.Element> {
	const { date } = await params

	return (
		<AppShell activeSurface='today'>
			<DaySurface date={date} />
		</AppShell>
	)
}
