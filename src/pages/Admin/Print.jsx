// To test:
// 1. Open page in Chrome
// 2. Ctrl+P (or Cmd+P on Mac)
// 3. Set: Destination=Save as PDF, Layout=Landscape, Paper=A4
// 4. Verify all content fits without cutoff

import { useEffect, useState } from 'react'
import { useParams, Navigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { useDateLocale } from '../../hooks/useDateLocale'
import { formatDate } from '../../utils/dateFormat'
import { calculateStandings } from '../../utils/standings'
import { Printer } from 'lucide-react'
import QRCode from 'qrcode'

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

const GROUP_SPLIT_PRINT_STYLE = `
  @page { size: A4 portrait; margin: 15mm; }
  @media print {
    body * { visibility: hidden; }
    .gs-wrap, .gs-wrap * { visibility: visible; }
    .gs-wrap { position: absolute; top: 0; left: 0; width: 100%; }
    .no-print { display: none !important; }
  }
`

export default function Print() {
  const { id: tournamentId } = useParams()
  const [searchParams] = useSearchParams()
  const filterAgId = searchParams.get('agId') || null
  const view = searchParams.get('view') || 'full'
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [tournament, setTournament] = useState(null)
  const [ageGroupData, setAgeGroupData] = useState([])
  const [qrUrls, setQrUrls] = useState({})
  const [tournamentQr, setTournamentQr] = useState(null)
  const [loading, setLoading] = useState(true)
  const dateLocale = useDateLocale()
  const printDate = format(new Date(), 'dd.MM.yyyy HH:mm', { locale: dateLocale })

  useEffect(() => {
    async function load() {
      const { data: tourney, error: tErr } = await supabase
        .from('tournaments')
        .select('*, venues(name), slug')
        .eq('id', tournamentId)
        .single()

      if (tErr || !tourney) { setLoading(false); return }
      setTournament(tourney)

      if (view === 'group-split' && tourney.slug) {
        const url = `https://www.fixturday.com/t/${tourney.slug}`
        QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: '#000', light: '#fff' } })
          .then(dataUrl => setTournamentQr(dataUrl))
      }

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
            id, round, group_label, kickoff_time, status, home_team_id, away_team_id,
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

        // Merge results into fixture list — the embedded join can return empty due to RLS
        const resultMap = Object.fromEntries(allResults.map(r => [r.fixture_id, r]))
        const fxWithResults = fxList.map(f => ({
          ...f,
          fixture_results: resultMap[f.id] ? [resultMap[f.id]] : (f.fixture_results ?? []),
        }))

        const standingsRows = calculateStandings(teams ?? [], fxWithResults, allResults)

        return { ag, fixtures: fxWithResults, standings: standingsRows }
      }))

      setAgeGroupData(results)

      // Generate QR data URLs — one per age group pointing at the live public page
      const urls = {}
      await Promise.all(
        ageGroups.map(async ag => {
          const publicUrl = `https://fixturday.com/t/${tourney.slug}/${ag.id}`
          urls[ag.id] = await QRCode.toDataURL(publicUrl, { width: 160, margin: 1, color: { dark: '#000', light: '#fff' } })
        })
      )
      setQrUrls(urls)

      setLoading(false)
    }
    load()
  }, [tournamentId])

  useEffect(() => {
    if (!loading && tournament) {
      const ready = view !== 'group-split' || tournamentQr !== null
      if (ready) setTimeout(() => window.print(), 500)
    }
  }, [loading, tournament, tournamentQr, view])

  if (authLoading || loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#000' }}>
        {t('print.preparing')}
      </div>
    )
  }
  if (!user) return <Navigate to="/admin" replace />
  if (!tournament) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#000' }}>
        {t('print.notFound')}
      </div>
    )
  }

  // ── Cross Table (Backup group play) view ─────────────────────────────────
  if (view === 'cross-table') {
    const targetAgData = filterAgId
      ? ageGroupData.find(({ ag }) => ag.id === filterAgId)
      : ageGroupData[0]

    const agName = targetAgData?.ag?.name ?? ''
    const allFixtures = targetAgData?.fixtures ?? []
    const publicUrl = tournament.slug ? `https://www.fixturday.com/t/${tournament.slug}` : ''

    // Build per-group fixture lists
    const groupFixtureMap = {}
    for (const f of allFixtures) {
      if (!f.group_label) continue
      if (!groupFixtureMap[f.group_label]) groupFixtureMap[f.group_label] = []
      groupFixtureMap[f.group_label].push(f)
    }

    const groups = Object.entries(groupFixtureMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, fxs]) => {
        // Collect unique teams
        const teamMap = new Map()
        for (const f of fxs) {
          if (f.home_team?.id) teamMap.set(f.home_team.id, f.home_team)
          if (f.away_team?.id) teamMap.set(f.away_team.id, f.away_team)
        }
        const teams = [...teamMap.values()]

        // Per-group standings
        const gResults = fxs.flatMap(f => {
          const r = f.fixture_results?.[0]
          return r ? [{ fixture_id: f.id, home_goals: r.home_goals, away_goals: r.away_goals }] : []
        })
        const gStandings = calculateStandings(teams, fxs, gResults)

        // Teams ordered by current standing position
        const orderedTeams = gStandings.length > 0
          ? gStandings.map(row => row.team)
          : [...teams].sort((a, b) => a.name.localeCompare(b.name))

        // Result lookup: `homeId:awayId` → score from row-team's POV
        const resultMap = {}
        for (const f of fxs) {
          const r = f.fixture_results?.[0]
          if (!r || !f.home_team_id || !f.away_team_id) continue
          resultMap[`${f.home_team_id}:${f.away_team_id}`] = { h: r.home_goals, a: r.away_goals }
          resultMap[`${f.away_team_id}:${f.home_team_id}`] = { h: r.away_goals, a: r.home_goals }
        }

        // Points/position per team
        const ptsMap = Object.fromEntries(
          gStandings.map((row, i) => [row.team.id, { pts: row.points, pos: i + 1 }])
        )

        return { label, teams: orderedTeams, resultMap, ptsMap }
      })

    const maxTeams = Math.max(...groups.map(g => g.teams.length), 0)
    const cellW = maxTeams > 10 ? 40 : maxTeams > 7 ? 50 : 60
    const tblFontSize = maxTeams > 10 ? '0.68rem' : maxTeams > 7 ? '0.76rem' : '0.84rem'

    return (
      <>
        <style>{`
          @page { size: A4 landscape; margin: 10mm 14mm; }
          @media print {
            body * { visibility: hidden; }
            .ct-root, .ct-root * { visibility: visible; }
            .ct-root { position: absolute; top: 0; left: 0; width: 100%; }
            .no-print { display: none !important; }
            .ct-group { page-break-after: always; }
            .ct-group:last-child { page-break-after: auto; }
          }
        `}</style>

        <div className="no-print" style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 999 }}>
          <button
            onClick={() => window.print()}
            style={{ background: '#f0a500', color: '#000', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            {t('print.printBtn')}
          </button>
        </div>

        <div className="ct-root" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#000', background: '#fff' }}>
          {groups.length === 0 && (
            <div style={{ padding: '2rem', color: '#888', fontFamily: 'Arial, sans-serif' }}>
              No groups found. Generate group stage fixtures first.
            </div>
          )}
          {groups.map(group => (
            <div key={group.label} className="ct-group" style={{ padding: '8mm 0' }}>
              {/* Page header */}
              <div style={{ borderBottom: '3px solid #000', paddingBottom: '5px', marginBottom: '12px' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.15 }}>
                  {tournament.name.toUpperCase()} — {agName.toUpperCase()}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#444', marginTop: '2px' }}>
                  {t('print.group')} {group.label}
                </div>
              </div>

              {/* Cross table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: tblFontSize, tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '26px' }} />
                  <col style={{ width: '120px' }} />
                  {group.teams.map((_, j) => <col key={j} style={{ width: cellW + 'px' }} />)}
                  <col style={{ width: cellW + 'px' }} />
                  <col style={{ width: cellW + 'px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={ctTh}>#</th>
                    <th style={{ ...ctTh, textAlign: 'left' }}>{t('standings.team')}</th>
                    {group.teams.map((_, j) => <th key={j} style={ctTh}>{j + 1}</th>)}
                    <th style={ctTh}>{t('standings.points')}</th>
                    <th style={ctTh}>Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {group.teams.map((team, i) => (
                    <tr key={team.id}>
                      <td style={{ ...ctTd, textAlign: 'center', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ ...ctTd, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {team.name}
                      </td>
                      {group.teams.map((opp, j) => {
                        if (i === j) return (
                          <td key={opp.id} style={{ ...ctTd, background: '#aaa', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />
                        )
                        const r = group.resultMap[`${team.id}:${opp.id}`]
                        return (
                          <td key={opp.id} style={{ ...ctTd, textAlign: 'center', fontWeight: r ? 700 : 400, color: r ? '#000' : '#bbb' }}>
                            {r ? `${r.h}:${r.a}` : '–'}
                          </td>
                        )
                      })}
                      <td style={ctTd} />
                      <td style={ctTd} />
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Page footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ccc', paddingTop: '5px', marginTop: '10px', fontSize: '0.65rem', color: '#999' }}>
                <span>fixturday.com{publicUrl ? ` — ${publicUrl.replace('https://', '')}` : ''}</span>
                <span>{printDate}</span>
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  // ── Group Split view ──────────────────────────────────────────────────────
  if (view === 'group-split') {
    const targetAgData = filterAgId
      ? ageGroupData.find(({ ag }) => ag.id === filterAgId)
      : ageGroupData[0]

    const groupMap = {}
    for (const f of (targetAgData?.fixtures ?? [])) {
      if (!f.group_label) continue
      if (!groupMap[f.group_label]) groupMap[f.group_label] = new Map()
      if (f.home_team?.id) groupMap[f.group_label].set(f.home_team.id, f.home_team.name)
      if (f.away_team?.id) groupMap[f.group_label].set(f.away_team.id, f.away_team.name)
    }
    const groups = Object.entries(groupMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, teamsMap]) => ({
        label,
        teams: [...teamsMap.entries()]
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))

    const publicUrl = tournament.slug ? `https://www.fixturday.com/t/${tournament.slug}` : ''
    const agName = targetAgData?.ag?.name ?? ''

    return (
      <>
        <style>{GROUP_SPLIT_PRINT_STYLE}</style>
        <div className="no-print" style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 999 }}>
          <button
            onClick={() => window.print()}
            style={{ background: '#f0a500', color: '#000', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            {t('print.printBtn')}
          </button>
        </div>

        <div className="gs-wrap" style={{ fontFamily: "'Barlow', sans-serif", color: '#000', background: '#fff', padding: '0', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ borderBottom: '3px solid #000', paddingBottom: '0.875rem', marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.4rem', fontWeight: 700, lineHeight: 1.05, color: '#000' }}>
              {tournament.name.toUpperCase()}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: '#444', marginTop: '0.2rem' }}>
              {agName.toUpperCase()}
            </div>
            <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.7rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.3rem' }}>
              {t('print.groupSplit')}
            </div>
          </div>

          {/* Groups grid */}
          {groups.length > 0 ? (
            <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {groups.map(group => (
                <div key={group.label} style={{ flex: 1, minWidth: '120px', border: '2px solid #000', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.15rem', fontWeight: 700, background: '#000', color: '#fff', padding: '0.45rem 0.75rem', letterSpacing: '0.04em' }}>
                    {t('print.group')} {group.label}
                  </div>
                  <div>
                    {group.teams.map((team, i) => (
                      <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', borderBottom: i < group.teams.length - 1 ? '1px solid #eee' : 'none' }}>
                        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.72rem', color: '#aaa', minWidth: '1.1rem' }}>{i + 1}</span>
                        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: '#000' }}>{team.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#888', fontFamily: "'Barlow', sans-serif", fontSize: '0.9rem', padding: '1rem 0' }}>
              No groups found for this division.
            </div>
          )}

          {/* Footer: follow online + QR */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '2px solid #000', paddingTop: '0.875rem', marginTop: '1.5rem' }}>
            <div>
              <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.65rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>
                {t('print.followOnline')}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#000', fontWeight: 700 }}>
                {publicUrl.replace('https://', '')}
              </div>
            </div>
            {tournamentQr && (
              <img src={tournamentQr} alt="QR" width={72} height={72} style={{ display: 'block', flexShrink: 0 }} />
            )}
          </div>
        </div>
      </>
    )
  }

  // ── Full schedule/standings view (default) ────────────────────────────────
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
        {ageGroupData.filter(({ ag }) => !filterAgId || ag.id === filterAgId).map(({ ag, fixtures, standings }) => {
          if (fixtures.length === 0 && standings.length === 0) return null

          return (
            <div key={ag.id} className="print-age-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #999', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                <h2 style={{ fontFamily: 'Arial, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#000', margin: 0 }}>
                  {ag.name}
                </h2>
                {qrUrls[ag.id] && (
                  <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: '1rem' }}>
                    <img
                      src={qrUrls[ag.id]}
                      width={72}
                      height={72}
                      alt="QR"
                      style={{ display: 'block', margin: '0 auto 3px' }}
                    />
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '7pt', fontWeight: 700, color: '#000', whiteSpace: 'nowrap' }}>
                      {t('print.qrLabel')}
                    </div>
                  </div>
                )}
              </div>

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
                                ? format(new Date(f.kickoff_time), 'dd.MM HH:mm', { locale: dateLocale })
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

const ctTh = {
  border: '1px solid #000',
  padding: '4px 3px',
  background: '#e0e0e0',
  fontWeight: 700,
  textAlign: 'center',
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact',
}

const ctTd = {
  border: '1px solid #aaa',
  padding: '10px 4px',
  color: '#000',
}
