import { Link } from 'react-router-dom'

export default function PublicNav({ tournament, ageGroups = [], activeAgeGroupId }) {
  return (
    <nav style={{
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '3.5rem', flexWrap: 'wrap' }}>
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            color: 'var(--color-accent)',
            textDecoration: 'none',
            fontWeight: 700,
            letterSpacing: '0.02em',
            flexShrink: 0,
          }}
        >
          FIXTURDAY
        </Link>

        {tournament && (
          <>
            <span style={{ color: 'var(--color-border)', flexShrink: 0 }}>›</span>
            <Link
              to={`/t/${tournament.slug}`}
              style={{
                color: activeAgeGroupId ? 'var(--color-text-muted)' : 'var(--color-text)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                flexShrink: 0,
              }}
            >
              {tournament.name}
            </Link>
          </>
        )}

        {ageGroups.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
            {ageGroups.map(ag => (
              <Link
                key={ag.id}
                to={`/t/${tournament.slug}/${ag.id}`}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: activeAgeGroupId === ag.id ? 'var(--color-accent)' : 'var(--color-surface-2)',
                  color: activeAgeGroupId === ag.id ? '#000' : 'var(--color-text-muted)',
                  border: `1px solid ${activeAgeGroupId === ag.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                }}
              >
                {ag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
