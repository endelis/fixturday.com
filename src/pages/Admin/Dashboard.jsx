import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { parseISO } from 'date-fns'
import { formatDate } from '../../utils/dateFormat'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'
import { Trophy, Users, Layers, Printer, Coffee, Plus, ChevronRight } from 'lucide-react'

export default function Dashboard() {
  const { user, isSuperAdmin, signOut } = useAuth()
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
          .select('*, age_groups(id, teams(id, status), stages(id, fixtures(id)))')
          .order('created_at', { ascending: false })
        if (!isSuperAdmin) query = query.eq('owner_id', user.id)
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

  async function handleDelete(e, tourney) {
    e.stopPropagation()
    if (!window.confirm(t('dashboard.deleteConfirm', { name: tourney.name }))) return
    try {
      const { error } = await supabase.from('tournaments').delete().eq('id', tourney.id)
      if (error) throw error
      setTournaments(prev => prev.filter(tm => tm.id !== tourney.id))
      toast(t('common.saved'))
    } catch {
      toast(t('dashboard.deleteError'), 'error')
    }
  }

  function fmtDate(str) {
    try { return str ? formatDate(parseISO(str)) : null } catch { return null }
  }

  return (
    <>
      <style>{`
        .dash-card {
          cursor: pointer;
          transition: border-color var(--transition-fast), border-left-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
          border-left: 3px solid transparent !important;
        }
        .dash-card:hover {
          border-left-color: var(--color-accent) !important;
          transform: translateX(2px);
          box-shadow: var(--shadow-lg);
        }
      `}</style>

      <div>
        <nav className="admin-nav">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo-horizontal.svg" alt="Fixturday" style={{ height: '26px' }} />
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <a
              href="https://www.buymeacoffee.com/endelis"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Coffee size={14} />
              {t('footer.coffee')}
            </a>
            <button className="btn-secondary btn-sm" onClick={handleSignOut}>{t('auth.logout')}</button>
          </div>
        </nav>

        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: 0 }}>{t('tournament.title')}</h1>
            <Link to="/admin/tournaments/new" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={16} />
              {t('tournament.new')}
            </Link>
          </div>

          {loading ? (
            <div className="loading">{t('common.loading')}</div>
          ) : tournaments.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '5rem 1rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem', color: 'var(--color-accent)',
              }}>
                <Trophy size={32} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                {t('dashboard.noTournaments')}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.75rem', maxWidth: '320px', margin: '0 auto 1.75rem' }}>
                {t('dashboard.noTournamentsHint')}
              </p>
              <Link to="/admin/tournaments/new" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Plus size={16} />
                {t('tournament.new')}
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
                          <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', letterSpacing: '0.01em' }}>
                            {tourney.name}
                          </strong>
                          <ChevronRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        </div>
                        {(startDate || endDate) && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                            {startDate}{startDate && endDate ? ' – ' : ''}{endDate}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
                        <span className="badge badge-muted" style={{ fontSize: '0.72rem' }}>{tourney.sport}</span>
                        <span className={`badge ${tourney.is_active ? 'badge-success' : 'badge-muted'}`}>
                          {tourney.is_active ? t('tournament.active') : t('tournament.inactive')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Users size={14} />
                          {confirmedTeams} {t('dashboard.teamsLabel')}
                          {pendingTeams > 0 && (
                            <span style={{ color: 'var(--color-accent)', marginLeft: '0.2rem' }}>
                              +{pendingTeams} {t('dashboard.pending')}
                            </span>
                          )}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Layers size={14} />
                          {fixturesCount} {t('dashboard.fixturesLabel')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          onClick={e => {
                            e.stopPropagation()
                            window.open(`/admin/tournaments/${tourney.id}/print`, '_blank')
                          }}
                        >
                          <Printer size={13} />
                          {t('dashboard.print')}
                        </button>
                        <button
                          className="btn-sm"
                          style={{ background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                          onClick={e => handleDelete(e, tourney)}
                        >
                          {t('dashboard.delete')}
                        </button>
                      </div>
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
