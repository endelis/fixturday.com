import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Share2, Mail, Link2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

function FbIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
}
function XBirdIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.73-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
}
function WaIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.07-1.33A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.66 0-3.2-.49-4.48-1.33l-.32-.2-3.04.8.82-2.98-.21-.33A8 8 0 014 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8zm4.18-5.66c-.23-.12-1.37-.68-1.58-.75-.21-.08-.37-.12-.52.12-.16.23-.6.75-.73.91-.13.16-.27.17-.5.06-.23-.12-.97-.36-1.85-1.14-.68-.61-1.14-1.36-1.27-1.59-.13-.23-.01-.36.1-.47.1-.1.23-.27.34-.4.11-.14.15-.23.23-.38.08-.16.04-.29-.02-.4-.06-.12-.52-1.26-.71-1.72-.19-.45-.38-.39-.52-.4-.13-.01-.29-.01-.44-.01-.16 0-.4.06-.62.29-.21.23-.81.79-.81 1.93 0 1.14.83 2.24.95 2.4.12.16 1.63 2.49 3.95 3.49.55.24.98.38 1.32.49.55.18 1.06.15 1.46.09.44-.07 1.37-.56 1.56-1.1.19-.54.19-1 .14-1.1-.05-.1-.21-.15-.44-.27z"/></svg>
}

export default function TournamentShareStrip({ tournament, ageGroups = [], activeAgeGroupId }) {
  const { t } = useTranslation()
  const location = useLocation()
  const [liveStatus, setLiveStatus] = useState('connecting')
  const [shareCopied, setShareCopied] = useState(false)

  useEffect(() => {
    if (!tournament?.id) return
    const ch = supabase
      .channel(`share-strip-${tournament.id}`)
      .subscribe(s => setLiveStatus(s === 'SUBSCRIBED' ? 'connected' : 'connecting'))
    return () => { supabase.removeChannel(ch) }
  }, [tournament?.id])

  function getShareData() {
    const activeAg = ageGroups.find(ag => ag.id === activeAgeGroupId)
    const divSuffix = activeAg ? ` — ${activeAg.name}` : ''
    const title = tournament?.name ? `${tournament.name}${divSuffix}` : document.title
    const text = `Follow ${tournament?.name ?? 'this tournament'}${divSuffix} live on Fixturday`
    return { title, text, url: window.location.href }
  }

  async function handleShare() {
    const data = getShareData()
    if (navigator.canShare?.(data)) {
      try {
        await navigator.share(data)
        window.gtag?.('event', 'share', { method: 'native', content_type: 'tournament', item_id: tournament?.slug ?? '' })
        return
      } catch (e) {
        if (e.name === 'AbortError') return
      }
    }
    await copyLink()
  }

  function shareToFacebook() {
    const { url } = getShareData()
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
    window.gtag?.('event', 'share', { method: 'facebook', content_type: 'tournament', item_id: tournament?.slug ?? '' })
  }

  function shareToX() {
    const { text, url } = getShareData()
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
    window.gtag?.('event', 'share', { method: 'twitter', content_type: 'tournament', item_id: tournament?.slug ?? '' })
  }

  function shareToWhatsApp() {
    const { text, url } = getShareData()
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener,noreferrer')
    window.gtag?.('event', 'share', { method: 'whatsapp', content_type: 'tournament', item_id: tournament?.slug ?? '' })
  }

  function shareToEmail() {
    const { title, text, url } = getShareData()
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`
    window.gtag?.('event', 'share', { method: 'email', content_type: 'tournament', item_id: tournament?.slug ?? '' })
  }

  async function copyLink() {
    const { url } = getShareData()
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
      window.gtag?.('event', 'share', { method: 'clipboard', content_type: 'tournament', item_id: tournament?.slug ?? '' })
    } catch {}
  }

  const buttons = [
    { icon: <Share2 size={13} />, label: 'Share', fn: handleShare },
    { icon: <FbIcon />, label: 'Facebook', fn: shareToFacebook },
    { icon: <XBirdIcon />, label: 'X (Twitter)', fn: shareToX },
    { icon: <WaIcon />, label: 'WhatsApp', fn: shareToWhatsApp },
    { icon: <Mail size={13} />, label: 'Email', fn: shareToEmail },
    { icon: <Link2 size={13} />, label: 'Copy link', fn: copyLink, copied: shareCopied },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
      {/* LIVE indicator */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        fontSize: '0.65rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em',
        color: liveStatus === 'connected' ? 'var(--color-live)' : 'rgba(136,146,164,0.35)',
        marginRight: '0.25rem',
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: liveStatus === 'connected' ? 'var(--color-live)' : 'rgba(136,146,164,0.2)',
          boxShadow: liveStatus === 'connected' ? '0 0 6px var(--color-live)' : 'none',
          animation: liveStatus === 'connected' ? 'live-dot-pulse 2s ease-in-out infinite' : 'none',
        }} />
        LIVE
      </span>
      {/* Share label */}
      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-heading)', color: 'var(--color-text-muted)', marginRight: '0.1rem' }}>
        {t('standings.share')}
      </span>
      {/* Platform buttons */}
      {buttons.map(({ icon, label, fn, copied }) => (
        <button
          key={label}
          onClick={fn}
          aria-label={label}
          title={copied ? t('standings.shareCopied') : label}
          style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            border: `1px solid ${copied ? 'var(--color-success)' : 'rgba(255,255,255,0.1)'}`,
            background: copied ? 'rgba(46,204,113,0.12)' : 'var(--color-surface)',
            color: copied ? 'var(--color-success)' : 'var(--color-text-muted)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
            transition: 'color var(--transition-fast), border-color var(--transition-fast)',
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
