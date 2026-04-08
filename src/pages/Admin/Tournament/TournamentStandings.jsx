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

    svg { display: none !important; }
  }
`

const thStyle = { textAlign: 'left', padding: '0.5rem 0.4rem', color: 'var(--color-muted)', fontSize: '0.78rem', fontWeight: 600 }
const thCStyle = { ...thStyle, textAlign: 'center' }
const tdStyle = { padding: '0.6rem 0.4rem' }
const tdCStyle = { ...tdStyle, textAlign: 'center' }

function StandingsTable({ rows, advancingCount, t }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.12)' }}>
            <th style={thStyle}>#</th>
            <th style={thStyle}>{t('standings.team')}</th>
            <th style={thCStyle}>{t('standings.played')}</th>
            <th style={thCStyle}>{t('standings.won')}</th>
            <th style={thCStyle}>{t('standings.drawn')}</th>
            <th style={thCStyle}>{t('standings.lost')}</th>
            <th style={thCStyle}>{t('standings.gf')}</th>
            <th style={thCStyle}>{t('standings.ga')}</th>
            <th style={thCStyle}>{t('standings.gd')}</th>
            <th style={{ ...thCStyle, color: 'var(--color-accent)', fontWeight: 700 }}>{t('standings.points')}</th>
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
              <td style={{ ...tdStyle, color: 'var(--color-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
              <td style={{ ...tdStyle, fontWeight: 500 }}>
                {advancingCount && idx < advancingCount && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-accent)', marginRight: '0.4rem', fontWeight: 700 }}>↑</span>
                )}
                {row.team.name}
              </td>
              <td style={tdCStyle}>{row.played}</td>
              <td style={tdCStyle}>{row.won}</td>
              <td style={tdCStyle}>{row.drawn}</td>
              <td style={tdCStyle}>{row.lost}</td>
              <td style={tdCStyle}>{row.gf}</td>
              <td style={tdCStyle}>{row.ga}</td>
              <td style={tdCStyle}>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
              <td style={{ ...tdCStyle, fontWeight: 700 }}>{row.points}</td>
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
  const [error, setError] = useState(null)
  const [advancing, setAdvancing] = useState(null)

  async function load() {
    setLoading(true)

    const { data: ageGroups, error: agError } = await supabase
      .from('age_groups')
      .select('id, name, format, teams_advancing')
      .eq('tournament_id', id)
      .order('name')

    if (agError) { setError(agError.message); setLoading(false); return }
    if (!ageGroups?.length) { setLoading(false); return }

    const results = []

    for (const ag of ageGroups) {
      const [{ data: teams }, { data: stages }] = await Promise.all([
        supabase.from('teams').select('id, name').eq('age_group_id', ag.id).eq('status', 'confirmed'),
        supabase.from('stages').select('id, type').eq('age_group_id', ag.id),
      ])

      if (!stages?.length) {
        results.push({ ag, type: 'simple', rows: [] })
        continue
      }

      const allStageIds = stages.map(s => s.id)
      const groupStageIds = new Set(stages.filter(s => s.type === 'group_stage').map(s => s.id))
      const knockoutStageIds = new Set(stages.filter(s => s.type === 'knockout').map(s => s.id))

      const { data: allFixtures } = await supabase
        .from('fixtures')
        .select('id, stage_id, home_team_id, away_team_id, status, group_label, home_placeholder, away_placeholder')
        .in('stage_id', allStageIds)

      const fixtureIds = (allFixtures ?? []).filter(f => f.home_team_id || f.away_team_id).map(f => f.id)
      const { data: fixtureResults } = fixtureIds.length > 0
        ? await supabase.from('fixture_results').select('fixture_id, home_goals, away_goals').in('fixture_id', fixtureIds)
        : { data: [] }

      if (ag.format === 'group_knockout' && groupStageIds.size > 0) {
        const groupFixtures = (allFixtures ?? []).filter(f => groupStageIds.has(f.stage_id))
        const knockoutFixtures = (allFixtures ?? []).filter(f => knockoutStageIds.has(f.stage_id))
        const groupLabels = [...new Set(groupFixtures.map(f => f.group_label).filter(Boolean))].sort()

        const perGroup = groupLabels.map(label => {
          const gFix = groupFixtures.filter(f => f.group_label === label)
          const teamIds = new Set([...gFix.map(f => f.home_team_id), ...gFix.map(f => f.away_team_id)].filter(Boolean))
          const gTeams = (teams ?? []).filter(t => teamIds.has(t.id))
          return { label, rows: calculateStandings(gTeams, gFix, fixtureResults ?? []) }
        })

        const allGroupDone = groupFixtures.length > 0 && groupFixtures.every(f => f.status === 'completed')
        const knockoutHasTeams = knockoutFixtures.some(f => f.home_team_id || f.away_team_id)

        results.push({ ag, type: 'group_knockout', perGroup, knockoutFixtures, allGroupDone, knockoutHasTeams })
      } else {
        const rows = calculateStandings(teams ?? [], allFixtures ?? [], fixtureResults ?? [])
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

      // Build G{groupNum}P{pos} → teamId map
      const placeholderMap = {}
      agData.perGroup.forEach(({ rows }, groupIndex) => {
        rows.slice(0, teamsAdvancing).forEach((row, posIndex) => {
          placeholderMap[`G${groupIndex + 1}P${posIndex + 1}`] = row.team.id
        })
      })

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

  return (
    <>
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

        {error && (
          <div className="no-print" style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
            {t('common.error')}: {error}
          </div>
        )}

        {ageGroupData.length === 0 && !error && (
          <p style={{ color: 'var(--color-muted)' }}>{t('common.noData')}</p>
        )}

        <div className="print-content">
          {ageGroupData.map(agData => (
            <div key={agData.ag.id} className="print-age-group" style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                {agData.ag.name}
              </h2>

              {agData.type === 'group_knockout' ? (
                <>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('standings.groupPhase')}
                  </h3>

                  {agData.perGroup.map(({ label, rows }) => (
                    <div key={label} style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        {t('standings.group')} {label}
                      </h4>
                      {rows.length === 0
                        ? <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>{t('common.noData')}</p>
                        : <StandingsTable rows={rows} advancingCount={agData.ag.teams_advancing ?? 2} t={t} />
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
                  ? <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>{t('common.noData')}</p>
                  : <StandingsTable rows={agData.rows} t={t} />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
