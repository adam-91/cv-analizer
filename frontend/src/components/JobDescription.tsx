import { useTranslation } from 'react-i18next'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function JobDescription({ value, onChange }: Props) {
  const { t } = useTranslation()

  return (
    <textarea
      className="job-description"
      placeholder={t('jobDescription.placeholder')}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={8}
    />
  )
}
