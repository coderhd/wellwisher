import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsSurface } from '../../src/app/settings/SettingsSurface'
import { ProfileMenu } from '../../src/components/shell/ProfileMenu'
import { createDemoState } from '../../src/data/demoScenario'
import { WellwisherProvider } from '../../src/state/WellwisherProvider'

describe('SettingsSurface component', () => {
	beforeEach(() => {
		localStorage.clear()
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

			const startInput = screen.getByLabelText(/start time/i)
			await user.clear(startInput)
			await user.type(startInput, '20:30')

			const endInput = screen.getByLabelText(/end time/i)
			await user.clear(endInput)
			await user.type(endInput, '21:00')

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
		it('renders start and end time inputs and saves updated boundaries', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const startInput = screen.getByLabelText(
				/available start|earliest start/i,
			)
			const endInput = screen.getByLabelText(
				/available end|latest end/i,
			)
			const saveBoundsBtn = screen.getByRole('button', {
				name: /save boundaries|save schedule boundaries/i,
			})

			expect(startInput).toBeInTheDocument()
			expect(endInput).toBeInTheDocument()

			// Change boundaries to 07:00 and 23:00
			await user.clear(startInput)
			await user.type(startInput, '07:00')

			await user.clear(endInput)
			await user.type(endInput, '23:00')

			await user.click(saveBoundsBtn)

			// Success feedback displayed
			expect(
				screen.getByText(/schedule boundaries saved/i),
			).toBeInTheDocument()
		})

		it('validates schedule bounds to ensure end time is after start time', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const startInput = screen.getByLabelText(
				/available start|earliest start/i,
			)
			const endInput = screen.getByLabelText(
				/available end|latest end/i,
			)
			const saveBoundsBtn = screen.getByRole('button', {
				name: /save boundaries|save schedule boundaries/i,
			})

			await user.clear(startInput)
			await user.type(startInput, '21:00')

			await user.clear(endInput)
			await user.type(endInput, '19:00')

			await user.click(saveBoundsBtn)

			expect(screen.getByRole('alert')).toHaveTextContent(
				/end time must be after start time/i,
			)
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

			const speedSelect = screen.getByLabelText(
				/speech rate|voice speed|speed/i,
			)
			expect(speedSelect).toHaveValue('1')

			await user.selectOptions(speedSelect, '1.25')
			expect(speedSelect).toHaveValue('1.25')
		})
	})

	describe('Storage & Data Management section', () => {
		it('renders Google Drive sync readiness badge and seam note', () => {
			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			expect(
				screen.getByText(
					/local-first storage \(ready for google drive sync\)/i,
				),
			).toBeInTheDocument()
			expect(
				screen.getByRole('button', { name: /connect google drive/i }),
			).toBeInTheDocument()
		})

		it('allows connecting to Google Drive, syncing, and disconnecting', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const connectBtn = screen.getByRole('button', {
				name: /connect google drive/i,
			})
			await user.click(connectBtn)

			expect(
				screen.getByText(/connected to google drive/i),
			).toBeInTheDocument()
			expect(
				screen.getByRole('button', { name: /sync now/i }),
			).toBeInTheDocument()

			// Test sync now
			const syncBtn = screen.getByRole('button', { name: /sync now/i })
			await user.click(syncBtn)
			expect(
				screen.getByText(/synced successfully with google drive/i),
			).toBeInTheDocument()

			// Test disconnect
			const disconnectBtn = screen.getByRole('button', {
				name: /disconnect google drive/i,
			})
			await user.click(disconnectBtn)
			expect(
				screen.getByText(/disconnected from google drive/i),
			).toBeInTheDocument()
		})

		it('exports state to a downloadable JSON file', async () => {
			const user = userEvent.setup()

			// Mock URL.createObjectURL and URL.revokeObjectURL
			const createObjectURLMock = vi.fn(() => 'blob:mock-url')
			const revokeObjectURLMock = vi.fn()
			globalThis.URL.createObjectURL = createObjectURLMock
			globalThis.URL.revokeObjectURL = revokeObjectURLMock

			// Spy on document.createElement to intercept download anchor
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

		it('resets state to demo scenario on reset button click', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<SettingsSurface />
				</WellwisherProvider>,
			)

			const resetBtn = screen.getByRole('button', {
				name: /reset to demo scenario|reset scenario|reset demo/i,
			})
			await user.click(resetBtn)

			expect(
				screen.getByText(
					/reset to harsh demo scenario complete|demo scenario reset/i,
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
		})
	})
})
