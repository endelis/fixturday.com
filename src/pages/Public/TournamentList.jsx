import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { lv } from 'date-fns/locale'
import PublicNav from '../../components/PublicNav'

export default function TournamentList() {
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
          {tournaments.map(t => (
            <Link key={t.id} to={`/t/${t.slug}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)' }}>
                  {t.name}
                </h2>
                {t.start_date && (
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    {format(new Date(t.start_date), 'd. MMMM yyyy', { locale: lv })}
                    {t.end_date && ` – ${format(new Date(t.end_date), 'd. MMMM yyyy', { locale: lv })}`}
                  </p>
                )}
                {t.description && <p style={{ marginTop: '0.5rem' }}>{t.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}
