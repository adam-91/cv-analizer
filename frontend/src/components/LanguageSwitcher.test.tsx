import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import LanguageSwitcher from './LanguageSwitcher'

describe('LanguageSwitcher', () => {
  it('renders PL and EN buttons', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByRole('button', { name: 'PL' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
  })

  it('marks the current language as active', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByRole('button', { name: 'PL' })).toHaveClass('active')
    expect(screen.getByRole('button', { name: 'EN' })).not.toHaveClass('active')
  })

  it('switches language and persists it to localStorage', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(localStorage.getItem('language')).toBe('en')
    expect(screen.getByRole('button', { name: 'EN' })).toHaveClass('active')
    expect(screen.getByRole('button', { name: 'PL' })).not.toHaveClass('active')
  })
})
