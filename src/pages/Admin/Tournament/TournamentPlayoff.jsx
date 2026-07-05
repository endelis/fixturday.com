import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'

const BRACKET_STYLE = `
  .bracket-scroll::-webkit-scrollbar { display: none; }
  .bracket-scroll { -ms-overflow-style: none; scrollbar-width: none; }

  .bracket-wrapper {
    flex-direction: column !important;
    overflow-x: visible !important;
    gap: 1.5rem !important;
  }
  .bracket-round {
    min-width: 0 !important;
    width: 100% !important;
    flex: 1 0 100% !important;
  }
  .bracket-round-label { text-align: left !important; }
  @media (min-width: 641px) {
    .bracket-wrapper {
      flex-direction: row !important;
      overflow-x: auto !important;
      gap: 1rem !important;
    }
    .bracket-round {
      min-width: 190px !important;
      width: auto !important;
      flex: 0 0 auto !important;
    }
    .bracket-round-label { text-align: center !important; }
  }
`

const PRINT_STYLE = `
  @media print {
    @page { size: A4 landscape; margin: 10mm 15mm; }
    body * { visibility: hidden; }
    .print-content, .print-content * { visibility: visible; }
    .print-content { position: absolute; top: 0; left: 0; width: 100%; }
    .no-print, .t-sidebar, .admin-nav,
    [class*="sidebar"], [class*="nav"] { display: none !important; }
    body {
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 11pt !important;
      color: #000 !important;
      background: #fff !important;
    }
    h1 { font-size: 16pt !important; color: #000 !important; }
    h2 { font-size: 13pt !important; color: #000 !important; }
    .bracket-wrapper { display: flex !important; overflow: visible !important; transform-origin: top left; }
    .bracket-round { min-width: 0 !important; flex: 1 !important; }
    .bracket-match { background: #fff !important; border: 1px solid #aaa !important; page-break-inside: avoid; margin-bottom: 6pt; box-shadow: none !important; }
    .bracket-team-row { color: #000 !important; padding: 3pt 5pt !important; font-size: 9pt !important; border-bottom: 0.5pt solid #ddd !important; background: #fff !important; }
    .bracket-team-row:last-child { border-bottom: none !important; }
    .bracket-round-label { color: #555 !important; font-size: 8pt !important; font-weight: bold; border: none !important; background: transparent !important; }
    .print-age-group + .print-age-group { page-break-before: always; }
    svg { display: none !important; }
  }
`

