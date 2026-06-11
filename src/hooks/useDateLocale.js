import { useTranslation } from 'react-i18next'
import { lv } from 'date-fns/locale'
import { enGB } from 'date-fns/locale'

const LOCALE_MAP = {
  lv,
  en: enGB,
}

export function useDateLocale() {
  const { i18n } = useTranslation()
  return LOCALE_MAP[i18n.language] ?? enGB
}
