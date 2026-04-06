import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'

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
            fixture_results(home_goals, away_goals),
            stages!inner(age_group_id, type, age_groups(id, name, tournament_id))
          `)
          .eq('stages.age_groups.tournament_id', tournamentId)
          .eq('stages.type', 'knockout')
          .eq('stages.age_group_id', ag.id)
          .order('round')

        if (fixError || !fixtures || fixtures.length === 0) continue

        // Group fixtures by round number
        const roundMap = new Map()
        for (const fix of fixtures) {
          const round = fix.round ?? 0
          if (!roundMap.has(round)) roundMap.set(round, [])
          roundMap.get(round).push(fix)
        }

        // Sort rounds
        const rounds = Array.from(roundMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([roundNum, matches]) => ({ roundNum, roundName: matches[0]?.round_name ?? `${t('fixture.round')} ${roundNum}`, matches }))

        if (rounds.length > 0) {
          brackets.push({ ageGroup: ag, rounds })
        }
      }

      setAgeGroupBrackets(brackets)
      setLoading(false)
    }

    load()
  }, [tournamentId, t])

  if (authLoading || loading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />

  return (
    <>
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
          <p style={{ color: 'var(--color-muted)' }}>{t('standings.knockoutPending')}</p>
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
                        letterSpacing: '0.06em', color: 'var(--color-muted)',
                        marginBottom: '0.75rem', textAlign: 'center',
                      }}
                    >
                      {roundName}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {matches.map((match) => {
                        const homeTeam = match.home_team?.name ?? match.home_placeholder ?? '?'
                        const awayTeam = match.away_team?.name ?? match.away_placeholder ?? '?'
                        const result = match.fixture_results?.[0]
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
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
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
                              fontSize: '0.7rem', color: 'var(--color-muted)',
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
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
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
