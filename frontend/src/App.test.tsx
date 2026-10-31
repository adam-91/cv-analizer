import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { analyzeCv, pingHealth } from './api/client'
import type { AnalysisResult } from './types'

vi.mock('./api/client', () => ({
  analyzeCv: vi.fn(),
  pingHealth: vi.fn(),
}))

const mockedAnalyzeCv = vi.mocked(analyzeCv)
const mockedPingHealth = vi.mocked(pingHealth)

const cvFile = new File(['cv'], 'resume.pdf', { type: 'application/pdf' })

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    score: 80,
    summary: 'Looks good',
    strengths: [],
    gaps: [],
    suggestions: [],
    matched_keywords: [],
    missing_keywords: [],
    ...overrides,
  }
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByLabelText('Wybierz plik CV (PDF)'), cvFile)
  await user.type(screen.getByPlaceholderText(/ogłoszenia o pracę/), 'Job description')
  await user.click(screen.getByRole('button', { name: 'Przeanalizuj moje CV' }))
}

beforeEach(() => {
  mockedPingHealth.mockResolvedValue(undefined)
  mockedAnalyzeCv.mockReset()
})

describe('App', () => {
  it('shows an error when submitting without a file', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Przeanalizuj moje CV' }))

    expect(screen.getByText('Wybierz plik CV.')).toBeInTheDocument()
    expect(mockedAnalyzeCv).not.toHaveBeenCalled()
  })

  it('shows an error when submitting without a job description', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.upload(screen.getByLabelText('Wybierz plik CV (PDF)'), cvFile)
    await user.click(screen.getByRole('button', { name: 'Przeanalizuj moje CV' }))

    expect(screen.getByText('Wklej treść ogłoszenia o pracę.')).toBeInTheDocument()
    expect(mockedAnalyzeCv).not.toHaveBeenCalled()
  })

  it('submits the form and displays the result', async () => {
    const user = userEvent.setup()
    mockedAnalyzeCv.mockResolvedValue(makeResult({ summary: 'Great match' }))
    render(<App />)

    await fillAndSubmit(user)

    expect(mockedAnalyzeCv).toHaveBeenCalledWith({
      cvFile,
      jobDescription: 'Job description',
      jobUrl: '',
      language: 'pl',
    })
    expect(await screen.findByText('Great match')).toBeInTheDocument()
  })

  it('shows the loading state while the request is in flight', async () => {
    const user = userEvent.setup()
    let resolve!: (value: AnalysisResult) => void
    mockedAnalyzeCv.mockReturnValue(new Promise((res) => (resolve = res)))
    render(<App />)

    await fillAndSubmit(user)

    expect(screen.getByRole('button', { name: 'Analizowanie…' })).toBeDisabled()

    resolve(makeResult({ summary: 'Done' }))
    expect(await screen.findByText('Done')).toBeInTheDocument()
  })

  it('shows the API error message when the request fails', async () => {
    const user = userEvent.setup()
    mockedAnalyzeCv.mockRejectedValue(new Error('Server exploded'))
    render(<App />)

    await fillAndSubmit(user)

    expect(await screen.findByText('Server exploded')).toBeInTheDocument()
  })

  it('submits a URL when the link mode is selected', async () => {
    const user = userEvent.setup()
    mockedAnalyzeCv.mockResolvedValue(makeResult({ summary: 'From URL' }))
    render(<App />)

    await user.upload(screen.getByLabelText('Wybierz plik CV (PDF)'), cvFile)
    await user.click(screen.getByRole('tab', { name: 'Wklej link' }))
    await user.type(screen.getByPlaceholderText(/link do oferty pracy/), 'https://example.com/job')
    await user.click(screen.getByRole('button', { name: 'Przeanalizuj moje CV' }))

    expect(mockedAnalyzeCv).toHaveBeenCalledWith({
      cvFile,
      jobDescription: '',
      jobUrl: 'https://example.com/job',
      language: 'pl',
    })
    expect(await screen.findByText('From URL')).toBeInTheDocument()
  })

  it('shows an error when submitting an empty URL', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.upload(screen.getByLabelText('Wybierz plik CV (PDF)'), cvFile)
    await user.click(screen.getByRole('tab', { name: 'Wklej link' }))
    await user.click(screen.getByRole('button', { name: 'Przeanalizuj moje CV' }))

    expect(screen.getByText('Wklej link do oferty pracy.')).toBeInTheDocument()
    expect(mockedAnalyzeCv).not.toHaveBeenCalled()
  })

  it('shows an error for an invalid URL scheme', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.upload(screen.getByLabelText('Wybierz plik CV (PDF)'), cvFile)
    await user.click(screen.getByRole('tab', { name: 'Wklej link' }))
    await user.type(screen.getByPlaceholderText(/link do oferty pracy/), 'not-a-url')
    await user.click(screen.getByRole('button', { name: 'Przeanalizuj moje CV' }))

    expect(screen.getByText('Link musi zaczynać się od http:// lub https://.')).toBeInTheDocument()
    expect(mockedAnalyzeCv).not.toHaveBeenCalled()
  })
})
