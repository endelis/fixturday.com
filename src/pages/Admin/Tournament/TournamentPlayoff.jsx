import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'

const MOBILE_STYLE = `
  @media (max-width: 767px) {
    .bracket-wrapper {
      flex-direction: column !important;
      overflow-x: visible !important;
      gap: 1.25rem !important;
    }
    .bracket-round {
      min-width: 0 !important;
      flex: none !important;
      width: 100% !important;
    }
    .bracket-round-label {
      text-align: left !important;
    }
    .bracket-match-team span {
      max-width: none !important;
    }
  }
`

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

    /* Bracket print layout */
    .bracket-wrapper {
      display: flex !important;
      overflow: visible !important;
      transform-origin: top left;
    }
    .bracket-round {
      min-width: 0 !important;
      flex: 1 !important;
    }
    .bracket-match {
      background: #fff !important;
      border: 1px solid #aaa !important;
      color: #000 !important;
      page-break-inside: avoid;
      margin-bottom: 6pt;
    }
    .bracket-match-team {
      color: #000 !important;
      border-bottom: 0.5pt solid #ddd !important;
      padding: 3pt 5pt !important;
      font-size: 9pt !important;
    }
    .bracket-match-team:last-child { border-bottom: none !important; }
    .bracket-match-score {
      color: #000 !important;
      font-weight: bold;
    }
    .bracket-round-label {
      color: #555 !important;
      font-size: 8pt !important;
      font-weight: bold;
      text-transform: uppercase;
    }

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
      // Fetch all age groups for this tournament
      const { data: ageGroups, error: agError } = await supabase
        .from('age_groups')
        .select('id, name')
        .eq('tournament_id', tournamentId)
        .order('name')

      if (agError) { setError(agError.message); setLoading(false); return }
      if (!ageGroups || ageGroups.length === 0) { setLoading(false); return }

      const brackets = []

      for (const ag of ageGroups) {
        // Fetch knockout fixtures for this age group via stages join
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

        // Fetch fixture_results separately (embedded joins can silently drop results)
        const fixIds = fixtures.map(f => f.id)
        const { data: results } = fixIds.length > 0
          ? await supabase.from('fixture_results').select('fixture_id, home_goals, away_goals').in('fixture_id', fixIds)
          : { data: [] }
        const resultMap = Object.fromEntries((results ?? []).map(r => [r.fixture_id, r]))
        const fixturesWithResults = fixtures.map(f => ({
          ...f,
          result: resultMap[f.id] ?? null,
        }))

        // Group into virtual rounds — 3rd-place and Final share a round number
        // but must display as separate columns in the bracket
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
            return { roundNum: round, roundName, matches }
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
      <style>{MOBILE_STYLE}</style>
      <style>{PRINT_STYLE}</style>
      <div className="container" style={{ paddingTop: '2rem', maxWidth: '1100px' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
            {t('workspace.navPlayoff')}
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

        {ageGroupBrackets.length === 0 && !error && (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('standings.knockoutPending')}</p>
        )}

        <div className="print-content">
          {ageGroupBrackets.map(({ ageGroup, rounds }) => (
            <div key={ageGroup.id} className="print-age-group" style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                {ageGroup.name}
              </h2>

              {/* Horizontal bracket — one column per round */}
              <div
                className="bracket-wrapper"
                style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem', alignItems: 'flex-start' }}
              >
                {rounds.map(({ roundNum, roundName, matches }) => (
                  <div
                    key={roundNum}
                    className="bracket-round"
                    style={{ minWidth: '180px', flex: '0 0 180px' }}
                  >
                    <div
                      className="bracket-round-label"
                      style={{
                        fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.06em', color: 'var(--color-text-muted)',
                        marginBottom: '0.75rem', textAlign: 'center',
                      }}
                    >
                      {roundName}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {matches.map((match) => {
                        const decodePlaceholder = (p) => {
                          if (!p) return '?'
                          const m = p.match(/^Group ([A-Z])-(\d+)$/) ?? p.match(/^G(\d+)P(\d+)$/)
                          if (m) return t('standings.groupPlaceholder', { group: m[1], pos: m[2] })
                          return p.replace('uzvarētājs', 'Winner').replace('zaudētājs', 'Loser')
                        }
                        const homeTeam = match.home_team?.name ?? decodePlaceholder(match.home_placeholder)
                        const awayTeam = match.away_team?.name ?? decodePlaceholder(match.away_placeholder)
                        const result = match.result ?? null
                        const hasResult = result != null
                        const homeGoals = hasResult ? result.home_goals : null
                        const awayGoals = hasResult ? result.away_goals : null
                        const homeWon = hasResult && homeGoals > awayGoals
                        const awayWon = hasResult && awayGoals > homeGoals

                        return (
                          <div
                            key={match.id}
                            className="bracket-match card"
                            style={{ padding: '0.65rem 0.75rem', fontSize: '0.85rem' }}
                          >
                            <div
                              className="bracket-match-team"
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginBottom: '0.35rem',
                                fontWeight: homeWon ? 700 : 400,
                                color: homeWon ? 'var(--color-accent)' : 'var(--color-text)',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                {homeTeam}
                              </span>
                              {hasResult && (
                                <span className="bracket-match-score" style={{ fontWeight: 700, minWidth: '1.5rem', textAlign: 'right' }}>
                                  {homeGoals}
                                </span>
                              )}
                            </div>

                            <div style={{
                              display: 'flex', justifyContent: 'center', alignItems: 'center',
                              fontSize: '0.7rem', color: 'var(--color-text-muted)',
                              marginBottom: '0.35rem',
                            }}>
                              {hasResult ? ':' : t('fixture.vs')}
                            </div>

                            <div
                              className="bracket-match-team"
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                fontWeight: awayWon ? 700 : 400,
                                color: awayWon ? 'var(--color-accent)' : 'var(--color-text)',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                {awayTeam}
                              </span>
                              {hasResult && (
                                <span className="bracket-match-score" style={{ fontWeight: 700, minWidth: '1.5rem', textAlign: 'right' }}>
                                  {awayGoals}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
