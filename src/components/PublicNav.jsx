import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X, Menu, Share2, Mail, Link2 } from 'lucide-react'

function FbIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
}
function XBirdIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.73-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
}
function WaIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.07-1.33A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.66 0-3.2-.49-4.48-1.33l-.32-.2-3.04.8.82-2.98-.21-.33A8 8 0 014 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8zm4.18-5.66c-.23-.12-1.37-.68-1.58-.75-.21-.08-.37-.12-.52.12-.16.23-.6.75-.73.91-.13.16-.27.17-.5.06-.23-.12-.97-.36-1.85-1.14-.68-.61-1.14-1.36-1.27-1.59-.13-.23-.01-.36.1-.47.1-.1.23-.27.34-.4.11-.14.15-.23.23-.38.08-.16.04-.29-.02-.4-.06-.12-.52-1.26-.71-1.72-.19-.45-.38-.39-.52-.4-.13-.01-.29-.01-.44-.01-.16 0-.4.06-.62.29-.21.23-.81.79-.81 1.93 0 1.14.83 2.24.95 2.4.12.16 1.63 2.49 3.95 3.49.55.24.98.38 1.32.49.55.18 1.06.15 1.46.09.44-.07 1.37-.56 1.56-1.1.19-.54.19-1 .14-1.1-.05-.1-.21-.15-.44-.27z"/></svg>
}
import { supabase } from '../lib/supabase'


/**
 * Public navigation bar.
 * Props:
 *   tournament        – current tournament object (optional, for breadcrumb)
 *   ageGroups         – sibling age groups (kept for Schedule/Standings compat)
 *   activeAgeGroupId  – active age group id (kept for Schedule/Standings compat)
 */
export default function PublicNav({ tournament, ageGroups = [], activeAgeGroupId, showRegister = true, showPlayoff = false }) {
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

  function getShareData() {
    const activeAg = ageGroups.find(ag => ag.id === activeAgeGroupId)
    const divSuffix = activeAg ? ` — ${activeAg.name}` : ''
    const title = tournament?.name ? `${tournament.name}${divSuffix}` : document.title
    const text = `Follow ${tournament?.name ?? 'this tournament'}${divSuffix} live on Fixturday`
    return { title, text, url: window.location.href }
  }

  async function handleShare() {
    const data = getShareData()
    if (navigator.canShare?.(data)) {
      try {
        await navigator.share(data)
        window.gtag?.('event', 'share', { method: 'native', content_type: 'tournament', item_id: tournament?.slug ?? '' })
        return
      } catch (e) {
        if (e.name === 'AbortError') return
      }
    }
    await copyLink()
  }

  function shareToFacebook() {
    const { url } = getShareData()
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
    window.gtag?.('event', 'share', { method: 'facebook', content_type: 'tournament', item_id: tournament?.slug ?? '' })
  }

  function shareToX() {
    const { text, url } = getShareData()
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
    window.gtag?.('event', 'share', { method: 'twitter', content_type: 'tournament', item_id: tournament?.slug ?? '' })
  }

  function shareToWhatsApp() {
    const { text, url } = getShareData()
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener,noreferrer')
    window.gtag?.('event', 'share', { method: 'whatsapp', content_type: 'tournament', item_id: tournament?.slug ?? '' })
  }

  function shareToEmail() {
    const { title, text, url } = getShareData()
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`
    window.gtag?.('event', 'share', { method: 'email', content_type: 'tournament', item_id: tournament?.slug ?? '' })
  }

  async function copyLink() {
    const { url } = getShareData()
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
      window.gtag?.('event', 'share', { method: 'clipboard', content_type: 'tournament', item_id: tournament?.slug ?? '' })
    } catch {}
  }

  // Build a division link that preserves the current tab
  function divisionPath(ag) {
    const path = location.pathname
    const base = `/t/${tournament?.slug}/${ag.id}`
    if (path.endsWith('/overview')) return `${base}/overview`
    if (path.endsWith('/fixtures')) return `${base}/fixtures`
    if (path.endsWith('/playoff')) return `${base}/playoff`
    if (path.endsWith('/teams')) return `${base}/teams`
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
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
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
                  <NavLink to={agId ? `/t/${tournament.slug}/${agId}/teams` : `/t/${tournament.slug}`} style={tourNavLink}>
                    {t('nav.teams')}
                  </NavLink>
                  {showPlayoff && (
                    <NavLink to={agId ? `/t/${tournament.slug}/${agId}/playoff` : `/t/${tournament.slug}`} end style={tourNavLink}>
                      {t('nav.playoff')}
                    </NavLink>
                  )}
                  <NavLink to={`/${tournament.slug}/info`} end style={tourNavLink}>
                    {t('nav.info')}
                  </NavLink>

                  {/* Register button — right-pinned */}
                  {showRegister && (
                    <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      <NavLink to={`/t/${tournament.slug}/register`} end style={registerNavLink}>
                        {t('nav.register')}
                      </NavLink>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* Share + LIVE strip — shown below sub-nav for tournament pages */}
      {tournament && (
        <div style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', paddingTop: '0.45rem', paddingBottom: '0.45rem' }}>
            {/* LIVE indicator */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.65rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em',
              color: liveStatus === 'connected' ? 'var(--color-live)' : 'rgba(136,146,164,0.35)',
              marginRight: '0.35rem', flexShrink: 0,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: liveStatus === 'connected' ? 'var(--color-live)' : 'rgba(136,146,164,0.2)',
                boxShadow: liveStatus === 'connected' ? '0 0 6px var(--color-live)' : 'none',
                animation: liveStatus === 'connected' ? 'live-dot-pulse 2s ease-in-out infinite' : 'none',
              }} />
              LIVE
            </span>
            {/* Share label */}
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-heading)', color: 'var(--color-text-muted)', flexShrink: 0, marginRight: '0.1rem' }}>
              {t('standings.share')}
            </span>
            {/* Share icon buttons */}
            {[
              { icon: <Share2 size={13} />, label: 'Share', fn: handleShare },
              { icon: <FbIcon />, label: 'Facebook', fn: shareToFacebook },
              { icon: <XBirdIcon />, label: 'X (Twitter)', fn: shareToX },
              { icon: <WaIcon />, label: 'WhatsApp', fn: shareToWhatsApp },
              { icon: <Mail size={13} />, label: 'Email', fn: shareToEmail },
              { icon: <Link2 size={13} />, label: 'Copy link', fn: copyLink, copied: shareCopied },
            ].map(({ icon, label, fn, copied }) => (
              <button
                key={label}
                onClick={fn}
                aria-label={label}
                title={copied ? t('standings.shareCopied') : label}
                style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  border: `1px solid ${copied ? 'var(--color-success)' : 'rgba(255,255,255,0.1)'}`,
                  background: copied ? 'rgba(46,204,113,0.12)' : 'var(--color-surface)',
                  color: copied ? 'var(--color-success)' : 'var(--color-text-muted)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                  transition: 'color var(--transition-fast), border-color var(--transition-fast)',
                }}
              >
                {icon}
              </button>
            ))}
          </div>
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
        @media (max-width: 640px) {
          .pub-nav-desktop { display: none !important; }
          .pub-nav-hamburger { display: flex !important; }
        }
        @media (max-width: 767px) {
          .pub-nav-logo { width: 160px; height: 27px; }
          .pub-nav-divisions-desktop { display: none !important; }
          .pub-nav-divisions-mobile { display: flex !important; }
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
  flexShrink: 0,
  borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
  transition: 'color var(--transition-fast)',
})
