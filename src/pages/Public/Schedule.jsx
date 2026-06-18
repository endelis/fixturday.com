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
        .select('*, tournaments(id, name, slug)')
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

      // Fetch fixture_results separately — embedded joins silently drop rows
      const fixtureList = fx ?? []
      let fixtureData = fixtureList.map(f => ({ ...f, fixture_results: [] }))

      if (fixtureList.length > 0) {
        const fixtureIds = fixtureList.map(f => f.id)
        const { data: results } = await supabase
          .from('fixture_results')
          .select('fixture_id, home_goals, away_goals')
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

  function teamName(teamId, name, placeholder) {
    if (teamId) return name ?? '?'
    if (placeholder) return <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{placeholder}</span>
    return '?'
  }

  // Groups a fixture list into [[displayTime, fixtures[]]] sorted chronologically.
  // Uses local display time so grouping matches what the user sees.
  function groupByKickoffTime(list) {
    const acc = {}
    list.forEach(f => {
      const key = f.kickoff_time ? format(new Date(f.kickoff_time), 'HH:mm') : '__NO_TIME__'
      ;(acc[key] = acc[key] ?? []).push(f)
    })
    return Object.entries(acc).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
  }

  function TimeSlotSection({ timeStr, games }) {
    return (
      <div style={{ marginBottom: '1rem' }}>
        {timeStr !== '__NO_TIME__' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--color-accent)', flexShrink: 0 }}>
              {timeStr}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: games.length > 1 ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
          gap: '0.5rem',
        }}>
          {games.map(f => <FixtureRow key={f.id} f={f} gameNumbers={gameNumbers} t={t} teamName={teamName} hideTime />)}
        </div>
      </div>
    )
  }

  function FixtureRow({ f, gameNumbers, t, teamName, hideTime = false }) {
    const result = f.fixture_results?.[0]
    const hasMeta = gameNumbers[f.id] != null || (!hideTime && f.kickoff_time) || f.pitch
    return (
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        {/* Match row — full width, teams never squeezed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ flex: 1, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem', overflow: 'hidden' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              {teamName(f.home_team_id, f.home_team?.name, f.home_placeholder_label)}
            </span>
            {f.home_team?.logo_path && <TeamLogo size="sm" logoPath={f.home_team.logo_path} alt={f.home_team?.name ?? ''} />}
          </span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', flexShrink: 0, width: '4.5rem', textAlign: 'center' }}>
            {result
              ? `${result.home_goals} : ${result.away_goals}`
              : f.status === 'live'
                ? <span className="live-badge">LIVE</span>
                : t('fixture.vs')}
          </span>
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
            {f.away_team?.logo_path && <TeamLogo size="sm" logoPath={f.away_team.logo_path} alt={f.away_team?.name ?? ''} />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              {teamName(f.away_team_id, f.away_team?.name, f.away_placeholder_label)}
            </span>
          </span>
        </div>
        {/* Meta row — game number and venue/pitch */}
        {hasMeta && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
              {gameNumbers[f.id] != null && <span>{t('schedule.gameNumber', { n: gameNumbers[f.id] })}</span>}
              {!hideTime && f.kickoff_time && <span>{formatTime(f.kickoff_time)}</span>}
            </div>
            {f.pitch && (
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textAlign: 'right' }}>
                {f.pitch.venues?.name} — {f.pitch.name}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  // Sequential game numbers globally, by kickoff order (query is already sorted)
  const gameNumbers = Object.fromEntries(
    fixtures.filter(f => f.kickoff_time).map((f, i) => [f.id, i + 1])
  )

  // group_knockout: split by stage type; other formats: flat date list
  const isGroupKnockout = ag?.format === 'group_knockout'
  const groupFixtures = fixtures.filter(f => f.group_label)
  const knockoutFixtures = fixtures.filter(f => !f.group_label)

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
    knockoutFixtures.reduce((acc, f) => {
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
          { roundName: resolveRoundName(named), matches: named },
          { roundName: resolveRoundName(unnamed), matches: unnamed },
        ]
      }
      const is3rd = f => f.home_placeholder?.includes('zaudētājs') || f.away_placeholder?.includes('zaudētājs')
      const thirdPlace = matches.filter(is3rd)
      const finals = matches.filter(f => !is3rd(f))
      if (thirdPlace.length > 0 && finals.length > 0) {
        return [
          { roundName: t('playoff.thirdPlace'), matches: thirdPlace },
          { roundName: t('playoff.final'), matches: finals },
        ]
      }
      return [{ roundName: resolveRoundName(matches), matches }]
    })

  // Fallback: date-grouped list for non-group_knockout formats
  const grouped = (!isGroupKnockout ? fixtures : []).reduce((acc, f) => {
    const day = f.kickoff_time ? format(new Date(f.kickoff_time), 'yyyy-MM-dd') : '__NO_DATE__'
    ;(acc[day] = acc[day] ?? []).push(f)
    return acc
  }, {})

  return (
    <div>
      <PublicNav tournament={ag?.tournaments} ageGroups={siblings} activeAgeGroupId={ageGroupId} />
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 4vw, 2rem)', margin: 0 }}>
            {ag?.name} — {t('schedule.title')}
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {t('common.lastUpdated', { time: formatTime(lastUpdated) })}
              </span>
            )}
            <Link to={`/t/${slug}/${ageGroupId}`} className="btn-secondary btn-sm">{t('schedule.backToStandings')}</Link>
          </div>
        </div>

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

        {fixtures.filter(f => f.status === 'live').length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-live)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-live)', animation: 'live-dot-pulse 2s ease-in-out infinite' }} />
              {t('schedule.liveNow')}
            </h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {fixtures.filter(f => f.status === 'live').map(f => (
                <FixtureRow key={f.id} f={f} gameNumbers={gameNumbers} t={t} teamName={teamName} />
              ))}
            </div>
          </div>
        )}

        {fixtures.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('fixture.noFixtures')}</p>
        )}

        {fixtures.length > 0 && !fixtures.some(f => f.kickoff_time) && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {t('schedule.noScheduleYet')}
          </p>
        )}

        {/* group_knockout: Group Stage + Playoff sections */}
        {isGroupKnockout && groupFixtures.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
              {t('schedule.groupStage')}
            </h2>
            {groupByKickoffTime(groupFixtures).map(([timeStr, games]) => (
              <TimeSlotSection key={timeStr} timeStr={timeStr} games={games} />
            ))}
          </div>
        )}

        {isGroupKnockout && knockoutFixtures.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
              {t('schedule.playoffStage')}
            </h2>
            {knockoutRoundList.map(({ roundName, matches }, idx) => (
              <div key={idx} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  {roundName}
                </h3>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {matches.map(f => <FixtureRow key={f.id} f={f} gameNumbers={gameNumbers} t={t} teamName={teamName} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* round_robin / knockout: date → time-slot list */}
        {!isGroupKnockout && Object.keys(grouped).sort().map(day => (
          <div key={day} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
              {day === '__NO_DATE__' ? t('schedule.noDate') : formatDate(day)}
            </h2>
            {groupByKickoffTime(grouped[day]).map(([timeStr, games]) => (
              <TimeSlotSection key={timeStr} timeStr={timeStr} games={games} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
