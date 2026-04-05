import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PublicNav from '../../components/PublicNav'
import { Heart, Shield, Users } from 'lucide-react'

export default function About() {
  const { t } = useTranslation()

  const values = [
    {
      icon: <Heart size={24} />,
      title: t('about.value1Title'),
      desc: t('about.value1Desc'),
    },
    {
      icon: <Shield size={24} />,
      title: t('about.value2Title'),
      desc: t('about.value2Desc'),
    },
    {
      icon: <Users size={24} />,
      title: t('about.value3Title'),
      desc: t('about.value3Desc'),
    },
  ]

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text)' }}>
      <PublicNav />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(180deg, #0d1b2e 0%, var(--color-bg) 100%)',
        padding: '5rem 1.5rem 3rem',
        textAlign: 'center',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 700,
            color: 'var(--color-accent)',
            marginBottom: '1.25rem',
            letterSpacing: '0.02em',
          }}>
            {t('about.title')}
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.7,
            maxWidth: '520px',
            margin: '0 auto',
          }}>
            {t('about.mission')}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '800px' }}>

        {/* Story */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.75rem',
            color: 'var(--color-text)',
            marginBottom: '1rem',
          }}>
            {t('about.storyTitle')}
          </h2>
          <div style={{ display: 'grid', gap: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: '0.9375rem' }}>
            <p>{t('about.storyP1')}</p>
            <p>{t('about.storyP2')}</p>
          </div>
        </section>

        {/* Values */}
        <section>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.75rem',
            color: 'var(--color-text)',
            marginBottom: '1.5rem',
          }}>
            {t('about.valuesTitle')}
          </h2>
          <div className="about-values-grid">
            {values.map((v, i) => (
              <div key={i} style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '1.5rem',
              }}>
                <div style={{ color: 'var(--color-accent)', marginBottom: '0.75rem' }}>{v.icon}</div>
                <h3 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.2rem',
                  color: 'var(--color-text)',
                  marginBottom: '0.4rem',
                }}>
                  {v.title}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div style={{ marginTop: '3.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{t('about.ctaText')}</p>
          <Link to="/admin/register" className="btn-primary" style={{ marginRight: '0.75rem' }}>
            {t('nav.start')}
          </Link>
          <Link to="/kontakti" className="btn-secondary">{t('nav.contact')}</Link>
        </div>
      </div>

      <style>{`
        .about-values-grid {
          display: grid; grid-template-columns: 1fr; gap: 1rem;
        }
        @media (min-width: 600px) {
          .about-values-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  )
}
