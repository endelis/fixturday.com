import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'

export default function Register() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const [authError, setAuthError] = useState(null)

  const password = watch('password')

  async function onSubmit({ email, password, confirmPassword }) {
    if (password !== confirmPassword) {
      setAuthError(t('auth.passwordMismatch'))
      return
    }
    setAuthError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setAuthError(error.message); return }
    toast(t('auth.registerSuccess'))
    navigate('/admin/dashboard', { replace: true })
  }

  return (
    <div className="admin-login">
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

          {authError && <p className="error-message">{authError}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%' }}
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
