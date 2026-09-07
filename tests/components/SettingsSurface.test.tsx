import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsSurface } from '../../src/app/settings/SettingsSurface'
import { ProfileMenu } from '../../src/components/shell/ProfileMenu'
import { createDemoState } from '../../src/data/demoScenario'
import { WellwisherProvider } from '../../src/state/WellwisherProvider'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}))

describe('SettingsSurface component', () => {
	beforeEach(() => {
		localStorage.clear()
		sessionStorage.clear()
		vi.restoreAllMocks()
	})

	it('renders all 4 core settings sections with accessible headings', () => {
		render(
			<WellwisherProvider>
				<SettingsSurface />
			</WellwisherProvider>,
		)

		// Page title
		expect(
			screen.getByRole('heading', { level: 1, name: /settings/i }),
		).toBeInTheDocument()

		// 4 section headings
		expect(
			screen.getByRole('heading', {
				level: 2,
				name: /master rhythm anchors/i,
			}),
		).toBeInTheDocument()
		expect(
			screen.getByRole('heading', {
				level: 2,
				name: /day schedule boundaries/i,
			}),
		).toBeInTheDocument()
		expect(
			screen.getByRole('heading', {
				level: 2,
				name: /voice & companion preferences|voice preferences/i,
			}),
		).toBeInTheDocument()
		expect(
			screen.getByRole('heading', {
				level: 2,
				name: /storage & data management/i,
			}),
		).toBeInTheDocument()

		// Voice section has #voice id for anchor navigation
		const voiceSection = document.getElementById('voice')
		expect(voiceSection).toBeInTheDocument()
	})

	describe('Master Rhythm Anchors section', () => {
		it('renders initial list of rhythm anchors with edit and delete actions', () => {
			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			// Demo anchors should be visible
			expect(screen.getByText(/morning rhythm/i)).toBeInTheDocument()
			expect(screen.getByText(/^lunch$/i)).toBeInTheDocument()

			// Check for Add Anchor button
			const addBtn = screen.getByRole('button', {
				name: /add rhythm anchor|\+ add anchor/i,
			})
			expect(addBtn).toBeInTheDocument()
		})

		it('opens AnchorModal to create a new anchor and updates the list upon saving', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const addBtn = screen.getByRole('button', {
				name: /add rhythm anchor|\+ add anchor/i,
			})
			await user.click(addBtn)

			// Modal is opened
			const dialog = screen.getByRole('dialog', {
				name: /new rhythm anchor/i,
			})
			expect(dialog).toBeInTheDocument()

			const titleInput = screen.getByLabelText(/title/i)
			await user.type(titleInput, 'Evening Journaling')

			// Select start time 20:30
			const startTrigger = screen.getByRole('button', { name: /anchor start time/i })
			await user.click(startTrigger)
			await user.click(screen.getByTestId('hour-20'))
			await user.click(screen.getByTestId('minute-30'))
			await user.click(screen.getByRole('button', { name: /done/i }))

			// Select end time 21:00
			const endTrigger = screen.getByRole('button', { name: /anchor end time/i })
			await user.click(endTrigger)
			await user.click(screen.getByTestId('hour-21'))
			await user.click(screen.getByTestId('minute-00'))
			await user.click(screen.getByRole('button', { name: /done/i }))

			const saveBtn = within(dialog).getByRole('button', {
				name: /create rhythm anchor|save/i,
			})
			await user.click(saveBtn)

			// Modal closes and new anchor appears in settings
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
			expect(screen.getByText(/evening journaling/i)).toBeInTheDocument()
			expect(screen.getByText(/20:30/)).toBeInTheDocument()
		})

		it('opens AnchorModal in edit mode when clicking edit and updates the anchor', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const editBtn = screen.getByRole('button', {
				name: /edit morning rhythm/i,
			})
			await user.click(editBtn)

			const dialog = screen.getByRole('dialog', {
				name: /edit rhythm anchor/i,
			})
			expect(dialog).toBeInTheDocument()

			const titleInput = screen.getByLabelText(/title/i)
			expect(titleInput).toHaveValue('Morning rhythm')

			await user.clear(titleInput)
			await user.type(titleInput, 'Sunrise Meditation & Walk')

			const saveBtn = within(dialog).getByRole('button', {
				name: /save changes|save/i,
			})
			await user.click(saveBtn)

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
			expect(
				screen.getByText('Sunrise Meditation & Walk'),
			).toBeInTheDocument()
		})

		it('allows deleting an anchor directly or through modal', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			expect(screen.getByText(/morning rhythm/i)).toBeInTheDocument()

			const deleteBtn = screen.getByRole('button', {
				name: /delete morning rhythm/i,
			})
			await user.click(deleteBtn)

			expect(
				screen.queryByText(/morning rhythm/i),
			).not.toBeInTheDocument()
		})
	})

	describe('Day Schedule Boundaries section', () => {
		it('renders start and end time custom pickers and saves updated boundaries', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const startTrigger = screen.getByRole('button', {
				name: /available start time/i,
			})
			const endTrigger = screen.getByRole('button', {
				name: /available end time/i,
			})
			const saveBoundsBtn = screen.getByRole('button', {
				name: /save boundaries|save schedule boundaries/i,
			})

			expect(startTrigger).toBeInTheDocument()
			expect(endTrigger).toBeInTheDocument()

			// Change boundaries to 07:00 and 23:00
			await user.click(startTrigger)
			await user.click(screen.getByTestId('hour-07'))
			await user.click(screen.getByTestId('minute-00'))
			await user.click(screen.getByRole('button', { name: /done/i }))

			await user.click(endTrigger)
			await user.click(screen.getByTestId('hour-23'))
			await user.click(screen.getByTestId('minute-00'))
			await user.click(screen.getByRole('button', { name: /done/i }))

			await user.click(saveBoundsBtn)

			// Success feedback displayed
			expect(
				screen.getByText(/schedule boundaries saved/i),
			).toBeInTheDocument()
		})
	})

	describe('Voice & Companion Preferences section', () => {
		it('toggles companion mute preference', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const muteToggle = screen.getByLabelText(
				/mute companion audio|mute audio/i,
			)
			expect(muteToggle).not.toBeChecked()

			await user.click(muteToggle)
			expect(muteToggle).toBeChecked()

			await user.click(muteToggle)
			expect(muteToggle).not.toBeChecked()
		})

		it('toggles companion auto-play preference', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const autoPlayToggle = screen.getByLabelText(
				/auto-play companion voice|auto-speak/i,
			)
			expect(autoPlayToggle).not.toBeChecked()

			await user.click(autoPlayToggle)
			expect(autoPlayToggle).toBeChecked()
		})

		it('updates speech rate preference', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const speedCombobox = screen.getByRole('combobox', {
				name: /speech rate/i,
			})
			await user.click(speedCombobox)
			const option125 = screen.getByRole('option', { name: /1\.25x/i })
			await user.click(option125)

			expect(screen.getByText(/1\.25x/i)).toBeInTheDocument()
		})
	})

	describe('Storage & Data Management section', () => {
		it('renders Google Drive client-side sync and GCP Client ID input', () => {
			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			expect(
				screen.getByText(
					/google drive client-side sync/i,
				),
			).toBeInTheDocument()
			expect(
				screen.getByLabelText(/google cloud oauth client id/i),
			).toBeInTheDocument()
			expect(
				screen.getByRole('button', { name: /connect google drive/i }),
			).toBeInTheDocument()
		})

		it('allows setting client ID and toggles GCP guide', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const clientIdInput = screen.getByLabelText(/google cloud oauth client id/i)
			await user.type(clientIdInput, 'my-test-client-id.apps.googleusercontent.com')
			expect(localStorage.getItem('wellwisher.gdrive.client_id')).toBe(
				'my-test-client-id.apps.googleusercontent.com',
			)

			const guideBtn = screen.getByRole('button', { name: /how to get oauth client id\?/i })
			await user.click(guideBtn)
			expect(screen.getByText(/google cloud platform setup/i)).toBeInTheDocument()
		})

		it('exports state to a downloadable JSON file', async () => {
			const user = userEvent.setup()

			const createObjectURLMock = vi.fn(() => 'blob:mock-url')
			const revokeObjectURLMock = vi.fn()
			globalThis.URL.createObjectURL = createObjectURLMock
			globalThis.URL.revokeObjectURL = revokeObjectURLMock

			const clickMock = vi.fn()
			const originalCreateElement = document.createElement.bind(document)
			const createElementSpy = vi
				.spyOn(document, 'createElement')
				.mockImplementation((tagName: string) => {
					const el = originalCreateElement(tagName)
					if (tagName === 'a') {
						el.click = clickMock
					}
					return el
				})

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const exportBtn = screen.getByRole('button', {
				name: /export data|export backup/i,
			})
			await user.click(exportBtn)

			expect(createObjectURLMock).toHaveBeenCalled()
			expect(clickMock).toHaveBeenCalled()
			expect(
				screen.getByText(/data exported successfully/i),
			).toBeInTheDocument()

			createElementSpy.mockRestore()
		})

		it('imports valid JSON state and replaces current state', async () => {
			const customState = createDemoState()
			customState.intentions = [
				{
					id: 'imported-intention',
					title: 'Imported Secret Project',
					kind: 'work',
					durationMinutes: 120,
					priority: 1,
				},
			]

			const file = new File([JSON.stringify(customState)], 'backup.json', {
				type: 'application/json',
			})

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const fileInput = screen.getByLabelText(
				/import data|choose backup file|import json/i,
			)

			fireEvent.change(fileInput, {
				target: { files: [file] },
			})

			await waitFor(() => {
				expect(
					screen.getByText(/data imported successfully/i),
				).toBeInTheDocument()
			})
		})

		it('shows an accessible alert error when importing an invalid file', async () => {
			const corruptedFile = new File(['{ invalid json :::'], 'bad.json', {
				type: 'application/json',
			})

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const fileInput = screen.getByLabelText(
				/import data|choose backup file|import json/i,
			)

			fireEvent.change(fileInput, {
				target: { files: [corruptedFile] },
			})

			await waitFor(() => {
				const alert = screen.getByRole('alert')
				expect(alert).toHaveTextContent(/invalid/i)
			})
		})

		it('resets state to default onboarding when clicking Reset to Default', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const resetDefaultBtn = screen.getByRole('button', {
				name: /reset to default \(onboarding\)/i,
			})
			await user.click(resetDefaultBtn)

			expect(mockPush).toHaveBeenCalledWith('/')
		})

		it('resets state to demo baseline when clicking Quick Reset', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const quickResetBtn = screen.getByRole('button', {
				name: /quick reset to demo baseline/i,
			})
			await user.click(quickResetBtn)

			expect(
				screen.getByText(
					/reset to demo baseline complete/i,
				),
			).toBeInTheDocument()
		})
	})

	describe('ProfileMenu Integration', () => {
		it('renders navigation links to /settings and /settings#voice in ProfileMenu', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<ProfileMenu />
				</WellwisherProvider>,
			)

			const profileBtn = screen.getByRole('button', {
				name: /profile and settings/i,
			})
			await user.click(profileBtn)

			const settingsLink = screen.getByRole('menuitem', {
				name: /^settings$/i,
			})
			expect(settingsLink).toHaveAttribute('href', '/settings')

			const voiceLink = screen.getByRole('menuitem', {
				name: /voice preferences/i,
			})
			expect(voiceLink).toHaveAttribute('href', '/settings#voice')

			const resetDefaultLink = screen.getByRole('menuitem', {
				name: /reset to default \(onboarding\)/i,
			})
			expect(resetDefaultLink).toHaveAttribute('href', '/')
		})
	})
})
