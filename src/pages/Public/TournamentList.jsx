import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../utils/dateFormat'
import { Search, Trophy, Calendar, MapPin, Users } from 'lucide-react'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { useSEO } from '../../hooks/useSEO'

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
  ongoing:  { labelKey: 'tournament.status.live',     cls: 'badge-live'    },
  upcoming: { labelKey: 'tournament.status.upcoming', cls: 'badge-warning' },
  finished: { labelKey: 'tournament.status.finished', cls: 'badge-muted'   },
}

const SPORT_ICONS = { football: '⚽' }

// ── Component ─────────────────────────────────────────────────
export default function TournamentList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [teamCounts, setTeamCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSport, setFilterSport] = useState('')
  const [filterCountry, setFilterCountry] = useState('')

  useSEO({
    title: 'Live Tournaments',
    description: 'Browse all active sports tournaments. Real-time standings and schedules. Find your tournament and follow live results.',
    path: '/tournaments',
  })

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, slug, sport, country, start_date, end_date, logo_url, venues(name), age_groups(id, name, registration_open)')
        .eq('is_active', true)
        .order('start_date', { ascending: false })

      if (error) { setLoading(false); return }

      const list = data ?? []
      setTournaments(list)

      // Load team counts using embedded age_groups (no extra round-trip)
      if (list.length > 0) {
        const agToTournament = {}
        for (const tour of list) {
          for (const ag of tour.age_groups ?? []) {
            agToTournament[ag.id] = tour.id
          }
        }
        const agIds = Object.keys(agToTournament)

        if (agIds.length > 0) {
          const { data: teams, error: teamsErr } = await supabase
            .from('teams')
            .select('id, age_group_id')
            .in('age_group_id', agIds)
            .neq('status', 'rejected')
          if (teamsErr) { setLoading(false); return }

          const counts = {}
          for (const team of teams ?? []) {
            const tid = agToTournament[team.age_group_id]
            if (tid) counts[tid] = (counts[tid] ?? 0) + 1
          }
          setTeamCounts(counts)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  const availableSports = [...new Set(tournaments.map(t => t.sport).filter(Boolean))]
  const availableCountries = [...new Set(tournaments.map(t => t.country).filter(Boolean))].sort()

  const filtered = tournaments.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) &&
    (!filterSport || t.sport === filterSport) &&
    (!filterCountry || t.country === filterCountry)
  )

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
        <PublicNav />
        <div className="loading">{t('common.loading')}</div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ background: '#0a1628', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNav />
      <main style={{ display: 'contents' }}>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section style={{
        padding: '4.5rem 1.5rem 3rem',
        textAlign: 'center',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(240,165,0,0.07) 0%, transparent 70%), #0a1628',
      }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            border: '1px solid rgba(240,165,0,0.35)',
            borderRadius: '999px',
            padding: '0.3rem 1rem',
            fontSize: '0.75rem',
            color: '#f0a500',
            letterSpacing: '0.1em',
            fontWeight: 600,
            marginBottom: '1.25rem',
          }}>
            {t('public.title').toUpperCase()}
          </div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '0.75rem',
          }}>
            {t('public.heroTitle')}
          </h1>
          <p style={{
            fontSize: 'clamp(0.9375rem, 2vw, 1rem)',
            color: '#8fa3bc',
            lineHeight: 1.6,
            margin: '0 0 2rem',
          }}>
            {t('public.heroSubtitle')}
          </p>
        </div>

        {/* Search — inside hero */}
        <div style={{ maxWidth: '560px', margin: '0 auto', position: 'relative' }}>
          <Search
            size={17}
            style={{
              position: 'absolute',
              left: '0.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8fa3bc',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            placeholder={t('public.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: '#0d1b2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#e0e8f4',
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              padding: '0.75rem 1rem 0.75rem 2.6rem',
              outline: 'none',
              boxSizing: 'border-box',
              minHeight: '44px',
            }}
            onFocus={e => (e.target.style.borderColor = '#f0a500')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>
      </section>

      <div style={{ flex: 1, padding: '2.5rem 1.5rem 4rem', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Sport filter pills */}
        {availableSports.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            <button
              onClick={() => setFilterSport('')}
              style={{
                padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                border: `1px solid ${!filterSport ? '#f0a500' : 'rgba(255,255,255,0.12)'}`,
                background: !filterSport ? 'rgba(240,165,0,0.12)' : 'transparent',
                color: !filterSport ? '#f0a500' : '#8fa3bc', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {t('public.allSports')}
            </button>
            {availableSports.map(sport => (
              <button
                key={sport}
                onClick={() => setFilterSport(filterSport === sport ? '' : sport)}
                style={{
                  padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                  border: `1px solid ${filterSport === sport ? '#f0a500' : 'rgba(255,255,255,0.12)'}`,
                  background: filterSport === sport ? 'rgba(240,165,0,0.12)' : 'transparent',
                  color: filterSport === sport ? '#f0a500' : '#8fa3bc', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {SPORT_ICONS[sport] ?? ''} {t(`sports.${sport}`, { defaultValue: sport })}
              </button>
            ))}
          </div>
        )}

        {/* Country filter pills */}
        {availableCountries.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            <button
              onClick={() => setFilterCountry('')}
              style={{
                padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                border: `1px solid ${!filterCountry ? 'rgba(143,163,188,0.5)' : 'rgba(255,255,255,0.12)'}`,
                background: !filterCountry ? 'rgba(143,163,188,0.08)' : 'transparent',
                color: !filterCountry ? '#8fa3bc' : 'rgba(143,163,188,0.6)', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {t('public.allCountries')}
            </button>
            {availableCountries.map(country => (
              <button
                key={country}
                onClick={() => setFilterCountry(filterCountry === country ? '' : country)}
                style={{
                  padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                  border: `1px solid ${filterCountry === country ? 'rgba(143,163,188,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  background: filterCountry === country ? 'rgba(143,163,188,0.08)' : 'transparent',
                  color: filterCountry === country ? '#8fa3bc' : 'rgba(143,163,188,0.4)', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {country}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--color-text-muted)' }}>
            <Trophy
              size={48}
              style={{ margin: '0 auto 1.25rem', display: 'block', opacity: 0.3 }}
            />
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.5rem',
              color: 'var(--color-text-muted)',
              marginBottom: '0.5rem',
            }}>
              {tournaments.length === 0 ? t('public.noTournaments') : t('public.noResults')}
            </h2>
            <p style={{ fontSize: '0.9rem' }}>
              {tournaments.length === 0 ? t('public.noTournamentsHint') : t('public.noResultsHint')}
            </p>
            {(search || filterSport || filterCountry) && (
              <button
                className="btn-secondary btn-sm"
                style={{ marginTop: '1.25rem', cursor: 'pointer' }}
                onClick={() => { setSearch(''); setFilterSport(''); setFilterCountry('') }}
              >
                {t('public.clearFilters')}
              </button>
            )}
          </div>
        ) : (
          /* Grid */
          <div className="tournament-list-grid">
            {filtered.map(tournament => {
              const status = getTournamentStatus(tournament)
              const statusCfg = status ? STATUS_CONFIG[status] : null
              const venueName = Array.isArray(tournament.venues)
                ? tournament.venues[0]?.name
                : tournament.venues?.name

              const teamCount = teamCounts[tournament.id] ?? 0
              const hasOpenReg = status !== 'finished' && (tournament.age_groups ?? []).some(ag => ag.registration_open)

              return (
                <div
                  key={tournament.id}
                  style={{ cursor: 'pointer', display: 'block', minWidth: 0 }}
                  onClick={() => navigate(`/t/${tournament.slug}`)}
                >
                  <article className="t-card">
                    {/* Top: logo + title + meta */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      {/* Logo */}
                      <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: '8px',
                        background: 'var(--color-surface-2)',
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
                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                          />
                        ) : (
                          <Trophy size={26} style={{ color: 'var(--color-accent)', opacity: 0.7 }} />
                        )}
                      </div>

                      {/* Text info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2
                          title={tournament.name}
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: 'var(--color-text)',
                            lineHeight: 1.15,
                            marginBottom: '0.4rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                          {tournament.name}
                        </h2>

                        {tournament.start_date && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.8125rem',
                            marginBottom: '0.15rem',
                          }}>
                            <Calendar size={13} style={{ flexShrink: 0 }} />
                            <span>
                              {formatDate(tournament.start_date)}
                              {tournament.end_date && (
                                <> &mdash; {formatDate(tournament.end_date)}</>
                              )}
                            </span>
                          </div>
                        )}

                        {(venueName || tournament.country) && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.8125rem',
                          }}>
                            <MapPin size={13} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {[venueName, tournament.country].filter(Boolean).join(' · ')}
                            </span>
                          </div>
                        )}

                        {(tournament.age_groups?.length ?? 0) > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.45rem' }}>
                            {tournament.age_groups.slice(0, 5).map(ag => (
                              <span key={ag.id} style={{
                                fontSize: '0.68rem',
                                color: 'var(--color-text-muted)',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '4px',
                                padding: '0.1rem 0.45rem',
                                lineHeight: 1.4,
                              }}>
                                {ag.name}
                              </span>
                            ))}
                            {tournament.age_groups.length > 5 && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>
                                +{tournament.age_groups.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: badges + team count */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--color-border)',
                    }}>
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
                          {t(`sports.${tournament.sport}`, { defaultValue: tournament.sport })}
                        </span>
                      )}

                      {statusCfg && (
                        <span className={`badge ${statusCfg.cls}`}>
                          {t(statusCfg.labelKey)}
                        </span>
                      )}

                      {hasOpenReg && (
                        <span style={{
                          padding: '0.18rem 0.65rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: 'rgba(240,165,0,0.12)',
                          color: '#f0a500',
                          border: '1px solid rgba(240,165,0,0.3)',
                        }}>
                          {t('public.regOpen')}
                        </span>
                      )}

                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                          <Users size={14} />
                          <span>{teamCount} {t('public.teamsLabel')}</span>
                        </div>
                        {hasOpenReg && (
                          <Link
                            to={`/t/${tournament.slug}/register`}
                            onClick={e => e.stopPropagation()}
                            style={{
                              padding: '0.3rem 0.75rem',
                              background: '#f0a500',
                              color: '#0a1628',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t('public.regBtn')} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        .tournament-list-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .tournament-list-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .t-card {
          background: #0d1b2e;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 1.125rem;
          transition: border-color 200ms ease;
          height: 100%;
          overflow: hidden;
        }
        .t-card:hover {
          border-color: rgba(240,165,0,0.5);
        }
      `}</style>

      </main>
      <Footer />
    </div>
  )
}
