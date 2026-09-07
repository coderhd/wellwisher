import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { IntentionModal } from '../../src/components/modals/IntentionModal'
import type { FlexibleIntention } from '../../src/domain/planning/types'

describe('IntentionModal', () => {
	it('does not render anything when isOpen is false', () => {
		const { container } = render(
			<IntentionModal
				isOpen={false}
				onSave={vi.fn()}
				onClose={vi.fn()}
			/>,
		)

		expect(container).toBeEmptyDOMElement()
	})

	it('renders dialog with all intention form fields when open', () => {
		render(
			<IntentionModal
				isOpen={true}
				onSave={vi.fn()}
				onClose={vi.fn()}
			/>,
		)

		const dialog = screen.getByRole('dialog', { name: /new intention/i })
		expect(dialog).toBeInTheDocument()
		expect(dialog).toHaveAttribute('aria-modal', 'true')

		expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/kind/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/duration/i)).toBeInTheDocument()
		expect(
			screen.getByLabelText(/preferred window|window/i),
		).toBeInTheDocument()
		expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /create intention|save/i }),
		).toBeInTheDocument()
	})

	it('validates empty title and prevents submission', async () => {
		const user = userEvent.setup()
		const onSave = vi.fn()

		render(
			<IntentionModal
				isOpen={true}
				onSave={onSave}
				onClose={vi.fn()}
			/>,
		)

		const submitBtn = screen.getByRole('button', {
			name: /create intention|save/i,
		})
		await user.click(submitBtn)

		expect(onSave).not.toHaveBeenCalled()
		expect(screen.getByRole('alert')).toHaveTextContent(
			/title is required/i,
		)
	})

	it('creates a new intention and calls onSave with generated id', async () => {
		const user = userEvent.setup()
		const onSave = vi.fn()
		const onClose = vi.fn()

		render(
			<IntentionModal
				isOpen={true}
				onSave={onSave}
				onClose={onClose}
			/>,
		)

		const titleInput = screen.getByLabelText(/title/i)
		await user.type(titleInput, 'Evening Reading')

		const kindSelect = screen.getByLabelText(/kind/i)
		await user.selectOptions(kindSelect, 'leisure')

		const durationSelect = screen.getByLabelText(/duration/i)
		await user.selectOptions(durationSelect, '45')

		const windowSelect = screen.getByLabelText(/preferred window|window/i)
		await user.selectOptions(windowSelect, 'evening')

		const prioritySelect = screen.getByLabelText(/priority/i)
		await user.selectOptions(prioritySelect, '2')

		const submitBtn = screen.getByRole('button', {
			name: /create intention|save/i,
		})
		await user.click(submitBtn)

		expect(onSave).toHaveBeenCalledTimes(1)
		const savedIntention = onSave.mock.calls[0][0] as FlexibleIntention
		expect(savedIntention.title).toBe('Evening Reading')
		expect(savedIntention.kind).toBe('leisure')
		expect(savedIntention.durationMinutes).toBe(45)
		expect(savedIntention.preferredWindow).toBe('evening')
		expect(savedIntention.priority).toBe(2)
		expect(savedIntention.id).toBeDefined()
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('populates initial values in edit mode and allows updating', async () => {
		const user = userEvent.setup()
		const onSave = vi.fn()
		const onClose = vi.fn()

		const initialIntention: FlexibleIntention = {
			id: 'existing-intention-1',
			title: 'Deep Architecture',
			kind: 'work',
			durationMinutes: 90,
			preferredWindow: 'morning',
			priority: 1,
		}

		render(
			<IntentionModal
				isOpen={true}
				initialIntention={initialIntention}
				onSave={onSave}
				onClose={onClose}
			/>,
		)

		const dialog = screen.getByRole('dialog', { name: /edit intention/i })
		expect(dialog).toBeInTheDocument()

		const titleInput = screen.getByLabelText(/title/i)
		expect(titleInput).toHaveValue('Deep Architecture')

		await user.clear(titleInput)
		await user.type(titleInput, 'Refined Architecture')

		const submitBtn = screen.getByRole('button', {
			name: /save changes|save/i,
		})
		await user.click(submitBtn)

		expect(onSave).toHaveBeenCalledWith({
			id: 'existing-intention-1',
			title: 'Refined Architecture',
			kind: 'work',
			durationMinutes: 90,
			preferredWindow: 'morning',
			priority: 1,
		})
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('calls onDelete in edit mode when delete button is clicked', async () => {
		const user = userEvent.setup()
		const onDelete = vi.fn()
		const onClose = vi.fn()

		const initialIntention: FlexibleIntention = {
			id: 'to-delete-123',
			title: 'Obsolete Task',
			kind: 'work',
			durationMinutes: 30,
			priority: 3,
		}

		render(
			<IntentionModal
				isOpen={true}
				initialIntention={initialIntention}
				onSave={vi.fn()}
				onDelete={onDelete}
				onClose={onClose}
			/>,
		)

		const deleteBtn = screen.getByRole('button', {
			name: /delete intention|delete/i,
		})
		expect(deleteBtn).toBeInTheDocument()

		await user.click(deleteBtn)

		expect(onDelete).toHaveBeenCalledWith('to-delete-123')
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('closes on escape key press', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()

		render(
			<IntentionModal
				isOpen={true}
				onSave={vi.fn()}
				onClose={onClose}
			/>,
		)

		await user.keyboard('{Escape}')
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('closes on close button click and cancel button click', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()

		const { rerender } = render(
			<IntentionModal
				isOpen={true}
				onSave={vi.fn()}
				onClose={onClose}
			/>,
		)

		const closeBtn = screen.getByRole('button', {
			name: /close modal|close/i,
		})
		await user.click(closeBtn)
		expect(onClose).toHaveBeenCalledTimes(1)

		rerender(
			<IntentionModal
				isOpen={true}
				onSave={vi.fn()}
				onClose={onClose}
			/>,
		)

		const cancelBtn = screen.getByRole('button', { name: /cancel/i })
		await user.click(cancelBtn)
		expect(onClose).toHaveBeenCalledTimes(2)
	})
})
