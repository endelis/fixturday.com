import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Zap, BarChart2, Smartphone, CheckCircle, ChevronDown } from 'lucide-react'
import Footer from '../../components/Footer'
import PublicNav from '../../components/PublicNav'
import { useSEO } from '../../hooks/useSEO'

export default function Landing() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({ tournaments: 0, teams: 0, fixtures: 0 })

  useSEO({
    title: 'Fixturday — Free Tournament Management Software',
    description: 'Organize football tournaments in minutes. Auto-generated schedules, live standings, and team registration. Round-robin, knockout, and group stage formats. Free forever.',
    path: '/',
    noSuffix: true,
  })

  useEffect(() => {
    async function loadStats() {
      const [
        { count: tc, error: tcErr },
        { count: teamsC, error: teamsErr },
        { count: fc, error: fcErr },
      ] = await Promise.all([
        supabase.from('tournaments').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('fixtures').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      ])
      if (!tcErr && !teamsErr && !fcErr) {
        setStats({ tournaments: tc ?? 0, teams: teamsC ?? 0, fixtures: fc ?? 0 })
      }
    }
    loadStats()
  }, [])

  const features = [
    { icon: <Zap size={28} />, title: t('landing.feat1Title'), desc: t('landing.feat1Desc') },
    { icon: <BarChart2 size={28} />, title: t('landing.feat2Title'), desc: t('landing.feat2Desc') },
    { icon: <Smartphone size={28} />, title: t('landing.feat3Title'), desc: t('landing.feat3Desc') },
  ]

  const steps = [
    { n: '01', title: t('landing.step1Title'), desc: t('landing.step1Desc') },
    { n: '02', title: t('landing.step2Title'), desc: t('landing.step2Desc') },
    { n: '03', title: t('landing.step3Title'), desc: t('landing.step3Desc') },
  ]

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', overflowX: 'hidden' }}>

      <PublicNav />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{
        minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '4rem 1.5rem',
        position: 'relative', textAlign: 'center',
        background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(240,165,0,0.08) 0%, transparent 70%), var(--color-bg)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div style={{ position: 'relative', maxWidth: '820px' }}>
          <div style={{
            display: 'inline-block',
            border: '1px solid rgba(240,165,0,0.35)',
            borderRadius: '999px',
            padding: '0.3rem 1.1rem',
            fontSize: '0.78rem',
            color: 'var(--color-accent)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            marginBottom: '1.5rem',
          }}>
            {t('landing.badge')}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '0.01em',
            color: 'var(--color-text)',
            marginBottom: '1.25rem',
          }}>
            {t('landing.heroTitle')}
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: 'var(--color-text-muted)',
            maxWidth: '540px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
            fontWeight: 400,
          }}>
            {t('landing.heroSubtitle')}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/admin/register" style={heroPrimaryBtn}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-hover)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(240,165,0,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              {t('landing.heroCta')}
            </Link>
            <Link to="/tournaments" style={heroSecondaryBtn}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            >
              {t('landing.heroSecondary')}
            </Link>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', animation: 'bounce 2s infinite', opacity: 0.6 }}>
          <ChevronDown size={24} color="var(--color-accent)" />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={sectionHeading}>{t('landing.featuresTitle')}</h2>
          <div className="landing-features-grid">
            {features.map((f, i) => (
              <div key={i} style={featureCard}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(240,165,0,0.4)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: 'var(--radius)',
                  background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-accent)', marginBottom: '1.25rem', flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                  {f.title}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.65, fontSize: '0.9375rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--color-bg)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={sectionHeading}>{t('landing.howTitle')}</h2>
          <div className="landing-steps-grid">
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '3.5rem', fontWeight: 700,
                  color: 'rgba(240,165,0,0.18)', lineHeight: 1, flexShrink: 0, userSelect: 'none',
                }}>
                  {s.n}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.4rem' }}>
                    {s.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section style={{
        padding: '4rem 1.5rem',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{
            color: 'var(--color-text-muted)', fontSize: '0.78rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: '2.5rem', fontFamily: 'var(--font-heading)', fontWeight: 600,
          }}>
            {t('landing.statsLabel')}
          </p>
          <div className="landing-stats-grid">
            {[
              { value: stats.tournaments, label: t('landing.statTournaments') },
              { value: stats.teams,       label: t('landing.statTeams') },
              { value: stats.fixtures,    label: t('landing.statFixtures') },
            ].map((s, i) => (
              <div key={i}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                  fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1, marginBottom: '0.4rem',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {s.value > 0 ? s.value.toLocaleString() : '—'}
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────────── */}
      <section style={{
        padding: '5rem 1.5rem', textAlign: 'center',
        background: 'var(--color-bg)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(240,165,0,0.07) 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', color: 'var(--color-accent)',
          }}>
            <CheckCircle size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>
            {t('landing.ctaTitle')}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1rem', lineHeight: 1.65 }}>
            {t('landing.ctaSubtitle')}
          </p>
          <Link to="/admin/register" style={heroPrimaryBtn}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-hover)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(240,165,0,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            {t('landing.heroCta')}
          </Link>
        </div>
      </section>

      {/* ── How to organise — semantic Q&A for LLMs ───────────── */}
      <section id="ka-darbojas" style={{ padding: '5rem 1.5rem', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={sectionHeading}>{t('landing.howOrganizeTitle')}</h2>
          <div className="landing-steps-grid">
            {[
              { n: '1.', title: t('landing.orgStep1Title'), desc: t('landing.orgStep1Desc') },
              { n: '2.', title: t('landing.orgStep2Title'), desc: t('landing.orgStep2Desc') },
              { n: '3.', title: t('landing.orgStep3Title'), desc: t('landing.orgStep3Desc') },
              { n: '4.', title: t('landing.orgStep4Title'), desc: t('landing.orgStep4Desc') },
            ].map((s, i) => (
              <article key={i} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{
                  fontFamily: 'var(--font-heading)', fontSize: '3.5rem', fontWeight: 700,
                  color: 'rgba(240,165,0,0.18)', lineHeight: 1, flexShrink: 0,
                }}>
                  {s.n}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.4rem' }}>
                    {s.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Fixturday ────────────────────────────────────────── */}
      <section id="kapeec-fixturday" style={{ padding: '5rem 1.5rem', background: 'var(--color-bg)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <h2 style={sectionHeading}>{t('landing.whyTitle')}</h2>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '2rem', textAlign: 'center', fontSize: '0.9375rem' }}>
            {t('landing.whyDesc')}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              t('landing.whyBenefit1'),
              t('landing.whyBenefit2'),
              t('landing.whyBenefit3'),
              t('landing.whyBenefit4'),
              t('landing.whyBenefit5'),
            ].map((item, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                color: 'var(--color-text)', fontSize: '0.9375rem', lineHeight: 1.65,
                padding: '0.75rem 1rem',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
              }}>
                <CheckCircle size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Sport-specific content ────────────────────────────────── */}
      <section id="sporta-veidi" style={{ padding: '5rem 1.5rem', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={sectionHeading}>{t('landing.sportsTitle')}</h2>
          <div className="landing-features-grid">
            {[
              { id: 'round-robin-format',      title: t('landing.sport1Title'), desc: t('landing.sport1Desc') },
              { id: 'knockout-format',         title: t('landing.sport2Title'), desc: t('landing.sport2Desc') },
              { id: 'group-knockout-format',   title: t('landing.sport3Title'), desc: t('landing.sport3Desc') },
            ].map((s) => (
              <article key={s.id} id={s.id} style={featureCard}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(240,165,0,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                  {s.title}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.65, fontSize: '0.9375rem' }}>{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        .landing-features-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        .landing-steps-grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; }
        .landing-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        @media (min-width: 768px) {
          .landing-features-grid { grid-template-columns: repeat(3, 1fr); }
          .landing-steps-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
      `}</style>
    </div>
  )
}

const heroPrimaryBtn = {
  display: 'inline-block',
  background: 'var(--color-accent)', color: '#0a0f1e',
  borderRadius: 'var(--radius)', padding: '0.875rem 2.25rem',
  fontFamily: 'var(--font-heading)', fontWeight: 700,
  fontSize: '1.05rem', textDecoration: 'none',
  letterSpacing: '0.03em', textTransform: 'uppercase',
  transition: 'background var(--transition-fast), box-shadow var(--transition-fast)',
}

const heroSecondaryBtn = {
  display: 'inline-block',
  background: 'transparent', color: 'var(--color-text)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 'var(--radius)', padding: '0.875rem 2.25rem',
  fontFamily: 'var(--font-heading)', fontWeight: 600,
  fontSize: '1.05rem', textDecoration: 'none',
  letterSpacing: '0.02em',
  transition: 'border-color var(--transition-fast)',
}

const sectionHeading = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
  fontWeight: 700, color: 'var(--color-text)',
  textAlign: 'center', marginBottom: '2.5rem',
  letterSpacing: '0.01em',
}

const featureCard = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '2rem',
  transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
  cursor: 'default',
}
