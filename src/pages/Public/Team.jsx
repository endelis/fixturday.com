import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { format } from 'date-fns'
import { lv } from 'date-fns/locale'
import { useTeamProfile, getLogoUrl } from '../../hooks/useTeamProfile'
import { toast } from '../../components/Toast'
import { formatTime } from '../../utils/dateFormat'
import PublicNav from '../../components/PublicNav'

function countryFlag(code) {
  if (!code) return ''
  return code.toUpperCase().replace(/./g, ch =>
    String.fromCodePoint(ch.charCodeAt(0) + 127397)
  )
}

function dayHeader(dateKey) {
  if (!dateKey || dateKey === '__NO_DATE__') return '—'
  const s = format(new Date(dateKey + 'T00:00:00'), "EEEE, dd. MMMM yyyy", { locale: lv })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function resultStyle(f, teamId) {
  if (f.status !== 'completed') return 'var(--color-muted)'
  const r = f.fixture_results?.[0]
  if (!r) return 'var(--color-muted)'
  const isHome = f.home_team_id === teamId
  const mine = isHome ? r.home_goals : r.away_goals
  const opp  = isHome ? r.away_goals : r.home_goals
  if (mine > opp)  return 'var(--color-success)'
  if (mine < opp)  return 'var(--color-danger)'
  return 'var(--color-muted)'
}

function HABadge({ isHome, t }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.5rem',
      borderRadius: '999px',
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      flexShrink: 0,
      background: isHome ? 'var(--color-accent)' : 'transparent',
      color: isHome ? '#000' : 'var(--color-muted)',
      border: isHome ? 'none' : '1px solid var(--color-muted)',
    }}>
      {isHome ? t('team.home') : t('team.away')}
    </span>
  )
}

function StatCell({ label, value }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0.6rem 0.9rem',
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius, 0.5rem)',
      minWidth: '3.25rem',
    }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
        {label}
      </span>
      <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
        {value}
      </span>
    </div>
  )
}

