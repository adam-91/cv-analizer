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

function Keywords({
  title,
  items,
  variant,
}: {
  title: string
  items: string[]
  variant: 'matched' | 'missing'
}) {
  if (!items || items.length === 0) return null

  return (
    <div className="keywords">
      <h3>{title}</h3>
      <div className="keywords-list">
        {items.map((item, index) => (
          <span key={index} className={`chip ${variant}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ResultCard({ result }: Props) {
  const { t } = useTranslation()
  const score = Math.max(0, Math.min(100, result.score))

  return (
    <div className="result-card">
      <div className="score">
        <span className="score-value">{result.score}</span>
        <span className="score-label">{t('result.scoreOutOf')}</span>
      </div>

      <div
        className="score-bar"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="score-bar-fill" style={{ width: `${score}%` }} />
      </div>

      <p className="summary">{result.summary}</p>

      <Section title={t('result.strengths')} items={result.strengths} />
      <Section title={t('result.gaps')} items={result.gaps} />
      <Section title={t('result.suggestions')} items={result.suggestions} />
      <Keywords
        title={t('result.matchedKeywords')}
        items={result.matched_keywords}
        variant="matched"
      />
      <Keywords
        title={t('result.missingKeywords')}
        items={result.missing_keywords}
        variant="missing"
      />
    </div>
  )
}
