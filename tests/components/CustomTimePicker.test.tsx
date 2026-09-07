import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { CustomTimePicker } from '../../src/components/ui/CustomTimePicker'

function TestTimePickerWrapper ({ initialValue = '08:30' }: { initialValue?: string }) {
	const [time, setTime] = useState(initialValue)
	return (
		<div>
			<label htmlFor='test-time'>Select Time</label>
			<CustomTimePicker
				id='test-time'
				value={time}
				onChange={setTime}
				ariaLabel='Start time'
			/>
			<span data-testid='selected-time'>{time}</span>
		</div>
	)
}

describe('CustomTimePicker component', () => {
	afterEach(cleanup)

	it('renders trigger button displaying current time', () => {
		render(<TestTimePickerWrapper initialValue='09:15' />)
		const trigger = screen.getByRole('button', { name: /start time|09:15/i })
		expect(trigger).toBeInTheDocument()
		expect(trigger).toHaveTextContent('09:15')
	})

	it('opens custom popover on trigger click without native browser popup', async () => {
		const user = userEvent.setup()
		render(<TestTimePickerWrapper initialValue='14:30' />)

		const trigger = screen.getByRole('button', { name: /start time|14:30/i })
		await user.click(trigger)

		expect(screen.getByRole('dialog')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /^hour 14$/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /^minute 30$/i })).toBeInTheDocument()
	})

	it('selects new hour and minute and updates value', async () => {
		const user = userEvent.setup()
		render(<TestTimePickerWrapper initialValue='08:00' />)

		const trigger = screen.getByRole('button', { name: /start time|08:00/i })
		await user.click(trigger)

		// Select Hour 10
		const hourBtn = screen.getByRole('button', { name: /hour 10/i })
		await user.click(hourBtn)

		// Select Minute 45
		const minBtn = screen.getByRole('button', { name: /minute 45/i })
		await user.click(minBtn)

		// Close by clicking confirm or outside
		const confirmBtn = screen.queryByRole('button', { name: /done|set time|confirm/i })
		if (confirmBtn) {
			await user.click(confirmBtn)
		}

		expect(screen.getByTestId('selected-time')).toHaveTextContent('10:45')
	})

	it('closes popover on Escape key press', async () => {
		const user = userEvent.setup()
		render(<TestTimePickerWrapper initialValue='12:00' />)

		const trigger = screen.getByRole('button', { name: /start time|12:00/i })
		await user.click(trigger)
		expect(screen.getByRole('dialog')).toBeInTheDocument()

		fireEvent.keyDown(document, { key: 'Escape' })
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})
})
