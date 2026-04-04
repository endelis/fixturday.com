import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'

export default function Dashboard() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*, age_groups(id, teams(id, status))')
        .order('created_at', { ascending: false })
      if (error) { toast('Kļūda ielādējot turnīrus', 'error'); setLoading(false); return }
      setTournaments(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    const { error } = await signOut()
    if (error) { toast('Kļūda: nevar iziet', 'error'); return }
    navigate('/admin')
  }

  return (
    <div>
      <nav className="admin-nav">
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)' }}>
          Fixturday Admin
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/admin/matchday" className="btn-primary btn-sm">⚽ Spēļu diena</Link>
          <Link to="/" className="btn-secondary btn-sm" target="_blank">Skatīt publiski ↗</Link>
          <button className="btn-secondary btn-sm" onClick={handleSignOut}>Iziet</button>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>Turnīri</h1>
          <Link to="/admin/tournaments/new" className="btn-primary">+ Jauns turnīrs</Link>
        </div>

        {loading ? (
          <div className="loading">Ielādē...</div>
        ) : tournaments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Nav turnīru. <Link to="/admin/tournaments/new" style={{ color: 'var(--color-accent)' }}>Izveidot pirmo →</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {tournaments.map(t => (
              <div key={t.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>{t.name}</strong>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    /{t.slug}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${t.is_active ? 'badge-success' : 'badge-muted'}`}>
                    {t.is_active ? 'Aktīvs' : 'Neaktīvs'}
                  </span>
                  {(() => {
                    const pendingCount = (t.age_groups ?? []).flatMap(ag => ag.teams ?? []).filter(tm => tm.status === 'pending').length
                    return pendingCount > 0 ? (
                      <span className="badge badge-warning" style={{ cursor: 'pointer' }}>
                        {pendingCount} gaida
                      </span>
                    ) : null
                  })()}
                  <Link to={`/admin/tournaments/${t.id}`} className="btn-secondary btn-sm">Rediģēt</Link>
                  <Link to={`/admin/tournaments/${t.id}/age-groups`} className="btn-secondary btn-sm">Vecuma grupas</Link>
                  <Link to={`/admin/tournaments/${t.id}/venues`} className="btn-secondary btn-sm">Vietas</Link>
                  <Link to={`/admin/tournaments/${t.id}/print`} className="btn-secondary btn-sm" target="_blank">🖨 Drukāt</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
