import { useEffect, useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase'
import { calculateStandings } from '../../../utils/standings'
import { formatBeachScore } from '../../../utils/beachVolleyball'

export default function TournamentStats() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { tournament } = useOutletContext()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: ageGroups, error: agErr } = await supabase
        .from('age_groups')
        .select('id, name')
        .eq('tournament_id', id)
        .order('name')
      if (agErr || !ageGroups?.length) { setLoading(false); return }

      const agIds = ageGroups.map(ag => ag.id)

      const { data: stages, error: stErr } = await supabase
        .from('stages')
        .select('id, age_group_id, type')
        .in('age_group_id', agIds)
      if (stErr) { setLoading(false); return }

      const stageIds = (stages ?? []).map(s => s.id)
      if (!stageIds.length) {
        setGroups(ageGroups.map(ag => ({ ...ag, total: 0, completed: 0, pending: 0, standings: [] })))
        setLoading(false)
        return
      }

      const { data: fixtures, error: fxErr } = await supabase
        .from('fixtures')
        .select(`
          id, status, round, group_label, stage_id, home_team_id, away_team_id,
          home_team:teams!home_team_id(id, name),
          away_team:teams!away_team_id(id, name)
        `)
        .in('stage_id', stageIds)
      if (fxErr) { setLoading(false); return }

      const { data: results, error: resErr } = await supabase
        .from('fixture_results')
        .select('fixture_id, home_goals, away_goals, sport_data')
        .in('fixture_id', (fixtures ?? []).map(f => f.id))
      if (resErr) { setLoading(false); return }

      const stageByAg = {}
      for (const s of (stages ?? [])) {
        ;(stageByAg[s.age_group_id] = stageByAg[s.age_group_id] ?? []).push(s.id)
      }

      const builtGroups = ageGroups.map(ag => {
        const agStageIds = stageByAg[ag.id] ?? []
        const agFixtures = (fixtures ?? []).filter(f => agStageIds.includes(f.stage_id))
        const agResults = (results ?? []).filter(r => agFixtures.some(f => f.id === r.fixture_id))
        const total = agFixtures.length
        const completed = agFixtures.filter(f => f.status === 'completed').length
        const pending = total - completed

        // Build unique teams list from fixtures for this age group
        const teamMap = {}
        for (const f of agFixtures) {
          if (f.home_team) teamMap[f.home_team.id] = f.home_team
          if (f.away_team) teamMap[f.away_team.id] = f.away_team
        }
        const agTeams = Object.values(teamMap)

        let standings = []
        try {
          standings = calculateStandings(agTeams, agFixtures, agResults, tournament.sport ?? 'football')
        } catch {
          standings = []
        }

        return { ...ag, total, completed, pending, standings, fixtures: agFixtures, results: agResults }
      })

      setGroups(builtGroups)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="loading">{t('common.loading')}</div>

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '2rem' }}>
        {t('workspace.navStats')} — {tournament.name}
      </h1>

      {groups.length === 0 ? (
        <div className="card" style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
          {t('common.noData')}
        </div>
      ) : (
        groups.map(ag => (
          <div key={ag.id} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
              {ag.name}
            </h2>

            {/* Match counts */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {[
                { label: t('stats.total'),     value: ag.total },
                { label: t('stats.completed'), value: ag.completed, color: 'var(--color-success)' },
                { label: t('stats.pending'),   value: ag.pending,   color: 'var(--color-text-muted)' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '0.75rem 1.25rem', minWidth: '100px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', color: s.color ?? 'var(--color-text)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Team performance */}
            {ag.standings.length > 0 && tournament.sport === 'beach_volleyball' ? (
              <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {ag.standings.map((row, i) => {
                  const sr = row.sets_lost > 0 ? (row.sets_won / row.sets_lost).toFixed(3) : row.sets_won > 0 ? '∞' : '—'
                  const pr = row.points_against > 0 ? (row.points_won / row.points_against).toFixed(3) : row.points_won > 0 ? '∞' : '—'
                  const stats = [
                    { label: 'W', value: row.won, color: 'var(--color-success)' },
                    { label: 'L', value: row.lost, color: 'var(--color-danger)' },
                    { label: 'SW', value: row.sets_won ?? 0 },
                    { label: 'SL', value: row.sets_lost ?? 0 },
                    { label: 'SR', value: sr },
                    { label: 'PW', value: row.points_won ?? 0 },
                    { label: 'PL', value: row.points_against ?? 0 },
                    { label: 'PR', value: pr, accent: true },
                  ]
                  return (
                    <div key={row.team.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: '120px' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.85rem', minWidth: '1.5rem' }}>#{i + 1}</span>
                        <span style={{ fontWeight: 600 }}>{row.team.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                        {stats.map(s => (
                          <div key={s.label} style={{ textAlign: 'center', minWidth: '2rem' }}>
                            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: s.accent ? 700 : 400, color: s.color ?? (s.accent ? 'var(--color-accent)' : 'var(--color-text)') }}>
                              {s.value}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : ag.standings.length > 0 ? (
              <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed', minWidth: 440 }}>
                  <colgroup>
                    <col style={{ width: 28 }} /><col />
                    <col style={{ width: 32 }} /><col style={{ width: 32 }} />
                    <col style={{ width: 36 }} /><col style={{ width: 36 }} /><col style={{ width: 40 }} /><col style={{ width: 40 }} /><col style={{ width: 44 }} /><col style={{ width: 44 }} />
                  </colgroup>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>{t('standings.team')}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('standings.played')}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('standings.won')}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('standings.drawn')}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('standings.lost')}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('standings.gf')}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('standings.ga')}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('standings.gd')}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--color-accent)', fontWeight: 700 }}>{t('standings.points')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ag.standings.map((row, i) => (
                      <tr key={row.team.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{row.team.name}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{row.played}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{row.won}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{row.drawn}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{row.lost}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{row.gf}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{row.ga}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', color: row.gd > 0 ? 'var(--color-success)' : row.gd < 0 ? 'var(--color-danger)' : 'inherit' }}>
                          {row.gd > 0 ? '+' : ''}{row.gd}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-accent)' }}>{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {/* Match results */}
            {ag.completed > 0 && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('stats.completed')} ({ag.completed})
                </h3>
                <div style={{ display: 'grid', gap: '0.375rem' }}>
                  {ag.fixtures
                    .filter(f => f.status === 'completed')
                    .map(f => {
                      const res = ag.results.find(r => r.fixture_id === f.id)
                      if (!res) return null
                      const homeWon = res.home_goals > res.away_goals
                      const awayWon = res.away_goals > res.home_goals
                      const score = tournament.sport === 'beach_volleyball'
                        ? formatBeachScore(res.sport_data)
                        : `${res.home_goals} : ${res.away_goals}`
                      return (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.875rem' }}>
                          <span style={{ flex: 1, textAlign: 'right', fontWeight: homeWon ? 600 : 400, color: homeWon ? 'var(--color-text)' : 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.home_team?.name ?? '?'}
                          </span>
                          <span style={{ fontFamily: 'var(--font-heading)', fontSize: tournament.sport === 'beach_volleyball' ? '0.78rem' : '0.95rem', minWidth: tournament.sport === 'beach_volleyball' ? '8rem' : '3.5rem', textAlign: 'center', flexShrink: 0, color: 'var(--color-accent)' }}>
                            {score}
                          </span>
                          <span style={{ flex: 1, fontWeight: awayWon ? 600 : 400, color: awayWon ? 'var(--color-text)' : 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.away_team?.name ?? '?'}
                          </span>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
