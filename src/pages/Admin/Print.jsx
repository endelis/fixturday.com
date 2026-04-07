// To test:
// 1. Open page in Chrome
// 2. Ctrl+P (or Cmd+P on Mac)
// 3. Set: Destination=Save as PDF, Layout=Landscape, Paper=A4
// 4. Verify all content fits without cutoff

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { lv } from 'date-fns/locale'
import { formatDate } from '../../utils/dateFormat'
import { calculateStandings } from '../../utils/standings'
import { Printer } from 'lucide-react'
import PrintQR from '../../components/Print/PrintQR'

const PRINT_STYLE = `
  @media print {
    @page {
      size: A4 landscape;
      margin: 10mm 15mm;
    }

    /* Hide everything except print content */
    body * { visibility: hidden; }
    .print-content, .print-content * { visibility: visible; }
    .print-content {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
    }

    /* Hide UI chrome */
    .no-print { display: none !important; }

    /* Reset body for print */
    body {
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 11pt !important;
      color: #000 !important;
      background: #fff !important;
    }

    h1 { font-size: 16pt !important; margin: 0 0 4pt !important; }
    h2 { font-size: 13pt !important; margin: 0 0 6pt !important; color: #000 !important; }
    h3 { font-size: 11pt !important; margin: 0 0 4pt !important; color: #555 !important; }
    p  { font-size: 9pt !important; }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt !important;
    }
    th, td {
      border: 1px solid #aaa;
      padding: 3pt 5pt;
      text-align: left;
    }
    th {
      background: #f0f0f0 !important;
      font-weight: bold;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    tr:nth-child(even) td {
      background: #f9f9f9 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    tr { page-break-inside: avoid; }
    thead { display: table-header-group; }

    /* Page break between age groups */
    .print-age-group { page-break-after: auto; }
    .print-age-group + .print-age-group { page-break-before: always; }

    /* Print footer — shown on every page */
    .print-page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      font-size: 8pt !important;
      color: #aaa !important;
      border-top: 0.5pt solid #ddd;
      padding-top: 3pt;
      text-align: center;
    }

    /* Lucide icons hidden in print */
    svg { display: none !important; }
  }
`

