import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { Zap, ShieldCheck, Users } from 'lucide-react'

export default function About() {
  const { t } = useTranslation()

  const values = [
    {
      icon: <Zap size={28} />,
      title: t('about.value1Title'),
      desc: t('about.value1Desc'),
    },
    {
      icon: <ShieldCheck size={28} />,
      title: t('about.value2Title'),
      desc: t('about.value2Desc'),
    },
    {
      icon: <Users size={28} />,
      title: t('about.value3Title'),
      desc: t('about.value3Desc'),
    },
  ]

  return (
    <div style={{ background: '#0a1628', color: '#e0e8f4', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNav />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{
        padding: '5rem 1.5rem 4rem',
        textAlign: 'center',
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(240,165,0,0.07) 0%, transparent 70%), #0a1628',
        position: 'relative',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
          <div style={pill}>{t('nav.about').toUpperCase()}</div>
          <h1 style={h1}>{t('about.title')}</h1>
          <p style={subtitle}>{t('about.mission')}</p>
        </div>
      </section>

      {/* ── Mission quote ─────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', background: '#0d1b2e' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <blockquote style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 'clamp(1.35rem, 3vw, 1.75rem)',
            fontWeight: 600,
            color: '#ffffff',
            lineHeight: 1.45,
            borderLeft: '3px solid #f0a500',
            paddingLeft: '1.5rem',
            textAlign: 'left',
            margin: '0 auto',
            maxWidth: '680px',
          }}>
            "{t('about.mission')}"
          </blockquote>
        </div>
      </section>

      {/* ── Story ────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', background: '#0a1628' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={sectionH2}>{t('about.storyTitle')}</h2>
          <div style={{ display: 'grid', gap: '1rem', color: '#8fa3bc', lineHeight: 1.75, fontSize: '0.9375rem' }}>
            <p style={{ margin: 0 }}>{t('about.storyP1')}</p>
            <p style={{ margin: 0 }}>{t('about.storyP2')}</p>
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', background: '#0d1b2e' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ ...sectionH2, textAlign: 'center', marginBottom: '2.5rem' }}>{t('about.valuesTitle')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {values.map((v, i) => (
              <div
                key={i}
                style={{
                  background: '#0a1628',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '14px',
                  padding: '2rem',
                  transition: 'border-color 200ms',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(240,165,0,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
              >
                <div style={{ color: '#f0a500', marginBottom: '1rem' }}>{v.icon}</div>
                <h3 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1.35rem', fontWeight: 700,
                  color: '#ffffff', marginBottom: '0.5rem',
                }}>
                  {v.title}
                </h3>
                <p style={{ color: '#8fa3bc', fontSize: '0.9375rem', lineHeight: 1.65, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center', background: '#0a1628', flex: 1 }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem',
          }}>
            Jautājumi? Sazinieties ar mums.
          </h2>
          <p style={{ color: '#8fa3bc', marginBottom: '1.75rem', fontSize: '0.9375rem' }}>
            {t('about.ctaText')}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/kontakti" style={ctaBtn}>{t('nav.contact')}</Link>
            <Link to="/admin/register" style={ctaBtnSecondary}>{t('nav.start')}</Link>
          </div>
        </div>
      </section>

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
  color: '#f0a500',
  letterSpacing: '0.1em',
  fontWeight: 600,
  marginBottom: '1.25rem',
}
const h1 = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: 'clamp(2.25rem, 6vw, 3.5rem)',
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: 1.1,
  marginBottom: '1.25rem',
}
const subtitle = {
  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
  color: '#8fa3bc',
  lineHeight: 1.65,
  maxWidth: '520px',
  margin: '0 auto',
}
const sectionH2 = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
  fontWeight: 700,
  color: '#ffffff',
  marginBottom: '1.25rem',
}
const ctaBtn = {
  display: 'inline-flex', alignItems: 'center',
  background: '#f0a500', color: '#0a1628',
  borderRadius: '8px', padding: '0.8rem 2rem',
  fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none',
}
const ctaBtnSecondary = {
  display: 'inline-flex', alignItems: 'center',
  background: 'transparent', color: '#e0e8f4',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px', padding: '0.8rem 2rem',
  fontWeight: 500, fontSize: '0.9375rem', textDecoration: 'none',
}
