import { useTranslation } from 'react-i18next'
import type { ChangeEvent } from 'react'

interface Props {
  file: File | null
  onChange: (file: File | null) => void
}

export default function FileUpload({ file, onChange }: Props) {
  const { t } = useTranslation()

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null)
  }

  return (
    <label className="file-upload">
      <input type="file" accept=".pdf,application/pdf" onChange={handleChange} />
      <span className={file ? 'file-selected' : ''}>
        {file ? file.name : t('upload.placeholder')}
      </span>
    </label>
  )
}
