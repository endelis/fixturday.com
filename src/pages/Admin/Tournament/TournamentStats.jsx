import { useEffect, useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase'
import { calculateStandings } from '../../../utils/standings'

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
          id, status, round, group_label, stage_id,
          home_team:teams!home_team_id(id, name),
          away_team:teams!away_team_id(id, name)
        `)
        .in('stage_id', stageIds)
      if (fxErr) { setLoading(false); return }

      const { data: results, error: resErr } = await supabase
        .from('fixture_results')
        .select('fixture_id, home_goals, away_goals')
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
          standings = calculateStandings(agTeams, agFixtures, agResults)
        } catch {
          standings = []
        }

        return { ...ag, total, completed, pending, standings }
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
        <div className="card" style={{ color: 'var(--color-muted)', textAlign: 'center' }}>
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
                { label: t('stats.pending'),   value: ag.pending,   color: 'var(--color-muted)' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '0.75rem 1.25rem', minWidth: '100px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', color: s.color ?? 'var(--color-text)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Standings */}
            {ag.standings.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-muted)' }}>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>{t('standings.team')}</th>
                      <th style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>{t('standings.played')}</th>
                      <th style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>{t('standings.won')}</th>
                      <th style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>{t('standings.drawn')}</th>
                      <th style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>{t('standings.lost')}</th>
                      <th style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>{t('standings.gd')}</th>
                      <th style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>{t('standings.points')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ag.standings.map((row, i) => (
                      <tr key={row.team.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <span style={{ color: 'var(--color-muted)', marginRight: '0.5rem', fontSize: '0.8rem' }}>{i + 1}</span>
                          {row.team.name}
                        </td>
                        <td style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>{row.played}</td>
                        <td style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>{row.won}</td>
                        <td style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>{row.drawn}</td>
                        <td style={{ padding: '0.5rem 0.5rem', textAlign: 'center' }}>{row.lost}</td>
                        <td style={{ padding: '0.5rem 0.5rem', textAlign: 'center', color: row.gd > 0 ? 'var(--color-success)' : row.gd < 0 ? 'var(--color-danger)' : 'inherit' }}>
                          {row.gd > 0 ? '+' : ''}{row.gd}
                        </td>
                        <td style={{ padding: '0.5rem 0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-accent)' }}>{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>{t('common.noData')}</p>
            )}
          </div>
        ))
      )}
    </div>
  )
}
