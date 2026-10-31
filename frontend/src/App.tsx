import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { analyzeCv, pingHealth } from './api/client'
import FileUpload from './components/FileUpload'
import JobDescription from './components/JobDescription'
import JobUrl from './components/JobUrl'
import LanguageSwitcher from './components/LanguageSwitcher'
import ResultCard from './components/ResultCard'
import type { AnalysisResult } from './types'

type JobSource = 'text' | 'url'

export default function App() {
  const { t, i18n } = useTranslation()
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [jobSource, setJobSource] = useState<JobSource>('text')
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

    if (jobSource === 'url') {
      const url = jobUrl.trim()
      if (!url) {
        setError(t('errors.noUrl'))
        return
      }
      if (!/^https?:\/\//i.test(url)) {
        setError(t('errors.invalidUrl'))
        return
      }
    } else if (!jobDescription.trim()) {
      setError(t('errors.noDescription'))
      return
    }

    setLoading(true)
    try {
      const language = i18n.language.startsWith('pl') ? 'pl' : 'en'
      const data = await analyzeCv({
        cvFile,
        jobDescription: jobSource === 'url' ? '' : jobDescription,
        jobUrl: jobSource === 'url' ? jobUrl : '',
        language,
      })
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

        <div className="job-source-toggle" role="tablist" aria-label={t('jobSource.label')}>
          <button
            type="button"
            role="tab"
            aria-selected={jobSource === 'text'}
            className={jobSource === 'text' ? 'active' : ''}
            onClick={() => setJobSource('text')}
          >
            {t('jobSource.text')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={jobSource === 'url'}
            className={jobSource === 'url' ? 'active' : ''}
            onClick={() => setJobSource('url')}
          >
            {t('jobSource.url')}
          </button>
        </div>

        {jobSource === 'url' ? (
          <JobUrl value={jobUrl} onChange={setJobUrl} />
        ) : (
          <JobDescription value={jobDescription} onChange={setJobDescription} />
        )}

        <button className="submit" type="submit" disabled={loading}>
          {loading ? t('app.analyzing') : t('app.analyze')}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {result && <ResultCard result={result} />}
    </div>
  )
}
