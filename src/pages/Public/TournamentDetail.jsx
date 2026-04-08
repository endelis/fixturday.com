import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { formatDate, formatTime } from '../../utils/dateFormat'
import {
  Calendar, MapPin, Mail, Phone, ChevronDown, FileText, Image as ImageIcon,
  Download, Users, Trophy,
} from 'lucide-react'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { calculateStandings } from '../../utils/standings'

// ── Status helpers ────────────────────────────────────────────
function getTournamentStatus(tournament) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (!tournament.start_date) return null
  const start = new Date(tournament.start_date)
  const end = tournament.end_date ? new Date(tournament.end_date) : start
  if (today < start) return 'upcoming'
  if (today > end) return 'finished'
  return 'ongoing'
}

const STATUS_CONFIG = {
  ongoing:  { labelKey: 'tournament.status.ongoing',  cls: 'badge-success' },
  upcoming: { labelKey: 'tournament.status.upcoming', cls: 'badge-warning' },
  finished: { labelKey: 'tournament.status.finished', cls: 'badge-muted'   },
}

// ── Time-block helpers for Grafiks tab ────────────────────────
function groupByTimeBlock(fixtures) {
  const blocks = {}
  for (const f of fixtures) {
    if (!f.kickoff_time) {
      blocks['no-time'] = blocks['no-time'] ?? []
      blocks['no-time'].push(f)
      continue
    }
    const dt = new Date(f.kickoff_time)
    const key = `${format(dt, 'yyyy-MM-dd')}_${String(dt.getHours()).padStart(2, '0')}`
    blocks[key] = blocks[key] ?? []
    blocks[key].push(f)
  }
  return blocks
}

function isCurrentBlock(blockKey) {
  if (!blockKey.includes('_')) return false
  const now = new Date()
  const [dateStr, hourStr] = blockKey.split('_')
  return format(now, 'yyyy-MM-dd') === dateStr && now.getHours() === parseInt(hourStr)
}

function blockLabel(blockKey, hasMultipleDays, t) {
  if (blockKey === 'no-time') return t('tournament.noTime')
  const [dateStr, hourStr] = blockKey.split('_')
  const hour = parseInt(hourStr)
  const timeRange = `${hourStr}:00 — ${String(hour + 1).padStart(2, '0')}:00`
  return hasMultipleDays ? `${format(new Date(dateStr), 'dd/MM')} · ${timeRange}` : timeRange
}

// ── Sub-tabs ──────────────────────────────────────────────────

