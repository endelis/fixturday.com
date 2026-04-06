import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X, Menu } from 'lucide-react'

/**
 * Public navigation bar.
 * Props:
 *   tournament        – current tournament object (optional, for breadcrumb)
 *   ageGroups         – sibling age groups (kept for Schedule/Standings compat)
 *   activeAgeGroupId  – active age group id (kept for Schedule/Standings compat)
 *
 * When no tournament is provided, shows standard nav links + hamburger on mobile.
 */
export default function PublicNav({ tournament, ageGroups = [], activeAgeGroupId }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  function closeDrawer() { setOpen(false) }

  return (
    <>
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
            <>
              {/* Desktop nav links */}
              <div className="pub-nav-desktop" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <Link to="/turniri" style={navLink}>{t('nav.tournaments')}</Link>
                <Link to="/pamaciba" style={navLink}>{t('nav.guide')}</Link>
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

              {/* Mobile hamburger */}
              <button
                className="pub-nav-hamburger"
                onClick={() => setOpen(true)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: '#e0e8f4',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Atvērt izvēlni"
              >
                <Menu size={24} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(10,22,40,0.6)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={closeDrawer}
        />
      )}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '280px',
        background: '#0d1b2e',
        borderLeft: '1px solid #1e3a5f',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <img src="/logo-horizontal.svg" alt="Fixturday" style={{ height: '22px' }} />
          <button
            onClick={closeDrawer}
            style={{ background: 'none', border: 'none', color: '#8fa3bc', cursor: 'pointer', padding: '0.25rem' }}
            aria-label="Aizvērt izvēlni"
          >
            <X size={22} />
          </button>
        </div>

        {/* Primary links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {[
            { to: '/turniri', label: t('nav.tournaments') },
            { to: '/pamaciba', label: t('nav.guide') },
            { to: '/par-mums', label: t('nav.about') },
            { to: '/kontakti', label: t('nav.contact') },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeDrawer}
              style={{
                color: '#e0e8f4',
                textDecoration: 'none',
                fontSize: '1.0625rem',
                fontWeight: 500,
                padding: '0.75rem 0.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {item.label}
            </Link>
          ))}

          <Link
            to="/admin"
            onClick={closeDrawer}
            style={{
              marginTop: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f0a500',
              color: '#0a1628',
              fontWeight: 700,
              fontSize: '0.9375rem',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              textDecoration: 'none',
            }}
          >
            {t('nav.login')}
          </Link>
        </div>

        {/* Legal links at bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {[
            { to: '/privatuma-politika', label: t('footer.privacy') },
            { to: '/lietosanas-noteikumi', label: t('footer.terms') },
            { to: '/sikdatnu-politika', label: t('footer.cookies') },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeDrawer}
              style={{ color: '#8fa3bc', fontSize: '0.8rem', textDecoration: 'none' }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .pub-nav-hamburger { display: none !important; }
        @media (max-width: 640px) {
          .pub-nav-desktop { display: none !important; }
          .pub-nav-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  )
}

const navLink = {
  color: '#8fa3bc',
  fontSize: '0.875rem',
  textDecoration: 'none',
  fontWeight: 500,
  whiteSpace: 'nowrap',
}
