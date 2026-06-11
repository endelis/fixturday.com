import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import lv from './locales/lv.json'
import en from './locales/en.json'

const STORAGE_KEY = 'fixturday_lang'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    lv: { translation: lv },
  },
  lng: localStorage.getItem(STORAGE_KEY) ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lang) => {
  localStorage.setItem(STORAGE_KEY, lang)
})

export default i18n
