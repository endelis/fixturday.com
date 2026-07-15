import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [pageError, setPageError] = useState(null)
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    let settled = false
    const resolve = () => { if (!settled) { settled = true; setReady(true) } }
    const fail = (msg) => { if (!settled) { settled = true; setPageError(msg) } }

    // Register listener FIRST — Supabase processes the hash asynchronously so
    // this is guaranteed to be in place before PASSWORD_RECOVERY fires
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') resolve()
    })

    // Also handle ?code= in URL (non-PKCE OTP code, e.g. from older email links)
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) fail(t('auth.resetLinkExpired'))
        else resolve()
      })
    }

    return () => subscription.unsubscribe()
  }, [t])

  async function onSubmit({ password }) {
    setPageError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setPageError(error.message); return }
    setSuccess(true)
    await supabase.auth.signOut()
    setTimeout(() => navigate('/admin', { replace: true }), 2500)
  }

  return (
    <div className="admin-login" style={{ position: 'relative' }}>
      <Link to="/admin" style={{ position: 'absolute', top: '1rem', left: '1rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
        <ArrowLeft size={20} />
      </Link>
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--color-accent)', margin: 0, letterSpacing: '0.05em' }}>
            FIXTURDAY
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {t('auth.resetPassword')}
          </p>
        </div>

        {success ? (
          <p style={{ textAlign: 'center', color: 'var(--color-success)', lineHeight: 1.5 }}>
            {t('auth.passwordUpdated')}
          </p>
        ) : pageError && !ready ? (
          <p style={{ textAlign: 'center', color: 'var(--color-danger)', lineHeight: 1.5 }}>
            {pageError}
          </p>
        ) : !ready ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('common.loading')}</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-group">
              <label>{t('auth.newPassword')}</label>
              <input
                type="password"
                autoComplete="new-password"
                {...register('password', {
                  required: true,
                  minLength: { value: 6, message: t('auth.passwordMinLength') },
                })}
              />
              {errors.password && <span className="error-message">{errors.password.message || t('auth.newPassword')}</span>}
            </div>
            <div className="form-group">
              <label>{t('auth.confirmPassword')}</label>
              <input
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  validate: v => v === watch('password') || t('auth.passwordMismatch'),
                })}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword.message}</span>}
            </div>

            {pageError && <p className="error-message">{pageError}</p>}

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ marginTop: '1.5rem', width: '100%' }}
            >
              {isSubmitting ? t('common.loading') : t('auth.resetPassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
