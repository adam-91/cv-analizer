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
      <span className={`dropzone${file ? ' file-selected' : ''}`}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {file ? file.name : t('upload.placeholder')}
      </span>
    </label>
  )
}
