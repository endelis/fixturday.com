import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { formatDate, formatTime } from '../../utils/dateFormat'
import PublicNav from '../../components/PublicNav'
import TeamLogo from '../../components/TeamLogo'
import { useSEO } from '../../hooks/useSEO'

export default function Schedule() {
  const { t } = useTranslation()
  const { slug, ageGroup: ageGroupId } = useParams()
  const [ag, setAg] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [filter, setFilter] = useState('all')

  const seoTitle = ag ? `${ag.tournaments.name} — ${ag.name} Schedule` : 'Tournament Schedule'
  const seoDesc = ag
    ? `Full match schedule and results for ${ag.tournaments.name} — ${ag.name}. Kick-off times, venues, and live scores.`
    : 'Tournament match schedule, kick-off times and results.'
  const seoSchema = ag ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SportsEvent',
        '@id': `https://www.fixturday.com/t/${slug}/${ageGroupId}/schedule#event`,
        name: `${ag.tournaments.name} — ${ag.name}`,
        url: `https://www.fixturday.com/t/${slug}/${ageGroupId}/schedule`,
        sport: 'Football',
        organizer: { '@type': 'Organization', name: 'Fixturday', url: 'https://www.fixturday.com' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Fixturday', item: 'https://www.fixturday.com' },
          { '@type': 'ListItem', position: 2, name: 'Tournaments', item: 'https://www.fixturday.com/tournaments' },
          { '@type': 'ListItem', position: 3, name: ag.tournaments.name, item: `https://www.fixturday.com/t/${slug}` },
          { '@type': 'ListItem', position: 4, name: `${ag.name} Standings`, item: `https://www.fixturday.com/t/${slug}/${ageGroupId}` },
          { '@type': 'ListItem', position: 5, name: `${ag.name} Schedule`, item: `https://www.fixturday.com/t/${slug}/${ageGroupId}/schedule` },
        ],
      },
    ],
  } : null
  useSEO({ title: seoTitle, description: seoDesc, path: `/t/${slug}/${ageGroupId}/schedule`, schema: seoSchema })

  useEffect(() => {
    async function load() {
      const { data: agData, error: agErr } = await supabase
        .from('age_groups')
        .select('*, tournaments(id, name, slug, sport)')
        .eq('id', ageGroupId)
        .single()

      if (agErr) { setLoading(false); return }
      setAg(agData)

      if (agData?.tournaments?.id) {
        const { data: sibs, error: sibErr } = await supabase
          .from('age_groups').select('id, name')
          .eq('tournament_id', agData.tournaments.id).order('name')
        if (!sibErr) setSiblings(sibs ?? [])
      }

      const { data: fx, error: fxErr } = await supabase
        .from('fixtures')
        .select(`
          *, home_placeholder_label, away_placeholder_label,
          home_team:teams!home_team_id(id, name, logo_path),
          away_team:teams!away_team_id(id, name, logo_path),
          pitch:pitches(name, venues(name)),
          stages!inner(age_group_id)
        `)
        .eq('stages.age_group_id', ageGroupId)
        .order('kickoff_time', { ascending: true })

      if (fxErr) { setLoading(false); return }

      const fixtureList = fx ?? []
      let fixtureData = fixtureList.map(f => ({ ...f, fixture_results: [] }))

      if (fixtureList.length > 0) {
        const fixtureIds = fixtureList.map(f => f.id)
        const { data: results } = await supabase
          .from('fixture_results')
          .select('fixture_id, home_goals, away_goals, sport_data')
          .in('fixture_id', fixtureIds)
        if (results?.length) {
          const resultMap = Object.fromEntries(results.map(r => [r.fixture_id, r]))
          fixtureData = fixtureList.map(f => ({
            ...f,
            fixture_results: resultMap[f.id] ? [resultMap[f.id]] : [],
          }))
        }
      }

      setFixtures(fixtureData)
      setLastUpdated(new Date())
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`schedule-${ageGroupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixture_results' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures' }, () => load())
      .subscribe()

    const poll = setInterval(load, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [ageGroupId])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (!ag) return <div className="loading">{t('common.error')}</div>

  const tournamentSport = ag.tournaments?.sport ?? 'football'
  const isBvb = tournamentSport === 'beach_volleyball'

  // Sequential game numbers from all fixtures (preserved across filters)
  const gameNumbers = Object.fromEntries(
    fixtures.filter(f => f.kickoff_time).map((f, i) => [f.id, i + 1])
  )

  // Filter counts
  const liveCount = fixtures.filter(f => f.status === 'live').length
  const upcomingCount = fixtures.filter(f => f.status !== 'completed' && f.status !== 'live').length
  const doneCount = fixtures.filter(f => f.status === 'completed').length

  const filteredFixtures = filter === 'live' ? fixtures.filter(f => f.status === 'live')
    : filter === 'upcoming' ? fixtures.filter(f => f.status !== 'completed' && f.status !== 'live')
    : filter === 'done' ? fixtures.filter(f => f.status === 'completed')
    : fixtures

  const filteredIds = new Set(filteredFixtures.map(f => f.id))

  const filterTabs = [
    { key: 'all',      label: t('schedule.filterAll'),      count: fixtures.length },
    { key: 'live',     label: t('schedule.filterLive'),     count: liveCount },
    { key: 'upcoming', label: t('schedule.filterUpcoming'), count: upcomingCount },
    { key: 'done',     label: t('schedule.filterDone'),     count: doneCount },
  ].filter(tab => tab.key === 'all' || tab.count > 0)

  // Group/knockout structure uses ALL fixtures for round names, filtered for rendering
  const isGroupKnockout = ag?.format === 'group_knockout'
  const allGroupFixtures = fixtures.filter(f => f.group_label)
  const allKnockoutFixtures = fixtures.filter(f => !f.group_label)
  const groupLabels = [...new Set(allGroupFixtures.map(f => f.group_label))].sort()

  function resolveRoundName(matches) {
    const rn = matches[0]?.round_name
    if (rn === '3rd_place') return t('playoff.thirdPlace')
    if (rn) return rn
    return matches.length === 1 ? t('playoff.final')
      : matches.length === 2 ? t('playoff.semiFinal')
      : matches.length === 4 ? t('playoff.quarterFinal')
      : t('standings.knockoutPhase')
  }

  const knockoutRoundList = Object.entries(
    allKnockoutFixtures.reduce((acc, f) => {
      const key = f.round ?? 999
      if (!acc[key]) acc[key] = []
      acc[key].push(f)
      return acc
    }, {})
  ).sort(([a], [b]) => Number(a) - Number(b))
    .flatMap(([, matches]) => {
      const named = matches.filter(f => f.round_name)
      const unnamed = matches.filter(f => !f.round_name)
      if (named.length > 0 && unnamed.length > 0) {
        return [
          { roundName: resolveRoundName(named), matches: named.filter(f => filteredIds.has(f.id)) },
          { roundName: resolveRoundName(unnamed), matches: unnamed.filter(f => filteredIds.has(f.id)) },
        ]
      }
      const is3rd = f => f.home_placeholder?.includes('zaudētājs') || f.away_placeholder?.includes('zaudētājs')
      const thirdPlace = matches.filter(is3rd)
      const finals = matches.filter(f => !is3rd(f))
      if (thirdPlace.length > 0 && finals.length > 0) {
        return [
          { roundName: t('playoff.thirdPlace'), matches: thirdPlace.filter(f => filteredIds.has(f.id)) },
          { roundName: t('playoff.final'), matches: finals.filter(f => filteredIds.has(f.id)) },
        ]
      }
      return [{ roundName: resolveRoundName(matches), matches: matches.filter(f => filteredIds.has(f.id)) }]
    })
    .filter(round => round.matches.length > 0)

  // Flat date grouping for non-group_knockout formats
  const flatFixtures = !isGroupKnockout ? filteredFixtures : []
  const grouped = flatFixtures.reduce((acc, f) => {
    const day = f.kickoff_time ? format(new Date(f.kickoff_time), 'yyyy-MM-dd') : '__NO_DATE__'
    ;(acc[day] = acc[day] ?? []).push(f)
    return acc
  }, {})

  function groupByTime(list) {
    const acc = {}
    list.forEach(f => {
      const key = f.kickoff_time ? format(new Date(f.kickoff_time), 'HH:mm') : '__NO_TIME__'
      ;(acc[key] = acc[key] ?? []).push(f)
    })
    return Object.entries(acc).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
  }

  // ── Match card component ────────────────────────────────────────
  function MatchCard({ f }) {
    const result = f.fixture_results?.[0]
    const isCompleted = f.status === 'completed'
    const isLive = f.status === 'live'
    const homeWon = result && result.home_goals > result.away_goals
    const awayWon = result && result.away_goals > result.home_goals

    const setDetail = isBvb && result?.sport_data?.sets?.length
      ? result.sport_data.sets.map(s => `${s.h}–${s.a}`).join('  ')
      : null

    const courtLabel = f.pitch
      ? (f.pitch.venues?.name ? `${f.pitch.venues.name} · ${f.pitch.name}` : f.pitch.name)
      : null
    const gameNum = gameNumbers[f.id]

    const sides = [
      {
        name: f.home_team_id ? (f.home_team?.name ?? '?') : (f.home_placeholder_label ?? '?'),
        logo: f.home_team?.logo_path,
        score: result?.home_goals,
        won: homeWon,
        placeholder: !f.home_team_id,
      },
      {
        name: f.away_team_id ? (f.away_team?.name ?? '?') : (f.away_placeholder_label ?? '?'),
        logo: f.away_team?.logo_path,
        score: result?.away_goals,
        won: awayWon,
        placeholder: !f.away_team_id,
      },
    ]

    return (
      <div style={{
        background: 'var(--color-surface)',
        border: `1px solid ${isLive ? 'rgba(0,230,118,0.4)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        boxShadow: isLive ? '0 0 20px rgba(0,230,118,0.1)' : 'none',
        transition: 'box-shadow var(--transition-base)',
      }}>
        {/* Meta strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.3rem 0.75rem',
          background: 'rgba(0,0,0,0.25)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.7rem',
          color: 'var(--color-text-muted)',
          gap: '0.5rem',
          minHeight: '28px',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {gameNum != null && (
              <span style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.04em', opacity: 0.7 }}>
                #{gameNum}
              </span>
            )}
            {f.kickoff_time && (
              <span style={{ fontWeight: 600 }}>{formatTime(new Date(f.kickoff_time))}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {courtLabel && (
              <span style={{
                background: 'rgba(255,255,255,0.07)',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontSize: '0.65rem',
                letterSpacing: '0.02em',
              }}>
                {courtLabel}
              </span>
            )}
            {isLive && (
              <span style={{
                color: 'var(--color-live)',
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: '0.07em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--color-live)',
                  animation: 'live-dot-pulse 2s ease-in-out infinite',
                  flexShrink: 0,
                }} />
                LIVE
              </span>
            )}
            {isCompleted && !isLive && (
              <span style={{ color: 'var(--color-success)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                {t('schedule.ft')}
              </span>
            )}
          </div>
        </div>

        {/* Teams */}
        <div style={{ padding: '0.5rem 0.75rem 0.625rem' }}>
          {sides.map((side, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              paddingBlock: '0.3rem',
              borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              {side.logo && (
                <TeamLogo size="sm" logoPath={side.logo} alt={side.name} />
              )}
              <span style={{
                flex: 1,
                fontSize: '0.9375rem',
                fontWeight: side.won ? 700 : 400,
                color: side.placeholder
                  ? 'var(--color-text-muted)'
                  : side.won
                    ? 'var(--color-text)'
                    : isCompleted ? 'var(--color-text-muted)' : 'var(--color-text)',
                fontStyle: side.placeholder ? 'italic' : 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {side.name}
              </span>
              {result != null && (
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.375rem',
                  lineHeight: 1,
                  fontWeight: side.won ? 700 : 400,
                  color: side.won ? 'var(--color-accent)' : 'rgba(148,163,184,0.5)',
                  minWidth: '1.25rem',
                  textAlign: 'right',
                }}>
                  {side.score}
                </span>
              )}
              {result == null && !f.home_team_id && !f.away_team_id && i === 0 && (
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
              )}
            </div>
          ))}

          {/* BV set detail */}
          {setDetail && (
            <div style={{
              marginTop: '0.35rem',
              paddingTop: '0.3rem',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              fontSize: '0.7rem',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {setDetail}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Time slot section ───────────────────────────────────────────
  function TimeSlot({ timeStr, games }) {
    return (
      <div style={{ marginBottom: '1rem' }}>
        {timeStr !== '__NO_TIME__' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.875rem',
              color: 'var(--color-accent)',
              flexShrink: 0,
              letterSpacing: '0.02em',
            }}>
              {timeStr}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '0.5rem',
        }}>
          {games.map(f => <MatchCard key={f.id} f={f} />)}
        </div>
      </div>
    )
  }

  const sectionH2 = {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.375rem',
    color: 'var(--color-accent)',
    marginBottom: '1rem',
    letterSpacing: '0.01em',
  }

  const sectionH3 = {
    fontFamily: 'var(--font-heading)',
    fontSize: '1rem',
    color: 'var(--color-text-muted)',
    marginBottom: '0.625rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }

  return (
    <div>
      <PublicNav tournament={ag?.tournaments} ageGroups={siblings} activeAgeGroupId={ageGroupId} />
      <div className="container" style={{ paddingTop: '1.75rem', paddingBottom: '3rem' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.25rem, 4vw, 1.875rem)', margin: 0 }}>
              {ag?.name} — {t('schedule.title')}
            </h1>
            {lastUpdated && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                {t('common.lastUpdated', { time: formatTime(lastUpdated) })}
              </p>
            )}
          </div>
          <Link to={`/t/${slug}/${ageGroupId}`} className="btn-secondary btn-sm" style={{ flexShrink: 0 }}>
            {t('schedule.backToStandings')}
          </Link>
        </div>

        {/* Reg open banner */}
        {ag.registration_open && (
          <Link
            to={`/t/${slug}/register`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '1rem', flexWrap: 'wrap', textDecoration: 'none',
              background: 'rgba(240,165,0,0.08)',
              border: '1px solid rgba(240,165,0,0.3)',
              borderLeft: '3px solid var(--color-accent)',
              borderRadius: '8px', padding: '0.875rem 1.25rem', marginBottom: '1rem',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('public.regOpen')}
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                {t('public.regBannerText')}
              </div>
            </div>
            <span style={{
              background: 'var(--color-accent)', color: '#0a1628',
              fontFamily: 'var(--font-heading)', fontWeight: 700,
              fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase',
              padding: '0.5rem 1.1rem', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {t('public.regBannerCta')} →
            </span>
          </Link>
        )}

        {/* Filter tabs */}
        {filterTabs.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '0',
          }}>
            {filterTabs.map(tab => {
              const isActive = filter === tab.key
              const isLiveTab = tab.key === 'live'
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: `2px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
                    color: isActive ? 'var(--color-accent)' : isLiveTab ? 'var(--color-live)' : 'var(--color-text-muted)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: '0.04em',
                    padding: '0.5rem 0.875rem 0.625rem',
                    cursor: 'pointer',
                    marginBottom: '-1px',
                    transition: 'color var(--transition-fast), border-color var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isLiveTab && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--color-live)',
                      flexShrink: 0,
                      animation: liveCount > 0 ? 'live-dot-pulse 2s ease-in-out infinite' : 'none',
                    }} />
                  )}
                  {tab.label}
                  <span style={{
                    fontSize: '0.7rem',
                    background: isActive ? 'rgba(240,165,0,0.15)' : 'rgba(255,255,255,0.07)',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    padding: '0.05rem 0.4rem',
                    borderRadius: '999px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                  }}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Empty states */}
        {fixtures.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('fixture.noFixtures')}</p>
        )}
        {fixtures.length > 0 && !fixtures.some(f => f.kickoff_time) && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {t('schedule.noScheduleYet')}
          </p>
        )}
        {filteredFixtures.length === 0 && fixtures.length > 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {t('common.noData')}
          </p>
        )}

        {/* Group knockout layout */}
        {isGroupKnockout && (
          <>
            {groupLabels.some(label =>
              allGroupFixtures.filter(f => f.group_label === label && filteredIds.has(f.id)).length > 0
            ) && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={sectionH2}>{t('schedule.groupStage')}</h2>
                {groupLabels.map(label => {
                  const visibleInGroup = allGroupFixtures.filter(f => f.group_label === label && filteredIds.has(f.id))
                  if (visibleInGroup.length === 0) return null
                  return (
                    <div key={label} style={{ marginBottom: '1.5rem' }}>
                      <h3 style={sectionH3}>{t('standings.group')} {label}</h3>
                      {groupByTime(visibleInGroup).map(([timeStr, games]) => (
                        <TimeSlot key={timeStr} timeStr={timeStr} games={games} />
                      ))}
                    </div>
                  )
                })}
              </div>
            )}

            {knockoutRoundList.length > 0 && (
              <div>
                <h2 style={sectionH2}>{t('schedule.playoffStage')}</h2>
                {knockoutRoundList.map(({ roundName, matches }, idx) => (
                  <div key={idx} style={{ marginBottom: '1.5rem' }}>
                    <h3 style={sectionH3}>{roundName}</h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: '0.5rem',
                    }}>
                      {matches.map(f => <MatchCard key={f.id} f={f} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Flat date layout (round_robin / knockout) */}
        {!isGroupKnockout && Object.keys(grouped).sort().map(day => (
          <div key={day} style={{ marginBottom: '2rem' }}>
            <h2 style={{ ...sectionH2, fontSize: '1.125rem' }}>
              {day === '__NO_DATE__' ? t('schedule.noDate') : formatDate(day)}
            </h2>
            {groupByTime(grouped[day]).map(([timeStr, games]) => (
              <TimeSlot key={timeStr} timeStr={timeStr} games={games} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
