import { Link } from 'react-router-dom'

/**
 * Public navigation bar.
 * Props:
 *   tournament        – current tournament object (optional, for breadcrumb)
 *   ageGroups         – sibling age groups (kept for Schedule/Standings compat)
 *   activeAgeGroupId  – active age group id (kept for Schedule/Standings compat)
 */
export default function PublicNav({ tournament, ageGroups = [], activeAgeGroupId }) {
  return (
    <nav style={{
      background: '#0d1b2e',
      borderBottom: '1px solid #1e3a5f',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '60px',
          gap: '0.75rem',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}
        >
          <img src="/logo-horizontal.svg" alt="Fixturday" style={{ height: '26px', display: 'block' }} />
        </Link>

        {/* Tournament breadcrumb */}
        {tournament && (
          <>
            <span style={{ color: '#2e4a68', fontSize: '1.1rem', flexShrink: 0, lineHeight: 1 }}>›</span>
            <span style={{
              color: '#8fa3bc',
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '180px',
            }}>
              {tournament.name}
            </span>
          </>
        )}

        {/* Age group tab switcher — backward compat for Schedule/Standings pages */}
        {ageGroups.length > 0 && tournament && (
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            flexWrap: 'wrap',
            marginLeft: 'auto',
            alignItems: 'center',
          }}>
            {ageGroups.map(ag => {
              const isActive = activeAgeGroupId === ag.id
              return (
                <Link
                  key={ag.id}
                  to={`/t/${tournament.slug}/${ag.id}`}
                  style={{
                    padding: '0.3rem 0.7rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: '36px',
                    background: isActive ? '#f0a500' : 'transparent',
                    color: isActive ? '#0d1b2e' : '#8fa3bc',
                    border: `1px solid ${isActive ? '#f0a500' : '#2e4a68'}`,
                    transition: 'all 200ms ease',
                  }}
                >
                  {ag.name}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
