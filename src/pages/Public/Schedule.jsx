import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { setWinner, getTargets } from '../../utils/catchServe'
import { format } from 'date-fns'
import { formatDate, formatTime } from '../../utils/dateFormat'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { useSEO } from '../../hooks/useSEO'

export default function Schedule() {
  const { t } = useTranslation()
  const { slug, ageGroup: ageGroupId } = useParams()
  const [ag, setAg] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [filter, setFilter] = useState('all')

  const seoTitle = ag ? `${ag.tournaments.name} — ${ag.name} Schedule` : 'Tournament Schedule'
  const seoDesc = ag
    ? `Full match schedule and results for ${ag.tournaments.name} — ${ag.name}. See kick-off times, pitch assignments, and live scores updated after every match.`
    : 'Full tournament match schedule with kick-off times, pitch assignments, and live scores. Results update automatically after every match.'
  const seoSchema = ag ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SportsEvent',
        '@id': `https://www.fixturday.com/t/${slug}/${ageGroupId}/schedule#event`,
        name: `${ag.tournaments.name} — ${ag.name}`,
        url: `https://www.fixturday.com/t/${slug}/${ageGroupId}/schedule`,
        sport: 'Football',
        organizer: { '@type': 'Organization', name: 'Fixturday', url: 'https://www.fixturday.com' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Fixturday', item: 'https://www.fixturday.com' },
          { '@type': 'ListItem', position: 2, name: 'Tournaments', item: 'https://www.fixturday.com/tournaments' },
          { '@type': 'ListItem', position: 3, name: ag.tournaments.name, item: `https://www.fixturday.com/t/${slug}` },
          { '@type': 'ListItem', position: 4, name: `${ag.name} Standings`, item: `https://www.fixturday.com/t/${slug}/${ageGroupId}` },
          { '@type': 'ListItem', position: 5, name: `${ag.name} Schedule`, item: `https://www.fixturday.com/t/${slug}/${ageGroupId}/schedule` },
        ],
      },
    ],
  } : null
  const ogImage = `https://www.fixturday.com/api/og?slug=${encodeURIComponent(slug)}&ag=${encodeURIComponent(ageGroupId)}&type=schedule`
  useSEO({ title: seoTitle, description: seoDesc, path: `/t/${slug}/${ageGroupId}/fixtures`, image: ogImage, schema: seoSchema })

  useEffect(() => {
    async function load() {
      const { data: agData, error: agErr } = await supabase
        .from('age_groups')
        .select('*, tournaments(id, name, slug, sport)')
        .eq('id', ageGroupId)
        .single()
      if (agErr) { setLoading(false); return }
      setAg(agData)

      if (agData?.tournaments?.id) {
        const { data: sibs, error: sibErr } = await supabase
          .from('age_groups').select('id, name')
          .eq('tournament_id', agData.tournaments.id).order('name')
        if (!sibErr) setSiblings(sibs ?? [])
      }

      const { data: fx, error: fxErr } = await supabase
        .from('fixtures')
        .select(`
          *, home_placeholder_label, away_placeholder_label,
          home_team:teams!home_team_id(id, name),
          away_team:teams!away_team_id(id, name),
          pitch:pitches(name),
          stages!inner(age_group_id)
        `)
        .eq('stages.age_group_id', ageGroupId)
        .order('kickoff_time', { ascending: true })
      if (fxErr) { setLoading(false); return }

      const fixtureList = fx ?? []
      let fixtureData = fixtureList.map(f => ({ ...f, fixture_results: [] }))

      if (fixtureList.length > 0) {
        const { data: results } = await supabase
          .from('fixture_results')
          .select('fixture_id, home_goals, away_goals, sport_data')
          .in('fixture_id', fixtureList.map(f => f.id))
        if (results?.length) {
          const resultMap = Object.fromEntries(results.map(r => [r.fixture_id, r]))
          fixtureData = fixtureList.map(f => ({
            ...f,
            fixture_results: resultMap[f.id] ? [resultMap[f.id]] : [],
          }))
        }
      }

      setFixtures(fixtureData)
      setLastUpdated(new Date())
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`schedule-${ageGroupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixture_results' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures' }, () => load())
      .subscribe()
    const poll = setInterval(load, 30000)
    return () => { supabase.removeChannel(channel); clearInterval(poll) }
  }, [ageGroupId])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (!ag) return <div className="loading">{t('common.error')}</div>

  const sport = ag.tournaments?.sport ?? 'football'
  const isBvb = sport === 'beach_volleyball' || sport === 'catch_serve'

  const now = new Date()
  const hasResults = fixtures.some(f => f.fixture_results?.length > 0)
  const firstKickoff = fixtures
    .filter(f => f.kickoff_time)
    .reduce((min, f) => { const d = new Date(f.kickoff_time); return (!min || d < min) ? d : min }, null)
  const cutoffReached = firstKickoff && (firstKickoff - now) < 24 * 60 * 60 * 1000
  const isRegOpen = ag.registration_open && !cutoffReached && !hasResults

  const liveCount     = fixtures.filter(f => f.status === 'live').length
  const upcomingCount = fixtures.filter(f => f.status !== 'completed' && f.status !== 'live').length
  const doneCount     = fixtures.filter(f => f.status === 'completed').length

  const filteredFixtures = filter === 'live'
    ? fixtures.filter(f => f.status === 'live')
    : filter === 'upcoming'
      ? fixtures.filter(f => f.status !== 'completed' && f.status !== 'live')
      : filter === 'done'
        ? fixtures.filter(f => f.status === 'completed')
        : fixtures

  const filteredIds = new Set(filteredFixtures.map(f => f.id))

  // First incomplete timeslot after at least one result is posted = "in progress" slot
  const inProgressSlot = (() => {
    if (!fixtures.some(f => f.status === 'completed')) return null
    const pending = [...new Set(
      fixtures
        .filter(f => f.status !== 'completed' && f.status !== 'live' && f.kickoff_time)
        .map(f => f.kickoff_time.slice(0, 16))
    )].sort()
    return pending[0] ?? null
  })()

  const filterTabs = [
    { key: 'all',      label: t('schedule.filterAll'),      count: fixtures.length },
    { key: 'live',     label: t('schedule.filterLive'),     count: liveCount },
    { key: 'upcoming', label: t('schedule.filterUpcoming'), count: upcomingCount },
    { key: 'done',     label: t('schedule.filterDone'),     count: doneCount },
  ].filter(tab => tab.key === 'all' || tab.count > 0)

  // ── Match row ────────────────────────────────────────────────
  function MatchRow({ f }) {
    const result = f.fixture_results?.[0]
    const isCompleted = f.status === 'completed'
    const isLive = f.status === 'live'
    // For catch_serve re-derive set counts from raw sport_data.sets.
    // Retroactively fixes records where home_goals=0 due to the BV target bug.
    let displayHome = result?.home_goals ?? 0
    let displayAway = result?.away_goals ?? 0
    if (sport === 'catch_serve' && result?.sport_data?.sets?.length > 0) {
      const { normalTarget, decidingTarget } = getTargets(ag?.cs_set_target ?? 15)
      displayHome = 0; displayAway = 0
      result.sport_data.sets.forEach((s, i) => {
        const w = setWinner(s.h, s.a, i === 2, normalTarget, decidingTarget)
        if (w === 'home') displayHome++
        else if (w === 'away') displayAway++
      })
    }

    const homeWon = result && displayHome > displayAway
    const awayWon = result && displayAway > displayHome
    const showEst = isBvb && !isCompleted && !isLive && !!time
    const isCurrentSlot = !isCompleted && !isLive && !!inProgressSlot &&
      f.kickoff_time?.slice(0, 16) === inProgressSlot

    const homeName = f.home_team_id ? (f.home_team?.name ?? '?') : (f.home_placeholder ?? f.home_placeholder_label ?? '?')
    const awayName = f.away_team_id ? (f.away_team?.name ?? '?') : (f.away_placeholder ?? f.away_placeholder_label ?? '?')
    const courtName = f.pitch?.name ?? null
    const time = f.kickoff_time ? formatTime(new Date(f.kickoff_time)) : null

    const scoreDisplay = result
      ? isBvb
        ? `${displayHome} : ${displayAway}`
        : `${result.home_goals} – ${result.away_goals}`
      : null

    const setDetail = isBvb && result?.sport_data?.sets?.length
      ? result.sport_data.sets.map(s => `${s.h}–${s.a}`).join(' · ')
      : null

    return (
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        borderLeft: `3px solid ${isLive ? 'var(--color-live)' : isCurrentSlot ? 'var(--color-accent)' : 'transparent'}`,
        background: isCurrentSlot ? 'rgba(240,165,0,0.04)' : undefined,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.5rem 0.75rem',
        }}>
          {/* Time + court stacked */}
          <div style={{ width: 56, flexShrink: 0 }}>
            {showEst && (
              <div style={{
                fontSize: '0.55rem',
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: 'rgba(240,165,0,0.55)',
                lineHeight: 1,
                marginBottom: 2,
              }}>
                {t('schedule.est')}
              </div>
            )}
            <div style={{
              fontSize: '0.82rem',
              fontVariantNumeric: 'tabular-nums',
              color: isLive ? 'var(--color-live)' : 'var(--color-text-muted)',
              fontWeight: isLive ? 700 : 400,
            }}>
              {time ?? '—'}
            </div>
            {courtName && (
              <div className="sch-pitch-inline" style={{
                fontSize: '0.58rem',
                color: 'rgba(148,163,184,0.4)',
                marginTop: 2,
                whiteSpace: 'nowrap',
              }}>
                {courtName}
              </div>
            )}
          </div>

          {/* Home team */}
          <div className="sch-team" style={{
            flex: 1,
            textAlign: 'right',
            fontSize: '0.9rem',
            fontWeight: homeWon ? 700 : 400,
            color: isCompleted && !homeWon ? 'var(--color-text-muted)' : 'var(--color-text)',
            fontStyle: !f.home_team_id ? 'italic' : 'normal',
          }}>
            {f.home_team_id
              ? <Link to={`/t/${slug}/${ageGroupId}/teams/${f.home_team_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{homeName}</Link>
              : homeName}
          </div>

          {/* Score */}
          <div style={{
            width: 60,
            flexShrink: 0,
            textAlign: 'center',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.125rem',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.02em',
            color: isLive
              ? 'var(--color-live)'
              : scoreDisplay
                ? 'var(--color-accent)'
                : 'rgba(148,163,184,0.25)',
          }}>
            {scoreDisplay ?? 'vs'}
          </div>

          {/* Away team */}
          <div className="sch-team" style={{
            flex: 1,
            fontSize: '0.9rem',
            fontWeight: awayWon ? 700 : 400,
            color: isCompleted && !awayWon ? 'var(--color-text-muted)' : 'var(--color-text)',
            fontStyle: !f.away_team_id ? 'italic' : 'normal',
          }}>
            {f.away_team_id
              ? <Link to={`/t/${slug}/${ageGroupId}/teams/${f.away_team_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{awayName}</Link>
              : awayName}
          </div>

          {/* Status */}
          <div style={{
            width: 32,
            flexShrink: 0,
            textAlign: 'right',
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: isLive
              ? 'var(--color-live)'
              : isCompleted
                ? 'var(--color-success)'
                : isCurrentSlot
                  ? 'var(--color-accent)'
                  : 'transparent',
          }}>
            {isLive ? 'LIVE' : isCompleted ? 'FT' : isCurrentSlot ? '▶' : ''}
          </div>
        </div>

        {/* Mobile pitch sub-row */}
        {courtName && (
          <div className="sch-pitch-row" style={{
            padding: '0 0.75rem 0.35rem calc(0.75rem + 56px + 0.625rem)',
            fontSize: '0.65rem',
            color: 'rgba(148,163,184,0.5)',
            letterSpacing: '0.03em',
          }}>
            {courtName}
          </div>
        )}

        {/* BV set detail sub-line */}
        {setDetail && (
          <div style={{
            padding: '0 0.75rem 0.35rem',
            paddingLeft: 'calc(0.75rem + 56px + 0.625rem)',
            fontSize: '0.67rem',
            color: 'rgba(148,163,184,0.38)',
            letterSpacing: '0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {setDetail}
          </div>
        )}
      </div>
    )
  }

  // ── Section card ─────────────────────────────────────────────
  function Section({ label, labelAccent, children }) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        marginBottom: '0.75rem',
      }}>
        {label && (
          <div style={{
            padding: '0.4rem 0.75rem',
            background: 'rgba(0,0,0,0.25)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: labelAccent ? 'var(--color-accent)' : 'var(--color-text-muted)',
          }}>
            {label}
          </div>
        )}
        {children}
      </div>
    )
  }

  // ── Group knockout data shaping ──────────────────────────────
  const isGroupKnockout = ag?.format === 'group_knockout'
  const groupFixtures    = fixtures.filter(f => f.group_label)
  const knockoutFixtures = fixtures.filter(f => !f.group_label)
  const groupLabels      = [...new Set(groupFixtures.map(f => f.group_label))].sort()

  function resolveRoundName(matches) {
    const rn = matches[0]?.round_name
    if (rn === '3rd_place') return t('playoff.thirdPlace')
    if (rn) return rn
    return matches.length === 1 ? t('playoff.final')
      : matches.length === 2 ? t('playoff.semiFinal')
      : matches.length === 4 ? t('playoff.quarterFinal')
      : t('standings.knockoutPhase')
  }

  const is3rd = f => f.home_placeholder?.includes('zaudētājs') || f.away_placeholder?.includes('zaudētājs')

  const knockoutRoundList = Object.entries(
    knockoutFixtures.reduce((acc, f) => {
      const key = f.round ?? 999
      ;(acc[key] = acc[key] ?? []).push(f)
      return acc
    }, {})
  ).sort(([a], [b]) => Number(a) - Number(b))
    .flatMap(([, matches]) => {
      const named   = matches.filter(f => f.round_name)
      const unnamed = matches.filter(f => !f.round_name)
      if (named.length > 0 && unnamed.length > 0) {
        return [
          { roundName: resolveRoundName(named),   matches: named },
          { roundName: resolveRoundName(unnamed), matches: unnamed },
        ]
      }
      const thirds = matches.filter(is3rd)
      const finals = matches.filter(f => !is3rd(f))
      if (thirds.length > 0 && finals.length > 0) {
        return [
          { roundName: t('playoff.thirdPlace'), matches: thirds },
          { roundName: t('playoff.final'),      matches: finals },
        ]
      }
      return [{ roundName: resolveRoundName(matches), matches }]
    })

  // Flat date grouping for non-group_knockout formats
  const flatFixtures = !isGroupKnockout ? filteredFixtures : []
  const dateGroups = flatFixtures.reduce((acc, f) => {
    const day = f.kickoff_time ? format(new Date(f.kickoff_time), 'yyyy-MM-dd') : '__NO_DATE__'
    ;(acc[day] = acc[day] ?? []).push(f)
    return acc
  }, {})

  const sectionHeading = {
    fontFamily: 'var(--font-heading)',
    fontSize: '0.875rem',
    color: 'var(--color-accent)',
    margin: '1.25rem 0 0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  }

  return (
    <div>
      <style>{`
        .sch-team { word-break: break-word; }
        .sch-pitch-inline { display: none; }
        .sch-pitch-row { display: block; }
        @media (min-width: 640px) {
          .sch-team { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .sch-pitch-inline { display: block; }
          .sch-pitch-row { display: none; }
        }
      `}</style>
      <PublicNav tournament={ag?.tournaments} ageGroups={siblings} activeAgeGroupId={ageGroupId} showRegister={isRegOpen} />
      <div className="container" style={{ paddingTop: '1.75rem', paddingBottom: '3rem' }}>

        {/* Page header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.25rem, 4vw, 1.875rem)', margin: 0 }}>
            {ag?.tournaments?.name} — {ag?.name} {t('schedule.title')}
          </h1>
          {lastUpdated && (
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              {t('common.lastUpdated', { time: formatTime(lastUpdated) })}
            </p>
          )}
        </div>

        {/* Registration banner */}
        {isRegOpen && (
          <Link
            to={`/t/${slug}/register`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '1rem', flexWrap: 'wrap', textDecoration: 'none',
              background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.3)',
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
            <span style={{ background: 'var(--color-accent)', color: '#0a1628', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.5rem 1.1rem', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {t('public.regBannerCta')} →
            </span>
          </Link>
        )}

        {/* Filter tabs */}
        {filterTabs.length > 1 && (
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            {filterTabs.map(tab => {
              const isActive = filter === tab.key
              const isLiveTab = tab.key === 'live'
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    background: 'none', border: 'none',
                    borderBottom: `2px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
                    color: isActive ? 'var(--color-accent)' : isLiveTab ? 'var(--color-live)' : 'var(--color-text-muted)',
                    fontFamily: 'var(--font-heading)', fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500, letterSpacing: '0.04em',
                    padding: '0.5rem 0.875rem 0.625rem',
                    cursor: 'pointer', marginBottom: '-1px',
                    transition: 'color var(--transition-fast), border-color var(--transition-fast)',
                    display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap',
                  }}
                >
                  {isLiveTab && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-live)', flexShrink: 0, animation: liveCount > 0 ? 'live-dot-pulse 2s ease-in-out infinite' : 'none' }} />
                  )}
                  {tab.label}
                  <span style={{ fontSize: '0.7rem', background: isActive ? 'rgba(240,165,0,0.15)' : 'rgba(255,255,255,0.07)', color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)', padding: '0.05rem 0.4rem', borderRadius: '999px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Empty states */}
        {fixtures.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('fixture.noFixtures')}</p>
        )}
        {fixtures.length > 0 && filteredFixtures.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('common.noData')}</p>
        )}

        {/* ── Group-knockout layout ── */}
        {isGroupKnockout && (
          <>
            {groupLabels.some(label =>
              groupFixtures.filter(f => f.group_label === label && filteredIds.has(f.id)).length > 0
            ) && (
              <>
                <h2 style={sectionHeading}>{t('schedule.groupStage')}</h2>
                {groupLabels.map(label => {
                  const visible = groupFixtures.filter(f => f.group_label === label && filteredIds.has(f.id))
                  if (!visible.length) return null
                  return (
                    <Section key={label} label={`${t('standings.group')} ${label}`}>
                      {visible.map(f => <MatchRow key={f.id} f={f} />)}
                    </Section>
                  )
                })}
              </>
            )}

            {knockoutRoundList.some(r => r.matches.some(f => filteredIds.has(f.id))) && (
              <>
                <h2 style={{ ...sectionHeading, marginTop: '1.75rem' }}>{t('schedule.playoffStage')}</h2>
                {knockoutRoundList.map(({ roundName, matches }, idx) => {
                  const visible = matches.filter(f => filteredIds.has(f.id))
                  if (!visible.length) return null
                  return (
                    <Section key={idx} label={roundName}>
                      {visible.map(f => <MatchRow key={f.id} f={f} />)}
                    </Section>
                  )
                })}
              </>
            )}
          </>
        )}

        {/* ── Flat layout (round-robin / knockout) ── */}
        {!isGroupKnockout && Object.keys(dateGroups).sort().map(day => (
          <div key={day}>
            <h2 style={sectionHeading}>
              {day === '__NO_DATE__' ? t('schedule.noDate') : formatDate(day)}
            </h2>
            <Section label={null}>
              {dateGroups[day].map(f => <MatchRow key={f.id} f={f} />)}
            </Section>
          </div>
        ))}
      </div>
      <Footer slim />
    </div>
  )
}
