import { useEffect, useState } from 'react'

let _addToast = null

export function toast(message, type = 'success') {
  _addToast?.({ message, type, id: Date.now() })
}

const toastColors = {
  success: { bg: 'var(--color-success)', text: '#0a0f1e' },
  error:   { bg: 'var(--color-danger)',  text: '#ffffff' },
  warning: { bg: 'var(--color-warning)', text: '#0a0f1e' },
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
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      zIndex: 'var(--z-toast)',
    }}>
      {toasts.map(t => {
        const { bg, text } = toastColors[t.type] ?? toastColors.success
        return (
          <div key={t.id} style={{
            background: bg,
            color: text,
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            fontWeight: 600,
            fontSize: '0.9rem',
            animation: 'slideIn 0.2s ease',
            maxWidth: '320px',
            wordBreak: 'break-word',
            fontFamily: 'var(--font-body)',
          }}>
            {t.message}
          </div>
        )
      })}
    </div>
  )
}
