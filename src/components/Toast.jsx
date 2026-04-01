import { useEffect, useState } from 'react'

let _addToast = null

export function toast(message, type = 'success') {
  _addToast?.({ message, type, id: Date.now() })
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _addToast = (t) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500)
    }
    return () => { _addToast = null }
  }, [])

  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 9999,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? 'var(--color-danger)' : t.type === 'warning' ? 'var(--color-warning)' : 'var(--color-success)',
          color: '#fff',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          fontWeight: 500,
          fontSize: '0.9rem',
          animation: 'fadeIn 0.2s ease',
        }}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
