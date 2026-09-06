import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DaySurface } from '../../src/app/day/[date]/DaySurface'
import { WellwisherProvider } from '../../src/state/WellwisherProvider'

describe('DaySurface component', () => {
	const testDate = '2026-09-07'

	it('renders date header for the chosen day', () => {
		render(
			<WellwisherProvider>
				<DaySurface date={testDate} />
			</WellwisherProvider>,
		)

		expect(
			screen.getByRole('heading', { name: /monday, september 7/i }),
		).toBeInTheDocument()
	})

	it('renders back navigation links to Today and Week surfaces', () => {
		render(
			<WellwisherProvider>
				<DaySurface date={testDate} />
			</WellwisherProvider>,
		)

		const backLinks = screen.getAllByRole('link', {
			name: /today|week|back to/i,
		})
		expect(backLinks.length).toBeGreaterThanOrEqual(1)
	})

	it('displays exact times for protected commitments', () => {
		render(
			<WellwisherProvider>
				<DaySurface date={testDate} />
			</WellwisherProvider>,
		)

		expect(screen.getByText(/morning rhythm/i)).toBeInTheDocument()
		expect(screen.getByText(/07:30 - 08:30/)).toBeInTheDocument()

		expect(screen.getByText(/lunch/i)).toBeInTheDocument()
		expect(screen.getByText(/13:30 - 14:30/)).toBeInTheDocument()
	})

	it('displays suggested flexible allocations with window indicators without fixed times', () => {
		render(
			<WellwisherProvider>
				<DaySurface date={testDate} />
			</WellwisherProvider>,
		)

		expect(screen.getByText(/ai engineering/i)).toBeInTheDocument()
		expect(screen.getAllByText(/morning window/i).length).toBeGreaterThanOrEqual(1)
	})

	it('renders visible open breathing windows and day capacity panel', () => {
		render(
			<WellwisherProvider>
				<DaySurface date={testDate} />
			</WellwisherProvider>,
		)

		const capacityPanel = screen.getByRole('region', {
			name: /day capacity|capacity summary/i,
		})
		expect(capacityPanel).toBeInTheDocument()

		expect(screen.getAllByText(/open/i).length).toBeGreaterThanOrEqual(1)
	})

	it('renders allocation legend for clarity', () => {
		render(
			<WellwisherProvider>
				<DaySurface date={testDate} />
			</WellwisherProvider>,
		)

		expect(
			screen.getByRole('region', { name: /allocation legend/i }),
		).toBeInTheDocument()
	})
})
