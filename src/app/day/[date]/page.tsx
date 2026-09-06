import { addDays, format, parseISO } from 'date-fns'
import React from 'react'

import { AppShell } from '../../../components/shell/AppShell'
import { DEMO_WEEK_START } from '../../../data/demoScenario'
import { DaySurface } from './DaySurface'

export function generateStaticParams (): Array<{ date: string }> {
	const startDate = parseISO(DEMO_WEEK_START)
	return Array.from({ length: 7 }, (_, i) => ({
		date: format(addDays(startDate, i), 'yyyy-MM-dd'),
	}))
}

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
