import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDate, formatTime } from '../../utils/dateFormat'
import { formatBeachScore } from '../../utils/beachVolleyball'
import { supabase } from '../../lib/supabase'
import { calculateStandings } from '../../utils/standings'
import PublicNav from '../../components/PublicNav'
import ClassFilter from '../../components/ClassFilter'
import { useSEO } from '../../hooks/useSEO'
import DoubleEliminationBracket from '../../components/DoubleEliminationBracket'

export default function Standings() {
  const { slug, ageGroup: ageGroupId } = useParams()
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [realtimeStatus, setRealtimeStatus] = useState('connecting')
  const [copied, setCopied] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const _rawAgeGroupId = searchParams.get('ageGroupId') || null
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const selectedAgeGroupId = (_rawAgeGroupId && UUID_RE.test(_rawAgeGroupId)) ? _rawAgeGroupId : null

  const seoTitle = data?.ag
    ? `${data.ag.tournaments.name} — ${data.ag.name} Standings`
    : 'Tournament Standings'
  const teamCount = data?.teams?.length ?? 0
  const seoDesc = data?.ag
    ? `Live ${data.ag.tournaments.name} standings — ${data.ag.name}. Track points, wins, draws, goal difference, and goals scored. Updated in real time after every match.`
    : 'Live tournament standings with points, goal difference, and head-to-head tiebreakers. Updated in real time after every match.'
  const seoSchema = data?.ag ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SportsEvent',
        '@id': `https://www.fixturday.com/t/${slug}/${ageGroupId}#event`,
        name: `${data.ag.tournaments.name} — ${data.ag.name}`,
        url: `https://www.fixturday.com/t/${slug}/${ageGroupId}`,
        sport: 'Football',
        organizer: { '@type': 'Organization', name: 'Fixturday', url: 'https://www.fixturday.com' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Fixturday', item: 'https://www.fixturday.com' },
          { '@type': 'ListItem', position: 2, name: 'Tournaments', item: 'https://www.fixturday.com/tournaments' },
          { '@type': 'ListItem', position: 3, name: data.ag.tournaments.name, item: `https://www.fixturday.com/t/${slug}` },
          { '@type': 'ListItem', position: 4, name: `${data.ag.name} Standings`, item: `https://www.fixturday.com/t/${slug}/${ageGroupId}` },
        ],
      },
    ],
  } : null
  useSEO({ title: seoTitle, description: seoDesc, path: `/t/${slug}/${ageGroupId}`, schema: seoSchema })

  function handleFilterChange(id) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (id) next.set('ageGroupId', id)
      else next.delete('ageGroupId')
      return next
    })
  }

  useEffect(() => {
    async function load() {
      const effectiveId = selectedAgeGroupId ?? ageGroupId

      // Age group always loads from the URL param — not the filter override
      const { data: ag, error: agErr } = await supabase
        .from('age_groups')
        .select('*, tournaments(id, name, slug, sport, location, start_date, end_date)')
        .eq('id', ageGroupId)
        .single()

      if (agErr) {
        setLoadError(agErr.code === 'PGRST116' ? 'not_found' : 'network')
        setLoading(false)
        return
      }
      if (!ag) { setLoadError('not_found'); setLoading(false); return }

      const [{ data: siblings, error: sibErr }, { data: teams, error: tmErr }, { data: fixtures, error: fxErr }] = await Promise.all([
        supabase.from('age_groups').select('id, name').eq('tournament_id', ag.tournaments.id).order('name'),
        supabase.from('teams').select('id, name').eq('age_group_id', effectiveId).eq('status', 'confirmed'),
        supabase.from('fixtures')
          .select('id, round, home_team_id, away_team_id, status, group_label, round_name, home_placeholder, away_placeholder, kickoff_time, home_team:teams!home_team_id(id,name), away_team:teams!away_team_id(id,name), pitch:pitches(name), stages!inner(age_group_id, type, bracket)')
          .eq('stages.age_group_id', effectiveId),
      ])
      if (sibErr || tmErr || fxErr) { setLoadError('network'); setLoading(false); return }

      // Scope results to only this age group's fixture IDs
      const fixtureIds = (fixtures ?? []).map(f => f.id)
      const { data: results, error: resErr } = fixtureIds.length > 0
        ? await supabase.from('fixture_results').select('*').in('fixture_id', fixtureIds)
        : { data: [], error: null }
      if (resErr) { setLoadError('network'); setLoading(false); return }

      setLoadError(null)
      setData({ ag, siblings: siblings ?? [], teams: teams ?? [], fixtures: fixtures ?? [], results: results ?? [] })
      setLastUpdated(new Date())
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`standings-${ageGroupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixture_results' }, () => load())
      .subscribe(status => {
        setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected')
      })

    const poll = setInterval(load, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [ageGroupId, selectedAgeGroupId])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (loadError === 'not_found') return <Navigate to={`/t/${slug}`} replace />
  if (loadError === 'network') return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <PublicNav />
      <div style={{ padding: '4rem 1.25rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        {t('common.error')}
      </div>
    </div>
  )
  if (!data?.ag) return <Navigate to={`/t/${slug}`} replace />

  const { ag, siblings, teams, fixtures, results } = data
  const tournament = ag.tournaments
  const tournamentSport = tournament.sport ?? 'football'
  const isSetBased = isSetBased || tournamentSport === 'catch_serve'
  const standings = calculateStandings(teams, fixtures, results, tournamentSport)

  const now = new Date()

  // Registration is open only if: manual flag on, division not full, no results yet, >24h before first kickoff, tournament not finished
  const confirmedCount = teams.length
  const isFull = ag.max_teams && confirmedCount >= ag.max_teams
  const firstKickoff = fixtures
    .filter(f => f.kickoff_time)
    .reduce((min, f) => { const d = new Date(f.kickoff_time); return (!min || d < min) ? d : min }, null)
  const cutoffReached = firstKickoff && (firstKickoff - now) < 24 * 60 * 60 * 1000
  const hasResults = results.length > 0
  const tournamentEndDate = tournament.end_date ? new Date(tournament.end_date) : (tournament.start_date ? new Date(tournament.start_date) : null)
  const tournamentFinished = tournamentEndDate && now > tournamentEndDate
  const isRegOpen = ag.registration_open && !isFull && !cutoffReached && !hasResults && !tournamentFinished

  const nextFixture = fixtures
    .filter(f => f.status !== 'completed' && f.home_team?.id && f.away_team?.id)
    .filter(f => !f.kickoff_time || new Date(f.kickoff_time) >= now)
    .sort((a, b) => {
      if (!a.kickoff_time && !b.kickoff_time) return (a.round ?? 0) - (b.round ?? 0)
      if (!a.kickoff_time) return 1
      if (!b.kickoff_time) return -1
      return new Date(a.kickoff_time) - new Date(b.kickoff_time)
    })[0] ?? null

  async function handleShare() {
    const url = window.location.href
    const title = `${tournament.name} — ${ag.name}`
    if (navigator.share) {
      try { await navigator.share({ title, url }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {}
    }
  }

  // Group-knockout: derive per-group data
  const groupFixtures = fixtures.filter(f => f.group_label)
  const groupLabels = [...new Set(groupFixtures.map(f => f.group_label))].sort()
  const knockoutFixtures = fixtures.filter(f => !f.group_label)
  const hasKnockoutFixtures = knockoutFixtures.length > 0

  function resolveRoundName(matches) {
    const rn = matches[0]?.round_name
    if (rn === '3rd_place') return t('playoff.thirdPlace')
    if (rn) return rn
    return matches.length === 1 ? t('playoff.final')
      : matches.length === 2 ? t('playoff.semiFinal')
      : matches.length === 4 ? t('playoff.quarterFinal')
      : t('standings.knockoutPhase')
  }

  // Group knockout fixtures by round number; split rounds that mix 3rd-place and final
  const knockoutByRound = knockoutFixtures.reduce((acc, f) => {
    const key = f.round ?? 999
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})
  const knockoutRoundList = Object.entries(knockoutByRound)
    .sort(([a], [b]) => Number(a) - Number(b))
    .flatMap(([, matches]) => {
      const named = matches.filter(f => f.round_name)
      const unnamed = matches.filter(f => !f.round_name)
      if (named.length > 0 && unnamed.length > 0) {
        return [
          { roundName: resolveRoundName(named), matches: named },
          { roundName: resolveRoundName(unnamed), matches: unnamed },
        ]
      }
      // Fallback for older data where round_name was not persisted:
      // detect the 3rd-place fixture by its placeholder text ('zaudētājs' = loser)
      const is3rd = f => f.home_placeholder?.includes('zaudētājs') || f.away_placeholder?.includes('zaudētājs')
      const thirdPlace = matches.filter(is3rd)
      const finals = matches.filter(f => !is3rd(f))
      if (thirdPlace.length > 0 && finals.length > 0) {
        return [
          { roundName: t('playoff.thirdPlace'), matches: thirdPlace },
          { roundName: t('playoff.final'), matches: finals },
        ]
      }
      return [{ roundName: resolveRoundName(matches), matches }]
    })

  // Derive how many teams advance from each group from knockout placeholder labels
  // e.g. "Group A-1", "Group B-2" → Group A: 1 advancing, Group B: 2 advancing
  const advancingCountMap = {}
  knockoutFixtures.forEach(f => {
    [f.home_placeholder, f.away_placeholder].forEach(p => {
      if (!p) return
      const m = p.match(/Group\s+([A-Z])-(\d+)/i)
      if (m) {
        const grp = m[1].toUpperCase()
        const rank = parseInt(m[2])
        if (!advancingCountMap[grp] || rank > advancingCountMap[grp]) {
          advancingCountMap[grp] = rank
        }
      }
    })
  })
  const allAdvVals = Object.values(advancingCountMap)
  const defaultAdvancing = allAdvVals.length > 0 && allAdvVals.every(v => v === allAdvVals[0])
    ? allAdvVals[0]
    : null

  return (
    <div>
      <PublicNav tournament={tournament} ageGroups={siblings} activeAgeGroupId={ageGroupId} showRegister={isRegOpen} />
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        {tournament.location && (
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            📍 {tournament.location}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 4vw, 2rem)', margin: 0 }}>{tournament.name} — {ag.name} {t('standings.title')}</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              fontSize: '0.72rem', fontFamily: 'var(--font-heading)', fontWeight: 600,
              color: realtimeStatus === 'connected' ? 'var(--color-live)' : 'var(--color-text-muted)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                background: realtimeStatus === 'connected' ? 'var(--color-live)' : 'var(--color-text-muted)',
                boxShadow: realtimeStatus === 'connected' ? '0 0 8px var(--color-live)' : 'none',
                animation: realtimeStatus === 'connected' ? 'live-dot-pulse 2s ease-in-out infinite' : 'none',
              }} />
              {realtimeStatus === 'connected'
                ? t('standings.live')
                : lastUpdated
                  ? t('common.lastUpdated', { time: formatTime(lastUpdated) })
                  : t('standings.connecting')}
            </span>
            <Link to={`/t/${slug}/${ageGroupId}/fixtures`} className="btn-secondary btn-sm">
              {t('standings.scheduleLink')}
            </Link>
            <button
              onClick={handleShare}
              className="btn-secondary btn-sm"
              style={{ cursor: 'pointer' }}
            >
              {copied ? t('standings.shareCopied') : t('standings.share')}
            </button>
          </div>
        </div>

        {isRegOpen && (
          <Link
            to={`/t/${slug}/register`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '1rem', flexWrap: 'wrap', textDecoration: 'none',
              background: 'rgba(240,165,0,0.08)',
              border: '1px solid rgba(240,165,0,0.3)',
              borderLeft: '3px solid var(--color-accent)',
              borderRadius: '8px', padding: '0.875rem 1.25rem', marginBottom: '1rem',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('public.regOpen')}
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                {t('public.regBannerText')}
              </div>
            </div>
            <span style={{
              background: 'var(--color-accent)', color: '#0a1628',
              fontFamily: 'var(--font-heading)', fontWeight: 700,
              fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase',
              padding: '0.5rem 1.1rem', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {t('public.regBannerCta')} →
            </span>
          </Link>
        )}

        <div style={{ position: 'sticky', top: 0, background: 'var(--color-bg)', paddingTop: '0.5rem', paddingBottom: '0.5rem', marginBottom: '0.75rem', zIndex: 10 }}>
          <ClassFilter
            tournamentId={tournament.id}
            value={selectedAgeGroupId ?? ageGroupId}
            onChange={handleFilterChange}
            showAll={false}
          />
        </div>

        {nextFixture && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
            background: 'rgba(240,165,0,0.07)', border: '1px solid rgba(240,165,0,0.18)',
            borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1.25rem',
          }}>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-heading)', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
              {t('standings.nextMatch')}
            </span>
            <span style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
              <strong>{nextFixture.home_team.name}</strong>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{t('fixture.vs')}</span>
              <strong>{nextFixture.away_team.name}</strong>
            </span>
            {(nextFixture.kickoff_time || nextFixture.pitch?.name) && (
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', flexShrink: 0 }}>
                {nextFixture.kickoff_time && formatTime(new Date(nextFixture.kickoff_time))}
                {nextFixture.kickoff_time && nextFixture.pitch?.name && ' · '}
                {nextFixture.pitch?.name}
              </span>
            )}
          </div>
        )}

        {isSetBased && ag.format !== 'double_elimination' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.875rem' }}>
            {[
              [t('standings.setsWon'),       t('standings.setsWonFull')],
              [t('standings.setsAgainst'),    t('standings.setsAgainstFull')],
              [t('standings.setRatio'),       t('standings.setRatioFull')],
              [t('standings.pointsWon'),      t('standings.pointsWonFull')],
              [t('standings.pointsAgainst'),  t('standings.pointsAgainstFull')],
              [t('standings.pointRatio'),     t('standings.pointRatioFull')],
            ].map(([abbr, full]) => (
              <span key={abbr} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                background: 'rgba(148,163,184,0.06)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: '4px',
                padding: '0.18rem 0.5rem',
                fontSize: '0.7rem',
              }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>{abbr}</span>
                <span style={{ color: 'rgba(148,163,184,0.45)' }}>{full}</span>
              </span>
            ))}
          </div>
        )}

        {ag.format === 'double_elimination' ? (
          fixtures.filter(f => f.stages?.bracket).length === 0
            ? <p style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</p>
            : <DoubleEliminationBracket fixtures={fixtures} results={results} tournamentSport={tournamentSport} />
        ) : standings.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('standings.noTeams')}</p>
        ) : ag.format === 'group_knockout' ? (
          <>
            {groupLabels.map(label => {
              const groupTeamIds = new Set()
              groupFixtures
                .filter(f => f.group_label === label)
                .forEach(f => { groupTeamIds.add(f.home_team_id); groupTeamIds.add(f.away_team_id) })
              const groupTeams = teams.filter(t => groupTeamIds.has(t.id))
              const groupStandings = calculateStandings(
                groupTeams,
                groupFixtures.filter(f => f.group_label === label),
                results,
                tournamentSport
              )
              return (
                <div key={label} style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
                    {t('standings.group')} {label}
                  </h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table-clean" style={{ tableLayout: 'fixed', minWidth: isSetBased ? 540 : 420 }}>
                      <colgroup>
                        <col style={{ width: 28 }} /><col style={{ width: 170 }} />
                        <col style={{ width: 32 }} /><col style={{ width: 32 }} />
                        {isSetBased ? (
                          <><col style={{ width: 32 }} /><col style={{ width: 32 }} /><col style={{ width: 32 }} /><col style={{ width: 44 }} /><col style={{ width: 36 }} /><col style={{ width: 36 }} /><col style={{ width: 52 }} /></>
                        ) : (
                          <><col style={{ width: 36 }} /><col style={{ width: 36 }} /><col style={{ width: 40 }} /><col style={{ width: 40 }} /><col style={{ width: 44 }} /><col style={{ width: 44 }} /></>
                        )}
                      </colgroup>
                      <thead>
                        <tr>
                          <th>#</th><th>{t('standings.team')}</th><th title="Played">{t('standings.played')}</th><th title="Won">{t('standings.won')}</th>
                          {isSetBased ? (
                            <><th title="Lost">{t('standings.lost')}</th><th title="Sets Won">{t('standings.setsWon')}</th><th title="Sets Lost">{t('standings.setsAgainst')}</th><th title="Set Ratio (SW÷SL)">{t('standings.setRatio')}</th><th title="Points Won">{t('standings.pointsWon')}</th><th title="Points Lost">{t('standings.pointsAgainst')}</th><th title="Point Ratio (PW÷PL)">{t('standings.pointRatio')}</th></>
                          ) : (
                            <><th>{t('standings.drawn')}</th><th>{t('standings.lost')}</th><th>{t('standings.gf')}</th><th>{t('standings.ga')}</th><th>{t('standings.gd')}</th><th>{t('standings.points')}</th></>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {groupStandings.flatMap((row, i) => {
                          const advCount = advancingCountMap[label] ?? defaultAdvancing
                          const isAdvancing = advCount != null && i < advCount
                          const isLastAdvancing = advCount != null && i === advCount - 1 && i < groupStandings.length - 1
                          const rankColor = i === 0 ? '#f0a500' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--color-text-muted)'
                          const rows = [
                            <tr key={row.team.id}>
                              <td style={{ color: rankColor, fontWeight: i < 3 ? 700 : 400, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                {i + 1}
                                {isAdvancing && (
                                  <span title="Advances to knockout" style={{ marginLeft: 3, color: 'var(--color-success)', fontSize: '0.6rem', verticalAlign: 'super', lineHeight: 1 }}>▲</span>
                                )}
                              </td>
                              <td>
                                <Link to={`/t/${slug}/${ageGroupId}/teams/${row.team.id}`} style={{ color: 'var(--color-accent)' }}>
                                  {row.team.name}
                                </Link>
                              </td>
                              <td>{row.played}</td>
                              <td>{row.won}</td>
                              {isSetBased ? (
                                <>
                                  <td>{row.lost}</td>
                                  <td>{row.sets_won ?? 0}</td>
                                  <td>{row.sets_lost ?? 0}</td>
                                  <td>{row.sets_lost > 0 ? (row.sets_won / row.sets_lost).toFixed(3) : (row.sets_won > 0 ? '∞' : '—')}</td>
                                  <td>{row.points_won ?? 0}</td>
                                  <td>{row.points_against ?? 0}</td>
                                  <td><strong>{row.points_against > 0 ? (row.points_won / row.points_against).toFixed(3) : (row.points_won > 0 ? '∞' : '—')}</strong></td>
                                </>
                              ) : (
                                <>
                                  <td>{row.drawn}</td>
                                  <td>{row.lost}</td>
                                  <td>{row.gf}</td>
                                  <td>{row.ga}</td>
                                  <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                                  <td><strong>{row.points}</strong></td>
                                </>
                              )}
                            </tr>
                          ]
                          if (isLastAdvancing) {
                            rows.push(
                              <tr key={`adv-sep-${label}`}>
                                <td colSpan={isSetBased ? 11 : 10}
                                  style={{ padding: 0, height: 2, background: 'rgba(34,197,94,0.28)', border: 'none', borderBottom: 'none' }} />
                              </tr>
                            )
                          }
                          return rows
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
            {hasKnockoutFixtures && (
              <div style={{ marginTop: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                  {t('standings.knockoutPhase')}
                </h2>
                {knockoutRoundList.map(({ roundName, matches }, idx) => (
                  <div key={idx} style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                      {roundName}
                    </h3>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {matches.map(f => {
                        const result = results.find(r => r.fixture_id === f.id)
                        const homeName = f.home_team?.name ?? f.home_placeholder ?? '?'
                        const awayName = f.away_team?.name ?? f.away_placeholder ?? '?'
                        const homeWon = result && result.home_goals > result.away_goals
                        const awayWon = result && result.away_goals > result.home_goals
                        const scoreDisplay = result
                          ? isSetBased
                            ? formatBeachScore(result.sport_data)
                            : `${result.home_goals} : ${result.away_goals}`
                          : f.home_team ? t('fixture.vs') : '—'
                        return (
                          <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}>
                            <span style={{ flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: homeWon ? 700 : 400, color: homeWon ? 'var(--color-accent)' : 'inherit' }}>{homeName}</span>
                            <span style={{ fontFamily: 'var(--font-heading)', fontSize: isSetBased ? '0.8rem' : '1.125rem', minWidth: isSetBased ? '8rem' : '4rem', textAlign: 'center', flexShrink: 0 }}>
                              {scoreDisplay}
                            </span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: awayWon ? 700 : 400, color: awayWon ? 'var(--color-accent)' : 'inherit' }}>{awayName}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-clean" style={{ tableLayout: 'fixed', minWidth: isSetBased ? 540 : 420 }}>
              <colgroup>
                <col style={{ width: 28 }} /><col style={{ width: 170 }} />
                <col style={{ width: 32 }} /><col style={{ width: 32 }} />
                {isSetBased ? (
                  <><col style={{ width: 32 }} /><col style={{ width: 32 }} /><col style={{ width: 32 }} /><col style={{ width: 44 }} /><col style={{ width: 36 }} /><col style={{ width: 36 }} /><col style={{ width: 52 }} /></>
                ) : (
                  <><col style={{ width: 36 }} /><col style={{ width: 36 }} /><col style={{ width: 40 }} /><col style={{ width: 40 }} /><col style={{ width: 44 }} /><col style={{ width: 44 }} /></>
                )}
              </colgroup>
              <thead>
                <tr>
                  <th>#</th><th>{t('standings.team')}</th><th title="Played">{t('standings.played')}</th><th title="Won">{t('standings.won')}</th>
                  {isSetBased ? (
                    <><th title="Lost">{t('standings.lost')}</th><th title="Sets Won">{t('standings.setsWon')}</th><th title="Sets Lost">{t('standings.setsAgainst')}</th><th title="Set Ratio (SW÷SL)">{t('standings.setRatio')}</th><th title="Points Won">{t('standings.pointsWon')}</th><th title="Points Lost">{t('standings.pointsAgainst')}</th><th title="Point Ratio (PW÷PL)">{t('standings.pointRatio')}</th></>
                  ) : (
                    <><th>{t('standings.drawn')}</th><th>{t('standings.lost')}</th><th>{t('standings.gf')}</th><th>{t('standings.ga')}</th><th>{t('standings.gd')}</th><th>{t('standings.points')}</th></>
                  )}
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => (
                  <tr key={row.team.id}>
                    <td style={{ color: i === 0 ? '#f0a500' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--color-text-muted)', fontWeight: i < 3 ? 700 : 400, fontSize: '0.82rem' }}>{i + 1}</td>
                    <td>
                      <Link to={`/t/${slug}/${ageGroupId}/teams/${row.team.id}`} style={{ color: 'var(--color-accent)' }}>
                        {row.team.name}
                      </Link>
                    </td>
                    <td>{row.played}</td>
                    <td>{row.won}</td>
                    {isSetBased ? (
                      <>
                        <td>{row.lost}</td>
                        <td>{row.sets_won ?? 0}</td>
                        <td>{row.sets_lost ?? 0}</td>
                        <td>{row.sets_lost > 0 ? (row.sets_won / row.sets_lost).toFixed(3) : (row.sets_won > 0 ? '∞' : '—')}</td>
                        <td>{row.points_won ?? 0}</td>
                        <td>{row.points_against ?? 0}</td>
                        <td><strong>{row.points_against > 0 ? (row.points_won / row.points_against).toFixed(3) : (row.points_won > 0 ? '∞' : '—')}</strong></td>
                      </>
                    ) : (
                      <>
                        <td>{row.drawn}</td>
                        <td>{row.lost}</td>
                        <td>{row.gf}</td>
                        <td>{row.ga}</td>
                        <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                        <td><strong>{row.points}</strong></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {teams.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
              {t('standings.teamsTitle')}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '0.625rem',
            }}>
              {teams.map(team => (
                <Link
                  key={team.id}
                  to={`/t/${slug}/${ageGroupId}/teams/${team.id}`}
                  style={{
                    display: 'block',
                    background: 'var(--color-surface)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {team.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
