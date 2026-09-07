import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Home from './page'
import { WellwisherProvider } from '../state/WellwisherProvider'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}))

describe('Landing Page Onboarding Flow', () => {
	beforeEach(() => {
		localStorage.clear()
		mockPush.mockClear()
	})

	it('renders Step 1 and progresses through all 4 onboarding steps into the cockpit', async () => {
		const user = userEvent.setup()

		render(
			<WellwisherProvider>
				<Home />
			</WellwisherProvider>,
		)

		// Step 1: Identity & Welcome
		expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
		expect(screen.getByRole('heading', { level: 1, name: /deliberate, calm planning/i })).toBeInTheDocument()
		expect(screen.getByLabelText(/what should companion voice call you\?/i)).toHaveValue('Harsh')

		// Click Continue -> Step 2
		await user.click(screen.getByRole('button', { name: /continue/i }))

		// Step 2: Day Boundaries
		expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument()
		expect(screen.getByRole('heading', { level: 1, name: /your daily scheduling window/i })).toBeInTheDocument()

		// Click Continue -> Step 3
		await user.click(screen.getByRole('button', { name: /continue/i }))

		// Step 3: Master Anchors
		expect(screen.getByText(/step 3 of 4/i)).toBeInTheDocument()
		expect(screen.getByRole('heading', { level: 1, name: /foundational rhythm anchors/i })).toBeInTheDocument()
		expect(screen.getByText(/morning rhythm & contemplation/i)).toBeInTheDocument()

		// Click Continue -> Step 4
		await user.click(screen.getByRole('button', { name: /continue/i }))

		// Step 4: Baseline Choice
		expect(screen.getByText(/step 4 of 4/i)).toBeInTheDocument()
		expect(screen.getByRole('heading', { level: 1, name: /choose how to start/i })).toBeInTheDocument()

		// Choose Load Demo Baseline
		await user.click(screen.getByRole('button', { name: /load demo baseline/i }))

		// Click Enter Cockpit
		await user.click(screen.getByRole('button', { name: /enter cockpit/i }))

		// Verify redirection to /today
		expect(mockPush).toHaveBeenCalledWith('/today')

		// Verify state was saved to localStorage
		const saved = localStorage.getItem('wellwisher.state.v1')
		expect(saved).not.toBeNull()
	})
})
