import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import pl from './locales/pl.json'

const storedLanguage = localStorage.getItem('language')

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pl: { translation: pl },
  },
  lng: storedLanguage ?? 'pl',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
