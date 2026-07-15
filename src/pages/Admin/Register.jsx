import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'
import Turnstile from '../../components/Turnstile'

export default function Register() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const [authError, setAuthError] = useState(null)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const handleVerify = useCallback((token) => setTurnstileToken(token), [])

  const password = watch('password')

  async function onSubmit({ email, password, confirmPassword, firstName, lastName, phone, newsletterOptIn }) {
    if (password !== confirmPassword) {
      setAuthError(t('auth.passwordMismatch'))
      return
    }
    if (!turnstileToken) { setAuthError(t('common.error') + ': Security check not ready'); return }
    setAuthError(null)
    try {
      const verifyRes = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      })
      const { success } = await verifyRes.json()
      if (!success) { setAuthError(t('common.error') + ': Security check failed'); setTurnstileToken(null); return }
    } catch {
      setAuthError(t('common.error') + ': Could not verify security check')
      return
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName || null,
          phone: phone || null,
          newsletter_opt_in: !!newsletterOptIn,
        },
        emailRedirectTo: 'https://www.fixturday.com/auth/confirm',
      },
    })
    if (error) { setAuthError(error.message); return }

    if (newsletterOptIn) {
      fetch('/api/subscribe-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName: lastName || '' }),
      }).catch(() => {})
    }

    toast(t('auth.registerSuccess'))
    navigate('/admin/dashboard', { replace: true })
  }

  return (
    <div className="admin-login" style={{ position: 'relative' }}>
      <Link to="/" style={{ position: 'absolute', top: '1rem', left: '1rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
        <ArrowLeft size={20} />
      </Link>
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2.5rem',
            color: 'var(--color-accent)',
            margin: 0,
            letterSpacing: '0.05em',
          }}>
            FIXTURDAY
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {t('auth.register')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="firstName">{t('auth.firstName')}</label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              {...register('firstName', { required: t('common.required') })}
            />
            {errors.firstName && <span className="error-message">{errors.firstName.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">
              {t('auth.lastName')}{' '}
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({t('auth.optional')})</span>
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              {...register('lastName')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              {t('auth.phone')}{' '}
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({t('auth.optional')})</span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              {...register('phone')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email', { required: t('common.required') })}
            />
            {errors.email && <span className="error-message">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password', {
                required: t('common.required'),
                minLength: { value: 6, message: t('auth.passwordMinLength') },
              })}
            />
            {errors.password && <span className="error-message">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword', { required: t('common.required') })}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword.message}</span>}
          </div>

          {/* Terms of Use — required */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', margin: '1rem 0 0.5rem' }}>
            <input
              type="checkbox"
              id="termsAccepted"
              {...register('termsAccepted', { required: t('auth.termsRequired') })}
              style={{ marginTop: '0.2rem', flexShrink: 0, accentColor: 'var(--color-accent)', width: 15, height: 15, cursor: 'pointer' }}
            />
            <label htmlFor="termsAccepted" style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', cursor: 'pointer', lineHeight: 1.45 }}>
              {t('auth.termsAccept')}{' '}
              <Link to="/terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>
                {t('auth.termsLink')}
              </Link>
            </label>
          </div>
          {errors.termsAccepted && <span className="error-message" style={{ display: 'block', marginBottom: '0.5rem' }}>{errors.termsAccepted.message}</span>}

          {/* Newsletter opt-in — optional */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', margin: '0.4rem 0 1rem' }}>
            <input
              type="checkbox"
              id="newsletterOptIn"
              {...register('newsletterOptIn')}
              style={{ marginTop: '0.2rem', flexShrink: 0, accentColor: 'var(--color-accent)', width: 15, height: 15, cursor: 'pointer' }}
            />
            <label htmlFor="newsletterOptIn" style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', cursor: 'pointer', lineHeight: 1.45 }}>
              {t('auth.newsletterSubscribe')}
            </label>
          </div>

          <Turnstile onVerify={handleVerify} />

          {authError && <p className="error-message">{authError}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || !turnstileToken}
            style={{ width: '100%', marginTop: '16px', opacity: (isSubmitting || !turnstileToken) ? 0.6 : 1 }}
          >
            {isSubmitting ? t('common.loading') : t('auth.registerBtn')}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {t('auth.haveAccount')}{' '}
            <Link to="/admin" style={{ color: 'var(--color-accent)' }}>
              {t('auth.login')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
