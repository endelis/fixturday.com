import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { Trophy, Zap, Users } from 'lucide-react'
import { useSEO } from '../../hooks/useSEO'

export default function About() {
  const { t } = useTranslation()

  useSEO({
    title: 'About Fixturday — Sports Tournament Software',
    description: 'Fixturday helps sports organizers run better tournaments. Free software with automatic schedules, live standings, online registration, and a public participant page.',
    path: '/about',
    noSuffix: true,
  })

  const values = [
    { icon: <Trophy size={28} />, title: t('about.value1Title'), desc: t('about.value1Desc') },
    { icon: <Zap size={28} />,    title: t('about.value2Title'), desc: t('about.value2Desc') },
    { icon: <Users size={28} />,  title: t('about.value3Title'), desc: t('about.value3Desc') },
  ]

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNav />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{
        padding: '5rem 1.5rem 4rem',
        textAlign: 'center',
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(240,165,0,0.07) 0%, transparent 70%), var(--color-bg)',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={pill}>{t('about.pill')}</div>
          <h1 style={h1}>{t('about.title')}</h1>
          <p style={subtitle}>{t('about.subtitle')}</p>
        </div>
      </section>

      {/* ── Mission quote ─────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <blockquote style={{
            fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
            fontStyle: 'italic',
            color: 'var(--color-text)',
            lineHeight: 1.65,
            borderLeft: '3px solid var(--color-accent)',
            paddingLeft: '1.5rem',
            margin: '0 auto',
            maxWidth: '680px',
          }}>
            "{t('about.mission')}"
          </blockquote>
        </div>
      </section>

      {/* ── Value cards ───────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', background: 'var(--color-bg)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="about-values-grid">
            {values.map((v, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  transition: 'border-color var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(240,165,0,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div style={{
                  color: 'var(--color-accent)',
                  background: 'rgba(240,165,0,0.1)',
                  borderRadius: 'var(--radius)',
                  padding: '0.6rem',
                  display: 'inline-flex',
                  marginBottom: '1rem',
                }}>
                  {v.icon}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  marginBottom: '0.5rem',
                }}>
                  {v.title}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.65, margin: 0 }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center', background: 'var(--color-surface)', flex: 1 }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: '1.75rem',
          }}>
            {t('about.ctaTitle')}
          </h2>
          <Link to="/contact" style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--color-accent)',
            color: '#0a0f1e',
            borderRadius: 'var(--radius)',
            padding: '0.85rem 2.25rem',
            fontWeight: 700,
            fontSize: '0.9375rem',
            textDecoration: 'none',
            minHeight: '44px',
          }}>
            {t('nav.contact')}
          </Link>
        </div>
      </section>

      <style>{`
        .about-values-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 768px) {
          .about-values-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <Footer />
    </div>
  )
}

const pill = {
  display: 'inline-block',
  border: '1px solid rgba(240,165,0,0.35)',
  borderRadius: '999px',
  padding: '0.3rem 1rem',
  fontSize: '0.75rem',
  color: 'var(--color-accent)',
  letterSpacing: '0.1em',
  fontWeight: 600,
  marginBottom: '1.25rem',
}
const h1 = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'clamp(2rem, 6vw, 3rem)',
  fontWeight: 700,
  color: 'var(--color-text)',
  lineHeight: 1.1,
  marginBottom: '1rem',
}
const subtitle = {
  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.65,
  maxWidth: '520px',
  margin: '0 auto',
}
