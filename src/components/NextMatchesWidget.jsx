import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, isToday } from 'date-fns'
import { useDateLocale } from '../hooks/useDateLocale'
import { useNextMatches } from '../hooks/useNextMatches'
import TeamLogo from './TeamLogo'

function formatKickoff(kickoffTime, locale) {
  if (!kickoffTime) return '—'
  const dt = new Date(kickoffTime)
  if (isToday(dt)) return format(dt, 'HH:mm')
  return format(dt, 'dd. MMM HH:mm', { locale })
}

export default function NextMatchesWidget({ tournamentId, slug, limit = 10 }) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { matches, loading } = useNextMatches(tournamentId, limit)

  if (loading || matches.length === 0) return null

  return (
    <section>
      <h2 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '1.25rem',
        color: 'var(--color-accent)',
        marginBottom: '0.75rem',
      }}>
        {t('widget.nextMatches')}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {matches.map(match => (
          <Link
            key={match.id}
            to={`/${slug}/matches/${match.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '0.625rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
                transition: 'border-color 200ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              {/* Time + age group label */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: '3.5rem', flexShrink: 0 }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  letterSpacing: '0.02em',
                }}>
                  {formatKickoff(match.kickoff_time, dateLocale)}
                </span>
                {match.stage?.age_group?.name && (
                  <span style={{
                    fontSize: '0.68rem',
                    color: 'var(--color-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    lineHeight: 1.3,
                  }}>
                    {match.stage.age_group.name}
                  </span>
                )}
              </div>

              {/* Home team */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                flex: 1,
                justifyContent: 'flex-end',
                minWidth: '5rem',
              }}>
                <span style={{
                  fontSize: '0.9rem',
                  color: 'var(--color-text)',
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {match.home_team?.name ?? '?'}
                </span>
                <TeamLogo size="sm" logoPath={match.home_team?.logo_path} alt={match.home_team?.name ?? ''} />
              </div>

              {/* vs */}
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.85rem',
                color: 'var(--color-muted)',
                flexShrink: 0,
              }}>
                {t('fixture.vs')}
              </span>

              {/* Away team */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                flex: 1,
                minWidth: '5rem',
              }}>
                <TeamLogo size="sm" logoPath={match.away_team?.logo_path} alt={match.away_team?.name ?? ''} />
                <span style={{
                  fontSize: '0.9rem',
                  color: 'var(--color-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {match.away_team?.name ?? '?'}
                </span>
              </div>

              {/* Pitch */}
              {match.pitch?.name && (
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-muted)',
                  flexShrink: 0,
                }}>
                  {match.pitch.venues?.name ? `${match.pitch.venues.name} · ` : ''}{match.pitch.name}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
