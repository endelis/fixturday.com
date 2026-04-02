import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import PublicNav from '../../components/PublicNav'

function getTournamentStatus(t) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (!t.start_date) return null
  const start = new Date(t.start_date)
  const end = t.end_date ? new Date(t.end_date) : start
  if (today < start) return 'upcoming'
  if (today > end) return 'finished'
  return 'ongoing'
}

export default function TournamentList() {
  const { t } = useTranslation()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tournaments')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: false })
      .then(({ data }) => {
        setTournaments(data ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="loading">Ielādē...</div>

  return (
    <div>
    <PublicNav />
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '1.5rem' }}>
        Turnīri
      </h1>
      {tournaments.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Nav aktīvu turnīru.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {tournaments.map(tournament => (
            <Link key={tournament.id} to={`/t/${tournament.slug}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)' }}>
                  {tournament.name}
                  {(() => {
                    const status = getTournamentStatus(tournament)
                    const STATUS_STYLE = {
                      ongoing:  { background: 'var(--color-success)', color: '#000' },
                      upcoming: { background: 'var(--color-accent)',  color: '#000' },
                      finished: { background: 'transparent', color: 'var(--color-muted)', border: '1px solid var(--color-border)' },
                    }
                    if (!status) return null
                    return (
                      <span style={{ display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, marginLeft: '0.75rem', ...STATUS_STYLE[status] }}>
                        {t(`tournament.status.${status}`)}
                      </span>
                    )
                  })()}
                </h2>
                {tournament.start_date && (
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    {format(new Date(tournament.start_date), 'dd/MM/yyyy')}
                    {tournament.end_date && ` – ${format(new Date(tournament.end_date), 'dd/MM/yyyy')}`}
                  </p>
                )}
                {tournament.description && <p style={{ marginTop: '0.5rem' }}>{tournament.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}
