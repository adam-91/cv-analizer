import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language.startsWith('pl') ? 'pl' : 'en'

  const change = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('language', lng)
  }

  return (
    <div className="lang-switcher">
      <button
        type="button"
        className={current === 'pl' ? 'active' : ''}
        onClick={() => change('pl')}
      >
        PL
      </button>
      <button
        type="button"
        className={current === 'en' ? 'active' : ''}
        onClick={() => change('en')}
      >
        EN
      </button>
    </div>
  )
}
