import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [authError, setAuthError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [session, navigate]);

  async function onSubmit({ email, password }) {
    setAuthError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate("/admin/dashboard", { replace: true });
    } catch {
      setAuthError(t('auth.loginError'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    const email = document.getElementById('email')?.value;
    if (!email) { setAuthError(t('auth.enterEmailFirst')); return }
    await supabase.auth.resetPasswordForEmail(email);
    setAuthError(null);
    alert(t('auth.resetSent'));
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--color-accent)', margin: 0, letterSpacing: '0.05em' }}>
            FIXTURDAY
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {t('auth.adminPanel')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email", { required: true })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password", { required: true })}
            />
          </div>

          {authError && (
            <p className="error-message">{authError}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{ marginTop: '8px' }}
          >
            {submitting ? t('common.loading') : t('auth.login')}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem' }}>
            <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
              {t('auth.forgotPassword')}
            </button>
          </p>

          <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {t('auth.noAccount')}{' '}
            <a href="/admin/register" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
              {t('auth.registerBtn')}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
