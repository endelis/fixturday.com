import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Zap, BarChart2, Smartphone, CheckCircle } from 'lucide-react'

export default function Landing() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({ tournaments: 0, teams: 0, fixtures: 0 })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function loadStats() {
      const [
        { count: tc },
        { count: teamsC },
        { count: fc },
      ] = await Promise.all([
        supabase.from('tournaments').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('fixtures').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      ])
      setStats({ tournaments: tc ?? 0, teams: teamsC ?? 0, fixtures: fc ?? 0 })
    }
    loadStats()
  }, [])

  const features = [
    {
      icon: <Zap size={28} />,
      title: t('landing.feat1Title'),
      desc: t('landing.feat1Desc'),
    },
    {
      icon: <BarChart2 size={28} />,
      title: t('landing.feat2Title'),
      desc: t('landing.feat2Desc'),
    },
    {
      icon: <Smartphone size={28} />,
      title: t('landing.feat3Title'),
      desc: t('landing.feat3Desc'),
    },
  ]

  const steps = [
    { n: '01', title: t('landing.step1Title'), desc: t('landing.step1Desc') },
    { n: '02', title: t('landing.step2Title'), desc: t('landing.step2Desc') },
    { n: '03', title: t('landing.step3Title'), desc: t('landing.step3Desc') },
  ]

  return (
    <div style={{ background: '#0a1628', color: '#e0e8f4', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(10, 22, 40, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: '60px',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem',
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo-horizontal.svg" alt="Fixturday" style={{ height: '24px' }} />
          </Link>

          {/* Desktop nav */}
          <div className="landing-nav-links">
            <Link to="/turniri" style={navLinkStyle}>{t('nav.tournaments')}</Link>
            <Link to="/par-mums" style={navLinkStyle}>{t('nav.about')}</Link>
            <Link to="/kontakti" style={navLinkStyle}>{t('nav.contact')}</Link>
            <Link to="/admin" style={{ ...navLinkStyle, border: '1px solid rgba(240,165,0,0.5)', borderRadius: '6px', padding: '0.35rem 0.9rem' }}>
              {t('nav.login')}
            </Link>
            <Link to="/admin/register" style={{
              background: '#f0a500', color: '#0a1628',
              borderRadius: '6px', padding: '0.35rem 1rem',
              fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>
              {t('nav.start')}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="landing-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e0e8f4', padding: '0.5rem' }}
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {menuOpen ? (
                <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <>
                  <line x1="3" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            position: 'absolute', top: '60px', left: 0, right: 0,
            background: '#0d1b2e', borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem',
          }}>
            <Link to="/turniri" style={mobileNavLink} onClick={() => setMenuOpen(false)}>{t('nav.tournaments')}</Link>
            <Link to="/par-mums" style={mobileNavLink} onClick={() => setMenuOpen(false)}>{t('nav.about')}</Link>
            <Link to="/kontakti" style={mobileNavLink} onClick={() => setMenuOpen(false)}>{t('nav.contact')}</Link>
            <Link to="/admin" style={mobileNavLink} onClick={() => setMenuOpen(false)}>{t('nav.login')}</Link>
            <Link to="/admin/register" style={{ ...mobileNavLink, color: '#f0a500', fontWeight: 700 }} onClick={() => setMenuOpen(false)}>{t('nav.start')}</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '6rem 1.5rem 4rem',
        position: 'relative', textAlign: 'center',
        background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(240,165,0,0.07) 0%, transparent 70%), #0a1628',
      }}>
        {/* Grid decoration */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div style={{ position: 'relative', maxWidth: '820px' }}>
          <div style={{
            display: 'inline-block',
            border: '1px solid rgba(240,165,0,0.3)',
            borderRadius: '999px',
            padding: '0.3rem 1rem',
            fontSize: '0.8rem',
            color: '#f0a500',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: '1.5rem',
          }}>
            {t('landing.badge')}
          </div>

          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.01em',
            color: '#ffffff',
            marginBottom: '1.25rem',
          }}>
            {t('landing.heroTitle')}
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: '#8fa3bc',
            maxWidth: '560px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.6,
          }}>
            {t('landing.heroSubtitle')}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/admin/register" style={heroPrimaryBtn}>
              {t('landing.heroCta')}
            </Link>
            <Link to="/turniri" style={heroSecondaryBtn}>
              {t('landing.heroSecondary')}
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', animation: 'bounce 2s infinite' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="#f0a500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          </svg>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', background: '#0d1b2e' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={sectionHeading}>{t('landing.featuresTitle')}</h2>
          <div className="landing-features-grid">
            {features.map((f, i) => (
              <div key={i} style={{
                background: '#0a1628',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px',
                padding: '2rem',
                transition: 'border-color 200ms ease',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(240,165,0,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
              >
                <div style={{ color: '#f0a500', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1.35rem', fontWeight: 700,
                  color: '#ffffff', marginBottom: '0.5rem',
                }}>
                  {f.title}
                </h3>
                <p style={{ color: '#8fa3bc', lineHeight: 1.6, fontSize: '0.9375rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', background: '#0a1628' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={sectionHeading}>{t('landing.howTitle')}</h2>
          <div className="landing-steps-grid">
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '3.5rem', fontWeight: 700,
                  color: 'rgba(240,165,0,0.2)', lineHeight: 1, flexShrink: 0,
                  userSelect: 'none',
                }}>
                  {s.n}
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '1.4rem', fontWeight: 700,
                    color: '#ffffff', marginBottom: '0.35rem',
                  }}>
                    {s.title}
                  </h3>
                  <p style={{ color: '#8fa3bc', fontSize: '0.9375rem', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', background: '#0d1b2e', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#8fa3bc', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2.5rem', fontWeight: 600 }}>
            {t('landing.statsLabel')}
          </p>
          <div className="landing-stats-grid">
            {[
              { value: stats.tournaments, label: t('landing.statTournaments') },
              { value: stats.teams, label: t('landing.statTeams') },
              { value: stats.fixtures, label: t('landing.statFixtures') },
            ].map((s, i) => (
              <div key={i}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                  fontWeight: 700, color: '#f0a500', lineHeight: 1,
                  marginBottom: '0.4rem',
                }}>
                  {s.value > 0 ? s.value.toLocaleString() : '—'}
                </div>
                <div style={{ color: '#8fa3bc', fontSize: '0.875rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────────── */}
      <section style={{
        padding: '5rem 1.5rem', textAlign: 'center',
        background: 'linear-gradient(135deg, #0d1b2e 0%, #0a1628 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(240,165,0,0.08) 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
          <CheckCircle size={40} style={{ color: '#f0a500', margin: '0 auto 1rem', display: 'block' }} />
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700,
            color: '#ffffff', marginBottom: '1rem',
          }}>
            {t('landing.ctaTitle')}
          </h2>
          <p style={{ color: '#8fa3bc', marginBottom: '2rem', fontSize: '1rem', lineHeight: 1.6 }}>
            {t('landing.ctaSubtitle')}
          </p>
          <Link to="/admin/register" style={heroPrimaryBtn}>
            {t('landing.heroCta')}
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{
        background: '#060f1c', borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '2.5rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
        }}>
          <img src="/logo-horizontal.svg" alt="Fixturday" style={{ height: '22px', opacity: 0.85 }} />
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link to="/turniri" style={footerLink}>{t('nav.tournaments')}</Link>
            <Link to="/par-mums" style={footerLink}>{t('nav.about')}</Link>
            <Link to="/kontakti" style={footerLink}>{t('nav.contact')}</Link>
          </div>
          <p style={{ color: '#3a506b', fontSize: '0.8rem', margin: 0 }}>
            © 2026 Fixturday
          </p>
        </div>
      </footer>

      <style>{`
        .landing-nav-links {
          display: flex; align-items: center; gap: 1.25rem;
        }
        .landing-hamburger { display: none; }
        @media (max-width: 767px) {
          .landing-nav-links { display: none; }
          .landing-hamburger { display: block; }
        }
        .landing-features-grid {
          display: grid; grid-template-columns: 1fr; gap: 1.25rem;
        }
        @media (min-width: 768px) {
          .landing-features-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .landing-steps-grid {
          display: grid; grid-template-columns: 1fr; gap: 2.5rem;
        }
        @media (min-width: 768px) {
          .landing-steps-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .landing-stats-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
      `}</style>
    </div>
  )
}

const navLinkStyle = {
  color: '#8fa3bc', textDecoration: 'none', fontSize: '0.875rem',
  fontWeight: 500, transition: 'color 150ms',
}

const mobileNavLink = {
  color: '#8fa3bc', textDecoration: 'none', fontSize: '1rem', fontWeight: 500,
}

const heroPrimaryBtn = {
  display: 'inline-block',
  background: '#f0a500', color: '#0a1628',
  borderRadius: '8px', padding: '0.8rem 2rem',
  fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
  letterSpacing: '0.01em',
}

const heroSecondaryBtn = {
  display: 'inline-block',
  background: 'transparent', color: '#e0e8f4',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px', padding: '0.8rem 2rem',
  fontWeight: 500, fontSize: '1rem', textDecoration: 'none',
}

const sectionHeading = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
  fontWeight: 700, color: '#ffffff',
  textAlign: 'center', marginBottom: '2.5rem',
}

const footerLink = {
  color: '#3a506b', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 150ms',
}
