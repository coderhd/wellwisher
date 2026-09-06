import React from 'react'
import { AppShell } from '../../../components/shell/AppShell'

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
			<section
				data-testid='day-surface'
				aria-label={`Day detail for ${date}`}
			>
				<h1>Day: {date}</h1>
				<p>Anchored commitments and flexible blocks</p>
			</section>
		</AppShell>
	)
}
