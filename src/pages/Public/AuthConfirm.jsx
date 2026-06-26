import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AuthConfirm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      setErrorMsg(errorDescription || error)
      setStatus('error')
      return
    }

    if (!code) {
      setErrorMsg('No confirmation code found. The link may have expired.')
      setStatus('error')
      return
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error: exchErr }) => {
      if (exchErr) {
        setErrorMsg(exchErr.message)
        setStatus('error')
      } else {
        setStatus('success')
        setTimeout(() => navigate('/admin/dashboard', { replace: true }), 2500)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2rem',
          color: 'var(--color-accent)',
          margin: '0 0 2.5rem',
          letterSpacing: '0.05em',
        }}>
          FIXTURDAY
        </h1>

        {status === 'loading' && (
          <>
            <div style={{
              width: 48, height: 48,
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-accent)',
              borderRadius: '50%',
              margin: '0 auto 1.25rem',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Confirming your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '1.25rem' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
              Email confirmed
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Your account is ready. Taking you to the dashboard…
            </p>
            <Link to="/admin/dashboard" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
              Go to dashboard →
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} color="#ef4444" style={{ marginBottom: '1.25rem' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
              Confirmation failed
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {errorMsg}
            </p>
            <Link to="/admin/register" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
              Back to registration →
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