export default function Team() {
  const { t } = useTranslation()
  const { slug, teamId } = useParams()
  const { team, tournament, fixtures, record, loading, error } = useTeamProfile(slug, teamId)

  useEffect(() => {
    if (error) toast(t('errors.loadFailed'), 'error')
  }, [error, t])

  useEffect(() => {
    if (!team) return
    document.title = `${team.name} — Fixturday`
    return () => { document.title = 'Fixturday' }
  }, [team])

  if (loading) return <div className="loading">{t('common.loading')}</div>

  if (!team) {
    return (
      <div>
        <PublicNav />
        <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-muted)' }}>{t('team.notFound')}</p>
        </div>
      </div>
    )
  }

  const teamLogoUrl    = getLogoUrl(team.logo_path, null, 'team-logos')
  const tournamentLogo = getLogoUrl(tournament?.logo_path, tournament?.logo_url, 'tournament-logos')
  const ageGroupName   = team.age_groups?.name

  // Group fixtures by calendar day (ascending — already sorted by query)
  const grouped = fixtures.reduce((acc, f) => {
    const day = f.kickoff_time
      ? format(new Date(f.kickoff_time), 'yyyy-MM-dd')
      : '__NO_DATE__'
    ;(acc[day] = acc[day] ?? []).push(f)
    return acc
  }, {})

  const stats = [
    { label: t('team.played'),          value: record.played },
    { label: t('team.won'),             value: record.won },
    { label: t('team.drawn'),           value: record.drawn },
    { label: t('team.lost'),            value: record.lost },
    { label: t('team.goalsFor'),        value: record.gf },
    { label: t('team.goalsAgainst'),    value: record.ga },
    { label: t('team.goalDifference'),  value: record.gd >= 0 ? `+${record.gd}` : record.gd },
    { label: t('team.points'),          value: record.points },
  ]

  return (
    <div>
      <PublicNav tournament={tournament} />

      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>

        {/* Breadcrumb */}
        <nav style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
          <Link to="/turniri" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>
            {t('match.breadcrumbAll')}
          </Link>
          {tournament && (
            <>
              <span>›</span>
              <Link to={`/t/${tournament.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
                {tournamentLogo && (
                  <img src={tournamentLogo} alt="" style={{ width: '1.25rem', height: '1.25rem', objectFit: 'contain', borderRadius: '2px' }} />
                )}
                {tournament.name}
              </Link>
            </>
          )}
          <span>›</span>
          <span>{t('team.profile')}</span>
        </nav>

        {/* Hero card */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <div className="team-hero">
            {/* Logo */}
            {teamLogoUrl ? (
              <img
                src={teamLogoUrl}
                alt={team.name}
                style={{ width: '5rem', height: '5rem', objectFit: 'contain', borderRadius: '0.375rem' }}
              />
            ) : (
              <div style={{
                width: '5rem', height: '5rem',
                background: 'var(--color-surface)',
                borderRadius: '0.375rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', color: 'var(--color-muted)',
              }}>⚽</div>
            )}

            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', margin: 0, lineHeight: 1.1 }}>
                {team.name}
                {team.country_code && (
                  <span style={{ fontSize: '1.5rem', marginLeft: '0.5rem' }} title={team.country_code}>
                    {countryFlag(team.country_code)}
                  </span>
                )}
              </h1>
              {ageGroupName && (
                <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>{ageGroupName}</span>
              )}
              {team.contact_name && (
                <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                  {t('team.manager')}: {team.contact_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mini stats strip */}
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem', paddingBottom: '0.25rem' }}>
          <div style={{ display: 'flex', gap: '0.375rem', minWidth: 'max-content' }}>
            {stats.map(s => <StatCell key={s.label} label={s.label} value={s.value} />)}
          </div>
        </div>

        {/* Fixture list */}
        {fixtures.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>{t('team.noFixtures')}</p>
        ) : (
          Object.keys(grouped).sort().map(day => (
            <div key={day} style={{ marginBottom: '1.75rem' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.05rem',
                color: 'var(--color-accent)',
                marginBottom: '0.6rem',
                letterSpacing: '0.02em',
              }}>
                {dayHeader(day)}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {grouped[day].map(f => {
                  const isHome   = f.home_team_id === teamId
                  const opponent = isHome ? f.away_team : f.home_team
                  const oppLogo  = getLogoUrl(opponent?.logo_path, null, 'team-logos')
                  const result   = f.fixture_results?.[0]
                  const scoreColor = resultStyle(f, teamId)

                  return (
                    <Link
                      key={f.id}
                      to={`/${slug}/matches/${f.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="card fixture-row" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 0.9rem',
                        cursor: 'pointer',
                      }}>
                        {/* Time */}
                        <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem', minWidth: '2.5rem', flexShrink: 0 }}>
                          {f.kickoff_time ? formatTime(f.kickoff_time) : '—'}
                        </span>

                        {/* H/A badge */}
                        <HABadge isHome={isHome} t={t} />

                        {/* Opponent */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: 0 }}>
                          {oppLogo ? (
                            <img src={oppLogo} alt="" style={{ width: '1.25rem', height: '1.25rem', objectFit: 'contain', flexShrink: 0 }} />
                          ) : (
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚽</span>
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                            {opponent?.name ?? '?'}
                          </span>
                        </div>

                        {/* Score */}
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: '1rem',
                          minWidth: '3.25rem',
                          textAlign: 'center',
                          flexShrink: 0,
                          color: scoreColor,
                        }}>
                          {f.status === 'completed' && result
                            ? `${result.home_goals}–${result.away_goals}`
                            : f.status === 'live' && result
                              ? `${result.home_goals}–${result.away_goals}`
                              : '—'}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .team-hero {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }
        @media (min-width: 480px) {
          .team-hero {
            flex-direction: row;
            align-items: center;
          }
        }
        .fixture-row:hover {
          background: color-mix(in srgb, var(--color-surface) 80%, white 20%);
        }
      `}</style>
    </div>
  )
}
