import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { metadata, viewport } from '../../src/app/layout'
import { DaySurface } from '../../src/app/day/[date]/DaySurface'
import { PlanSurface } from '../../src/app/plan/PlanSurface'
import { TodaySurface } from '../../src/app/today/TodaySurface'
import { WeekSurface } from '../../src/app/week/WeekSurface'
import { AppShell } from '../../src/components/shell/AppShell'
import { VoiceDock } from '../../src/components/voice/VoiceDock'
import { createDemoState } from '../../src/data/demoScenario'
import { WellwisherProvider } from '../../src/state/WellwisherProvider'
import {
	MockCompanionVoice,
	MockDictationAdapter,
} from '../../src/voice/mockVoice'

describe('Accessibility & Responsive Hardening', () => {
	let mockDictation: MockDictationAdapter
	let mockCompanion: MockCompanionVoice

	beforeEach(() => {
		mockDictation = new MockDictationAdapter()
		mockCompanion = new MockCompanionVoice()
	})

	describe('Landmarks and Structural Navigation', () => {
		it('renders all essential landmarks and skip navigation link', () => {
			render(
				<WellwisherProvider>
					<AppShell activeSurface='today'>
						<div>Page content</div>
					</AppShell>
				</WellwisherProvider>,
			)

			// Banner landmark
			const banner = screen.getByRole('banner')
			expect(banner).toBeInTheDocument()

			// Navigation landmark
			const navigation = screen.getByRole('navigation', {
				name: /main navigation/i,
			})
			expect(navigation).toBeInTheDocument()

			// Main landmark with id matching skip link target
			const main = screen.getByRole('main')
			expect(main).toBeInTheDocument()
			expect(main).toHaveAttribute('id', 'main-content')

			// Skip link
			const skipLink = screen.getByRole('link', {
				name: /skip to (main )?content/i,
			})
			expect(skipLink).toBeInTheDocument()
			expect(skipLink).toHaveAttribute('href', '#main-content')

			// Companion dock region landmark
			const voiceRegion = screen.getByRole('region', {
				name: /companion voice and dictation/i,
			})
			expect(voiceRegion).toBeInTheDocument()
		})

		it('provides clear accessible labels on all primary surfaces', () => {
			const view1 = render(
				<WellwisherProvider>
					<AppShell activeSurface='today'>
						<TodaySurface />
					</AppShell>
				</WellwisherProvider>,
			)

			expect(
				screen.getByRole('region', {
					name: /today('s)? recommendation|recommended focus/i,
				}),
			).toBeInTheDocument()

			view1.unmount()

			const view2 = render(
				<WellwisherProvider>
					<AppShell activeSurface='week'>
						<WeekSurface />
					</AppShell>
				</WellwisherProvider>,
			)

			expect(
				screen.getByRole('heading', { name: /week ahead|september/i }),
			).toBeInTheDocument()

			view2.unmount()

			render(
				<WellwisherProvider>
					<AppShell activeSurface='today'>
						<DaySurface date='2026-09-08' />
					</AppShell>
				</WellwisherProvider>,
			)

			expect(
				screen.getByRole('link', { name: /week overview/i }),
			).toBeInTheDocument()
			expect(
				screen.getByRole('heading', { name: /tuesday, september 8/i }),
			).toBeInTheDocument()
		})
	})

	describe('Accessible Interactive Names and Keyboard Support', () => {
		it('ensures all interactive controls have accessible names', () => {
			render(
				<WellwisherProvider>
					<VoiceDock
						dictationAdapter={mockDictation}
						companionVoice={mockCompanion}
						activeSurface='today'
					/>
				</WellwisherProvider>,
			)

			// Dictation button accessible name
			const dictateBtn = screen.getByRole('button', {
				name: /start dictation|dictate|command/i,
			})
			expect(dictateBtn).toBeInTheDocument()

			// Mute toggle accessible name
			const muteBtn = screen.getByRole('button', {
				name: /mute companion audio|unmute companion audio/i,
			})
			expect(muteBtn).toBeInTheDocument()

			// Replay orientation accessible name
			const replayBtn = screen.getByRole('button', {
				name: /replay orientation|replay/i,
			})
			expect(replayBtn).toBeInTheDocument()
		})

		it('provides accessible keyboard alternatives for plan drag-and-drop', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<PlanSurface />
				</WellwisherProvider>,
			)

			// Find select dropdown for keyboard allocation of unplaced intentions
			const placementSelects = screen.getAllByRole('combobox', {
				name: /placement options for/i,
			})
			expect(placementSelects.length).toBeGreaterThanOrEqual(1)

			const firstSelect = placementSelects[0]
			expect(firstSelect).toBeInTheDocument()

			// Choose a placement option via keyboard selection
			await user.click(firstSelect)
			const optionToSelect = screen.getAllByRole('option')[1]
			await user.click(optionToSelect)

			// Verify allocation button actions (Arrange, Undo) are keyboard reachable
			const arrangeBtn = screen.getByRole('button', {
				name: /arrange (my )?week/i,
			})
			expect(arrangeBtn).toBeInTheDocument()
		})

		it('supports closing popup menus with the Escape key', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider>
					<AppShell activeSurface='today'>
						<TodaySurface />
					</AppShell>
				</WellwisherProvider>,
			)

			const profileBtn = screen.getByRole('button', {
				name: /profile and settings/i,
			})
			await user.click(profileBtn)

			expect(screen.getByRole('menu')).toBeInTheDocument()

			await user.keyboard('{Escape}')
			expect(screen.queryByRole('menu')).not.toBeInTheDocument()
		})
	})

	describe('Muted Audio Usability', () => {
		it('remains fully usable and legible when companion audio is muted', async () => {
			const user = userEvent.setup()

			render(
				<WellwisherProvider initialState={createDemoState()}>
					<AppShell activeSurface='today'>
						<TodaySurface />
					</AppShell>
				</WellwisherProvider>,
			)

			const muteButtons = screen.getAllByRole('button', {
				name: /mute companion audio/i,
			})
			expect(muteButtons.length).toBeGreaterThanOrEqual(1)
			await user.click(muteButtons[0])

			// Mute buttons update to unmute
			expect(
				screen.getAllByRole('button', {
					name: /unmute companion audio/i,
				}).length,
			).toBeGreaterThanOrEqual(1)

			// Visual recommendation perspective is still prominently visible
			expect(
				screen.getByText(
					/start with ai engineering\. it is the only track with a hard deadline/i,
				),
			).toBeInTheDocument()

			// Focus action is still functional
			const startFocusBtn = screen.getByRole('button', {
				name: /start focus/i,
			})
			expect(startFocusBtn).toBeInTheDocument()
			await user.click(startFocusBtn)

			// Active focus session controls remain fully accessible
			expect(
				screen.getByRole('button', { name: /complete session/i }),
			).toBeInTheDocument()
		})
	})

	describe('Responsive Shell Layout', () => {
		it('renders header nav with links for Today, Week, and Plan without sidebar', () => {
			render(
				<WellwisherProvider>
					<AppShell activeSurface='plan'>
						<div>Plan content</div>
					</AppShell>
				</WellwisherProvider>,
			)

			expect(screen.getByRole('link', { name: /^today/i })).toBeInTheDocument()
			expect(screen.getByRole('link', { name: /^week/i })).toBeInTheDocument()
			expect(screen.getByRole('link', { name: /^plan/i })).toBeInTheDocument()
			expect(document.querySelector('aside')).toBeNull()
		})
	})

	describe('PWA Manifest & Layout Metadata Hardening', () => {
		it('defines valid PWA manifest and icons on disk', () => {
			const manifestPath = path.resolve(process.cwd(), 'public/manifest.webmanifest')
			expect(fs.existsSync(manifestPath)).toBe(true)

			const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
			expect(content.name).toBe('Wellwisher')
			expect(content.short_name).toBe('Wellwisher')
			expect(content.display).toBe('standalone')
			expect(content.theme_color.toLowerCase()).toBe('#121820')
			expect(content.background_color.toLowerCase()).toBe('#0b0f14')
			expect(content.icons).toHaveLength(2)
			expect(content.icons[0].sizes).toBe('192x192')
			expect(content.icons[1].sizes).toBe('512x512')

			const icon192Path = path.resolve(process.cwd(), 'public/icons/icon-192.png')
			const icon512Path = path.resolve(process.cwd(), 'public/icons/icon-512.png')
			expect(fs.existsSync(icon192Path)).toBe(true)
			expect(fs.existsSync(icon512Path)).toBe(true)
			expect(fs.statSync(icon192Path).size).toBeGreaterThan(100)
			expect(fs.statSync(icon512Path).size).toBeGreaterThan(100)
		})

		it('exports complete metadata and viewport configuration in root layout', () => {
			expect(metadata.title).toBe('Wellwisher')
			expect(metadata.description).toBe('A calm personal planning companion.')
			expect(metadata.manifest).toBe('/manifest.webmanifest')
			expect(metadata.appleWebApp).toEqual({
				capable: true,
				statusBarStyle: 'default',
				title: 'Wellwisher',
			})
			expect(viewport.themeColor).toBe('#121820')
		})

		it('includes prefers-reduced-motion in globals.css', () => {
			const globalsPath = path.resolve(process.cwd(), 'src/app/globals.css')
			const globalsCss = fs.readFileSync(globalsPath, 'utf-8')

			expect(globalsCss).toContain('@media (prefers-reduced-motion: reduce)')
			expect(globalsCss).toContain('animation-duration: 0.01ms')
			expect(globalsCss).toContain(':focus-visible')
		})
	})
})
