import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '../types'

interface Props {
  result: AnalysisResult
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null

  return (
    <div className="section">
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default function ResultCard({ result }: Props) {
  const { t } = useTranslation()

  return (
    <div className="result-card">
      <div className="score">
        <span className="score-value">{result.score}</span>
        <span className="score-label">{t('result.scoreOutOf')}</span>
      </div>

      <p className="summary">{result.summary}</p>

      <Section title={t('result.strengths')} items={result.strengths} />
      <Section title={t('result.gaps')} items={result.gaps} />
      <Section title={t('result.suggestions')} items={result.suggestions} />
      <Section title={t('result.matchedKeywords')} items={result.matched_keywords} />
      <Section title={t('result.missingKeywords')} items={result.missing_keywords} />
    </div>
  )
}
