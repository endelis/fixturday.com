import { useTranslation } from 'react-i18next'

const LANGS = ['en', 'lv']

export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation()
  const current = i18n.language

  return (
    <div style={{
      display: 'flex',
      gap: '2px',
      background: 'rgba(255,255,255,0.07)',
      borderRadius: '6px',
      padding: '2px',
      flexShrink: 0,
    }}>
      {LANGS.map(lang => (
        <button
          key={lang}
          onClick={() => i18n.changeLanguage(lang)}
          style={{
            background: current === lang ? '#f0a500' : 'transparent',
            color: current === lang ? '#0a1628' : '#8fa3bc',
            border: 'none',
            borderRadius: '4px',
            fontSize: compact ? '0.7rem' : '0.75rem',
            fontWeight: 700,
            padding: compact ? '0.2rem 0.45rem' : '0.25rem 0.5rem',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 150ms',
            minHeight: compact ? '24px' : '28px',
            minWidth: compact ? '28px' : '32px',
          }}
        >
          {lang}
        </button>
      ))}
    </div>
  )
}
