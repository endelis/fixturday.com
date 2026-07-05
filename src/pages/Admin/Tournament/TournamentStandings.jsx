import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { calculateStandings } from '../../../utils/standings'
import { toast } from '../../../components/Toast'

const PRINT_STYLE = `
  @media print {
    @page { size: A4 landscape; margin: 10mm 15mm; }

    /* Isolate print content */
    body * { visibility: hidden; }
    .print-content, .print-content * { visibility: visible; }
    .print-content { position: absolute; top: 0; left: 0; width: 100%; }

    /* Hide UI chrome */
    .no-print,
    .t-sidebar,
    .admin-nav,
    [class*="sidebar"],
    [class*="nav"] { display: none !important; }

    /* Reset */
    body {
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 11pt !important;
      color: #000 !important;
      background: #fff !important;
    }
    h1 { font-size: 16pt !important; color: #000 !important; }
    h2 { font-size: 13pt !important; color: #000 !important; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 9pt !important; }
    th, td { border: 1px solid #aaa; padding: 3pt 5pt; }
    th {
      background: #f0f0f0 !important;
      font-weight: bold;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    td { color: #000 !important; }
    tr:nth-child(even) td {
      background: #f9f9f9 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    tr { page-break-inside: avoid; }
    thead { display: table-header-group; }

    .print-age-group + .print-age-group { page-break-before: always; }
    .ag-tab-hidden { display: block !important; }

    svg { display: none !important; }
  }
`

const AG_TAB_STYLE = `
  .ag-tab-hidden { display: none; }
`

const STANDINGS_MOBILE_STYLE = `
  .standings-table th:nth-child(4),
  .standings-table td:nth-child(4),
  .standings-table th:nth-child(5),
  .standings-table td:nth-child(5),
  .standings-table th:nth-child(6),
  .standings-table td:nth-child(6),
  .standings-table th:nth-child(7),
  .standings-table td:nth-child(7),
  .standings-table th:nth-child(8),
  .standings-table td:nth-child(8) {
    display: none;
  }
  @media (min-width: 768px) {
    .standings-table th:nth-child(4),
    .standings-table td:nth-child(4),
    .standings-table th:nth-child(5),
    .standings-table td:nth-child(5),
    .standings-table th:nth-child(6),
    .standings-table td:nth-child(6),
    .standings-table th:nth-child(7),
    .standings-table td:nth-child(7),
    .standings-table th:nth-child(8),
    .standings-table td:nth-child(8) {
      display: table-cell;
    }
  }
`

const thStyle = { textAlign: 'left', padding: '0.5rem 0.4rem', color: 'var(--color-text-muted)', fontSize: '0.78rem', fontWeight: 600 }
const thCStyle = { ...thStyle, textAlign: 'center' }
const tdStyle = { padding: '0.6rem 0.4rem' }
const tdCStyle = { ...tdStyle, textAlign: 'center' }

