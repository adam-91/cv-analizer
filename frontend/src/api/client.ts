import type { AnalysisResult } from '../types'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (data?.detail) {
      return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    }
  } catch {
    // fall through
  }
  return `Request failed with status ${res.status}`
}

export async function pingHealth(): Promise<void> {
  await fetch(`${API_URL}/api/health`)
}

export async function analyzeCv(
  cvFile: File,
  jobDescription: string,
  language: string,
): Promise<AnalysisResult> {
  const form = new FormData()
  form.append('cv_file', cvFile)
  form.append('job_description', jobDescription)
  form.append('language', language)

  const res = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    throw new Error(await readErrorDetail(res))
  }

  return (await res.json()) as AnalysisResult
}
