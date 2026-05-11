import { getLogoUrl } from '../hooks/useMatch'

const SIZE = { sm: 32, md: 64, lg: 128 }

export default function TournamentLogo({ logoPath, logoUrl, size = 'md', alt = '', className }) {
  const px = SIZE[size] ?? SIZE.md
  const src = getLogoUrl(logoPath, logoUrl, 'tournament-logos')

  if (!src) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={px}
        height={px}
        className={className}
        aria-label={alt || undefined}
        role={alt ? 'img' : 'presentation'}
        style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
      >
        <path
          d="M12 2L3 7v5c0 5.5 3.8 10.3 9 11.5C18.2 22.3 21 17.5 21 12V7l-9-5z"
          fill="var(--color-surface)"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
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
      style={{ objectFit: 'contain', flexShrink: 0, verticalAlign: 'middle' }}
    />
  )
}
