import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { analyzeCv, pingHealth } from './api/client'
import FileUpload from './components/FileUpload'
import JobDescription from './components/JobDescription'
import LanguageSwitcher from './components/LanguageSwitcher'
import ResultCard from './components/ResultCard'
import type { AnalysisResult } from './types'

export default function App() {
  const { t, i18n } = useTranslation()
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    pingHealth().catch(() => {})
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!cvFile) {
      setError(t('errors.noFile'))
      return
    }
    if (!jobDescription.trim()) {
      setError(t('errors.noDescription'))
      return
    }

    setLoading(true)
    try {
      const language = i18n.language.startsWith('pl') ? 'pl' : 'en'
      const data = await analyzeCv(cvFile, jobDescription, language)
      setResult(data)
    } catch (err) {
      console.error('[cv-analizer] analyze error:', err)
      setError(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <img className="logo" src="/logo.png" alt={t('app.title')} />
          <div>
            <h1 className="app-title">{t('app.title')}</h1>
            <p className="app-tagline">{t('app.tagline')}</p>
          </div>
        </div>
        <LanguageSwitcher />
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <FileUpload file={cvFile} onChange={setCvFile} />
        <JobDescription value={jobDescription} onChange={setJobDescription} />
        <button className="submit" type="submit" disabled={loading}>
          {loading ? t('app.analyzing') : t('app.analyze')}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {result && <ResultCard result={result} />}
    </div>
  )
}
