import { getLogoUrl } from '../hooks/useMatch'

const SIZE = { sm: 32, md: 64, lg: 128 }

export default function TeamLogo({ logoPath, size = 'md', alt = '', className }) {
  const px = SIZE[size] ?? SIZE.md
  const src = getLogoUrl(logoPath, null, 'team-logos')

  if (!src) {
    const initial = alt ? alt.charAt(0).toUpperCase() : '?'
    return (
      <span
        aria-label={alt || undefined}
        role={alt ? 'img' : 'presentation'}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: px,
          height: px,
          borderRadius: '50%',
          background: 'var(--color-surface)',
          color: 'var(--color-accent)',
          fontSize: Math.floor(px * 0.45),
          fontWeight: 700,
          flexShrink: 0,
          userSelect: 'none',
          verticalAlign: 'middle',
        }}
      >
        {initial}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={px}
      height={px}
      loading="lazy"
      className={className}
      style={{ objectFit: 'contain', borderRadius: '2px', flexShrink: 0, verticalAlign: 'middle' }}
    />
  )
}
