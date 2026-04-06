import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'fixturday_cookie_consent'

export default function CookieBanner() {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem(STORAGE_KEY)
  )

  if (dismissed) return null

  function accept(value) {
    localStorage.setItem(STORAGE_KEY, value)
    setDismissed(true)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#0d1b2e',
      borderTop: '1px solid rgba(240,165,0,0.35)',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        flexWrap: 'wrap',
      }}>
        <p style={{
          flex: 1,
          minWidth: '240px',
          margin: 0,
          fontSize: '0.875rem',
          color: '#8fa3bc',
          lineHeight: 1.55,
        }}>
          {t('cookies.bannerText')}{' '}
          <Link to="/privatuma-politika" style={{ color: '#f0a500', textDecoration: 'underline' }}>
            {t('cookies.privacyLink')}
          </Link>
          {' · '}
          <Link to="/sikdatnu-politika" style={{ color: '#f0a500', textDecoration: 'underline' }}>
            {t('cookies.cookiesLink')}
          </Link>
        </p>

        <div style={{ display: 'flex', gap: '0.625rem', flexShrink: 0, flexWrap: 'wrap' }}>
          <button
            onClick={() => accept('functional')}
            style={{
              border: '1px solid rgba(240,165,0,0.55)',
              color: '#f0a500',
              background: 'none',
              borderRadius: '6px',
              padding: '0.5rem 1.1rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-body)',
            }}
          >
            {t('cookies.acceptFunctional')}
          </button>
          <button
            onClick={() => accept('all')}
            style={{
              background: '#f0a500',
              color: '#0d1b2e',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 1.25rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-body)',
            }}
          >
            {t('cookies.acceptAll')}
          </button>
        </div>
      </div>
    </div>
  )
}
