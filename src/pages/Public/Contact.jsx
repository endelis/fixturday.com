import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'
import PublicNav from '../../components/PublicNav'
import { Mail, MapPin } from 'lucide-react'

export default function Contact() {
  const { t } = useTranslation()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
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

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text)' }}>
      <PublicNav />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(180deg, #0d1b2e 0%, var(--color-bg) 100%)',
        padding: '4.5rem 1.5rem 3rem',
        textAlign: 'center',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
          fontWeight: 700,
          color: 'var(--color-accent)',
          marginBottom: '0.75rem',
          letterSpacing: '0.02em',
        }}>
          {t('contact.title')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: '600px' }}>

        {submitted ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
              {t('contact.successTitle')}
            </h2>
            <p style={{ color: 'var(--color-text-muted)' }}>{t('contact.successBody')}</p>
            <button
              className="btn-secondary"
              style={{ marginTop: '1.5rem' }}
              onClick={() => setSubmitted(false)}
            >
              {t('contact.sendAnother')}
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: '2rem' }}>
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
                  {...register('message', { required: t('common.required'), minLength: { value: 10, message: t('contact.messageTooShort') } })}
                  rows={5}
                  placeholder={t('contact.messagePlaceholder')}
                />
                {errors.message && <span className="error-message">{errors.message.message}</span>}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{ width: '100%' }}
              >
                {isSubmitting ? t('common.saving') : t('contact.submit')}
              </button>
            </form>
          </div>
        )}

        {/* Contact info */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            <Mail size={16} style={{ color: 'var(--color-accent)' }} />
            <span>info@fixturday.com</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            <MapPin size={16} style={{ color: 'var(--color-accent)' }} />
            <span>Latvija</span>
          </div>
        </div>
      </div>
    </div>
  )
}
