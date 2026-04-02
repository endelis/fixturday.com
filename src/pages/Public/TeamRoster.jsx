import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
import PublicNav from '../../components/PublicNav'

export default function TeamRoster() {
  const { slug, ageGroup: ageGroupId, teamId } = useParams()
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [siblings, setSiblings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase.from('teams').select('*, age_groups(id, name, tournament_id, tournaments(id, name, slug))').eq('id', teamId).single(),
        supabase.from('team_players').select('*').eq('team_id', teamId).order('number'),
      ])
      setTeam(t)
      setPlayers(p ?? [])
      if (t?.age_groups?.tournaments?.id) {
        const { data: sibs } = await supabase
          .from('age_groups').select('id, name')
          .eq('tournament_id', t.age_groups.tournaments.id).order('name')
        setSiblings(sibs ?? [])
      }
      setLoading(false)
    }
    load()
  }, [teamId])

  if (loading) return <div className="loading">Ielādē...</div>
  if (!team) return <div className="loading">Komanda nav atrasta.</div>

  const tournament = team.age_groups?.tournaments

  return (
    <div>
    <PublicNav tournament={tournament} ageGroups={siblings} activeAgeGroupId={ageGroupId} />
    <div className="container" style={{ paddingTop: '2rem' }}>
      <p><Link to={`/t/${slug}/${ageGroupId}`} style={{ color: 'var(--color-accent)' }}>← {team.age_groups?.name} tabula</Link></p>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: '0.5rem 0 0.25rem' }}>{team.name}</h1>
      {team.club && <p style={{ color: 'var(--color-text-muted)' }}>{team.club}</p>}

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginTop: '1.5rem', marginBottom: '1rem' }}>Spēlētāji</h2>
      {players.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Nav reģistrētu spēlētāju.</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>#</th><th>Vārds</th><th>Dzimšanas datums</th></tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id}>
                <td>{p.number ?? '—'}</td>
                <td>{p.name}</td>
                <td>{p.date_of_birth ? format(new Date(p.date_of_birth), 'dd/MM/yyyy') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    </div>
  )
}
