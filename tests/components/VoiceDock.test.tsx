import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VoiceDock } from '../../src/components/voice/VoiceDock'
import { WellwisherProvider } from '../../src/state/WellwisherProvider'
import {
	getCompanionPerspective,
	MockCompanionVoice,
	MockDictationAdapter,
} from '../../src/voice/mockVoice'

describe('VoiceDock component', () => {
	let mockDictation: MockDictationAdapter
	let mockCompanion: MockCompanionVoice

	beforeEach(() => {
		mockDictation = new MockDictationAdapter()
		mockCompanion = new MockCompanionVoice()
	})

	it('renders collapsed voice dock with dictation and audio controls', () => {
		render(
			<WellwisherProvider>
				<VoiceDock
					dictationAdapter={mockDictation}
					companionVoice={mockCompanion}
					activeSurface='today'
				/>
			</WellwisherProvider>,
		)

		expect(
			screen.getByRole('button', { name: /start dictation|dictate/i }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /mute|unmute/i }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /replay/i }),
		).toBeInTheDocument()
	})

	it('starts dictation and expands inline composer on tap', async () => {
		const user = userEvent.setup()

		render(
			<WellwisherProvider>
				<VoiceDock
					dictationAdapter={mockDictation}
					companionVoice={mockCompanion}
					activeSurface='today'
				/>
			</WellwisherProvider>,
		)

		const dictateButton = screen.getByRole('button', {
			name: /start dictation|dictate/i,
		})
		await user.click(dictateButton)

		// Inline composer should be visible
		expect(screen.getByRole('textbox')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /stop listening/i }),
		).toBeInTheDocument()
	})

	it('taps to stop listening while keeping transcript for editing', async () => {
		const user = userEvent.setup()

		render(
			<WellwisherProvider>
				<VoiceDock
					dictationAdapter={mockDictation}
					companionVoice={mockCompanion}
					activeSurface='today'
				/>
			</WellwisherProvider>,
		)

		// Start
		await user.click(
			screen.getByRole('button', { name: /start dictation|dictate/i }),
		)
		expect(mockDictation.isListening).toBe(true)

		// Emit partial transcript
		act(() => {
			mockDictation.emitPartial('Focus on AI Engineering')
		})

		await waitFor(() => {
			expect(screen.getByRole('textbox')).toHaveValue('Focus on AI Engineering')
		})

		// Stop listening via tap
		const stopButton = screen.getByRole('button', { name: /stop listening/i })
		await user.click(stopButton)

		expect(mockDictation.isListening).toBe(false)
		// Transcript remains in textbox and is ready for editing
		expect(screen.getByRole('textbox')).toHaveValue('Focus on AI Engineering')
	})

	it('allows user to edit transcribed text before sending', async () => {
		const user = userEvent.setup()
		const handleCommandSubmit = vi.fn()

		render(
			<WellwisherProvider>
				<VoiceDock
					dictationAdapter={mockDictation}
					companionVoice={mockCompanion}
					activeSurface='today'
					onCommandSubmit={handleCommandSubmit}
				/>
			</WellwisherProvider>,
		)

		await user.click(
			screen.getByRole('button', { name: /start dictation|dictate/i }),
		)
		act(() => {
			mockDictation.emitPartial('Protect gym')
		})

		const textbox = screen.getByRole('textbox')
		await waitFor(() => {
			expect(textbox).toHaveValue('Protect gym')
		})

		await user.click(screen.getByRole('button', { name: /stop listening/i }))

		// Edit text
		await user.clear(textbox)
		await user.type(textbox, 'Protect gym at 8 PM')

		// Submit
		const sendButton = screen.getByRole('button', { name: /send|apply/i })
		await user.click(sendButton)

		expect(handleCommandSubmit).toHaveBeenCalledWith('Protect gym at 8 PM')
	})

	it('closes composer and discards draft when cancel is clicked', async () => {
		const user = userEvent.setup()

		render(
			<WellwisherProvider>
				<VoiceDock
					dictationAdapter={mockDictation}
					companionVoice={mockCompanion}
					activeSurface='today'
				/>
			</WellwisherProvider>,
		)

		await user.click(
			screen.getByRole('button', { name: /start dictation|dictate/i }),
		)
		expect(screen.getByRole('textbox')).toBeInTheDocument()

		const cancelButton = screen.getByRole('button', { name: /cancel|close/i })
		await user.click(cancelButton)

		expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
	})

	it('toggles mute preference and updates companion voice mute state', async () => {
		const user = userEvent.setup()
		const muteSpy = vi.spyOn(mockCompanion, 'mute')
		const unmuteSpy = vi.spyOn(mockCompanion, 'unmute')

		render(
			<WellwisherProvider>
				<VoiceDock
					dictationAdapter={mockDictation}
					companionVoice={mockCompanion}
					activeSurface='today'
				/>
			</WellwisherProvider>,
		)

		const muteButton = screen.getByRole('button', { name: /mute/i })
		await user.click(muteButton)

		expect(muteSpy).toHaveBeenCalled()

		// Clicking again unmutes
		const unmuteButton = screen.getByRole('button', { name: /unmute/i })
		await user.click(unmuteButton)

		expect(unmuteSpy).toHaveBeenCalled()
	})

	it('handles pause and replay companion voice actions', async () => {
		const user = userEvent.setup()
		const replaySpy = vi.spyOn(mockCompanion, 'replay')
		const pauseSpy = vi.spyOn(mockCompanion, 'pause')

		render(
			<WellwisherProvider>
				<VoiceDock
					dictationAdapter={mockDictation}
					companionVoice={mockCompanion}
					activeSurface='today'
				/>
			</WellwisherProvider>,
		)

		const replayButton = screen.getByRole('button', { name: /replay/i })
		await user.click(replayButton)

		expect(replaySpy).toHaveBeenCalled()

		// If speaking, pause button should be available and callable
		mockCompanion.setIsSpeaking(true)

		const pauseButton = screen.getByRole('button', { name: /pause/i })
		await user.click(pauseButton)

		expect(pauseSpy).toHaveBeenCalled()
	})

	it('remains fully usable with typed input when speech recognition is unsupported', async () => {
		const user = userEvent.setup()
		const unsupportedAdapter = new MockDictationAdapter({ supported: false })
		const handleCommandSubmit = vi.fn()

		render(
			<WellwisherProvider>
				<VoiceDock
					dictationAdapter={unsupportedAdapter}
					companionVoice={mockCompanion}
					activeSurface='today'
					onCommandSubmit={handleCommandSubmit}
				/>
			</WellwisherProvider>,
		)

		// Click to open composer
		await user.click(
			screen.getByRole('button', { name: /start dictation|dictate|type command/i }),
		)

		// Textbox is available with non-blocking unsupported guidance
		expect(screen.getByRole('textbox')).toBeInTheDocument()
		expect(
			screen.getByText(/unavailable|not supported|type your instruction/i),
		).toBeInTheDocument()

		// User can still type and submit manually
		const textbox = screen.getByRole('textbox')
		await user.type(textbox, 'Family function Saturday afternoon')

		const sendButton = screen.getByRole('button', { name: /send|apply/i })
		await user.click(sendButton)

		expect(handleCommandSubmit).toHaveBeenCalledWith(
			'Family function Saturday afternoon',
		)
	})

	it('provides companion perspective message without concatenating card text', () => {
		const todayPerspective = getCompanionPerspective('today')
		const weekPerspective = getCompanionPerspective('week')
		const planPerspective = getCompanionPerspective('plan')

		// Ensure perspective messages are meaningful human interpretations, not raw card concatenation
		expect(todayPerspective).toContain('AI')
		expect(todayPerspective).not.toContain('Protected · 90 min · 100%')

		expect(weekPerspective).toContain('Saturday belongs to family')
		expect(planPerspective).toContain('planning board')
	})
})
