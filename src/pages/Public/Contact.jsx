import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { Mail, MapPin, Clock, CheckCircle } from 'lucide-react'

export default function Contact() {
  const { t } = useTranslation()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    document.title = t('contact.pageTitle')
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', t('contact.metaDesc'))
  }, [t])
  const [submitted, setSubmitted] = useState(false)

  async function onSubmit(values) {
    const { error } = await supabase.from('contact_messages').insert({
      name: values.name,
      email: values.email,
      message: values.message,
    })
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('contact.success'))
    reset()
    setSubmitted(true)
  }

  const infoCards = [
    {
      icon: <Mail size={20} />,
      label: t('contact.infoEmailLabel'),
      value: t('contact.infoEmailValue'),
      href: `mailto:${t('contact.infoEmailValue')}`,
    },
    {
      icon: <MapPin size={20} />,
      label: t('contact.infoLocationLabel'),
      value: t('contact.infoLocationValue'),
      href: null,
    },
    {
      icon: <Clock size={20} />,
      label: t('contact.infoResponseLabel'),
      value: t('contact.infoResponseValue'),
      href: null,
    },
  ]

  return (
    <div style={{ background: '#0a1628', color: '#e0e8f4', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNav />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{
        padding: '4.5rem 1.5rem 3rem',
        textAlign: 'center',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(240,165,0,0.07) 0%, transparent 70%), #0a1628',
      }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={pill}>{t('contact.pill')}</div>
          <h1 style={h1}>{t('contact.title')}</h1>
          <p style={subtitle}>{t('contact.subtitle')}</p>
        </div>
      </section>

      {/* ── Two-column layout ─────────────────────────────────── */}
      <section style={{ flex: 1, padding: '3rem 1.5rem 4rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }} className="contact-grid">

          {/* Left — contact info cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {infoCards.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                background: '#0d1b2e',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
              }}>
                <div style={{
                  color: '#f0a500',
                  flexShrink: 0,
                  background: 'rgba(240,165,0,0.1)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#8fa3bc',
                    marginBottom: '0.2rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                  }}>
                    {item.label}
                  </div>
                  {item.href ? (
                    <a href={item.href} style={{ color: '#e0e8f4', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500 }}>
                      {item.value}
                    </a>
                  ) : (
                    <span style={{ color: '#e0e8f4', fontSize: '0.9375rem', fontWeight: 500 }}>{item.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right — form */}
          <div style={{
            background: '#0d1b2e',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '2rem',
          }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <CheckCircle size={48} style={{ color: '#22c55e', margin: '0 auto 1rem', display: 'block' }} />
                <h2 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1.75rem',
                  color: '#22c55e',
                  marginBottom: '0.75rem',
                }}>
                  {t('contact.successTitle')}
                </h2>
                <p style={{ color: '#8fa3bc', marginBottom: '1.5rem' }}>{t('contact.successBody')}</p>
                <button
                  onClick={() => setSubmitted(false)}
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#e0e8f4',
                    background: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)',
                    minHeight: '44px',
                  }}
                >
                  {t('contact.sendAnother')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>{t('contact.name')} *</label>
                  <input
                    {...register('name', { required: t('common.required') })}
                    placeholder={t('contact.namePlaceholder')}
                  />
                  {errors.name && <span className="error-message">{errors.name.message}</span>}
                </div>

                <div className="form-group">
                  <label>{t('contact.email')} *</label>
                  <input
                    type="email"
                    {...register('email', { required: t('common.required') })}
                    placeholder={t('contact.emailPlaceholder')}
                  />
                  {errors.email && <span className="error-message">{errors.email.message}</span>}
                </div>

                <div className="form-group">
                  <label>{t('contact.message')} *</label>
                  <textarea
                    rows={5}
                    placeholder={t('contact.messagePlaceholder')}
                    {...register('message', {
                      required: t('common.required'),
                      minLength: { value: 10, message: t('contact.messageTooShort') },
                    })}
                  />
                  {errors.message && <span className="error-message">{errors.message.message}</span>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    background: '#f0a500',
                    color: '#0a1628',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.85rem 1.5rem',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    fontFamily: 'var(--font-body)',
                    minHeight: '44px',
                    transition: 'opacity 150ms',
                  }}
                >
                  {isSubmitting ? t('common.saving') : t('contact.submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 768px) {
          .contact-grid { grid-template-columns: 1fr 1.6fr; }
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
  color: '#f0a500',
  letterSpacing: '0.1em',
  fontWeight: 600,
  marginBottom: '1.25rem',
}
const h1 = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  fontWeight: 700,
  color: '#ffffff',
  marginBottom: '0.75rem',
}
const subtitle = {
  fontSize: 'clamp(0.9375rem, 2vw, 1rem)',
  color: '#8fa3bc',
  lineHeight: 1.6,
  margin: 0,
}
