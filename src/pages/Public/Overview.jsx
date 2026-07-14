import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { parseISO } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { calculateStandings } from '../../utils/standings'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { formatTime, formatDate } from '../../utils/dateFormat'
import { useSEO } from '../../hooks/useSEO'

export default function TournamentOverviewPublic() {
  const { slug, ageGroup: ageGroupId } = useParams()
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const seoTitle = data?.ag ? `${data.ag.tournaments.name} — Overview` : 'Tournament Overview'
  const seoDesc = data?.ag
    ? `Live overview of ${data.ag.tournaments.name} — scores, standings, and upcoming matches in one view.`
    : 'Tournament overview with live scores, standings, and upcoming matches.'
  const ogImage = `https://www.fixturday.com/api/og?slug=${encodeURIComponent(slug)}&ag=${encodeURIComponent(ageGroupId)}`
  useSEO({ title: seoTitle, description: seoDesc, path: `/t/${slug}/${ageGroupId}/overview`, image: ogImage })

  useEffect(() => {
    async function load() {
      const { data: ag, error: agErr } = await supabase
        .from('age_groups')
        .select('*, tournaments(id, name, slug, sport, location, start_date, end_date)')
        .eq('id', ageGroupId)
        .single()
      if (agErr || !ag) { setLoadError('not_found'); setLoading(false); return }

      const [{ data: siblings }, { data: teams }, { data: fixtures }] = await Promise.all([
        supabase.from('age_groups').select('id, name').eq('tournament_id', ag.tournaments.id).order('name'),
        supabase.from('teams').select('id, name').eq('age_group_id', ageGroupId).eq('status', 'confirmed'),
        supabase
          .from('fixtures')
          .select('id, round, home_team_id, away_team_id, status, group_label, round_name, kickoff_time, home_placeholder, away_placeholder, pitch:pitches(id,name), home_team:teams!home_team_id(id,name), away_team:teams!away_team_id(id,name), stages!inner(age_group_id)')
          .eq('stages.age_group_id', ageGroupId)
          .order('kickoff_time', { ascending: true, nullsFirst: false }),
      ])

      const fixtureIds = (fixtures ?? []).map(f => f.id)
      const { data: results } = fixtureIds.length > 0
        ? await supabase.from('fixture_results').select('fixture_id, home_goals, away_goals, sport_data').in('fixture_id', fixtureIds)
        : { data: [] }

      // Sponsors — separate query so a missing DB migration doesn't break the page
      const { data: sponsorRow, error: sponsorErr } = await supabase
        .from('tournaments')
        .select('sponsors_label, sponsors')
        .eq('id', ag.tournaments.id)
        .single()
      const sponsorData = sponsorErr ? {} : (sponsorRow ?? {})

      setData({ ag, siblings: siblings ?? [], teams: teams ?? [], fixtures: fixtures ?? [], results: results ?? [], sponsorData })
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`overview-${ageGroupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixture_results' }, load)
      .subscribe()
    const poll = setInterval(load, 30000)
    return () => { supabase.removeChannel(channel); clearInterval(poll) }
  }, [ageGroupId])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (loadError === 'not_found') return <Navigate to={`/t/${slug}`} replace />
  if (!data?.ag) return <Navigate to={`/t/${slug}`} replace />

  const { ag, siblings, teams, fixtures, results, sponsorData } = data
  const tournament = ag.tournaments
  const sport = tournament.sport ?? 'football'
  const sportOpts = { rugbyPointsSystem: ag.rugby_points_system ?? '4_2_1', csSetTarget: ag.cs_set_target ?? 15 }

  const now = new Date()
  const resultMap = Object.fromEntries(results.map(r => [r.fixture_id, r]))
  const hasResults = results.length > 0
  const firstKickoff = fixtures
    .filter(f => f.kickoff_time)
    .reduce((min, f) => { const d = new Date(f.kickoff_time); return (!min || d < min) ? d : min }, null)
  const cutoffReached = firstKickoff && (firstKickoff - now) < 24 * 60 * 60 * 1000
  const tournamentEndDate = tournament.end_date ? new Date(tournament.end_date) : null
  const tournamentFinished = tournamentEndDate && now > tournamentEndDate
  const confirmedCount = teams.length
  const isFull = ag.max_teams && confirmedCount >= ag.max_teams
  const isRegOpen = ag.registration_open && !isFull && !cutoffReached && !hasResults && !tournamentFinished

  // Progress
  const playableFixtures = fixtures.filter(f => f.home_team?.id && f.away_team?.id)
  const completedFixtures = playableFixtures.filter(f => f.status === 'completed')
  const totalCount = fixtures.length
  const doneCount = completedFixtures.length
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const allMatchesPlayed = totalCount > 0 && doneCount === totalCount
  const shouldComputePodium = allMatchesPlayed

  // Live, upcoming, latest results
  const liveMatches = playableFixtures.filter(f => f.status === 'live')
  const latestResults = [...fixtures.filter(f => f.status === 'completed')]
    .sort((a, b) => {
      if (!a.kickoff_time && !b.kickoff_time) return 0
      if (!a.kickoff_time) return 1; if (!b.kickoff_time) return -1
      return new Date(b.kickoff_time) - new Date(a.kickoff_time)
    })
    .slice(0, 5)
  // Use last completed kickoff as the cutoff so "Up Next" advances by results,
  // not by clock — games show once the previous slot's results are posted.
  const completedWithKickoff = completedFixtures.filter(f => f.kickoff_time)
  const lastCompletedKickoff = completedWithKickoff.length > 0
    ? new Date(Math.max(...completedWithKickoff.map(f => new Date(f.kickoff_time).getTime())))
    : null
  const upcomingCutoff = lastCompletedKickoff ?? now
  const upcomingMatches = fixtures
    .filter(f => f.status !== 'completed' && f.status !== 'live' && f.status !== 'postponed')
    .filter(f => {
      // Unresolved playoff slots: always show regardless of kickoff time
      if (!f.group_label && (f.home_placeholder || f.away_placeholder)) return true
      // Hide anything at or before the last completed slot (result-based, not clock-based)
      if (f.kickoff_time && new Date(f.kickoff_time) <= upcomingCutoff) return false
      if (f.group_label) return !!(f.home_team?.id && f.away_team?.id)
      return !!(f.home_team?.id && f.away_team?.id)
    })
    .slice(0, 5)

  // Group standings
  const groupFixtures = fixtures.filter(f => f.group_label)
  const groupLabels = [...new Set(groupFixtures.map(f => f.group_label))].sort()
  // For round-robin final podium: exclude knockout fixtures from standings
  const standingsFixtures = groupFixtures.length > 0 ? groupFixtures : fixtures
  const allStandings = calculateStandings(teams, standingsFixtures, results, sport, sportOpts)

  function groupStandings(label) {
    const gFixtures = fixtures.filter(f => f.group_label === label)
    const gTeamIds = new Set(gFixtures.flatMap(f => [f.home_team_id, f.away_team_id].filter(Boolean)))
    const gTeams = teams.filter(t => gTeamIds.has(t.id))
    return calculateStandings(gTeams, gFixtures, results, sport, sportOpts)
  }

  // Final standings: all KO positions, or top 5 for round-robin
  const knockoutFixtures = fixtures.filter(f => !f.group_label && f.home_team?.id && f.away_team?.id)
  const hasKnockout = ag.format !== 'round_robin' && knockoutFixtures.length > 0

  const MEDALS = ['🥇', '🥈', '🥉']
  let finalPodium = [] // [{pos, team|null, medal}]
  if (shouldComputePodium) {
    if (hasKnockout) {
      const is3rdPlace = f =>
        f.round_name === '3rd_place' || f.round_name === '3rd Place' || f.round_name === '3rd place' ||
        f.home_placeholder?.toLowerCase().includes('loser') ||
        f.away_placeholder?.toLowerCase().includes('loser')
      const thirdFx = knockoutFixtures.find(is3rdPlace)
      const finalFx = knockoutFixtures.find(f => f.round_name === 'Final' || f.round_name === 'final') ??
        knockoutFixtures.filter(f => !is3rdPlace(f)).at(-1) ?? null

      if (finalFx?.status === 'completed') {
        const r = resultMap[finalFx.id]
        if (r) {
          const homeWon = r.home_goals > r.away_goals
          finalPodium.push({ pos: 1, team: homeWon ? finalFx.home_team : finalFx.away_team, medal: '🥇' })
          finalPodium.push({ pos: 2, team: homeWon ? finalFx.away_team : finalFx.home_team, medal: '🥈' })
        }
      }
      if (thirdFx?.status === 'completed') {
        const r = resultMap[thirdFx.id]
        if (r) {
          const homeWon = r.home_goals > r.away_goals
          finalPodium.push({ pos: 3, team: homeWon ? thirdFx.home_team : thirdFx.away_team, medal: '🥉' })
        }
      } else if (finalPodium.length === 2) {
        // No 3rd place match — find semi-final losers as joint 3rd
        const podiumIds = new Set(finalPodium.map(p => p.team?.id))
        const semiLosers = knockoutFixtures
          .filter(f => f.id !== finalFx?.id && !is3rdPlace(f) && f.status === 'completed' && !podiumIds.has(f.home_team?.id) && !podiumIds.has(f.away_team?.id))
          .flatMap(f => {
            const r = resultMap[f.id]
            if (!r) return []
            const homeWon = r.home_goals > r.away_goals
            return [homeWon ? f.away_team : f.home_team]
          })
          .filter(Boolean)
        if (semiLosers[0]) finalPodium.push({ pos: 3, team: semiLosers[0], medal: '🥉' })
      }
      // Always pad to exactly 3 slots so 3rd shows as empty when not yet decided
      while (finalPodium.length < 3) {
        const pos = finalPodium.length + 1
        finalPodium.push({ pos, team: null, medal: MEDALS[pos - 1] })
      }
    } else if (allStandings.length > 0) {
      // Round-robin only: top 3, pad with null slots for missing positions
      finalPodium = [0, 1, 2].map(i => ({
        pos: i + 1,
        team: allStandings[i]?.team ?? null,
        medal: MEDALS[i],
        points: allStandings[i]?.points,
      }))
    }
  }

  const scoreStr = (fixtureId) => {
    const r = resultMap[fixtureId]
    return r ? `${r.home_goals} – ${r.away_goals}` : '– – –'
  }

  const matchRowStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '0.5rem', padding: '0.5rem 0.75rem',
    borderBottom: '1px solid var(--color-border)',
    fontSize: '0.85rem',
  }
  const teamNameStyle = { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

  return (
    <div>
      <PublicNav tournament={tournament} ageGroups={siblings} activeAgeGroupId={ageGroupId} showRegister={isRegOpen} showPlayoff={ag.format === 'group_knockout' || ag.format === 'knockout'} />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>

        {/* Registration CTA */}
        {isRegOpen && (
          <Link
            to={`/t/${slug}/register`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '1rem', flexWrap: 'wrap', textDecoration: 'none',
              background: 'rgba(240,165,0,0.08)',
              border: '1px solid rgba(240,165,0,0.3)',
              borderRadius: '10px', padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-accent)', marginBottom: '0.2rem' }}>
                {t('overview.regOpen')}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                {t('overview.regOpenHint')}
              </div>
            </div>
            <span style={{
              flexShrink: 0, padding: '0.5rem 1.25rem',
              background: 'var(--color-accent)', color: '#0a1628',
              borderRadius: '6px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem',
            }}>
              {t('overview.regBtn')}
            </span>
          </Link>
        )}

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 4vw, 2.25rem)', margin: '0 0 0.5rem', lineHeight: 1.15 }}>
            {tournament.name}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            {(tournament.start_date || tournament.end_date) && (
              <span>
                📅 {tournament.start_date ? formatDate(parseISO(tournament.start_date)) : ''}
                {tournament.end_date && tournament.end_date !== tournament.start_date
                  ? ` – ${formatDate(parseISO(tournament.end_date))}`
                  : ''}
              </span>
            )}
            {tournament.location && <span>📍 {tournament.location}</span>}
            {siblings.length > 1 && (
              <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{ag.name}</span>
            )}
          </div>
        </div>

        {/* Sponsors */}
        {sponsorData.sponsors?.length > 0 && (
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            {sponsorData.sponsors_label && (
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                {sponsorData.sponsors_label}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', justifyContent: 'center', alignItems: 'center', maxWidth: '720px', margin: '0 auto' }}>
              {sponsorData.sponsors.map((s, i) => {
                const logoUrl = supabase.storage.from('tournament-logos').getPublicUrl(s.logo_path).data.publicUrl
                const inner = (
                  <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: '8px', padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', minWidth: '80px', maxWidth: '160px', transition: 'opacity 0.15s' }}>
                    <img src={logoUrl} alt={s.name || 'Sponsor'} style={{ height: '52px', maxWidth: '130px', objectFit: 'contain', display: 'block' }} />
                    {s.name && (
                      <div style={{ fontSize: '0.62rem', color: '#333', fontWeight: 600, marginTop: '0.1rem', textAlign: 'center', lineHeight: 1.3 }}>{s.name}</div>
                    )}
                  </div>
                )
                return s.website ? (
                  <a key={i} href={s.website} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }} onMouseEnter={e => e.currentTarget.querySelector('div').style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.querySelector('div').style.opacity = '1'}>
                    {inner}
                  </a>
                ) : (
                  <div key={i}>{inner}</div>
                )
              })}
            </div>
          </div>
        )}

        {/* Final podium — shown when all matches played or end date passed */}
        {shouldComputePodium && finalPodium.some(p => p.team) && (() => {
          const platH   = ['5rem', '3.5rem', '2.25rem']
          const platC   = [
            { bg: 'rgba(240,165,0,0.18)',   border: 'rgba(240,165,0,0.55)',   txt: '#f0a500' },
            { bg: 'rgba(180,180,200,0.12)', border: 'rgba(180,180,200,0.4)',  txt: '#a8a8c0' },
            { bg: 'rgba(160,100,50,0.12)',  border: 'rgba(160,100,50,0.38)', txt: '#b07840' },
          ]
          return (
            <div className="card" style={{ marginBottom: '1.75rem', background: 'linear-gradient(135deg, rgba(240,165,0,0.06) 0%, rgba(240,165,0,0.01) 100%)', borderColor: 'rgba(240,165,0,0.22)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '1.5rem' }}>
                {t('overview.finalStandings')}
              </div>
              {/* 2nd | 1st | 3rd */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                {[1, 0, 2].map(idx => {
                  const entry = finalPodium[idx]
                  if (!entry) return null
                  const c = platC[idx]
                  const isFirst = idx === 0
                  return (
                    <div key={entry.pos} style={{ flex: '1 1 0', maxWidth: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                      <span style={{ fontSize: isFirst ? '2rem' : '1.5rem', lineHeight: 1, display: 'block', marginBottom: '0.3rem' }}>{entry.medal}</span>
                      <div style={{
                        fontSize: isFirst ? '0.88rem' : '0.78rem', fontWeight: isFirst ? 700 : 500,
                        color: entry.team ? 'var(--color-text)' : 'var(--color-text-muted)',
                        lineHeight: 1.3, minHeight: '2.4rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 0.25rem',
                      }}>
                        {entry.team
                          ? <Link to={`/t/${slug}/${ageGroupId}/teams/${entry.team.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{entry.team.name}</Link>
                          : <span style={{ opacity: 0.35, fontSize: '1.25rem' }}>—</span>}
                      </div>
                      <div style={{ width: '100%', height: platH[idx], background: c.bg, border: `1px solid ${c.border}`, borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: c.txt }}>{entry.pos}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Link to={`/t/${slug}/${ageGroupId}`} style={{ color: 'var(--color-accent)', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 500 }}>
                {t('overview.fullStandingsLink')} →
              </Link>
            </div>
          )
        })()}

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {t('overview.matchesPlayed', { done: doneCount, total: totalCount })}
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', color: doneCount === totalCount ? 'var(--color-success)' : 'var(--color-accent)' }}>
                {progressPct}%
              </span>
            </div>
            <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${progressPct}%`, height: '100%',
                background: doneCount === totalCount ? 'var(--color-success)' : 'var(--color-accent)',
                borderRadius: '3px', transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}

        {/* Live matches */}
        {liveMatches.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--color-live)' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-live)', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-live)', display: 'inline-block', animation: 'live-dot-pulse 2s ease-in-out infinite' }} />
              {t('standings.live')}
            </div>
            {liveMatches.map(f => (
              <div key={f.id} style={matchRowStyle}>
                <Link to={`/t/${slug}/${ageGroupId}/teams/${f.home_team.id}`} style={{ ...teamNameStyle, textDecoration: 'none', color: 'inherit' }}>{f.home_team.name}</Link>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-live)', flexShrink: 0 }}>{scoreStr(f.id)}</span>
                <Link to={`/t/${slug}/${ageGroupId}/teams/${f.away_team.id}`} style={{ ...teamNameStyle, textAlign: 'right', textDecoration: 'none', color: 'inherit' }}>{f.away_team.name}</Link>
              </div>
            ))}
          </div>
        )}

        {/* Latest results + Up next */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <style>{`
            @media (min-width: 640px) {
              .ovw-cols { grid-template-columns: 1fr 1fr !important; }
              .ovw-pitch-mob { display: none !important; }
              .ovw-pitch-col { display: inline !important; }
            }
            @media (max-width: 639px) {
              .ovw-pitch-col { display: none !important; }
              .ovw-pitch-mob { display: block !important; }
            }
          `}</style>
          <div className="ovw-cols" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>

            {/* Latest results */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                {t('overview.latestResults')}
              </div>
              {latestResults.length === 0 ? (
                <div style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {t('overview.noResultsYet')}
                </div>
              ) : (
                latestResults.map(f => {
                  const phStyle = { color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }
                  return (
                    <div key={f.id} style={matchRowStyle}>
                      {f.home_team?.id
                        ? <Link to={`/t/${slug}/${ageGroupId}/teams/${f.home_team.id}`} style={{ ...teamNameStyle, textDecoration: 'none', color: 'inherit' }}>{f.home_team.name}</Link>
                        : <span style={{ ...teamNameStyle, ...phStyle }}>{f.home_placeholder || '?'}</span>}
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: 'var(--color-text)', flexShrink: 0 }}>{scoreStr(f.id)}</span>
                      {f.away_team?.id
                        ? <Link to={`/t/${slug}/${ageGroupId}/teams/${f.away_team.id}`} style={{ ...teamNameStyle, textAlign: 'right', textDecoration: 'none', color: 'inherit' }}>{f.away_team.name}</Link>
                        : <span style={{ ...teamNameStyle, textAlign: 'right', ...phStyle }}>{f.away_placeholder || '?'}</span>}
                    </div>
                  )
                })
              )}
              {doneCount > 5 && (
                <Link to={`/t/${slug}/${ageGroupId}/fixtures`} style={{ display: 'block', padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: 'var(--color-accent)', textDecoration: 'none', borderTop: '1px solid var(--color-border)' }}>
                  {t('overview.allResults')} →
                </Link>
              )}
            </div>

            {/* Up next */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                {t('overview.upNext')}
              </div>
              {upcomingMatches.length === 0 ? (
                <div style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {doneCount === totalCount && totalCount > 0 ? t('overview.allDone') : t('overview.noUpcoming')}
                </div>
              ) : (
                upcomingMatches.map(f => {
                  const homeName = f.home_team?.name || f.home_placeholder || '?'
                  const awayName = f.away_team?.name || f.away_placeholder || '?'
                  const phStyle = { ...teamNameStyle, color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }
                  return (
                    <div key={f.id} style={matchRowStyle}>
                      {f.home_team?.id
                        ? <Link to={`/t/${slug}/${ageGroupId}/teams/${f.home_team.id}`} style={{ ...teamNameStyle, textDecoration: 'none', color: 'inherit' }}>{homeName}</Link>
                        : <span style={phStyle}>{homeName}</span>}
                      <span style={{ flexShrink: 0, textAlign: 'center', minWidth: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                          {f.kickoff_time ? formatTime(new Date(f.kickoff_time)) : 'vs'}
                        </span>
                        {f.pitch?.name && (
                          <span className="ovw-pitch-mob" style={{ fontSize: '0.62rem', color: 'var(--color-accent)', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            {f.pitch.name}
                          </span>
                        )}
                      </span>
                      {f.away_team?.id
                        ? <Link to={`/t/${slug}/${ageGroupId}/teams/${f.away_team.id}`} style={{ ...teamNameStyle, textAlign: 'right', textDecoration: 'none', color: 'inherit' }}>{awayName}</Link>
                        : <span style={{ ...phStyle, textAlign: 'right' }}>{awayName}</span>}
                      {f.pitch?.name && (
                        <span className="ovw-pitch-col" style={{ flexShrink: 0, fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'right', minWidth: '72px' }}>
                          {f.pitch.name}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Group standings (condensed) */}
        {groupLabels.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              {t('overview.groupStandings')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {groupLabels.map(label => {
                const rows = groupStandings(label)
                return (
                  <div key={label} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-heading)', fontSize: '0.82rem', color: 'var(--color-accent)' }}>
                      {t('standings.group')} {label}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                          <th style={{ padding: '0.3rem 0.75rem', textAlign: 'left', fontWeight: 500 }}>#</th>
                          <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left', fontWeight: 500 }}>{t('standings.team')}</th>
                          <th style={{ padding: '0.3rem 0.5rem', textAlign: 'center', fontWeight: 500 }}>P</th>
                          <th style={{ padding: '0.3rem 0.5rem', textAlign: 'center', fontWeight: 500 }}>W</th>
                          <th style={{ padding: '0.3rem 0.5rem', textAlign: 'center', fontWeight: 500 }}>L</th>
                          <th style={{ padding: '0.3rem 0.75rem', textAlign: 'center', fontWeight: 500, color: 'var(--color-accent)' }}>{t('standings.points')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={row.team.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.4rem 0.75rem', color: 'var(--color-text-muted)' }}>{i + 1}</td>
                            <td style={{ padding: '0.4rem 0.5rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <Link to={`/t/${slug}/${ageGroupId}/teams/${row.team.id}`} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>{row.team.name}</Link>
                            </td>
                            <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.played}</td>
                            <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.won}</td>
                            <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.lost}</td>
                            <td style={{ padding: '0.4rem 0.75rem', textAlign: 'center', fontFamily: 'var(--font-heading)', color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>{row.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No groups — full standings (condensed) */}
        {groupLabels.length === 0 && allStandings.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-heading)', fontSize: '0.82rem', color: 'var(--color-accent)' }}>
              {t('standings.title')}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                  <th style={{ padding: '0.3rem 0.75rem', textAlign: 'left', fontWeight: 500 }}>#</th>
                  <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left', fontWeight: 500 }}>{t('standings.team')}</th>
                  <th style={{ padding: '0.3rem 0.5rem', textAlign: 'center', fontWeight: 500 }}>P</th>
                  <th style={{ padding: '0.3rem 0.5rem', textAlign: 'center', fontWeight: 500 }}>W</th>
                  <th style={{ padding: '0.3rem 0.5rem', textAlign: 'center', fontWeight: 500 }}>L</th>
                  <th style={{ padding: '0.3rem 0.75rem', textAlign: 'center', fontWeight: 500, color: 'var(--color-accent)' }}>{t('standings.points')}</th>
                </tr>
              </thead>
              <tbody>
                {allStandings.map((row, i) => (
                  <tr key={row.team.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.4rem 0.75rem', color: 'var(--color-text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <Link to={`/t/${slug}/${ageGroupId}/teams/${row.team.id}`} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>{row.team.name}</Link>
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.played}</td>
                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.won}</td>
                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.lost}</td>
                    <td style={{ padding: '0.4rem 0.75rem', textAlign: 'center', fontFamily: 'var(--font-heading)', color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to={`/t/${slug}/${ageGroupId}`} className="btn-secondary btn-sm">{t('nav.standings')} →</Link>
          <Link to={`/t/${slug}/${ageGroupId}/fixtures`} className="btn-secondary btn-sm">{t('nav.schedule')} →</Link>
        </div>

      </div>
      <Footer slim />
    </div>
  )
}
