import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { calculateStandings } from '../../utils/standings'
import PublicNav from '../../components/PublicNav'

export default function Standings() {
  const { slug, ageGroup: ageGroupId } = useParams()
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    async function load() {
      // Load age group + its tournament + sibling age groups in one shot
      const { data: ag } = await supabase
        .from('age_groups')
        .select('*, tournaments(id, name, slug)')
        .eq('id', ageGroupId)
        .single()

      if (!ag) { setLoading(false); return }

      const [{ data: siblings }, { data: teams }, { data: fixtures }] = await Promise.all([
        supabase.from('age_groups').select('id, name').eq('tournament_id', ag.tournaments.id).order('name'),
        supabase.from('teams').select('*').eq('age_group_id', ageGroupId).eq('status', 'confirmed'),
        supabase.from('fixtures')
          .select('id, home_team_id, away_team_id, status, group_label, stages!inner(age_group_id, type)')
          .eq('stages.age_group_id', ageGroupId),
      ])

      // Scope results to only this age group's fixture IDs
      const fixtureIds = (fixtures ?? []).map(f => f.id)
      const { data: results } = fixtureIds.length > 0
        ? await supabase.from('fixture_results').select('*').in('fixture_id', fixtureIds)
        : { data: [] }

      setData({ ag, siblings: siblings ?? [], teams: teams ?? [], fixtures: fixtures ?? [], results: results ?? [] })
      setLastUpdated(new Date())
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`standings-${ageGroupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixture_results' }, () => load())
      .subscribe()

    const poll = setInterval(load, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [ageGroupId])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (!data?.ag) return <div className="loading">{t('standings.notFound')}</div>

  const { ag, siblings, teams, fixtures, results } = data
  const standings = calculateStandings(teams, fixtures, results)
  const tournament = ag.tournaments

  // Group-knockout: derive per-group data
  const groupFixtures = fixtures.filter(f => f.stages?.type === 'group_stage' && f.group_label)
  const groupLabels = [...new Set(groupFixtures.map(f => f.group_label))].sort()
  const hasKnockoutFixtures = fixtures.some(f => f.stages?.type === 'knockout')

  return (
    <div>
      <PublicNav tournament={tournament} ageGroups={siblings} activeAgeGroupId={ageGroupId} />
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: 0 }}>{ag.name} — {t('standings.title')}</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                {t('common.lastUpdated', { time: format(lastUpdated, 'HH:mm') })}
              </span>
            )}
            <Link to={`/t/${slug}/${ageGroupId}/fixtures`} className="btn-secondary btn-sm">
              {t('standings.scheduleLink')}
            </Link>
          </div>
        </div>

        {standings.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('standings.noTeams')}</p>
        ) : ag.format === 'group_knockout' && groupLabels.length > 0 ? (
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
              <div style={{ marginTop: '1rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {t('standings.knockout')}
                </h2>
                <p style={{ color: 'var(--color-text-muted)' }}>{t('standings.knockoutPending')}</p>
              </div>
            )}
          </>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Komanda</th><th>S</th><th>U</th><th>N</th><th>Z</th><th>GV</th><th>GS</th><th>GS±</th><th>P</th>
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