function StandingsTable({ rows, advancingCount, t, sport = 'football' }) {
  const isBvb = sport === 'beach_volleyball' || sport === 'catch_serve'
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className={isBvb ? undefined : 'standings-table'} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', tableLayout: 'fixed', minWidth: isBvb ? 560 : 440 }}>
        <colgroup>
          <col style={{ width: 28 }} /><col />
          <col style={{ width: 32 }} /><col style={{ width: 32 }} />
          {isBvb ? (
            <><col style={{ width: 32 }} /><col style={{ width: 32 }} /><col style={{ width: 32 }} /><col style={{ width: 44 }} /><col style={{ width: 36 }} /><col style={{ width: 36 }} /><col style={{ width: 52 }} /></>
          ) : (
            <><col style={{ width: 36 }} /><col style={{ width: 36 }} /><col style={{ width: 40 }} /><col style={{ width: 40 }} /><col style={{ width: 44 }} /><col style={{ width: 44 }} /></>
          )}
        </colgroup>
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.12)' }}>
            <th style={thStyle}>#</th>
            <th style={thStyle}>{t('standings.team')}</th>
            <th style={thCStyle}>{t('standings.played')}</th>
            <th style={thCStyle}>{t('standings.won')}</th>
            {isBvb ? (
              <>
                <th style={thCStyle}>{t('standings.lost')}</th>
                <th style={thCStyle}>{t('standings.setsWon')}</th>
                <th style={thCStyle}>{t('standings.setsAgainst')}</th>
                <th style={thCStyle}>{t('standings.setRatio')}</th>
                <th style={thCStyle}>{t('standings.pointsWon')}</th>
                <th style={thCStyle}>{t('standings.pointsAgainst')}</th>
                <th style={{ ...thCStyle, color: 'var(--color-accent)', fontWeight: 700 }}>{t('standings.pointRatio')}</th>
              </>
            ) : (
              <>
                <th style={thCStyle}>{t('standings.drawn')}</th>
                <th style={thCStyle}>{t('standings.lost')}</th>
                <th style={thCStyle}>{t('standings.gf')}</th>
                <th style={thCStyle}>{t('standings.ga')}</th>
                <th style={thCStyle}>{t('standings.gd')}</th>
                <th style={{ ...thCStyle, color: 'var(--color-accent)', fontWeight: 700 }}>{t('standings.points')}</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.team.id}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: advancingCount && idx < advancingCount
                  ? 'rgba(240,165,0,0.05)'
                  : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
              }}
            >
              <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
              <td style={{ ...tdStyle, fontWeight: 500 }}>
                {advancingCount && idx < advancingCount && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-accent)', marginRight: '0.4rem', fontWeight: 700 }}>↑</span>
                )}
                {row.team.name}
              </td>
              <td style={tdCStyle}>{row.played}</td>
              <td style={tdCStyle}>{row.won}</td>
              {isBvb ? (
                <>
                  <td style={tdCStyle}>{row.lost}</td>
                  <td style={tdCStyle}>{row.sets_won ?? 0}</td>
                  <td style={tdCStyle}>{row.sets_lost ?? 0}</td>
                  <td style={tdCStyle}>{row.sets_lost > 0 ? (row.sets_won / row.sets_lost).toFixed(3) : (row.sets_won > 0 ? '∞' : '—')}</td>
                  <td style={tdCStyle}>{row.points_won ?? 0}</td>
                  <td style={tdCStyle}>{row.points_against ?? 0}</td>
                  <td style={{ ...tdCStyle, fontWeight: 700 }}>{row.points_against > 0 ? (row.points_won / row.points_against).toFixed(3) : (row.points_won > 0 ? '∞' : '—')}</td>
                </>
              ) : (
                <>
                  <td style={tdCStyle}>{row.drawn}</td>
                  <td style={tdCStyle}>{row.lost}</td>
                  <td style={tdCStyle}>{row.gf}</td>
                  <td style={tdCStyle}>{row.ga}</td>
                  <td style={tdCStyle}>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                  <td style={{ ...tdCStyle, fontWeight: 700 }}>{row.points}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function TournamentStandings() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [ageGroupData, setAgeGroupData] = useState([])
  const [selectedAgId, setSelectedAgId] = useState(null)
  const [error, setError] = useState(null)
  const [advancing, setAdvancing] = useState(null)
  const [tournamentSport, setTournamentSport] = useState('football')

  async function load() {
    setLoading(true)

    const [{ data: tournRow }, { data: ageGroups, error: agError }] = await Promise.all([
      supabase.from('tournaments').select('sport').eq('id', id).single(),
      supabase.from('age_groups').select('id, name, format, teams_advancing').eq('tournament_id', id).order('name'),
    ])

    const sport = tournRow?.sport ?? 'football'
    setTournamentSport(sport)

    if (agError) { setError(agError.message); setLoading(false); return }
    if (!ageGroups?.length) { setLoading(false); return }

    const results = []

    for (const ag of ageGroups) {
      const [teamsRes, stagesRes] = await Promise.all([
        supabase.from('teams').select('id, name').eq('age_group_id', ag.id).eq('status', 'confirmed'),
        supabase.from('stages').select('id, type').eq('age_group_id', ag.id),
      ])
      if (teamsRes.error || stagesRes.error) { results.push({ ag, type: 'simple', rows: [] }); continue }
      const teams = teamsRes.data
      const stages = stagesRes.data

      if (!stages?.length) {
        results.push({ ag, type: 'simple', rows: [] })
        continue
      }

      const allStageIds = stages.map(s => s.id)
      const groupStageIds = new Set(stages.filter(s => s.type === 'group_stage').map(s => s.id))
      const knockoutStageIds = new Set(stages.filter(s => s.type === 'knockout').map(s => s.id))

      const { data: allFixtures, error: fxErr } = await supabase
        .from('fixtures')
        .select('id, stage_id, home_team_id, away_team_id, status, group_label, home_placeholder, away_placeholder')
        .in('stage_id', allStageIds)
      if (fxErr) { results.push({ ag, type: 'simple', rows: [] }); continue }

      const fixtureIds = (allFixtures ?? []).filter(f => f.home_team_id || f.away_team_id).map(f => f.id)
      const { data: fixtureResults, error: frErr } = fixtureIds.length > 0
        ? await supabase.from('fixture_results').select('fixture_id, home_goals, away_goals, sport_data').in('fixture_id', fixtureIds)
        : { data: [], error: null }
      if (frErr) { results.push({ ag, type: 'simple', rows: [] }); continue }

      if (ag.format === 'group_knockout' && groupStageIds.size > 0) {
        const groupFixtures = (allFixtures ?? []).filter(f => groupStageIds.has(f.stage_id))
        const knockoutFixtures = (allFixtures ?? []).filter(f => knockoutStageIds.has(f.stage_id))
        const groupLabels = [...new Set(groupFixtures.map(f => f.group_label).filter(Boolean))].sort()

        const perGroup = groupLabels.map(label => {
          const gFix = groupFixtures.filter(f => f.group_label === label)
          const teamIds = new Set([...gFix.map(f => f.home_team_id), ...gFix.map(f => f.away_team_id)].filter(Boolean))
          const gTeams = (teams ?? []).filter(t => teamIds.has(t.id))
          return { label, rows: calculateStandings(gTeams, gFix, fixtureResults ?? [], sport) }
        })

        const allGroupDone = groupFixtures.length > 0 && groupFixtures.every(f => f.status === 'completed')
        const knockoutHasTeams = knockoutFixtures.some(f => f.home_team_id || f.away_team_id)

        results.push({ ag, type: 'group_knockout', perGroup, knockoutFixtures, allGroupDone, knockoutHasTeams })
      } else {
        const rows = calculateStandings(teams ?? [], allFixtures ?? [], fixtureResults ?? [], sport)
        results.push({ ag, type: 'simple', rows })
      }
    }

    setAgeGroupData(results)
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading || !user) return
    load()
  }, [id, authLoading, user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdvance(agData) {
    setAdvancing(agData.ag.id)
    try {
      const teamsAdvancing = agData.ag.teams_advancing ?? 2
      const bracketSeeding = agData.ag.bracket_seeding ?? 'cross'

      const placeholderMap = {}

      if (bracketSeeding === 'ranked') {
        // Collect all advancing teams across groups, sort by overall standings
        const allAdvancing = agData.perGroup.flatMap(({ rows }) => rows.slice(0, teamsAdvancing))
        allAdvancing.sort((a, b) =>
          b.points - a.points ||
          (b.gf - b.ga) - (a.gf - a.ga) ||
          b.gf - a.gf ||
          a.team.name.localeCompare(b.team.name)
        )
        allAdvancing.forEach((row, i) => { placeholderMap[`Rank ${i + 1}`] = row.team.id })
      } else {
        // Cross and mirror both use "Group A-1" placeholder format
        agData.perGroup.forEach(({ label, rows }) => {
          rows.slice(0, teamsAdvancing).forEach((row, posIndex) => {
            placeholderMap[`Group ${label}-${posIndex + 1}`] = row.team.id
          })
        })
      }

      for (const f of agData.knockoutFixtures) {
        const homeTeamId = f.home_placeholder ? (placeholderMap[f.home_placeholder] ?? null) : f.home_team_id
        const awayTeamId = f.away_placeholder ? (placeholderMap[f.away_placeholder] ?? null) : f.away_team_id
        const { error } = await supabase.from('fixtures')
          .update({ home_team_id: homeTeamId, away_team_id: awayTeamId })
          .eq('id', f.id)
        if (error) throw error
      }

      toast(t('standings.advanced'), 'success')
      await load()
    } catch {
      toast(t('common.error'), 'error')
    } finally {
      setAdvancing(null)
    }
  }

  if (authLoading || loading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />

  const activeAgId = selectedAgId ?? ageGroupData[0]?.ag.id

  return (
    <>
      <style>{AG_TAB_STYLE}</style>
      <style>{STANDINGS_MOBILE_STYLE}</style>
      <style>{PRINT_STYLE}</style>
      <div className="container" style={{ paddingTop: '2rem', maxWidth: '900px' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
            {t('workspace.navStandings')}
          </h1>
          <button className="btn-secondary btn-sm" onClick={() => window.print()}>
            🖨 {t('standings.print')}
          </button>
        </div>

        {ageGroupData.length > 1 && (
          <div className="no-print" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {ageGroupData.map(agData => {
              const isActive = activeAgId === agData.ag.id
              return (
                <button
                  key={agData.ag.id}
                  onClick={() => setSelectedAgId(agData.ag.id)}
                  style={{
                    padding: '0.35rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                    cursor: 'pointer',
                    background: isActive ? 'var(--color-accent)' : 'transparent',
                    color: isActive ? '#0a0f1e' : 'var(--color-text-muted)',
                    border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {agData.ag.name}
                </button>
              )
            })}
          </div>
        )}

        {error && (
          <div className="no-print" style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
            {t('common.error')}: {error}
          </div>
        )}

        {ageGroupData.length === 0 && !error && (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</p>
        )}

        <div className="print-content">
          {ageGroupData.map(agData => (
            <div
              key={agData.ag.id}
              className={`print-age-group${activeAgId !== agData.ag.id ? ' ag-tab-hidden' : ''}`}
              style={{ marginBottom: '2.5rem' }}
            >
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                {agData.ag.name}
              </h2>

              {agData.type === 'group_knockout' ? (
                <>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('standings.groupPhase')}
                  </h3>

                  {agData.perGroup.map(({ label, rows }) => (
                    <div key={label} style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        {t('standings.group')} {label}
                      </h4>
                      {rows.length === 0
                        ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('common.noData')}</p>
                        : <StandingsTable rows={rows} advancingCount={agData.ag.teams_advancing ?? 2} t={t} sport={tournamentSport} />
                      }
                    </div>
                  ))}

                  <div className="no-print" style={{ marginTop: '1rem' }}>
                    {agData.knockoutHasTeams ? (
                      <p style={{ color: 'var(--color-success)', fontSize: '0.875rem' }}>
                        ✓ {t('standings.advanceDone')}
                      </p>
                    ) : (
                      <button
                        className="btn-primary btn-sm"
                        disabled={!agData.allGroupDone || advancing === agData.ag.id}
                        onClick={() => handleAdvance(agData)}
                        title={!agData.allGroupDone ? t('standings.knockoutPending') : ''}
                      >
                        {advancing === agData.ag.id ? t('standings.advancing') : t('standings.advanceBtn')}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                agData.rows.length === 0
                  ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('common.noData')}</p>
                  : <StandingsTable rows={agData.rows} t={t} sport={tournamentSport} />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
