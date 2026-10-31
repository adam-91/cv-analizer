import { useTranslation } from 'react-i18next'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function JobUrl({ value, onChange }: Props) {
  const { t } = useTranslation()

  return (
    <input
      className="job-url"
      type="text"
      inputMode="url"
      autoComplete="url"
      placeholder={t('jobUrl.placeholder')}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
