import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X, Menu, Share2 } from 'lucide-react'
import { supabase } from '../lib/supabase'


/**
 * Public navigation bar.
 * Props:
 *   tournament        – current tournament object (optional, for breadcrumb)
 *   ageGroups         – sibling age groups (kept for Schedule/Standings compat)
 *   activeAgeGroupId  – active age group id (kept for Schedule/Standings compat)
 */
export default function PublicNav({ tournament, ageGroups = [], activeAgeGroupId, showRegister = true }) {
  const { t } = useTranslation()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [liveStatus, setLiveStatus] = useState('connecting')
  const [shareCopied, setShareCopied] = useState(false)

  // Heartbeat channel — tracks Supabase connection for the live dot
  useEffect(() => {
    if (!tournament?.id) return
    const ch = supabase
      .channel(`pub-nav-hb-${tournament.id}`)
      .subscribe(s => setLiveStatus(s === 'SUBSCRIBED' ? 'connected' : 'connecting'))
    return () => { supabase.removeChannel(ch) }
  }, [tournament?.id])

  async function handleShare() {
    const url = tournament?.slug
      ? `https://www.fixturday.com/t/${tournament.slug}`
      : window.location.href
    const title = document.title
    if (navigator.share) {
      try { await navigator.share({ title, url }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2000)
      } catch {}
    }
  }

  // Build a division link that preserves the current tab
  function divisionPath(ag) {
    const path = location.pathname
    const base = `/t/${tournament?.slug}/${ag.id}`
    if (path.endsWith('/overview')) return `${base}/overview`
    if (path.endsWith('/fixtures')) return `${base}/fixtures`
    return base  // standings (default) or anything else
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function closeDrawer() { setOpen(false) }

  return (
    <>
      <nav style={{
        background: scrolled
          ? 'rgba(10, 15, 30, 0.97)'
          : 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        borderTop: '2px solid var(--color-accent)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-nav)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'background var(--transition-base), backdrop-filter var(--transition-base)',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.5)' : 'none',
      }}>
        <div
          className="container"
          style={{ display: 'flex', alignItems: 'center', height: '60px', gap: '0.75rem' }}
        >
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}>
            <img src="/logo-horizontal.svg" alt="Fixturday" className="pub-nav-logo" style={{ display: 'block' }} />
          </Link>

          {tournament ? (
            <>
              {ageGroups.length > 1 && (
                <div className="pub-nav-divisions-desktop" style={{
                  display: 'flex',
                  gap: '0.35rem',
                  flexWrap: 'nowrap',
                  marginLeft: 'auto',
                  alignItems: 'center',
                  overflowX: 'auto',
                  minWidth: 0,
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}>
                  {ageGroups.map(ag => {
                    const isActive = activeAgeGroupId === ag.id
                    return (
                      <Link
                        key={ag.id}
                        to={divisionPath(ag)}
                        style={{
                          padding: '0.3rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 600,
                          letterSpacing: '0.03em',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          minHeight: '34px',
                          background: isActive ? 'var(--color-accent)' : 'transparent',
                          color: isActive ? '#0a0f1e' : 'var(--color-text-muted)',
                          border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          transition: 'all var(--transition-fast)',
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
              <div className="pub-nav-desktop" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {[
                  { to: '/tournaments', label: t('nav.tournaments') },
                  { to: '/blog',        label: 'Blog' },
                  { to: '/guide',       label: t('nav.guide') },
                  { to: '/about',       label: t('nav.about') },
                ].map(item => (
                  <Link key={item.to} to={item.to} style={desktopNavLink}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link to="/admin/register" style={startFreeBtnStyle}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-accent)' }}
                >
                  {t('nav.start')}
                </Link>
                <Link to="/admin" style={loginBtnStyle}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = '#0a0f1e' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-accent)' }}
                >
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
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background var(--transition-fast)',
                }}
                aria-label={t('nav.openMenu')}
              >
                <Menu size={24} />
              </button>
            </>
          )}
        </div>

        {/* Tournament sub-nav */}
        {tournament && ageGroups.length > 0 && (
          <div
            className="container"
            style={{
              display: 'flex',
              gap: '0.25rem',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '0.3rem',
              paddingBottom: '0.3rem',
              alignItems: 'center',
            }}
          >
            {(() => {
              const agId = activeAgeGroupId ?? ageGroups[0]?.id
              return (
                <>
                  <NavLink to={agId ? `/t/${tournament.slug}/${agId}/overview` : `/t/${tournament.slug}`} end style={tourNavLink}>
                    {t('nav.overview')}
                  </NavLink>
                  <NavLink to={agId ? `/t/${tournament.slug}/${agId}/fixtures` : `/t/${tournament.slug}`} end style={tourNavLink}>
                    {t('nav.schedule')}
                  </NavLink>
                  <NavLink to={agId ? `/t/${tournament.slug}/${agId}` : `/t/${tournament.slug}`} end style={tourNavLink}>
                    {t('nav.standings')}
                  </NavLink>
                  <NavLink to={`/${tournament.slug}/info`} end style={tourNavLink}>
                    {t('nav.info')}
                  </NavLink>

                  {/* Right group: live indicator + share + register */}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                    {/* Live dot */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.65rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em',
                      color: liveStatus === 'connected' ? 'var(--color-live)' : 'rgba(136,146,164,0.4)',
                    }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: liveStatus === 'connected' ? 'var(--color-live)' : 'rgba(136,146,164,0.25)',
                        boxShadow: liveStatus === 'connected' ? '0 0 6px var(--color-live)' : 'none',
                        animation: liveStatus === 'connected' ? 'live-dot-pulse 2s ease-in-out infinite' : 'none',
                      }} />
                      <span className="pub-nav-live-label">LIVE</span>
                    </span>

                    {/* Share button */}
                    <button
                      onClick={handleShare}
                      title={shareCopied ? t('standings.shareCopied') : t('standings.share')}
                      style={{
                        background: 'none',
                        border: `1px solid ${shareCopied ? 'var(--color-success)' : 'var(--color-border)'}`,
                        color: shareCopied ? 'var(--color-success)' : 'var(--color-text-muted)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.2rem 0.5rem',
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        fontSize: '0.72rem', fontFamily: 'var(--font-heading)',
                        minHeight: '28px', transition: 'color var(--transition-fast), border-color var(--transition-fast)',
                      }}
                    >
                      <Share2 size={13} />
                      <span className="pub-nav-share-label">
                        {shareCopied ? t('standings.shareCopied') : t('standings.share')}
                      </span>
                    </button>

                    {showRegister && (
                      <NavLink to={`/t/${tournament.slug}/register`} end style={registerNavLink}>
                        {t('nav.register')}
                      </NavLink>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* Mobile-only division selector — shown below sub-nav on small screens */}
        {tournament && ageGroups.length > 1 && (
          <div className="pub-nav-divisions-mobile container" style={{
            gap: '0.5rem',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            borderTop: '1px solid var(--color-border)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            {ageGroups.map(ag => {
              const isActive = activeAgeGroupId === ag.id
              return (
                <Link
                  key={ag.id}
                  to={divisionPath(ag)}
                  style={{
                    padding: '0.35rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    minHeight: '34px',
                    background: isActive ? 'var(--color-accent)' : 'transparent',
                    color: isActive ? '#0a0f1e' : 'var(--color-text-muted)',
                    border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    transition: 'all var(--transition-fast)',
                    flexShrink: 0,
                  }}
                >
                  {ag.name}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-modal)',
            background: 'rgba(10, 15, 30, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={closeDrawer}
        />
      )}

      {/* Mobile drawer panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '280px',
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        zIndex: 'var(--z-toast)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <img src="/logo-horizontal.svg" alt="Fixturday" width="152" height="26" style={{ height: '26px', width: '152px' }} />
          <button
            onClick={closeDrawer}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              borderRadius: 'var(--radius-sm)',
            }}
            aria-label={t('nav.closeMenu')}
          >
            <X size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {[
            { to: '/tournaments', label: t('nav.tournaments') },
            { to: '/blog',        label: 'Blog' },
            { to: '/guide',       label: t('nav.guide') },
            { to: '/about',       label: t('nav.about') },
            { to: '/contact',     label: t('nav.contact') },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeDrawer}
              style={{
                color: 'var(--color-text)',
                textDecoration: 'none',
                fontSize: '1.0625rem',
                fontWeight: 500,
                padding: '0.875rem 0.5rem',
                borderBottom: '1px solid var(--color-border)',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text)'}
            >
              {item.label}
            </Link>
          ))}

          <Link
            to="/admin/register"
            onClick={closeDrawer}
            style={{
              marginTop: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-accent)',
              color: '#0a0f1e',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '0.03em',
              borderRadius: 'var(--radius)',
              padding: '0.875rem 1rem',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            {t('nav.start')}
          </Link>
          <Link
            to="/admin"
            onClick={closeDrawer}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(240,165,0,0.35)',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '0.9rem',
              letterSpacing: '0.03em',
              borderRadius: 'var(--radius)',
              padding: '0.75rem 1rem',
              textDecoration: 'none',
              textTransform: 'uppercase',
              marginTop: '0.5rem',
            }}
          >
            {t('nav.login')}
          </Link>
        </div>

        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
{[
            { to: '/privacy-policy', label: t('footer.privacy') },
            { to: '/terms-of-use',   label: t('footer.terms') },
            { to: '/cookie-policy',  label: t('footer.cookies') },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeDrawer}
              style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .pub-nav-hamburger { display: none !important; }
        .pub-nav-logo { width: 175px; height: 30px; }
        .pub-nav-divisions-desktop { display: flex !important; }
        .pub-nav-divisions-mobile { display: none !important; }
        .pub-nav-live-label { display: inline; }
        .pub-nav-share-label { display: inline; }
        @media (max-width: 640px) {
          .pub-nav-desktop { display: none !important; }
          .pub-nav-hamburger { display: flex !important; }
        }
        @media (max-width: 767px) {
          .pub-nav-logo { width: 160px; height: 27px; }
          .pub-nav-divisions-desktop { display: none !important; }
          .pub-nav-divisions-mobile { display: flex !important; }
          .pub-nav-live-label { display: none !important; }
          .pub-nav-share-label { display: none !important; }
        }
      `}</style>
    </>
  )
}

const desktopNavLink = {
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
  textDecoration: 'none',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  padding: '0.3rem 0.6rem',
  borderRadius: 'var(--radius-sm)',
  transition: 'color var(--transition-fast)',
}

const startFreeBtnStyle = {
  marginLeft: '0.5rem',
  background: 'var(--color-accent)',
  color: '#0a0f1e',
  borderRadius: 'var(--radius-sm)',
  padding: '0.35rem 0.875rem',
  fontSize: '0.875rem',
  fontWeight: 700,
  fontFamily: 'var(--font-heading)',
  letterSpacing: '0.03em',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'background var(--transition-fast)',
  textTransform: 'uppercase',
}

const loginBtnStyle = {
  marginLeft: '0.5rem',
  border: '1px solid rgba(240,165,0,0.45)',
  borderRadius: 'var(--radius-sm)',
  padding: '0.35rem 0.875rem',
  color: 'var(--color-accent)',
  fontSize: '0.875rem',
  fontWeight: 600,
  fontFamily: 'var(--font-heading)',
  letterSpacing: '0.03em',
  textDecoration: 'none',
  background: 'transparent',
  transition: 'background var(--transition-fast), color var(--transition-fast)',
  textTransform: 'uppercase',
}

const registerNavLink = ({ isActive }) => ({
  padding: '0.25rem 0.75rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.8rem',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textDecoration: 'none',
  textTransform: 'uppercase',
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '30px',
  background: isActive ? 'var(--color-accent)' : 'rgba(240,165,0,0.12)',
  color: isActive ? '#0a0f1e' : 'var(--color-accent)',
  border: '1px solid rgba(240,165,0,0.35)',
  transition: 'all var(--transition-fast)',
  flexShrink: 0,
})

const tourNavLink = ({ isActive }) => ({
  color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
  textDecoration: 'none',
  fontSize: '0.8125rem',
  fontWeight: isActive ? 600 : 400,
  padding: '0.3rem 0.7rem',
  borderRadius: 'var(--radius-sm)',
  whiteSpace: 'nowrap',
  borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
  transition: 'color var(--transition-fast)',
})
