import { render, screen } from '@testing-library/react'
import Home from './page'

test('home offers the Today entry point', () => {
  render(<Home />)
  expect(screen.getByRole('link', { name: /today/i })).toHaveAttribute('href', '/today')
})
