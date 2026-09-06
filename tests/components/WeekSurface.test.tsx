import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WeekSurface } from '../../src/app/week/WeekSurface'
import { WellwisherProvider } from '../../src/state/WellwisherProvider'

describe('WeekSurface component', () => {
	it('renders seven day-level allocation columns without an hour-by-hour calendar grid', () => {
		render(
			<WellwisherProvider>
				<WeekSurface />
			</WellwisherProvider>,
		)

		const dayColumns = screen.getAllByTestId(/^day-column-/)
		expect(dayColumns).toHaveLength(7)

		// Assert that conventional hour-by-hour grid rows (e.g. 09:00, 10:00, 11:00 grid rows) are NOT rendered
		expect(screen.queryByTestId('calendar-hour-grid')).toBeNull()
	})

	it('includes planned, open, and protected summary counts across the week', () => {
		render(
			<WellwisherProvider>
				<WeekSurface />
			</WellwisherProvider>,
		)

		const weekSummaryRegion = screen.getByRole('region', {
			name: /week summary|week allocation summary/i,
		})
		expect(weekSummaryRegion).toBeInTheDocument()

		expect(screen.getByText(/total protected/i)).toBeInTheDocument()
		expect(screen.getByText(/total suggested|total planned/i)).toBeInTheDocument()
		expect(screen.getByText(/total open/i)).toBeInTheDocument()
	})

	it('renders links to /day/YYYY-MM-DD for each day column header', () => {
		render(
			<WellwisherProvider>
				<WeekSurface />
			</WellwisherProvider>,
		)

		const dayDetailLinks = screen.getAllByRole('link', {
			name: /view day detail for|open day|mon|tue|wed|thu|fri|sat|sun/i,
		})
		expect(dayDetailLinks.length).toBeGreaterThanOrEqual(7)

		// Check link href format
		const firstLink = dayDetailLinks.find((link) =>
			link.getAttribute('href')?.startsWith('/day/2026-09-07'),
		)
		expect(firstLink).toBeDefined()
	})

	it('renders protected, suggested, and open capacity states within day columns', () => {
		render(
			<WellwisherProvider>
				<WeekSurface />
			</WellwisherProvider>,
		)

		// Protected items present
		expect(screen.getAllByText(/morning rhythm/i).length).toBeGreaterThan(0)
		expect(screen.getAllByText(/lunch/i).length).toBeGreaterThan(0)

		// Suggested flexible items present
		expect(screen.getAllByText(/ai engineering/i).length).toBeGreaterThan(0)

		// Open capacity is explicitly visible
		expect(screen.getAllByText(/open/i).length).toBeGreaterThan(0)
	})

	it('does not repeat the Today recommendation card inside each day column', () => {
		render(
			<WellwisherProvider>
				<WeekSurface />
			</WellwisherProvider>,
		)

		// Should not render the Today recommendation region or focus button inside columns
		expect(
			screen.queryByRole('region', { name: "Today's recommendation" }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: /start focus/i }),
		).not.toBeInTheDocument()
	})

	it('renders allocation legend for orientation', () => {
		render(
			<WellwisherProvider>
				<WeekSurface />
			</WellwisherProvider>,
		)

		expect(
			screen.getByRole('region', { name: /allocation legend/i }),
		).toBeInTheDocument()
	})
})
