import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import JobDescription from './JobDescription'

describe('JobDescription', () => {
  it('renders a textarea with the placeholder', () => {
    render(<JobDescription value="" onChange={() => {}} />)

    const textarea = screen.getByPlaceholderText('Wklej tutaj treść ogłoszenia o pracę…')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveValue('')
  })

  it('displays the provided value', () => {
    render(<JobDescription value="Senior Developer" onChange={() => {}} />)

    expect(screen.getByPlaceholderText(/ogłoszenia o pracę/)).toHaveValue('Senior Developer')
  })

  it('calls onChange when the user types', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<JobDescription value="" onChange={onChange} />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'abc')

    expect(onChange).toHaveBeenCalled()
  })
})
