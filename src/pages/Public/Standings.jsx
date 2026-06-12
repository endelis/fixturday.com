import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDate, formatTime } from '../../utils/dateFormat'
import { supabase } from '../../lib/supabase'
import { calculateStandings } from '../../utils/standings'
import PublicNav from '../../components/PublicNav'
import ClassFilter from '../../components/ClassFilter'
import { useSEO } from '../../hooks/useSEO'

export default function Standings() {
  const { slug, ageGroup: ageGroupId } = useParams()
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [realtimeStatus, setRealtimeStatus] = useState('connecting')
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedAgeGroupId = searchParams.get('ageGroupId') || null

  const seoTitle = data?.ag ? `${data.ag.tournaments.name} — ${data.ag.name} Standings` : 'Tournament Standings'
  const seoDesc = data?.ag
    ? `Live standings for ${data.ag.tournaments.name} — ${data.ag.name}. Real-time results and match schedule.`
    : 'Live tournament standings and real-time results.'
  useSEO({ title: seoTitle, description: seoDesc, path: `/t/${slug}/${ageGroupId}` })

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
      const effectiveId = selectedAgeGroupId ?? ageGroupId

      // Load age group + its tournament + sibling age groups in one shot
      const { data: ag, error: agErr } = await supabase
        .from('age_groups')
        .select('*, tournaments(id, name, slug)')
        .eq('id', effectiveId)
        .single()

      if (agErr || !ag) { setLoading(false); return }

      const [{ data: siblings, error: sibErr }, { data: teams, error: tmErr }, { data: fixtures, error: fxErr }] = await Promise.all([
        supabase.from('age_groups').select('id, name').eq('tournament_id', ag.tournaments.id).order('name'),
        supabase.from('teams').select('*').eq('age_group_id', effectiveId).eq('status', 'confirmed'),
        supabase.from('fixtures')
          .select('id, round, home_team_id, away_team_id, status, group_label, round_name, home_placeholder, away_placeholder, home_team:teams!home_team_id(id,name), away_team:teams!away_team_id(id,name), stages!inner(age_group_id, type)')
          .eq('stages.age_group_id', effectiveId),
      ])
      if (sibErr || tmErr || fxErr) { setLoading(false); return }

      // Scope results to only this age group's fixture IDs
      const fixtureIds = (fixtures ?? []).map(f => f.id)
      const { data: results, error: resErr } = fixtureIds.length > 0
        ? await supabase.from('fixture_results').select('*').in('fixture_id', fixtureIds)
        : { data: [], error: null }
      if (resErr) { setLoading(false); return }

      setData({ ag, siblings: siblings ?? [], teams: teams ?? [], fixtures: fixtures ?? [], results: results ?? [] })
      setLastUpdated(new Date())
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`standings-${ageGroupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixture_results' }, () => load())
      .subscribe(status => {
        setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected')
      })

    const poll = setInterval(load, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [ageGroupId, selectedAgeGroupId])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (!data?.ag) return <div className="loading">{t('standings.notFound')}</div>

  const { ag, siblings, teams, fixtures, results } = data
  const standings = calculateStandings(teams, fixtures, results)
  const tournament = ag.tournaments

  // Group-knockout: derive per-group data
  const groupFixtures = fixtures.filter(f => f.group_label)
  const groupLabels = [...new Set(groupFixtures.map(f => f.group_label))].sort()
  const knockoutFixtures = fixtures.filter(f => !f.group_label)
  const hasKnockoutFixtures = knockoutFixtures.length > 0

  function resolveRoundName(matches) {
    const rn = matches[0]?.round_name
    if (rn === '3rd_place') return t('playoff.thirdPlace')
    if (rn) return rn
    return matches.length === 1 ? t('playoff.final')
      : matches.length === 2 ? t('playoff.semiFinal')
      : matches.length === 4 ? t('playoff.quarterFinal')
      : t('standings.knockoutPhase')
  }

  // Group knockout fixtures by round number; split rounds that mix 3rd-place and final
  const knockoutByRound = knockoutFixtures.reduce((acc, f) => {
    const key = f.round ?? 999
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})
  const knockoutRoundList = Object.entries(knockoutByRound)
    .sort(([a], [b]) => Number(a) - Number(b))
    .flatMap(([, matches]) => {
      const named = matches.filter(f => f.round_name)
      const unnamed = matches.filter(f => !f.round_name)
      if (named.length > 0 && unnamed.length > 0) {
        return [
          { roundName: resolveRoundName(named), matches: named },
          { roundName: resolveRoundName(unnamed), matches: unnamed },
        ]
      }
      // Fallback for older data where round_name was not persisted:
      // detect the 3rd-place fixture by its placeholder text ('zaudētājs' = loser)
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

  return (
    <div>
      <PublicNav tournament={tournament} ageGroups={siblings} activeAgeGroupId={ageGroupId} />
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 4vw, 2rem)', margin: 0 }}>{ag.name} — {t('standings.title')}</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              fontSize: '0.72rem', fontFamily: 'var(--font-heading)', fontWeight: 600,
              color: realtimeStatus === 'connected' ? 'var(--color-live)' : 'var(--color-text-muted)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                background: realtimeStatus === 'connected' ? 'var(--color-live)' : 'var(--color-text-muted)',
                boxShadow: realtimeStatus === 'connected' ? '0 0 8px var(--color-live)' : 'none',
                animation: realtimeStatus === 'connected' ? 'live-dot-pulse 2s ease-in-out infinite' : 'none',
              }} />
              {realtimeStatus === 'connected'
                ? t('standings.live')
                : lastUpdated
                  ? t('common.lastUpdated', { time: formatTime(lastUpdated) })
                  : t('standings.connecting')}
            </span>
            <Link to={`/t/${slug}/${ageGroupId}/fixtures`} className="btn-secondary btn-sm">
              {t('standings.scheduleLink')}
            </Link>
          </div>
        </div>

        <div style={{ position: 'sticky', top: 0, background: 'var(--color-bg)', paddingTop: '0.5rem', paddingBottom: '0.5rem', marginBottom: '0.75rem', zIndex: 10 }}>
          <ClassFilter
            tournamentId={tournament.id}
            value={selectedAgeGroupId}
            onChange={handleFilterChange}
          />
        </div>

        {standings.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('standings.noTeams')}</p>
        ) : ag.format === 'group_knockout' ? (
          <>
            {groupLabels.map(label => {
              const groupTeamIds = new Set()
              groupFixtures
                .filter(f => f.group_label === label)
                .forEach(f => { groupTeamIds.add(f.home_team_id); groupTeamIds.add(f.away_team_id) })
              const groupTeams = teams.filter(t => groupTeamIds.has(t.id))
              const groupStandings = calculateStandings(
                groupTeams,
                groupFixtures.filter(f => f.group_label === label),
                results
              )
              return (
                <div key={label} style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
                    {t('standings.group')} {label}
                  </h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th><th>{t('standings.team')}</th><th>{t('standings.played')}</th><th>{t('standings.won')}</th><th>{t('standings.drawn')}</th><th>{t('standings.lost')}</th><th>{t('standings.gf')}</th><th>{t('standings.ga')}</th><th>{t('standings.gd')}</th><th>{t('standings.points')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupStandings.map((row, i) => (
                          <tr key={row.team.id}>
                            <td>{i + 1}</td>
                            <td>
                              <Link to={`/t/${slug}/${ageGroupId}/teams/${row.team.id}`} style={{ color: 'var(--color-accent)' }}>
                                {row.team.name}
                              </Link>
                            </td>
                            <td>{row.played}</td>
                            <td>{row.won}</td>
                            <td>{row.drawn}</td>
                            <td>{row.lost}</td>
                            <td>{row.gf}</td>
                            <td>{row.ga}</td>
                            <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                            <td><strong>{row.points}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
            {hasKnockoutFixtures && (
              <div style={{ marginTop: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                  {t('standings.knockoutPhase')}
                </h2>
                {knockoutRoundList.map(({ roundName, matches }, idx) => (
                  <div key={idx} style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                      {roundName}
                    </h3>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {matches.map(f => {
                        const result = results.find(r => r.fixture_id === f.id)
                        const homeName = f.home_team?.name ?? f.home_placeholder ?? '?'
                        const awayName = f.away_team?.name ?? f.away_placeholder ?? '?'
                        const homeWon = result && result.home_goals > result.away_goals
                        const awayWon = result && result.away_goals > result.home_goals
                        return (
                          <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}>
                            <span style={{ flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: homeWon ? 700 : 400, color: homeWon ? 'var(--color-accent)' : 'inherit' }}>{homeName}</span>
                            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', minWidth: '4rem', textAlign: 'center', flexShrink: 0 }}>
                              {result ? `${result.home_goals} : ${result.away_goals}` : (f.home_team ? t('fixture.vs') : '—')}
                            </span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: awayWon ? 700 : 400, color: awayWon ? 'var(--color-accent)' : 'inherit' }}>{awayName}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>{t('standings.team')}</th><th>{t('standings.played')}</th><th>{t('standings.won')}</th><th>{t('standings.drawn')}</th><th>{t('standings.lost')}</th><th>{t('standings.gf')}</th><th>{t('standings.ga')}</th><th>{t('standings.gd')}</th><th>{t('standings.points')}</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => (
                  <tr key={row.team.id}>
                    <td>{i + 1}</td>
                    <td>
                      <Link to={`/t/${slug}/${ageGroupId}/teams/${row.team.id}`} style={{ color: 'var(--color-accent)' }}>
                        {row.team.name}
                      </Link>
                    </td>
                    <td>{row.played}</td>
                    <td>{row.won}</td>
                    <td>{row.drawn}</td>
                    <td>{row.lost}</td>
                    <td>{row.gf}</td>
                    <td>{row.ga}</td>
                    <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                    <td><strong>{row.points}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
