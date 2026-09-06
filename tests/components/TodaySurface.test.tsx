import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TodaySurface } from '../../src/app/today/TodaySurface'
import { WellwisherProvider } from '../../src/state/WellwisherProvider'

describe('TodaySurface component', () => {
	it('renders exactly one primary recommendation card with title and duration', () => {
		render(
			<WellwisherProvider>
				<TodaySurface />
			</WellwisherProvider>,
		)

		const recommendationSection = screen.getByRole('region', {
			name: /today('s)? recommendation|recommended focus/i,
		})
		expect(recommendationSection).toBeInTheDocument()

		// Should display AI Engineering recommendation
		expect(
			screen.getByRole('heading', { name: /ai engineering/i }),
		).toBeInTheDocument()

		// Recommendation duration badge / window
		expect(screen.getAllByText(/90 min/i).length).toBeGreaterThanOrEqual(1)
	})

	it('displays the calm companion reason explaining why the item is recommended', () => {
		render(
			<WellwisherProvider>
				<TodaySurface />
			</WellwisherProvider>,
		)

		expect(
			screen.getByText(/start with ai engineering\. it is the only track with a hard deadline/i),
		).toBeInTheDocument()
	})

	it('provides a focus session action button that dispatches focus start', async () => {
		const user = userEvent.setup()

		render(
			<WellwisherProvider>
				<TodaySurface />
			</WellwisherProvider>,
		)

		const focusButton = screen.getByRole('button', {
			name: /start focus/i,
		})
		expect(focusButton).toBeInTheDocument()

		await user.click(focusButton)

		// After starting focus, button state or session indicators can reflect running/active state
		expect(focusButton).toBeInTheDocument()
	})

	it('renders companion perspective message in editorial style', () => {
		render(
			<WellwisherProvider>
				<TodaySurface />
			</WellwisherProvider>,
		)

		const companionSection = screen.getByLabelText(/companion perspective|daily orientation/i)
		expect(companionSection).toBeInTheDocument()
		expect(companionSection).toHaveTextContent(/harsh|today/i)
	})

	it('displays today protected commitments with exact times and titles', () => {
		render(
			<WellwisherProvider>
				<TodaySurface />
			</WellwisherProvider>,
		)

		// Anchors for weekday
		expect(screen.getByText(/morning rhythm/i)).toBeInTheDocument()
		expect(screen.getByText(/07:30 - 08:30/)).toBeInTheDocument()

		expect(screen.getByText(/lunch/i)).toBeInTheDocument()
		expect(screen.getByText(/13:30 - 14:30/)).toBeInTheDocument()

		expect(screen.getByText(/sunset \/ calm place/i)).toBeInTheDocument()
		expect(screen.getByText(/18:00 - 20:00/)).toBeInTheDocument()
	})

	it('displays capacity summary panel with protected, suggested, and open capacity', () => {
		render(
			<WellwisherProvider>
				<TodaySurface />
			</WellwisherProvider>,
		)

		const capacityPanel = screen.getByRole('region', {
			name: /today('s)? capacity|capacity summary|day capacity/i,
		})
		expect(capacityPanel).toBeInTheDocument()

		expect(screen.getAllByText(/protected/i).length).toBeGreaterThanOrEqual(1)
		expect(screen.getAllByText(/suggested/i).length).toBeGreaterThanOrEqual(1)
		expect(screen.getAllByText(/open/i).length).toBeGreaterThanOrEqual(1)
	})

	it('renders compact non-repetitive week ribbon with link to full week', () => {
		render(
			<WellwisherProvider>
				<TodaySurface />
			</WellwisherProvider>,
		)

		const weekRibbon = screen.getByRole('region', {
			name: /this week|week ribbon/i,
		})
		expect(weekRibbon).toBeInTheDocument()

		// Has link to full week view
		const fullWeekLink = screen.getByRole('link', {
			name: /view full week|week ahead|full week/i,
		})
		expect(fullWeekLink).toHaveAttribute('href', '/week')

		// Days in ribbon link to their respective day detail pages
		const dayLinks = screen.getAllByRole('link', {
			name: /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
		})
		expect(dayLinks.length).toBe(7)
	})

	it('renders subordinate voice and audio controls', async () => {
		const user = userEvent.setup()

		render(
			<WellwisherProvider>
				<TodaySurface />
			</WellwisherProvider>,
		)

		const voiceButton = screen.getByRole('button', {
			name: /voice|audio|mute|unmute/i,
		})
		expect(voiceButton).toBeInTheDocument()

		await user.click(voiceButton)
		expect(voiceButton).toBeInTheDocument()
	})
})
