import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AnchorModal } from '../../src/components/modals/AnchorModal'
import type { RhythmAnchor } from '../../src/domain/planning/types'

describe('AnchorModal', () => {
	it('does not render anything when isOpen is false', () => {
		const { container } = render(
			<AnchorModal
				isOpen={false}
				onSave={vi.fn()}
				onClose={vi.fn()}
			/>,
		)

		expect(container).toBeEmptyDOMElement()
	})

	it('renders dialog with all anchor form fields when open', () => {
		render(
			<AnchorModal
				isOpen={true}
				onSave={vi.fn()}
				onClose={vi.fn()}
			/>,
		)

		const dialog = screen.getByRole('dialog', {
			name: /new rhythm anchor|new anchor/i,
		})
		expect(dialog).toBeInTheDocument()
		expect(dialog).toHaveAttribute('aria-modal', 'true')

		expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/start time/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/end time/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/repeat pattern|repeat/i)).toBeInTheDocument()
		expect(
			screen.getByLabelText(/protected commitment|protected/i),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /create rhythm anchor|save/i }),
		).toBeInTheDocument()
	})

	it('validates empty title and prevents submission', async () => {
		const user = userEvent.setup()
		const onSave = vi.fn()

		render(
			<AnchorModal
				isOpen={true}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		)

		const submitBtn = screen.getByRole('button', {
			name: /create rhythm anchor|save/i,
		})
		await user.click(submitBtn)

		expect(onSave).not.toHaveBeenCalled()
		expect(screen.getByRole('alert')).toHaveTextContent(
			/title is required/i,
		)
	})

	it('validates that end time must be after start time', async () => {
		const user = userEvent.setup()
		const onSave = vi.fn()

		render(
			<AnchorModal
				isOpen={true}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		)

		const titleInput = screen.getByLabelText(/title/i)
		await user.type(titleInput, 'Evening Gym')

		// Set Start Time to 18:00
		const startTrigger = screen.getByRole('button', { name: /anchor start time/i })
		await user.click(startTrigger)
		await user.click(screen.getByTestId('hour-18'))
		await user.click(screen.getByTestId('minute-00'))
		await user.click(screen.getByRole('button', { name: /done/i }))

		// Set End Time to 17:00 (before start time)
		const endTrigger = screen.getByRole('button', { name: /anchor end time/i })
		await user.click(endTrigger)
		await user.click(screen.getByTestId('hour-17'))
		await user.click(screen.getByTestId('minute-00'))
		await user.click(screen.getByRole('button', { name: /done/i }))

		const submitBtn = screen.getByRole('button', {
			name: /create rhythm anchor|save/i,
		})
		await user.click(submitBtn)

		expect(onSave).not.toHaveBeenCalled()
		expect(screen.getByRole('alert')).toHaveTextContent(
			/end time must be after start time/i,
		)
	})

	it('creates a new anchor and calls onSave with daily repeat', async () => {
		const user = userEvent.setup()
		const onSave = vi.fn()
		const onClose = vi.fn()

		render(
			<AnchorModal
				isOpen={true}
				onSave={onSave}
				onClose={onClose}
			/>,
		)

		const titleInput = screen.getByLabelText(/title/i)
		await user.type(titleInput, 'Morning Walk')

		// Set Start Time to 06:30
		const startTrigger = screen.getByRole('button', { name: /anchor start time/i })
		await user.click(startTrigger)
		await user.click(screen.getByTestId('hour-06'))
		await user.click(screen.getByTestId('minute-30'))
		await user.click(screen.getByRole('button', { name: /done/i }))

		// Set End Time to 07:30
		const endTrigger = screen.getByRole('button', { name: /anchor end time/i })
		await user.click(endTrigger)
		await user.click(screen.getByTestId('hour-07'))
		await user.click(screen.getByTestId('minute-30'))
		await user.click(screen.getByRole('button', { name: /done/i }))

		// Daily is default, but let's select it via CustomSelect
		const repeatCombobox = screen.getByRole('combobox', { name: /repeat pattern/i })
		await user.click(repeatCombobox)
		await user.click(screen.getByRole('option', { name: /daily/i }))

		const submitBtn = screen.getByRole('button', {
			name: /create rhythm anchor|save/i,
		})
		await user.click(submitBtn)

		expect(onSave).toHaveBeenCalledTimes(1)
		const savedAnchor = onSave.mock.calls[0][0] as RhythmAnchor
		expect(savedAnchor.title).toBe('Morning Walk')
		expect(savedAnchor.startTime).toBe('06:30')
		expect(savedAnchor.endTime).toBe('07:30')
		expect(savedAnchor.repeat).toEqual({ type: 'daily' })
		expect(savedAnchor.protected).toBe(true)
		expect(savedAnchor.id).toBeDefined()
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('supports selected-days repeat pattern', async () => {
		const user = userEvent.setup()
		const onSave = vi.fn()
		const onClose = vi.fn()

		render(
			<AnchorModal
				isOpen={true}
				onSave={onSave}
				onClose={onClose}
			/>,
		)

		const titleInput = screen.getByLabelText(/title/i)
		await user.type(titleInput, 'Weekend Yoga')

		// Set Start Time to 08:00
		const startTrigger = screen.getByRole('button', { name: /anchor start time/i })
		await user.click(startTrigger)
		await user.click(screen.getByTestId('hour-08'))
		await user.click(screen.getByTestId('minute-00'))
		await user.click(screen.getByRole('button', { name: /done/i }))

		// Set End Time to 09:00
		const endTrigger = screen.getByRole('button', { name: /anchor end time/i })
		await user.click(endTrigger)
		await user.click(screen.getByTestId('hour-09'))
		await user.click(screen.getByTestId('minute-00'))
		await user.click(screen.getByRole('button', { name: /done/i }))

		// Select selected-days
		const repeatCombobox = screen.getByRole('combobox', { name: /repeat pattern/i })
		await user.click(repeatCombobox)
		await user.click(screen.getByRole('option', { name: /selected days/i }))

		// Select Saturday (6) and Sunday (0)
		const satCheckbox = screen.getByLabelText(/saturday|sat/i)
		const sunCheckbox = screen.getByLabelText(/sunday|sun/i)

		// Uncheck default weekdays if any, and check Saturday & Sunday
		if (!satCheckbox.hasAttribute('checked')) {
			await user.click(satCheckbox)
		}
		if (!sunCheckbox.hasAttribute('checked')) {
			await user.click(sunCheckbox)
		}

		// Let's uncheck Monday through Friday if checked
		const monCheckbox = screen.getByLabelText(/monday|mon/i)
		if (monCheckbox.getAttribute('aria-checked') === 'true' || (monCheckbox as HTMLInputElement).checked) {
			await user.click(monCheckbox)
		}

		const submitBtn = screen.getByRole('button', {
			name: /create rhythm anchor|save/i,
		})
		await user.click(submitBtn)

		expect(onSave).toHaveBeenCalledTimes(1)
		const savedAnchor = onSave.mock.calls[0][0] as RhythmAnchor
		expect(savedAnchor.title).toBe('Weekend Yoga')
		expect(savedAnchor.repeat.type).toBe('selected-days')
		if (savedAnchor.repeat.type === 'selected-days') {
			expect(savedAnchor.repeat.days).toContain(6)
			expect(savedAnchor.repeat.days).toContain(0)
		}
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('populates initial values in edit mode and updates anchor', async () => {
		const user = userEvent.setup()
		const onSave = vi.fn()
		const onClose = vi.fn()

		const initialAnchor: RhythmAnchor = {
			id: 'lunch-anchor-1',
			title: 'Lunch',
			startTime: '13:00',
			endTime: '14:00',
			repeat: { type: 'weekdays' },
			protected: true,
		}

		render(
			<AnchorModal
				isOpen={true}
				initialAnchor={initialAnchor}
				onSave={onSave}
				onClose={onClose}
			/>,
		)

		const dialog = screen.getByRole('dialog', {
			name: /edit rhythm anchor|edit anchor/i,
		})
		expect(dialog).toBeInTheDocument()

		const titleInput = screen.getByLabelText(/title/i)
		expect(titleInput).toHaveValue('Lunch')

		await user.clear(titleInput)
		await user.type(titleInput, 'Mindful Lunch & Rest')

		const submitBtn = screen.getByRole('button', {
			name: /save changes|save/i,
		})
		await user.click(submitBtn)

		expect(onSave).toHaveBeenCalledWith({
			id: 'lunch-anchor-1',
			title: 'Mindful Lunch & Rest',
			startTime: '13:00',
			endTime: '14:00',
			repeat: { type: 'weekdays' },
			protected: true,
		})
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('calls onDelete in edit mode when delete button is clicked', async () => {
		const user = userEvent.setup()
		const onDelete = vi.fn()
		const onClose = vi.fn()

		const initialAnchor: RhythmAnchor = {
			id: 'anchor-to-delete',
			title: 'Old Habit',
			startTime: '16:00',
			endTime: '16:30',
			repeat: { type: 'daily' },
			protected: false,
		}

		render(
			<AnchorModal
				isOpen={true}
				initialAnchor={initialAnchor}
				onSave={vi.fn()}
				onDelete={onDelete}
				onClose={onClose}
			/>,
		)

		const deleteBtn = screen.getByRole('button', {
			name: /delete rhythm anchor|delete anchor|delete/i,
		})
		expect(deleteBtn).toBeInTheDocument()

		await user.click(deleteBtn)

		expect(onDelete).toHaveBeenCalledWith('anchor-to-delete')
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('closes on escape key and close button', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()

		const { rerender } = render(
			<AnchorModal
				isOpen={true}
				onSave={vi.fn()}
				onClose={onClose}
			/>,
		)

		await user.keyboard('{Escape}')
		expect(onClose).toHaveBeenCalledTimes(1)

		rerender(
			<AnchorModal
				isOpen={true}
				onSave={vi.fn()}
				onClose={onClose}
			/>,
		)

		const closeBtn = screen.getByRole('button', {
			name: /close modal|close/i,
		})
		await user.click(closeBtn)
		expect(onClose).toHaveBeenCalledTimes(2)
	})
})
