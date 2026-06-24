import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Coffee } from 'lucide-react'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer style={{
      background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      padding: '2.5rem 1.5rem 1.75rem',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Row 1 — Logo + nav links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo-horizontal.svg" alt="Fixturday" width="152" height="26" style={{ height: '26px', width: '152px', opacity: 0.85 }} />
          </Link>

          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { to: '/tournaments', key: 'nav.tournaments' },
              { to: '/guide',       key: 'nav.guide' },
              { to: '/blog',        label: 'Blog' },
              { to: '/changelog',   label: "What's new" },
              { to: '/about',       key: 'nav.about' },
              { to: '/contact',     key: 'nav.contact' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                style={footerNavLink}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
              >
                {item.label ?? t(item.key)}
              </Link>
            ))}
          </div>
        </div>

        {/* Row 1b — Software landing pages */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          paddingBottom: '1.25rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-border)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, flexShrink: 0 }}>
            Software
          </span>
          {[
            { to: '/free-tournament-software',            label: 'Free Tournament Software' },
            { to: '/football-tournament-software',        label: 'Football Tournament' },
            { to: '/beach-volleyball-tournament-software',label: 'Beach Volleyball Tournament' },
            { to: '/tournament-bracket-generator',        label: 'Bracket Generator' },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              style={footerNavLink}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Row 2 — Support link */}
        <div style={{
          textAlign: 'center',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <a
            href="https://www.buymeacoffee.com/endelis"
            target="_blank"
            rel="noopener noreferrer"
            style={coffeeLink}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--color-accent)'
              e.currentTarget.style.borderColor = 'rgba(240,165,0,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--color-text-muted)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            <Coffee size={14} />
            {t('footer.coffee')}
          </a>
        </div>

        {/* Row 3 — Copyright + legal */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <p style={{ color: 'var(--color-border)', fontSize: '0.8rem', margin: 0 }}>
            {t('footer.copyright')}
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            {[
              { to: '/privacy-policy', key: 'footer.privacy' },
              { to: '/terms-of-use',   key: 'footer.terms' },
              { to: '/cookie-policy',  key: 'footer.cookies' },
              { to: '/data-deletion',  key: 'footer.dataDeletion' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                style={legalLink}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-border)'}
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}

const footerNavLink = {
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
  padding: '0.3rem 0.6rem',
  borderRadius: 'var(--radius-sm)',
  transition: 'color var(--transition-fast)',
}

const coffeeLink = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  color: 'var(--color-text-muted)',
  fontSize: '0.8125rem',
  textDecoration: 'none',
  padding: '0.4rem 1rem',
  border: '1px solid var(--color-border)',
  borderRadius: '999px',
  transition: 'color var(--transition-fast), border-color var(--transition-fast)',
}

const legalLink = {
  color: 'var(--color-border)',
  textDecoration: 'none',
  fontSize: '0.775rem',
  transition: 'color var(--transition-fast)',
}
