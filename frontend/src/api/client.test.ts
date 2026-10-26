import { afterEach, describe, expect, it, vi } from 'vitest'

import { analyzeCv, pingHealth } from './client'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const cvFile = new File(['cv-content'], 'resume.pdf', { type: 'application/pdf' })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('analyzeCv', () => {
  it('sends a POST to /api/analyze with multipart FormData', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ score: 42 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await analyzeCv(cvFile, 'job description', 'pl')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/analyze')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)

    const form = init.body as FormData
    expect(form.get('cv_file')).toBe(cvFile)
    expect(form.get('job_description')).toBe('job description')
    expect(form.get('language')).toBe('pl')

    expect(result).toEqual({ score: 42 })
  })

  it('returns the parsed JSON when the response is ok', async () => {
    const payload = {
      score: 80,
      summary: 'summary',
      strengths: ['a'],
      gaps: [],
      suggestions: [],
      matched_keywords: ['x'],
      missing_keywords: [],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(payload)))

    await expect(analyzeCv(cvFile, 'desc', 'en')).resolves.toEqual(payload)
  })

  it('throws the detail message when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'Bad request' }, 400)))

    await expect(analyzeCv(cvFile, 'desc', 'en')).rejects.toThrow('Bad request')
  })

  it('stringifies a non-string detail payload', async () => {
    const detail = { field: 'error' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail }, 422)))

    await expect(analyzeCv(cvFile, 'desc', 'en')).rejects.toThrow(JSON.stringify(detail))
  })

  it('falls back to the status message when there is no detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 500)))

    await expect(analyzeCv(cvFile, 'desc', 'en')).rejects.toThrow('Request failed with status 500')
  })

  it('falls back to the status message when the body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Internal Server Error', { status: 500 })))

    await expect(analyzeCv(cvFile, 'desc', 'en')).rejects.toThrow('Request failed with status 500')
  })
})

describe('pingHealth', () => {
  it('calls GET /api/health', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await pingHealth()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/health')
  })
})
