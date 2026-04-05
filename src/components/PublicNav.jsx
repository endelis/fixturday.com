import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * Public navigation bar.
 * Props:
 *   tournament        – current tournament object (optional, for breadcrumb)
 *   ageGroups         – sibling age groups (kept for Schedule/Standings compat)
 *   activeAgeGroupId  – active age group id (kept for Schedule/Standings compat)
 *
 * When no tournament is provided, shows standard nav links.
 */
export default function PublicNav({ tournament, ageGroups = [], activeAgeGroupId }) {
  const { t } = useTranslation()
  return (
    <nav style={{
      background: '#0d1b2e',
      borderBottom: '1px solid #1e3a5f',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '60px',
          gap: '0.75rem',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}
        >
          <img src="/logo-horizontal.svg" alt="Fixturday" style={{ height: '26px', display: 'block' }} />
        </Link>

        {tournament ? (
          <>
            {/* Tournament breadcrumb */}
            <span style={{ color: '#2e4a68', fontSize: '1.1rem', flexShrink: 0, lineHeight: 1 }}>›</span>
            <Link
              to={`/t/${tournament.slug}`}
              style={{
                color: '#8fa3bc',
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '180px',
                textDecoration: 'none',
              }}
            >
              {tournament.name}
            </Link>

            {/* Age group tab switcher */}
            {ageGroups.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '0.4rem',
                flexWrap: 'wrap',
                marginLeft: 'auto',
                alignItems: 'center',
              }}>
                {ageGroups.map(ag => {
                  const isActive = activeAgeGroupId === ag.id
                  return (
                    <Link
                      key={ag.id}
                      to={`/t/${tournament.slug}/${ag.id}`}
                      style={{
                        padding: '0.3rem 0.7rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        minHeight: '36px',
                        background: isActive ? '#f0a500' : 'transparent',
                        color: isActive ? '#0d1b2e' : '#8fa3bc',
                        border: `1px solid ${isActive ? '#f0a500' : '#2e4a68'}`,
                        transition: 'all 200ms ease',
                      }}
                    >
                      {ag.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* Standard nav links when no tournament context */
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link to="/turniri" style={navLink}>{t('nav.tournaments')}</Link>
            <Link to="/par-mums" style={navLink}>{t('nav.about')}</Link>
            <Link to="/kontakti" style={navLink}>{t('nav.contact')}</Link>
            <Link to="/admin" style={{
              ...navLink,
              border: '1px solid rgba(240,165,0,0.4)',
              borderRadius: '6px',
              padding: '0.3rem 0.75rem',
              color: '#f0a500',
            }}>
              {t('nav.login')}
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

const navLink = {
  color: '#8fa3bc',
  fontSize: '0.875rem',
  textDecoration: 'none',
  fontWeight: 500,
  whiteSpace: 'nowrap',
}
