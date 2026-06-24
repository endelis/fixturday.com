import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { useDateLocale } from '../../hooks/useDateLocale'
import { useMatch, getLogoUrl } from '../../hooks/useMatch'
import { toast } from '../../components/Toast'
import PublicNav from '../../components/PublicNav'
import { useEffect } from 'react'
import { useSEO } from '../../hooks/useSEO'

function countryFlag(code) {
  if (!code) return ''
  return code.toUpperCase().replace(/./g, ch =>
    String.fromCodePoint(ch.charCodeAt(0) + 127397)
  )
}

function StatusPill({ status, t }) {
  const styles = {
    scheduled: { background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-text-muted)' },
    live:      { background: 'var(--color-success)', color: '#fff' },
    completed: { background: 'var(--color-bg)', color: 'var(--color-text-muted)', border: '1px solid var(--color-text-muted)' },
    postponed: { background: 'var(--color-danger)',  color: '#fff' },
  }
  const label = {
    scheduled: t('match.statusScheduled'),
    live:      t('match.statusLive'),
    completed: t('match.statusCompleted'),
    postponed: t('match.statusPostponed'),
  }
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      ...(styles[status] ?? styles.scheduled),
    }}>
      {label[status] ?? status}
    </span>
  )
}

function TeamBlock({ team, t }) {
  const logoUrl = getLogoUrl(team?.logo_path, null, 'team-logos')
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      flex: 1,
      minWidth: 0,
    }}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={team?.name}
          style={{ width: '4rem', height: '4rem', objectFit: 'contain', borderRadius: '0.25rem' }}
        />
      ) : (
        <div style={{
          width: '4rem', height: '4rem',
          background: 'var(--color-surface)',
          borderRadius: '0.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', color: 'var(--color-text-muted)',
        }}>
          ⚽
        </div>
      )}
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
        fontWeight: 700,
        textAlign: 'center',
        lineHeight: 1.2,
        wordBreak: 'break-word',
      }}>
        {team?.name ?? '?'}
      </span>
      {team?.country_code && (
        <span style={{ fontSize: '1.25rem' }} title={team.country_code}>
          {countryFlag(team.country_code)}
        </span>
      )}
    </div>
  )
}

export default function Match() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { slug, matchId } = useParams()
  const { match, loading, error } = useMatch(matchId)

  useEffect(() => {
    if (error) toast(t('errors.loadFailed'), 'error')
  }, [error, t])

  const seoHome = match?.home_team?.name
  const seoAway = match?.away_team?.name
  const seoTournament = match?.stages?.age_groups?.tournaments?.name
  const seoTitle = seoHome && seoAway ? `${seoHome} – ${seoAway}` : 'Match'
  const seoDesc = seoHome && seoAway
    ? `Match result and details for ${seoHome} vs ${seoAway}${seoTournament ? ` — ${seoTournament}` : ''}. See kick-off time, pitch, goals, and match events.`
    : 'Match result and details including kick-off time, goals, and match events.'
  useSEO({ title: seoTitle, description: seoDesc, path: `/${slug}/matches/${matchId}` })

  if (loading) return <div className="loading">{t('common.loading')}</div>

  if (!match) {
    return (
      <div>
        <PublicNav />
        <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>{t('match.matchNotFound')}</p>
        </div>
      </div>
    )
  }

  const stage      = match.stages
  const ageGroup   = stage?.age_groups
  const tournament = ageGroup?.tournaments
  const result     = match.fixture_results?.[0]
  const isCompleted = match.status === 'completed'
  const isLive      = match.status === 'live'
  const tournamentLogoUrl = getLogoUrl(tournament?.logo_path, tournament?.logo_url, 'tournament-logos')

  const mapsHref = match.pitch?.venues?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.pitch.venues.address)}`
    : null

  return (
    <div>
      <PublicNav tournament={tournament} />

      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>

        {/* Breadcrumb */}
        <nav style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          <Link to="/tournaments" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            {t('match.breadcrumbAll')}
          </Link>
          <span>›</span>
          {tournament && (
            <>
              <Link to={`/t/${tournament.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
                {tournamentLogoUrl && (
                  <img src={tournamentLogoUrl} alt="" style={{ width: '1.25rem', height: '1.25rem', objectFit: 'contain', borderRadius: '2px' }} />
                )}
                {tournament.name}
              </Link>
              <span>›</span>
            </>
          )}
          <span>{t('match.title')}</span>
        </nav>

        {/* Match card */}
        <div className="card" style={{ padding: '1.5rem' }}>

          {/* Meta row: age group / stage / group / round */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {ageGroup?.name && (
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{ageGroup.name}</span>
            )}
            {stage?.type && (
              <>
                <span style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>·</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{stage.type}</span>
              </>
            )}
            {match.group_label && (
              <>
                <span style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>·</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{match.group_label}</span>
              </>
            )}
            {match.round_name && (
              <>
                <span style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>·</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{match.round_name}</span>
              </>
            )}
            <span style={{ marginLeft: 'auto' }}>
              <StatusPill status={match.status} t={t} />
            </span>
          </div>

          {/* Teams + score */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
            className="match-scoreline"
          >
            <TeamBlock team={match.home_team} t={t} />

            {/* Centre: score or vs */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              flexShrink: 0,
            }}>
              {isCompleted && result ? (
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: 'var(--color-text)',
                  letterSpacing: '0.05em',
                }}>
                  {result.home_goals} – {result.away_goals}
                </span>
              ) : isLive && result ? (
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: 'var(--color-success)',
                  letterSpacing: '0.05em',
                }}>
                  {result.home_goals} – {result.away_goals}
                </span>
              ) : (
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                }}>
                  {t('match.vs')}
                </span>
              )}
            </div>

            <TeamBlock team={match.away_team} t={t} />
          </div>

          {/* Match details */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            {match.kickoff_time && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ minWidth: '5rem', fontWeight: 500, color: 'var(--color-text)' }}>{t('match.kickoff')}</span>
                <span>{format(new Date(match.kickoff_time), "dd. MMMM yyyy, HH:mm", { locale: dateLocale })}</span>
              </div>
            )}
            {match.pitch && (
              <>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ minWidth: '5rem', fontWeight: 500, color: 'var(--color-text)' }}>{t('match.pitch')}</span>
                  <span>{match.pitch.name}</span>
                </div>
                {match.pitch.venues && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ minWidth: '5rem', fontWeight: 500, color: 'var(--color-text)' }}>{t('match.venue')}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span>{match.pitch.venues.name}</span>
                      {match.pitch.venues.address && (
                        <span style={{ fontSize: '0.8rem' }}>
                          {match.pitch.venues.address}
                          {mapsHref && (
                            <>
                              {' '}
                              <a
                                href={mapsHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--color-accent)', textDecoration: 'none', fontSize: '0.8rem' }}
                              >
                                {t('match.openInMaps')} ↗
                              </a>
                            </>
                          )}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 540px) {
          .match-scoreline {
            flex-direction: row !important;
            justify-content: center;
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
}
