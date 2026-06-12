import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { formatDate, formatTime } from '../../utils/dateFormat'
import PublicNav from '../../components/PublicNav'
import TeamLogo from '../../components/TeamLogo'
import ClassFilter from '../../components/ClassFilter'

export default function Schedule() {
  const { t } = useTranslation()
  const { slug, ageGroup: ageGroupId } = useParams()
  const [ag, setAg] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedAgeGroupId = searchParams.get('ageGroupId') || null

  function handleFilterChange(id) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (id) next.set('ageGroupId', id)
      else next.delete('ageGroupId')
      return next
    })
  }

  useEffect(() => {
    async function load() {
      const { data: agData, error: agErr } = await supabase
        .from('age_groups')
        .select('*, tournaments(id, name, slug)')
        .eq('id', ageGroupId)
        .single()

      if (agErr) { setLoading(false); return }
      setAg(agData)
      document.title = `${agData.tournaments.name} — ${agData.name} — Schedule — Fixturday`

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
        .eq('stages.age_group_id', selectedAgeGroupId ?? ageGroupId)
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
      document.title = 'Fixturday'
    }
  }, [ageGroupId, selectedAgeGroupId])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (!ag) return <div className="loading">{t('common.error')}</div>

  function teamName(teamId, name, placeholder) {
    if (teamId) return name ?? '?'
    if (placeholder) return <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{placeholder}</span>
    return '?'
  }

  function FixtureRow({ f, gameNumbers, t, teamName }) {
    const result = f.fixture_results?.[0]
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', flexWrap: 'wrap' }}>
        {gameNumbers[f.id] != null && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0, minWidth: '2rem' }}>
            {t('schedule.gameNumber', { n: gameNumbers[f.id] })}
          </span>
        )}
        {f.kickoff_time && (
          <span style={{ color: 'var(--color-text-muted)', minWidth: '3rem', fontSize: '0.875rem', flexShrink: 0 }}>
            {formatTime(f.kickoff_time)}
          </span>
        )}
        <span style={{ flex: 1, textAlign: 'right', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', overflow: 'hidden' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {teamName(f.home_team_id, f.home_team?.name, f.home_placeholder_label)}
          </span>
          <TeamLogo size="sm" logoPath={f.home_team?.logo_path} alt={f.home_team?.name ?? ''} />
        </span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', width: '4rem', textAlign: 'center', flexShrink: 0 }}>
          {result
            ? `${result.home_goals} : ${result.away_goals}`
            : f.status === 'live'
              ? <span className="live-badge">LIVE</span>
              : t('fixture.vs')}
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
          <TeamLogo size="sm" logoPath={f.away_team?.logo_path} alt={f.away_team?.name ?? ''} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {teamName(f.away_team_id, f.away_team?.name, f.away_placeholder_label)}
          </span>
        </span>
        {f.pitch && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
            {f.pitch.venues?.name} — {f.pitch.name}
          </span>
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
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: 0 }}>
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

        <div style={{ position: 'sticky', top: 0, background: 'var(--color-bg)', paddingTop: '0.5rem', paddingBottom: '0.5rem', marginBottom: '0.75rem', zIndex: 10 }}>
          <ClassFilter
            tournamentId={ag?.tournaments?.id}
            value={selectedAgeGroupId}
            onChange={handleFilterChange}
          />
        </div>

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
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {groupFixtures.map(f => <FixtureRow key={f.id} f={f} gameNumbers={gameNumbers} t={t} teamName={teamName} />)}
            </div>
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

        {/* round_robin / knockout: flat date list */}
        {!isGroupKnockout && Object.keys(grouped).sort().map(day => (
          <div key={day} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
              {day === '__NO_DATE__' ? t('schedule.noDate') : formatDate(day)}
            </h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {grouped[day].map(f => <FixtureRow key={f.id} f={f} gameNumbers={gameNumbers} t={t} teamName={teamName} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
