import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppShell } from '../../src/components/shell/AppShell'
import { WellwisherProvider } from '../../src/state/WellwisherProvider'

describe('AppShell component', () => {
	it('renders children within the shell main container', () => {
		render(
			<WellwisherProvider>
				<AppShell activeSurface='today'>
					<div data-testid='test-content'>Today Content</div>
				</AppShell>
			</WellwisherProvider>,
		)

		expect(screen.getByTestId('test-content')).toBeInTheDocument()
		expect(screen.getByText('Today Content')).toBeInTheDocument()
	})

	it('renders primary navigation links with accessible names and correct targets', () => {
		render(
			<WellwisherProvider>
				<AppShell activeSurface='today'>
					<div>Content</div>
				</AppShell>
			</WellwisherProvider>,
		)

		const todayLink = screen.getByRole('link', { name: /^today/i })
		const weekLink = screen.getByRole('link', { name: /^week/i })
		const planLink = screen.getByRole('link', { name: /^plan/i })

		expect(todayLink).toHaveAttribute('href', '/today')
		expect(weekLink).toHaveAttribute('href', '/week')
		expect(planLink).toHaveAttribute('href', '/plan')
	})

	it('announces the active surface correctly via aria-current', () => {
		const { rerender } = render(
			<WellwisherProvider>
				<AppShell activeSurface='today'>
					<div>Content</div>
				</AppShell>
			</WellwisherProvider>,
		)

		expect(screen.getByRole('link', { name: /^today/i })).toHaveAttribute(
			'aria-current',
			'page',
		)
		expect(screen.getByRole('link', { name: /^week/i })).not.toHaveAttribute(
			'aria-current',
		)
		expect(screen.getByRole('link', { name: /^plan/i })).not.toHaveAttribute(
			'aria-current',
		)

		rerender(
			<WellwisherProvider>
				<AppShell activeSurface='week'>
					<div>Content</div>
				</AppShell>
			</WellwisherProvider>,
		)

		expect(screen.getByRole('link', { name: /^today/i })).not.toHaveAttribute(
			'aria-current',
		)
		expect(screen.getByRole('link', { name: /^week/i })).toHaveAttribute(
			'aria-current',
			'page',
		)

		rerender(
			<WellwisherProvider>
				<AppShell activeSurface='plan'>
					<div>Content</div>
				</AppShell>
			</WellwisherProvider>,
		)

		expect(screen.getByRole('link', { name: /^plan/i })).toHaveAttribute(
			'aria-current',
			'page',
		)
	})

	it('does not render a desktop-only sidebar', () => {
		render(
			<WellwisherProvider>
				<AppShell activeSurface='today'>
					<div>Content</div>
				</AppShell>
			</WellwisherProvider>,
		)

		expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
		expect(document.querySelector('aside')).toBeNull()
		expect(document.querySelector('[data-sidebar]')).toBeNull()
	})

	it('renders wordmark linking to home/today', () => {
		render(
			<WellwisherProvider>
				<AppShell activeSurface='today'>
					<div>Content</div>
				</AppShell>
			</WellwisherProvider>,
		)

		const wordmark = screen.getByRole('link', { name: /wellwisher/i })
		expect(wordmark).toBeInTheDocument()
		expect(wordmark).toHaveAttribute('href', '/today')
	})

	it('makes Settings reachable through the profile menu control', async () => {
		const user = userEvent.setup()

		render(
			<WellwisherProvider>
				<AppShell activeSurface='today'>
					<div>Content</div>
				</AppShell>
			</WellwisherProvider>,
		)

		// Settings should not be visible before opening the menu
		expect(screen.queryByText(/settings/i)).not.toBeInTheDocument()

		const profileButton = screen.getByRole('button', {
			name: /profile and settings|harsh dave|account/i,
		})
		expect(profileButton).toBeInTheDocument()

		// Open profile menu
		await user.click(profileButton)

		// Settings is now reachable
		const settingsOption = screen.getByText(/settings/i)
		expect(settingsOption).toBeInTheDocument()

		// Clicking outside or pressing escape closes menu
		await user.keyboard('{Escape}')
		expect(screen.queryByText(/settings/i)).not.toBeInTheDocument()
	})

	it('resets demo scenario and closes profile menu when reset option is clicked', async () => {
		const user = userEvent.setup()

		render(
			<WellwisherProvider>
				<AppShell activeSurface='today'>
					<div>Content</div>
				</AppShell>
			</WellwisherProvider>,
		)

		const profileButton = screen.getByRole('button', {
			name: /profile and settings|harsh dave|account/i,
		})

		// Open profile menu
		await user.click(profileButton)

		const resetOption = screen.getByRole('menuitem', {
			name: /quick reset to demo baseline/i,
		})
		expect(resetOption).toBeInTheDocument()

		// Click quick reset demo scenario
		await user.click(resetOption)

		// Menu should close
		expect(screen.queryByRole('menu')).not.toBeInTheDocument()
	})
})