export default function TournamentPlayoff() {
  const { id: tournamentId } = useParams()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [ageGroupBrackets, setAgeGroupBrackets] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: ageGroups, error: agError } = await supabase
        .from('age_groups')
        .select('id, name')
        .eq('tournament_id', tournamentId)
        .order('name')

      if (agError) { setError(agError.message); setLoading(false); return }
      if (!ageGroups || ageGroups.length === 0) { setLoading(false); return }

      const brackets = []

      for (const ag of ageGroups) {
        const { data: fixtures, error: fixError } = await supabase
          .from('fixtures')
          .select(`
            id, round, round_name, home_placeholder, away_placeholder,
            home_team:teams!home_team_id(id, name),
            away_team:teams!away_team_id(id, name),
            stages!inner(age_group_id, type)
          `)
          .eq('stages.age_group_id', ag.id)
          .eq('stages.type', 'knockout')
          .order('round')

        if (fixError || !fixtures || fixtures.length === 0) continue

        const fixIds = fixtures.map(f => f.id)
        const { data: results } = fixIds.length > 0
          ? await supabase.from('fixture_results').select('fixture_id, home_goals, away_goals').in('fixture_id', fixIds)
          : { data: [] }
        const resultMap = Object.fromEntries((results ?? []).map(r => [r.fixture_id, r]))
        const fixturesWithResults = fixtures.map(f => ({ ...f, result: resultMap[f.id] ?? null }))

        const vMap = new Map()
        for (const fix of fixturesWithResults) {
          const round = fix.round ?? 0
          const is3rd =
            fix.round_name === '3rd_place' ||
            (fix.home_placeholder ?? '').includes('zaudētājs') ||
            (fix.away_placeholder ?? '').includes('zaudētājs') ||
            (fix.home_placeholder ?? '').includes('Loser') ||
            (fix.away_placeholder ?? '').includes('Loser')
          const key = is3rd ? `${round}:3` : `${round}:m`
          if (!vMap.has(key)) vMap.set(key, { round, is3rd, matches: [] })
          vMap.get(key).matches.push(fix)
        }

        const rounds = [...vMap.values()]
          .sort((a, b) => a.round !== b.round ? a.round - b.round : (a.is3rd ? -1 : 1))
          .map(({ round, is3rd, matches }) => {
            let roundName
            if (is3rd) {
              roundName = t('playoff.thirdPlace')
            } else if (matches[0]?.round_name) {
              roundName = matches[0].round_name
            } else {
              const n = matches.length
              roundName = n === 1
                ? t('playoff.final')
                : n === 2 ? t('playoff.semiFinal')
                : n === 4 ? t('playoff.quarterFinal')
                : `${t('fixture.round')} ${round}`
            }
            return { roundNum: round, roundName, matches, is3rd }
          })

        if (rounds.length > 0) {
          brackets.push({ ageGroup: ag, rounds })
        }
      }

      setAgeGroupBrackets(brackets)
      setLoading(false)
    }

    if (authLoading || !user) return
    load()
  }, [tournamentId, authLoading, user, t])

  if (authLoading || loading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />

  return (
    <>
      <style>{BRACKET_STYLE}</style>
      <style>{PRINT_STYLE}</style>
      <div className="container" style={{ paddingTop: '2rem', maxWidth: '1100px' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
            {t('workspace.navPlayoff')}
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

        {ageGroupBrackets.length === 0 && !error && (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('standings.knockoutPending')}</p>
        )}

        <div className="print-content">
          {ageGroupBrackets.map(({ ageGroup, rounds }) => (
            <div key={ageGroup.id} className="print-age-group" style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-accent)', marginBottom: '1.25rem' }}>
                {ageGroup.name}
              </h2>

              <div
                className="bracket-wrapper bracket-scroll"
                style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', alignItems: 'flex-start' }}
              >
                {rounds.map(({ roundNum, roundName, matches, is3rd }) => {
                  const isFinal = !is3rd && matches.length === 1 && roundName === t('playoff.final')

                  const decodePlaceholder = (p) => {
                    if (!p) return '?'
                    const m = p.match(/^Group ([A-Z])-(\d+)$/) ?? p.match(/^G(\d+)P(\d+)$/)
                    if (m) return t('standings.groupPlaceholder', { group: m[1], pos: m[2] })
                    return p.replace('uzvarētājs', 'Winner').replace('zaudētājs', 'Loser')
                  }

                  return (
                    <div
                      key={`${roundNum}:${is3rd}`}
                      className="bracket-round"
                      style={{ minWidth: isFinal ? '210px' : '190px', flex: `0 0 ${isFinal ? '210px' : '190px'}` }}
                    >
                      {/* Round label */}
                      <div
                        className="bracket-round-label"
                        style={{
                          textAlign: 'center',
                          marginBottom: '0.75rem',
                          padding: '0.3rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          background: isFinal ? 'rgba(240,165,0,0.12)' : is3rd ? 'rgba(255,255,255,0.04)' : 'transparent',
                          color: isFinal ? 'var(--color-accent)' : 'var(--color-text-muted)',
                          border: isFinal ? '1px solid rgba(240,165,0,0.25)' : '1px solid transparent',
                        }}
                      >
                        {isFinal ? '🏆 ' : is3rd ? '🥉 ' : ''}{roundName}
                      </div>

                      {/* Match cards */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {matches.map((match) => {
                          const homeTeam = match.home_team?.name ?? decodePlaceholder(match.home_placeholder)
                          const awayTeam = match.away_team?.name ?? decodePlaceholder(match.away_placeholder)
                          const homeIsReal = !!match.home_team?.name
                          const awayIsReal = !!match.away_team?.name
                          const result = match.result ?? null
                          const hasResult = result != null
                          const homeGoals = hasResult ? result.home_goals : null
                          const awayGoals = hasResult ? result.away_goals : null
                          const homeWon = hasResult && homeGoals > awayGoals
                          const awayWon = hasResult && awayGoals > homeGoals

                          return (
                            <div
                              key={match.id}
                              className="bracket-match"
                              style={{
                                borderRadius: 'var(--radius)',
                                overflow: 'hidden',
                                border: isFinal
                                  ? '1px solid rgba(240,165,0,0.45)'
                                  : '1px solid var(--color-border)',
                                boxShadow: isFinal
                                  ? '0 0 28px rgba(240,165,0,0.12)'
                                  : 'none',
                              }}
                            >
                              {/* Home row */}
                              <div
                                className="bracket-team-row"
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.55rem 0.75rem',
                                  background: homeWon
                                    ? 'rgba(240,165,0,0.1)'
                                    : 'var(--color-surface)',
                                  borderBottom: '1px solid var(--color-border)',
                                  gap: '0.5rem',
                                }}
                              >
                                <span style={{
                                  fontWeight: homeWon ? 700 : 400,
                                  color: homeWon
                                    ? 'var(--color-accent)'
                                    : homeIsReal ? 'var(--color-text)' : 'var(--color-text-muted)',
                                  fontStyle: homeIsReal ? 'normal' : 'italic',
                                  fontSize: '0.85rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  flex: 1,
                                }}>
                                  {homeTeam}
                                </span>
                                {hasResult && (
                                  <span style={{
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    color: homeWon ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                    minWidth: '1.25rem',
                                    textAlign: 'right',
                                    flexShrink: 0,
                                  }}>
                                    {homeGoals}
                                  </span>
                                )}
                              </div>

                              {/* Away row */}
                              <div
                                className="bracket-team-row"
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.55rem 0.75rem',
                                  background: awayWon
                                    ? 'rgba(240,165,0,0.1)'
                                    : 'var(--color-surface-2)',
                                  gap: '0.5rem',
                                }}
                              >
                                <span style={{
                                  fontWeight: awayWon ? 700 : 400,
                                  color: awayWon
                                    ? 'var(--color-accent)'
                                    : awayIsReal ? 'var(--color-text)' : 'var(--color-text-muted)',
                                  fontStyle: awayIsReal ? 'normal' : 'italic',
                                  fontSize: '0.85rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  flex: 1,
                                }}>
                                  {awayTeam}
                                </span>
                                {hasResult && (
                                  <span style={{
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    color: awayWon ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                    minWidth: '1.25rem',
                                    textAlign: 'right',
                                    flexShrink: 0,
                                  }}>
                                    {awayGoals}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
