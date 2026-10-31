import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import JobUrl from './JobUrl'

describe('JobUrl', () => {
  it('renders an input with the placeholder', () => {
    render(<JobUrl value="" onChange={() => {}} />)

    const input = screen.getByPlaceholderText('Wklej link do oferty pracy…')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('displays the provided value', () => {
    render(<JobUrl value="https://example.com/job" onChange={() => {}} />)

    expect(screen.getByPlaceholderText(/link do oferty pracy/)).toHaveValue(
      'https://example.com/job',
    )
  })

  it('calls onChange when the user types', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<JobUrl value="" onChange={onChange} />)

    await user.type(screen.getByPlaceholderText(/link do oferty pracy/), 'abc')

    expect(onChange).toHaveBeenCalled()
  })
})
