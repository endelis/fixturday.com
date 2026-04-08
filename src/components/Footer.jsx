import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer style={{
      background: '#060f1c',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '2rem 1.5rem 1.5rem',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Row 1 — Logo + nav links */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem',
          paddingBottom: '1.25rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo-horizontal.svg" alt="Fixturday" style={{ height: '22px', opacity: 0.85 }} />
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link to="/turniri"   style={navLink}>{t('nav.tournaments')}</Link>
            <Link to="/pamaciba"  style={navLink}>{t('nav.guide')}</Link>
            <Link to="/par-mums"  style={navLink}>{t('nav.about')}</Link>
            <Link to="/kontakti"  style={navLink}>{t('nav.contact')}</Link>
          </div>
        </div>

        {/* Row 2 — Buy me a coffee */}
        <div style={{
          textAlign: 'center',
          paddingBottom: '1.25rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <a
            href="https://www.buymeacoffee.com/endelis"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#3a506b',
              fontSize: '0.8rem',
              textDecoration: 'none',
              transition: 'color 150ms',
              padding: '0.4rem 0.875rem',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '999px',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f0a500'}
            onMouseLeave={e => e.currentTarget.style.color = '#3a506b'}
          >
            ☕ Fixturday ir bezmaksas. Ja noderēja — paskaties kafiju.
          </a>
        </div>

        {/* Row 3 — Copyright + legal links */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <p style={{ color: '#3a506b', fontSize: '0.8rem', margin: 0 }}>
            {t('footer.copyright')}
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <Link to="/privatuma-politika"    style={legalLink}>{t('footer.privacy')}</Link>
            <Link to="/lietosanas-noteikumi"  style={legalLink}>{t('footer.terms')}</Link>
            <Link to="/sikdatnu-politika"     style={legalLink}>{t('footer.cookies')}</Link>
            <Link to="/datu-dzesana"          style={legalLink}>{t('footer.dataDeletion')}</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}

const navLink = {
  color: '#3a506b',
  textDecoration: 'none',
  fontSize: '0.875rem',
  transition: 'color 150ms',
}

const legalLink = {
  color: '#3a506b',
  textDecoration: 'none',
  fontSize: '0.775rem',
  transition: 'color 150ms',
}