function InfoTab({ tournament, rulesOpen, setRulesOpen, attachments, t }) {
  const isEmpty = !tournament.description && !tournament.rules && attachments.length === 0
  if (isEmpty) {
    return <p style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {tournament.description && (
        <p style={{ color: 'var(--color-text)', lineHeight: 1.75, fontSize: '0.9375rem' }}>
          {tournament.description}
        </p>
      )}

      {tournament.rules && (
        <div>
          <button
            onClick={() => setRulesOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: rulesOpen ? '8px 8px 0 0' : '8px',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-heading)',
              fontSize: '1.125rem',
              fontWeight: 600,
              padding: '0.875rem 1.25rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 200ms ease',
              minHeight: '44px',
            }}
          >
            <span style={{ flex: 1 }}>{t('public.rulesSection')}</span>
            <ChevronDown
              size={18}
              style={{
                flexShrink: 0,
                transition: 'transform 200ms ease',
                transform: rulesOpen ? 'rotate(180deg)' : 'none',
              }}
            />
          </button>

          {rulesOpen && (
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              padding: '1.25rem',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.75,
              color: 'var(--color-text)',
              fontSize: '0.9rem',
            }}>
              {tournament.rules}
            </div>
          )}
        </div>
      )}

      {attachments.length > 0 && (
        <div>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            marginBottom: '0.75rem',
            color: 'var(--color-text)',
          }}>
            {t('tournament.attachments')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {attachments.map((att, i) => {
              const isPdf = att.type === 'pdf' || String(att.name ?? '').endsWith('.pdf')
              const Icon = isPdf ? FileText : ImageIcon
              return (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    textDecoration: 'none',
                    color: 'var(--color-text)',
                    transition: 'border-color 200ms ease',
                    minHeight: '44px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  <Icon size={20} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.9rem' }}>{att.name}</span>
                  <Download size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function GrafiksTab({ fixtures, t }) {
  if (fixtures.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
        {t('schedule.noScheduleYet')}
      </p>
    )
  }

  const blocks = groupByTimeBlock(fixtures)
  const blockKeys = Object.keys(blocks).sort()
  const distinctDates = new Set(
    blockKeys.filter(k => k !== 'no-time').map(k => k.split('_')[0])
  )
  const hasMultipleDays = distinctDates.size > 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {blockKeys.map(blockKey => {
        const blockFixtures = blocks[blockKey]
        const isNow = isCurrentBlock(blockKey)

        return (
          <div key={blockKey}>
            {/* Block header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.125rem',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                {blockLabel(blockKey, hasMultipleDays, t)}
              </h2>
              {isNow && (
                <span className="live-badge">{t('public.tagNow')}</span>
              )}
            </div>

            {/* Fixture rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {blockFixtures.map(f => {
                const result = f.fixture_results?.[0]
                const isCompleted = f.status === 'completed'
                const pitchName = f.pitch?.name

                return (
                  <div
                    key={f.id}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '0.625rem 1rem',
                      display: 'grid',
                      gridTemplateColumns: '3.25rem 1fr auto 1fr',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                    className="fx-row"
                  >
                    {/* Kickoff */}
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      letterSpacing: '0.02em',
                    }}>
                      {f.kickoff_time ? formatTime(f.kickoff_time) : '—'}
                    </span>

                    {/* Home team */}
                    <span style={{
                      textAlign: 'right',
                      fontWeight: isCompleted ? 600 : 400,
                      color: 'var(--color-text)',
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {f.home_team?.name ?? '?'}
                    </span>

                    {/* Score / vs */}
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: isCompleted ? '1.125rem' : '0.85rem',
                      fontWeight: 700,
                      color: isCompleted ? 'var(--color-text)' : 'var(--color-text-muted)',
                      textAlign: 'center',
                      minWidth: '4rem',
                      letterSpacing: isCompleted ? '0.04em' : 0,
                    }}>
                      {isCompleted && result
                        ? `${result.home_goals} : ${result.away_goals}`
                        : t('fixture.vs')}
                    </span>

                    {/* Away team */}
                    <span style={{
                      fontWeight: isCompleted ? 600 : 400,
                      color: 'var(--color-text)',
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {f.away_team?.name ?? '?'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <style>{`
        @media (max-width: 480px) {
          .fx-row {
            grid-template-columns: 2.75rem 1fr 2.75rem 1fr !important;
            font-size: 0.8rem !important;
            padding: 0.5rem 0.625rem !important;
          }
        }
      `}</style>
    </div>
  )
}

function TabulaTab({ ageGroups, teams, fixtures, allResults, slug, t }) {
  const sections = ageGroups
    .map(ag => {
      const agTeams = teams.filter(team => team.age_group_id === ag.id)
      if (agTeams.length === 0) return null
      const agFixtures = fixtures.filter(f => f.stage?.age_group_id === ag.id)
      const standings = calculateStandings(agTeams, agFixtures, allResults)
      return { ag, standings }
    })
    .filter(Boolean)

  if (sections.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {sections.map(({ ag, standings }) => (
        <div key={ag.id}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.5rem',
            color: 'var(--color-accent)',
            letterSpacing: '0.02em',
            marginBottom: '0.75rem',
          }}>
            {ag.name}
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '2rem' }}>#</th>
                  <th>{t('standings.team')}</th>
                  <th style={{ textAlign: 'center' }}>{t('standings.played')}</th>
                  <th className="std-desktop" style={{ textAlign: 'center' }}>{t('standings.won')}</th>
                  <th className="std-desktop" style={{ textAlign: 'center' }}>{t('standings.drawn')}</th>
                  <th className="std-desktop" style={{ textAlign: 'center' }}>{t('standings.lost')}</th>
                  <th className="std-desktop" style={{ textAlign: 'center' }}>{t('standings.gd')}</th>
                  <th style={{ textAlign: 'center' }}>{t('standings.points')}</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => (
                  <tr
                    key={row.team.id}
                    style={{
                      borderLeft: i === 0
                        ? '3px solid var(--color-accent)'
                        : '3px solid transparent',
                    }}
                  >
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                      {i + 1}
                    </td>
                    <td>
                      <Link
                        to={`/t/${slug}/${ag.id}/teams/${row.team.id}`}
                        style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {row.team.name}
                      </Link>
                    </td>
                    <td style={{ textAlign: 'center' }}>{row.played}</td>
                    <td className="std-desktop" style={{ textAlign: 'center' }}>{row.won}</td>
                    <td className="std-desktop" style={{ textAlign: 'center' }}>{row.drawn}</td>
                    <td className="std-desktop" style={{ textAlign: 'center' }}>{row.lost}</td>
                    <td className="std-desktop" style={{ textAlign: 'center' }}>
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </td>
                    <td style={{ textAlign: 'center' }}><strong>{row.points}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <style>{`
        @media (max-width: 600px) {
          .std-desktop { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function KomandasTab({ teams, ageGroups, slug, t }) {
  const agMap = Object.fromEntries(ageGroups.map(ag => [ag.id, ag]))

  if (teams.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
        <Users size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
        <p>{t('common.noData')}</p>
      </div>
    )
  }

  return (
    <div className="teams-grid">
      {teams.map(team => {
        const ag = agMap[team.age_group_id]
        return (
          <Link
            key={team.id}
            to={`/t/${slug}/${team.age_group_id}/teams/${team.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '1rem',
                transition: 'border-color 200ms ease',
                height: '100%',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.125rem',
                color: 'var(--color-text)',
                marginBottom: team.club ? '0.2rem' : '0.5rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {team.name}
              </h3>
              {team.club && (
                <p style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-muted)',
                  marginBottom: '0.5rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {team.club}
                </p>
              )}
              {ag && (
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {ag.name}
                </span>
              )}
            </div>
          </Link>
        )
      })}

      <style>{`
        .teams-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .teams-grid { grid-template-columns: 1fr 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function TournamentDetail() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const tabInitialized = useRef(false)

  const [tournament, setTournament] = useState(null)
  const [ageGroups, setAgeGroups] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [teams, setTeams] = useState([])
  const [activeTab, setActiveTab] = useState('grafiks')
  const [loading, setLoading] = useState(true)
  const [rulesOpen, setRulesOpen] = useState(false)

  useEffect(() => {
    async function load() {
      // 1. Tournament
      const { data: tourney, error } = await supabase
        .from('tournaments')
        .select('*, venues(name)')
        .eq('slug', slug)
        .single()

      if (error || !tourney) { setLoading(false); return }
      setTournament(tourney)

      // Dynamic meta
      document.title = `${tourney.name} — Fixturday`
      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc) {
        const dateStr = tourney.start_date
          ? new Date(tourney.start_date).toLocaleDateString('lv-LV', { year: 'numeric', month: 'long', day: 'numeric' })
          : ''
        metaDesc.setAttribute('content', `${tourney.name} — ${tourney.sport ?? 'sporta'} turnīrs Latvijā.${dateStr ? ` ${dateStr}.` : ''} Seko rezultātiem un grafikam reāllaikā.`)
      }

      // SportsEvent JSON-LD
      const venueNameStr = Array.isArray(tourney.venues) ? tourney.venues[0]?.name : tourney.venues?.name
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: tourney.name,
        sport: tourney.sport ?? undefined,
        startDate: tourney.start_date ?? undefined,
        endDate: tourney.end_date ?? tourney.start_date ?? undefined,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: venueNameStr ?? 'Latvija',
          address: { '@type': 'PostalAddress', addressCountry: 'LV' },
        },
        organizer: { '@type': 'Person', name: 'Fixturday', url: 'https://www.fixturday.com' },
        url: `https://www.fixturday.com/t/${tourney.slug}`,
        inLanguage: 'lv',
      }
      let ldScript = document.getElementById('ld-sports-event')
      if (!ldScript) {
        ldScript = document.createElement('script')
        ldScript.id = 'ld-sports-event'
        ldScript.type = 'application/ld+json'
        document.head.appendChild(ldScript)
      }
      ldScript.textContent = JSON.stringify(jsonLd)

      // 2. Age groups
      const { data: groups } = await supabase
        .from('age_groups')
        .select('id, name, format, game_duration, registration_open')
        .eq('tournament_id', tourney.id)
        .order('name')

      const ags = groups ?? []
      setAgeGroups(ags)

      if (ags.length === 0) {
        if (!tabInitialized.current) { tabInitialized.current = true; setActiveTab('info') }
        setLoading(false)
        return
      }

      const agIds = ags.map(g => g.id)

      // 3. Stages + Teams in parallel
      const [{ data: stagesData }, { data: teamsData }] = await Promise.all([
        supabase.from('stages').select('id, age_group_id, type').in('age_group_id', agIds),
        supabase.from('teams')
          .select('id, name, club, age_group_id, status')
          .in('age_group_id', agIds)
          .eq('status', 'confirmed'),
      ])

      setTeams(teamsData ?? [])

      const stages = stagesData ?? []
      const stageIds = stages.map(s => s.id)
      const stageMap = Object.fromEntries(stages.map(s => [s.id, s]))

      if (stageIds.length === 0) {
        if (!tabInitialized.current) { tabInitialized.current = true; setActiveTab('info') }
        setLoading(false)
        return
      }

      // 4. Fixtures
      const { data: fxData } = await supabase
        .from('fixtures')
        .select(`
          id, kickoff_time, status, home_team_id, away_team_id, group_label, stage_id,
          home_team:teams!home_team_id(id, name),
          away_team:teams!away_team_id(id, name),
          pitch:pitches(name, venues(name)),
          fixture_results(home_goals, away_goals)
        `)
        .in('stage_id', stageIds)
        .order('kickoff_time', { ascending: true })

      const fxWithStage = (fxData ?? []).map(f => ({
        ...f,
        stage: stageMap[f.stage_id] ?? null,
      }))

      setFixtures(fxWithStage)

      if (!tabInitialized.current) {
        tabInitialized.current = true
        setActiveTab(fxWithStage.length > 0 ? 'grafiks' : 'info')
      }

      setLoading(false)
    }

    load()

    const channel = supabase
      .channel(`td-${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixture_results' }, load)
      .subscribe()

    const poll = setInterval(load, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
      const ldScript = document.getElementById('ld-sports-event')
      if (ldScript) ldScript.remove()
    }
  }, [slug])

  // ── Loading / not found ───────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
        <PublicNav />
        <div className="loading">{t('common.loading')}</div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
        <PublicNav />
        <div className="loading">{t('register.notFound')}</div>
      </div>
    )
  }

  // ── Derived data ──────────────────────────────────────────
  const status = getTournamentStatus(tournament)
  const statusCfg = status ? STATUS_CONFIG[status] : null
  const venueName = Array.isArray(tournament.venues)
    ? tournament.venues[0]?.name
    : tournament.venues?.name
  const registrationOpen = ageGroups.some(ag => ag.registration_open)
  const attachments = tournament.attachments ?? []

  // Flatten results for calculateStandings
  const allResults = fixtures.flatMap(f =>
    (f.fixture_results ?? []).map(r => ({ ...r, fixture_id: f.id }))
  )

  const TABS = [
    { id: 'info',     label: t('public.tabInfo')      },
    { id: 'grafiks',  label: t('public.tabSchedule')  },
    { id: 'tabula',   label: t('public.tabStandings') },
    { id: 'komandas', label: t('public.tabTeams')     },
  ]

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <PublicNav tournament={tournament} />

      {/* ── Hero section ──────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ paddingTop: '2rem' }}>

          {/* Logo + info */}
          <div style={{
            display: 'flex',
            gap: '1.25rem',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            marginBottom: '1.5rem',
          }}>
            {/* Logo */}
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '12px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {tournament.logo_url ? (
                <img
                  src={tournament.logo_url}
                  alt={tournament.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }}
                />
              ) : (
                <Trophy size={40} style={{ color: 'var(--color-accent)', opacity: 0.7 }} />
              )}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                color: 'var(--color-accent)',
                letterSpacing: '0.01em',
                lineHeight: 1.1,
                marginBottom: '0.6rem',
              }}>
                {tournament.name}
              </h1>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {tournament.sport && (
                  <span style={{
                    padding: '0.18rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: 'rgba(34, 197, 94, 0.12)',
                    color: 'var(--color-success)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                  }}>
                    {tournament.sport}
                  </span>
                )}
                {statusCfg && (
                  <span className={`badge ${statusCfg.cls}`}>{t(statusCfg.labelKey)}</span>
                )}
              </div>

              {/* Date */}
              {tournament.start_date && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.875rem',
                  marginBottom: '0.25rem',
                }}>
                  <Calendar size={14} style={{ flexShrink: 0 }} />
                  <span>
                    {formatDate(tournament.start_date)}
                    {tournament.end_date && (
                      <> &mdash; {formatDate(tournament.end_date)}</>
                    )}
                  </span>
                </div>
              )}

              {/* Venue */}
              {venueName && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.875rem',
                }}>
                  <MapPin size={14} style={{ flexShrink: 0 }} />
                  <span>{venueName}</span>
                </div>
              )}

              {/* Organizer contact */}
              {tournament.organizer_email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
                  <Mail size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  <a href={`mailto:${tournament.organizer_email}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
                    {tournament.organizer_email}
                  </a>
                </div>
              )}
              {tournament.organizer_phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
                  <Phone size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  <a href={`tel:${tournament.organizer_phone}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
                    {tournament.organizer_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Register CTA */}
          {registrationOpen && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Link
                to={`/t/${slug}/register`}
                className="btn-primary"
                style={{ fontSize: '1rem', padding: '0.75rem 1.75rem' }}
              >
                {t('public.regBtn')}
              </Link>
            </div>
          )}

          {/* Tab bar */}
          <div style={{ display: 'flex', overflowX: 'auto', gap: 0, marginBottom: '-1px' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id
                    ? '2px solid var(--color-accent)'
                    : '2px solid transparent',
                  color: activeTab === tab.id
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  padding: '0.75rem 1.25rem',
                  cursor: 'pointer',
                  transition: 'color 200ms ease, border-color 200ms ease',
                  whiteSpace: 'nowrap',
                  minHeight: '44px',
                }}
                onMouseEnter={e => {
                  if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--color-text)'
                }}
                onMouseLeave={e => {
                  if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--color-text-muted)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────── */}
      <div className="container" style={{ paddingTop: '1.75rem', paddingBottom: '4rem' }}>
        {activeTab === 'info' && (
          <InfoTab
            tournament={tournament}
            rulesOpen={rulesOpen}
            setRulesOpen={setRulesOpen}
            attachments={attachments}
            t={t}
          />
        )}

        {activeTab === 'grafiks' && (
          <GrafiksTab fixtures={fixtures} t={t} />
        )}

        {activeTab === 'tabula' && (
          <TabulaTab
            ageGroups={ageGroups}
            teams={teams}
            fixtures={fixtures}
            allResults={allResults}
            slug={slug}
            t={t}
          />
        )}

        {activeTab === 'komandas' && (
          <KomandasTab teams={teams} ageGroups={ageGroups} slug={slug} t={t} />
        )}
      </div>
      <Footer />
    </div>
  )
}
