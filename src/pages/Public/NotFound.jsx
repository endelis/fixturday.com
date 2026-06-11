import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PublicNav from '../../components/PublicNav'

export default function NotFound() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = `${t('notFound.title')} — Fixturday`
    return () => { document.title = 'Fixturday' }
  }, [t])

  return (
    <div style={{ background: '#0a1628', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNav />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem',
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(5rem, 15vw, 8rem)',
          fontWeight: 800,
          color: 'rgba(240,165,0,0.15)',
          lineHeight: 1,
          marginBottom: '1.5rem',
          letterSpacing: '-0.02em',
        }}>
          404
        </div>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
          fontWeight: 700,
          color: '#e0e8f4',
          marginBottom: '0.75rem',
        }}>
          {t('notFound.title')}
        </h1>
        <p style={{
          color: '#8fa3bc',
          fontSize: '1rem',
          marginBottom: '2rem',
          maxWidth: '28rem',
          lineHeight: 1.6,
        }}>
          {t('notFound.subtitle')}
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.65rem 1.5rem',
            background: '#f0a500',
            color: '#0a1628',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.9375rem',
          }}
        >
          {t('notFound.back')}
        </Link>
      </div>
    </div>
  )
}
