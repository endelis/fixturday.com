import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { parseISO } from 'date-fns'
import { formatDate } from '../../utils/dateFormat'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'
import { Trophy } from 'lucide-react'

export default function Dashboard() {
  const { user, signOut, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        let query = supabase
          .from('tournaments')
          .select('*, owner:owner_id(email), age_groups(id, teams(id, status), stages(id, fixtures(id)))')
          .order('created_at', { ascending: false })
        if (!isSuperAdmin) {
          query = query.eq('owner_id', user.id)
        }
        const { data, error } = await query
        if (error) throw error
        setTournaments(data ?? [])
      } catch {
        toast(t('dashboard.loadError'), 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, isSuperAdmin])

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/admin')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  function fmtDate(str) {
    try { return str ? formatDate(parseISO(str)) : null } catch { return null }
  }

  return (
    <>
      <style>{`.dash-card:hover { filter: brightness(1.08); cursor: pointer; }`}</style>
      <div>
        <nav className="admin-nav">
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)' }}>
            Fixturday Admin
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {isSuperAdmin && (
              <span style={{
                background: 'var(--color-accent)', color: '#000',
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase',
              }}>
                {t('dashboard.superAdminBadge')}
              </span>
            )}
            <button className="btn-secondary btn-sm" onClick={handleSignOut}>{t('auth.logout')}</button>
          </div>
        </nav>

        <div className="container" style={{ paddingTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>{t('tournament.title')}</h1>
            <Link to="/admin/tournaments/new" className="btn-primary">+ {t('tournament.new')}</Link>
          </div>

          {loading ? (
            <div className="loading">{t('common.loading')}</div>
          ) : tournaments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <Trophy size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                {t('dashboard.noTournaments')}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                {t('dashboard.noTournamentsHint')}
              </p>
              <Link to="/admin/tournaments/new" className="btn-primary">
                + {t('tournament.new')}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {tournaments.map(tourney => {
                const confirmedTeams = (tourney.age_groups ?? [])
                  .flatMap(ag => ag.teams ?? [])
                  .filter(tm => tm.status === 'confirmed').length
                const pendingTeams = (tourney.age_groups ?? [])
                  .flatMap(ag => ag.teams ?? [])
                  .filter(tm => tm.status === 'pending').length
                const fixturesCount = (tourney.age_groups ?? [])
                  .flatMap(ag => (ag.stages ?? []).flatMap(s => s.fixtures ?? [])).length
                const startDate = fmtDate(tourney.start_date)
                const endDate = fmtDate(tourney.end_date)

                return (
                  <div
                    key={tourney.id}
                    className="card dash-card"
                    onClick={() => navigate(`/admin/tournaments/${tourney.id}/overview`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem' }}>
                          {tourney.name}
                        </strong>
                        {(startDate || endDate) && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                            {startDate}{startDate && endDate ? ' – ' : ''}{endDate}
                          </div>
                        )}
                        {isSuperAdmin && tourney.owner?.email && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', marginTop: '0.15rem', opacity: 0.8 }}>
                            {tourney.owner.email}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge badge-muted" style={{ fontSize: '0.72rem' }}>{tourney.sport}</span>
                        <span className={`badge ${tourney.is_active ? 'badge-success' : 'badge-muted'}`}>
                          {tourney.is_active ? t('tournament.active') : t('tournament.inactive')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                        <span>
                          👥 {confirmedTeams} {t('dashboard.teamsLabel')}
                          {pendingTeams > 0 && (
                            <span style={{ color: 'var(--color-accent)', marginLeft: '0.3rem' }}>
                              +{pendingTeams} {t('dashboard.pending')}
                            </span>
                          )}
                        </span>
                        <span>⚽ {fixturesCount} {t('dashboard.fixturesLabel')}</span>
                      </div>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={e => {
                          e.stopPropagation()
                          window.open(`/admin/tournaments/${tourney.id}/print`, '_blank')
                        }}
                      >
                        🖨 {t('dashboard.print')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
