import { useEffect, useState } from 'react'
import { useParams, Navigate, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { calculateStandings } from '../../../utils/standings'
import PrintQR from '../../../components/Print/PrintQR'

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

export default function TournamentStandings() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const { tournament } = useOutletContext() ?? {}
  const [loading, setLoading] = useState(true)
  const [ageGroupStandings, setAgeGroupStandings] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading || !user) return
    async function load() {
      // Fetch all age groups for this tournament
      const { data: ageGroups, error: agError } = await supabase
        .from('age_groups')
        .select('id, name')
        .eq('tournament_id', id)
        .order('name')

      if (agError) { setError(agError.message); setLoading(false); return }
      if (!ageGroups || ageGroups.length === 0) { setLoading(false); return }

      const results = []

      for (const ag of ageGroups) {
        // Fetch confirmed teams for this age group
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('age_group_id', ag.id)
          .eq('status', 'confirmed')

        if (teamsError) continue
        if (!teams || teams.length === 0) {
          results.push({ ageGroup: ag, rows: [] })
          continue
        }

        // Fetch stages for this age group
        const { data: stages, error: stagesError } = await supabase
          .from('stages')
          .select('id')
          .eq('age_group_id', ag.id)

        if (stagesError || !stages || stages.length === 0) {
          results.push({ ageGroup: ag, rows: [] })
          continue
        }

        const stageIds = stages.map(s => s.id)

        // Fetch fixtures for these stages
        const { data: fixtures, error: fixError } = await supabase
          .from('fixtures')
          .select('id, home_team_id, away_team_id, status')
          .in('stage_id', stageIds)

        if (fixError || !fixtures || fixtures.length === 0) {
          results.push({ ageGroup: ag, rows: calculateStandings(teams, [], []) })
          continue
        }

        const fixtureIds = fixtures.map(f => f.id)

        // Fetch fixture results
        const { data: fixtureResults, error: resError } = await supabase
          .from('fixture_results')
          .select('fixture_id, home_goals, away_goals')
          .in('fixture_id', fixtureIds)

        if (resError) {
          results.push({ ageGroup: ag, rows: calculateStandings(teams, fixtures, []) })
          continue
        }

        const rows = calculateStandings(teams, fixtures, fixtureResults ?? [])
        results.push({ ageGroup: ag, rows })
      }

      setAgeGroupStandings(results)
      setLoading(false)
    }

    load()
  }, [id, authLoading, user])

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
          <button
            className="btn-secondary btn-sm"
            onClick={() => window.print()}
          >
            🖨 {t('standings.print')}
          </button>
        </div>

        {error && (
          <div className="no-print" style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
            {t('common.error')}: {error}
          </div>
        )}

        {ageGroupStandings.length === 0 && !error && (
          <p style={{ color: 'var(--color-muted)' }}>{t('common.noData')}</p>
        )}

        <div className="print-content">
          {tournament?.slug && (
            <PrintQR
              url={`https://www.fixturday.com/t/${tournament.slug}`}
              label={t('print.qrStandings')}
            />
          )}
          {ageGroupStandings.map(({ ageGroup, rows }) => (
            <div key={ageGroup.id} className="print-age-group" style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
                {ageGroup.name}
              </h2>

              {rows.length === 0 ? (
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>{t('common.noData')}</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.12)', color: 'var(--color-muted)', fontSize: '0.78rem' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem', width: '2rem' }}>#</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem' }}>{t('standings.team')}</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem 0.4rem' }}>{t('standings.played')}</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem 0.4rem' }}>{t('standings.won')}</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem 0.4rem' }}>{t('standings.drawn')}</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem 0.4rem' }}>{t('standings.lost')}</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem 0.4rem' }}>{t('standings.gf')}</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem 0.4rem' }}>{t('standings.ga')}</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem 0.4rem' }}>{t('standings.gd')}</th>
                        <th style={{ textAlign: 'center', padding: '0.5rem 0.4rem', color: 'var(--color-accent)', fontWeight: 700 }}>{t('standings.points')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr
                          key={row.team.id}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <td style={{ padding: '0.6rem 0.4rem', color: 'var(--color-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                          <td style={{ padding: '0.6rem 0.4rem', fontWeight: 500 }}>{row.team.name}</td>
                          <td style={{ textAlign: 'center', padding: '0.6rem 0.4rem' }}>{row.played}</td>
                          <td style={{ textAlign: 'center', padding: '0.6rem 0.4rem' }}>{row.won}</td>
                          <td style={{ textAlign: 'center', padding: '0.6rem 0.4rem' }}>{row.drawn}</td>
                          <td style={{ textAlign: 'center', padding: '0.6rem 0.4rem' }}>{row.lost}</td>
                          <td style={{ textAlign: 'center', padding: '0.6rem 0.4rem' }}>{row.gf}</td>
                          <td style={{ textAlign: 'center', padding: '0.6rem 0.4rem' }}>{row.ga}</td>
                          <td style={{ textAlign: 'center', padding: '0.6rem 0.4rem' }}>
                            {row.gd > 0 ? `+${row.gd}` : row.gd}
                          </td>
                          <td style={{ textAlign: 'center', padding: '0.6rem 0.4rem', fontWeight: 700 }}>{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
