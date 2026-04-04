import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'

export default function Dashboard() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*, age_groups(id, teams(id, status), stages(id, fixtures(id)))')
        .order('created_at', { ascending: false })
      if (error) { toast(t('dashboard.loadError'), 'error'); setLoading(false); return }
      setTournaments(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    const { error } = await signOut()
    if (error) { toast(t('common.error'), 'error'); return }
    navigate('/admin')
  }

  function fmtDate(str) {
    try { return str ? format(parseISO(str), 'dd/MM/yyyy') : null } catch { return null }
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
            <Link to="/admin/matchday" className="btn-primary btn-sm">⚽ {t('workspace.navMatchday')}</Link>
            <Link to="/" className="btn-secondary btn-sm" target="_blank">{t('dashboard.viewPublic')}</Link>
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
            <div className="card" style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
              {t('dashboard.noTournaments')}{' '}
              <Link to="/admin/tournaments/new" style={{ color: 'var(--color-accent)' }}>
                {t('dashboard.createFirst')}
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
