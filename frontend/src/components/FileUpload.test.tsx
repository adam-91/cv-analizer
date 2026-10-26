import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import FileUpload from './FileUpload'

describe('FileUpload', () => {
  it('renders the placeholder when no file is selected', () => {
    render(<FileUpload file={null} onChange={() => {}} />)

    expect(screen.getByText('Wybierz plik CV (PDF)')).toBeInTheDocument()
  })

  it('renders the file name when a file is selected', () => {
    const file = new File(['cv'], 'resume.pdf', { type: 'application/pdf' })
    render(<FileUpload file={file} onChange={() => {}} />)

    expect(screen.getByText('resume.pdf')).toBeInTheDocument()
    expect(screen.queryByText('Wybierz plik CV (PDF)')).not.toBeInTheDocument()
  })

  it('calls onChange with the selected file', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FileUpload file={null} onChange={onChange} />)

    const input = screen.getByLabelText('Wybierz plik CV (PDF)')
    const file = new File(['cv'], 'resume.pdf', { type: 'application/pdf' })
    await user.upload(input, file)

    expect(onChange).toHaveBeenCalledWith(file)
  })

  it('calls onChange with null when the selection is cleared', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const file = new File(['cv'], 'resume.pdf', { type: 'application/pdf' })
    render(<FileUpload file={file} onChange={onChange} />)

    const input = screen.getByLabelText('resume.pdf')
    // Select a file first so the input's file list is non-empty, then clear it.
    await user.upload(input, file)
    await user.upload(input, [])

    expect(onChange).toHaveBeenLastCalledWith(null)
  })
})
