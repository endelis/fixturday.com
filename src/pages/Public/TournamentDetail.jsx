import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import PublicNav from '../../components/PublicNav'

export default function TournamentDetail() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const [tournament, setTournament] = useState(null)
  const [ageGroups, setAgeGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('tournaments')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!t) { setLoading(false); return }
      setTournament(t)

      const { data: ag } = await supabase
        .from('age_groups')
        .select('*')
        .eq('tournament_id', t.id)
        .order('name')

      setAgeGroups(ag ?? [])
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return <div className="loading">Ielādē...</div>
  if (!tournament) return <div className="loading">Turnīrs nav atrasts.</div>

  return (
    <div>
    <PublicNav tournament={tournament} ageGroups={ageGroups} />
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--color-accent)' }}>
        {tournament.name}
      </h1>
      {tournament.description && <p style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>{tournament.description}</p>}

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
        Vecuma grupas
      </h2>
      {ageGroups.some(ag => ag.registration_open) && (
        <Link
          to={`/t/${tournament.slug}/register`}
          className="btn-primary"
          style={{ display: 'inline-block', marginBottom: '1.5rem', fontSize: '1rem' }}
        >
          {t('tournament.registerCTA')}
        </Link>
      )}
      {ageGroups.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Nav vecuma grupu.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {ageGroups.map(ag => (
            <Link key={ag.id} to={`/t/${slug}/${ag.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>{ag.name}</span>
                <span className={`badge ${ag.registration_open ? 'badge-success' : 'badge-muted'}`}>
                  {ag.registration_open ? 'Reģistrācija atvērta' : 'Reģistrācija slēgta'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}
