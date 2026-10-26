import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ResultCard from './ResultCard'
import type { AnalysisResult } from '../types'

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    score: 75,
    summary: 'Great fit for the role',
    strengths: ['Strong experience'],
    gaps: ['Missing skill'],
    suggestions: ['Add a summary'],
    matched_keywords: ['react'],
    missing_keywords: ['python'],
    ...overrides,
  }
}

describe('ResultCard', () => {
  it('renders the score and summary', () => {
    render(<ResultCard result={makeResult()} />)

    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.getByText('/ 100')).toBeInTheDocument()
    expect(screen.getByText('Great fit for the role')).toBeInTheDocument()
  })

  it('clamps the progress bar to 100', () => {
    render(<ResultCard result={makeResult({ score: 150 })} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('clamps the progress bar to 0', () => {
    render(<ResultCard result={makeResult({ score: -10 })} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('renders sections with their items', () => {
    render(<ResultCard result={makeResult()} />)

    expect(screen.getByText('Mocne strony')).toBeInTheDocument()
    expect(screen.getByText('Strong experience')).toBeInTheDocument()
    expect(screen.getByText('Braki')).toBeInTheDocument()
    expect(screen.getByText('Missing skill')).toBeInTheDocument()
    expect(screen.getByText('Wskazówki')).toBeInTheDocument()
    expect(screen.getByText('Add a summary')).toBeInTheDocument()
  })

  it('hides empty sections', () => {
    render(<ResultCard result={makeResult({ gaps: [], suggestions: [] })} />)

    expect(screen.queryByText('Braki')).not.toBeInTheDocument()
    expect(screen.queryByText('Wskazówki')).not.toBeInTheDocument()
    expect(screen.getByText('Mocne strony')).toBeInTheDocument()
  })

  it('renders keyword chips with the correct variant', () => {
    render(<ResultCard result={makeResult()} />)

    expect(screen.getByText('react')).toHaveClass('matched')
    expect(screen.getByText('python')).toHaveClass('missing')
  })

  it('hides empty keyword groups', () => {
    render(<ResultCard result={makeResult({ matched_keywords: [], missing_keywords: [] })} />)

    expect(screen.queryByText('Dopasowane słowa kluczowe')).not.toBeInTheDocument()
    expect(screen.queryByText('Brakujące słowa kluczowe')).not.toBeInTheDocument()
  })
})
