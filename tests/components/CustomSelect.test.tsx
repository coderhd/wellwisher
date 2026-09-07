import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { CustomSelect, type CustomSelectOption } from '../../src/components/ui/CustomSelect'

const mockOptions: CustomSelectOption[] = [
	{ value: 'morning', label: 'Morning window (06:00 – 12:00)' },
	{ value: 'afternoon', label: 'Afternoon window (12:00 – 18:00)' },
	{ value: 'evening', label: 'Evening window (18:00 – 24:00)' },
]

function TestSelectWrapper ({ initialValue = 'morning' }: { initialValue?: string }) {
	const [val, setVal] = useState(initialValue)
	return (
		<div>
			<label id='select-label'>Preferred Window</label>
			<CustomSelect
				value={val}
				onChange={setVal}
				options={mockOptions}
				ariaLabel='Preferred Window'
			/>
			<span data-testid='selected-value'>{val}</span>
		</div>
	)
}

describe('CustomSelect component', () => {
	afterEach(cleanup)

	it('renders trigger button showing active selection label', () => {
		render(<TestSelectWrapper initialValue='afternoon' />)
		const trigger = screen.getByRole('combobox', { name: /preferred window/i })
		expect(trigger).toBeInTheDocument()
		expect(trigger).toHaveTextContent(/afternoon window/i)
	})

	it('opens custom options listbox on click and allows selecting an option', async () => {
		const user = userEvent.setup()
		render(<TestSelectWrapper initialValue='morning' />)

		const trigger = screen.getByRole('combobox', { name: /preferred window/i })
		await user.click(trigger)

		const listbox = screen.getByRole('listbox')
		expect(listbox).toBeInTheDocument()

		const eveningOption = screen.getByRole('option', { name: /evening window/i })
		await user.click(eveningOption)

		expect(screen.getByTestId('selected-value')).toHaveTextContent('evening')
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
	})

	it('closes dropdown when Escape key is pressed', async () => {
		const user = userEvent.setup()
		render(<TestSelectWrapper initialValue='morning' />)

		const trigger = screen.getByRole('combobox', { name: /preferred window/i })
		await user.click(trigger)
		expect(screen.getByRole('listbox')).toBeInTheDocument()

		fireEvent.keyDown(document, { key: 'Escape' })
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
	})
})