export default function Print() {
  const { id: tournamentId } = useParams()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [tournament, setTournament] = useState(null)
  const [ageGroupData, setAgeGroupData] = useState([])
  const [loading, setLoading] = useState(true)
  const printDate = format(new Date(), 'dd.MM.yyyy HH:mm', { locale: lv })

  useEffect(() => {
    if (authLoading || !user) return
    async function load() {
      const { data: tourney, error: tErr } = await supabase
        .from('tournaments')
        .select('*, venues(name)')
        .eq('id', tournamentId)
        .single()

      if (tErr || !tourney) { setLoading(false); return }
      setTournament(tourney)

      const { data: ageGroups, error: agErr } = await supabase
        .from('age_groups')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('name')

      if (agErr || !ageGroups?.length) { setLoading(false); return }

      const results = await Promise.all(ageGroups.map(async ag => {
        const [{ data: teams }, { data: stagesData }] = await Promise.all([
          supabase.from('teams').select('id, name').eq('age_group_id', ag.id).eq('status', 'confirmed'),
          supabase.from('stages').select('id').eq('age_group_id', ag.id),
        ])

        const stageIds = (stagesData ?? []).map(s => s.id)

        const { data: fixtures } = await supabase
          .from('fixtures')
          .select(`
            id, round, kickoff_time, status, home_team_id, away_team_id,
            home_team:teams!home_team_id(id, name),
            away_team:teams!away_team_id(id, name),
            pitch:pitches(name, venues(name)),
            fixture_results(home_goals, away_goals)
          `)
          .in('stage_id', stageIds)
          .order('kickoff_time', { ascending: true })

        const fxList = fixtures ?? []
        const fixtureIds = fxList.map(f => f.id)

        const allResults = fixtureIds.length > 0
          ? (await supabase.from('fixture_results').select('fixture_id, home_goals, away_goals').in('fixture_id', fixtureIds)).data ?? []
          : []

        const standingsRows = calculateStandings(teams ?? [], fxList, allResults)

        return { ag, fixtures: fxList, standings: standingsRows }
      }))

      setAgeGroupData(results)
      setLoading(false)
    }
    load()
  }, [tournamentId, authLoading, user])

  useEffect(() => {
    if (!loading && tournament) {
      setTimeout(() => window.print(), 500)
    }
  }, [loading, tournament])

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#000' }}>
        {t('print.preparing')}
      </div>
    )
  }
  if (!tournament) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#000' }}>
        {t('print.notFound')}
      </div>
    )
  }

  const venueName = Array.isArray(tournament.venues)
    ? tournament.venues[0]?.name
    : tournament.venues?.name

  return (
    <>
      <style>{PRINT_STYLE}</style>

      {/* Manual print button — hidden in print */}
      <div className="no-print" style={{
        position: 'fixed', top: '1rem', right: '1rem', zIndex: 999,
        display: 'flex', gap: '0.5rem',
      }}>
        <button
          onClick={() => window.print()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#f0a500', color: '#000', border: 'none',
            borderRadius: '6px', padding: '0.5rem 1rem',
            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
          }}
        >
          <Printer size={16} /> {t('print.printBtn')}
        </button>
      </div>

      <div
        className="print-content"
        style={{ fontFamily: 'Arial, sans-serif', color: '#000', background: '#fff', padding: '1.5cm' }}
      >
        {/* ── Tournament header ─────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: '1.25rem',
          borderBottom: '2px solid #000', paddingBottom: '0.75rem',
        }}>
          <div>
            <h1 style={{ fontFamily: 'Arial, sans-serif', fontSize: '1.75rem', margin: 0, fontWeight: 700 }}>
              {tournament.name}
            </h1>
            <p style={{ margin: '0.2rem 0 0', color: '#555', fontSize: '0.8rem' }}>
              {tournament.sport && <span>{tournament.sport} · </span>}
              {tournament.start_date && formatDate(tournament.start_date)}
              {tournament.end_date && ` – ${formatDate(tournament.end_date)}`}
              {venueName && ` · ${venueName}`}
            </p>
          </div>
          <p style={{ margin: 0, color: '#777', fontSize: '0.7rem', textAlign: 'right' }}>
            fixturday.com<br />
            {t('print.printedOn')}{printDate}
          </p>
        </div>

        {/* ── Per age group ──────────────────────────────────────── */}
        {ageGroupData.map(({ ag, fixtures, standings }) => {
          if (fixtures.length === 0 && standings.length === 0) return null

          return (
            <div key={ag.id} className="print-age-group">
              <h2 style={{
                fontFamily: 'Arial, sans-serif', fontSize: '1.25rem', fontWeight: 700,
                borderBottom: '1px solid #999', paddingBottom: '0.25rem', marginBottom: '0.75rem',
                color: '#000',
              }}>
                {ag.name}
              </h2>

              {/* Standings table */}
              {standings.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', color: '#333' }}>
                    {t('print.standings')}
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#f0f0f0' }}>
                        <th style={thStyle}>#</th>
                        <th style={{ ...thStyle, textAlign: 'left', minWidth: '120px' }}>{t('standings.team')}</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>{t('standings.played')}</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>{t('standings.won')}</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>{t('standings.drawn')}</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>{t('standings.lost')}</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>{t('standings.gf')}</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>{t('standings.ga')}</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>{t('standings.gd')}</th>
                        <th style={{ ...thStyle, textAlign: 'center', fontWeight: 700 }}>{t('standings.points')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row, i) => (
                        <tr key={row.team.id} style={{ background: i % 2 === 1 ? '#f9f9f9' : '#fff' }}>
                          <td style={tdStyle}>{i + 1}</td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{row.team.name}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{row.played}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{row.won}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{row.drawn}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{row.lost}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{row.gf}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{row.ga}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            {row.gd > 0 ? `+${row.gd}` : row.gd}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Fixtures / schedule table */}
              {fixtures.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', color: '#333' }}>
                    {t('print.schedule')}
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#f0f0f0' }}>
                        <th style={{ ...thStyle, whiteSpace: 'nowrap' }}>{t('print.colRound')}</th>
                        <th style={{ ...thStyle, whiteSpace: 'nowrap' }}>{t('print.colTime')}</th>
                        <th style={thStyle}>{t('print.colPitch')}</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>{t('print.colHome')}</th>
                        <th style={{ ...thStyle, textAlign: 'center', minWidth: '50px' }}>{t('print.colResult')}</th>
                        <th style={thStyle}>{t('print.colAway')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fixtures.map((f, i) => {
                        const result = f.fixture_results?.[0]
                        return (
                          <tr key={f.id} style={{ background: i % 2 === 1 ? '#f9f9f9' : '#fff' }}>
                            <td style={tdStyle}>{f.round ?? '—'}</td>
                            <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                              {f.kickoff_time
                                ? format(new Date(f.kickoff_time), 'dd.MM HH:mm', { locale: lv })
                                : '—'}
                            </td>
                            <td style={tdStyle}>
                              {f.pitch ? `${f.pitch.venues?.name ?? ''} – ${f.pitch.name}` : '—'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                              {f.home_team?.name ?? '?'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, letterSpacing: '0.05em' }}>
                              {result ? `${result.home_goals} : ${result.away_goals}` : ' : '}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>
                              {f.away_team?.name ?? '?'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}

        {/* ── Print footer (fixed, appears on every page) ────────── */}
        <div className="print-page-footer" style={{
          fontSize: '0.7rem', color: '#aaa',
          borderTop: '0.5px solid #ddd', paddingTop: '3px',
          textAlign: 'center', marginTop: '1rem',
        }}>
          fixturday.com — {tournament.name} — {printDate}
        </div>

        <PrintQR
          url={`https://www.fixturday.com/t/${tournament.slug}`}
          label={t('print.qrSchedule')}
        />
      </div>
    </>
  )
}

const thStyle = {
  border: '1px solid #aaa',
  padding: '3px 5px',
  background: '#f0f0f0',
  fontWeight: 700,
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact',
}

const tdStyle = {
  border: '1px solid #ccc',
  padding: '3px 5px',
  color: '#000',
}
