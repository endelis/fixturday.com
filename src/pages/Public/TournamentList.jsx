import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { Search, Trophy, Calendar, MapPin, Users } from 'lucide-react'
import PublicNav from '../../components/PublicNav'

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
  ongoing:  { label: 'AKTĪVS',   cls: 'badge-success' },
  upcoming: { label: 'DRĪZUMĀ',  cls: 'badge-warning' },
  finished: { label: 'BEIDZIES', cls: 'badge-muted'   },
}

// ── Component ─────────────────────────────────────────────────
export default function TournamentList() {
  const { t } = useTranslation()
  const [tournaments, setTournaments] = useState([])
  const [teamCounts, setTeamCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, slug, sport, start_date, end_date, logo_url, venues(name)')
        .eq('is_active', true)
        .order('start_date', { ascending: false })

      if (error) { setLoading(false); return }

      const list = data ?? []
      setTournaments(list)

      // Load team counts: tournaments → age_groups → teams
      if (list.length > 0) {
        const tIds = list.map(t => t.id)

        const { data: ags } = await supabase
          .from('age_groups')
          .select('id, tournament_id')
          .in('tournament_id', tIds)

        if (ags && ags.length > 0) {
          const agIds = ags.map(g => g.id)
          const agToTournament = Object.fromEntries(ags.map(g => [g.id, g.tournament_id]))

          const { data: teams } = await supabase
            .from('teams')
            .select('id, age_group_id')
            .in('age_group_id', agIds)
            .neq('status', 'rejected')

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

  const filtered = tournaments.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
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
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <PublicNav />

      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>

        {/* Page header */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1.5rem',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 5vw, 2.5rem)',
            color: 'var(--color-accent)',
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}>
            {t('public.title')}
          </h1>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
            {t('public.tagline')}
          </span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <Search
            size={17}
            style={{
              position: 'absolute',
              left: '0.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
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
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              padding: '0.75rem 1rem 0.75rem 2.6rem',
              outline: 'none',
              transition: 'border-color 200ms ease',
              minHeight: '44px',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

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
              {t('public.noResults')}
            </h2>
            <p style={{ fontSize: '0.9rem' }}>{t('public.noResultsHint')}</p>
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

              return (
                <Link
                  key={tournament.id}
                  to={`/t/${tournament.slug}`}
                  style={{ textDecoration: 'none', display: 'block' }}
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
                        <h2 style={{
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
                              {format(new Date(tournament.start_date), 'dd/MM/yyyy')}
                              {tournament.end_date && (
                                <> &mdash; {format(new Date(tournament.end_date), 'dd/MM/yyyy')}</>
                              )}
                            </span>
                          </div>
                        )}

                        {venueName && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.8125rem',
                          }}>
                            <MapPin size={13} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {venueName}
                            </span>
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
                          {tournament.sport}
                        </span>
                      )}

                      {statusCfg && (
                        <span className={`badge ${statusCfg.cls}`}>
                          {statusCfg.label}
                        </span>
                      )}

                      <div style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.8125rem',
                      }}>
                        <Users size={14} />
                        <span>{teamCount} {t('public.teamsLabel')}</span>
                      </div>
                    </div>
                  </article>
                </Link>
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
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 1.125rem;
          transition: border-color 200ms ease;
          height: 100%;
        }
        .t-card:hover {
          border-color: var(--color-accent);
        }
      `}</style>
    </div>
  )
}
