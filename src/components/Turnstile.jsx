import { useEffect, useRef } from 'react'

const SCRIPT_ID = 'cf-turnstile-script'
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

export default function Turnstile({ onVerify }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  // Stable ref so the effect never needs to re-run when the callback changes
  const onVerifyRef = useRef(onVerify)
  onVerifyRef.current = onVerify

  useEffect(() => {
    function render() {
      if (!containerRef.current || widgetIdRef.current !== null) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: 'dark',
        callback:          (token) => onVerifyRef.current(token),
        'expired-callback':       () => onVerifyRef.current(null),
        'error-callback':         () => onVerifyRef.current(null),
      })
    }

    if (window.turnstile) {
      render()
    } else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.onload = render
      document.head.appendChild(script)
    } else {
      document.getElementById(SCRIPT_ID).addEventListener('load', render, { once: true })
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} style={{ marginTop: '0.25rem' }} />
}
