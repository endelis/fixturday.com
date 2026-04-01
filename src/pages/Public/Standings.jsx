import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { calculateStandings } from '../../utils/standings'
import PublicNav from '../../components/PublicNav'

export default function Standings() {
  const { slug, ageGroup: ageGroupId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: ag }, { data: teams }, { data: fixtures }, { data: results }] = await Promise.all([
        supabase.from('age_groups').select('*, tournaments(name, slug)').eq('id', ageGroupId).single(),
        supabase.from('teams').select('*').eq('age_group_id', ageGroupId).eq('status', 'confirmed'),
        supabase.from('fixtures').select('*, stages!inner(age_group_id)').eq('stages.age_group_id', ageGroupId),
        supabase.from('fixture_results').select('*'),
      ])
      setData({ ag, teams: teams ?? [], fixtures: fixtures ?? [], results: results ?? [] })
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('standings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixture_results' }, () => load())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [ageGroupId])

  if (loading) return <div className="loading">Ielādē...</div>
  if (!data?.ag) return <div className="loading">Vecuma grupa nav atrasta.</div>

  const { ag, teams, fixtures, results } = data
  const standings = calculateStandings(teams, fixtures, results)
  const tournament = ag.tournaments

  return (
    <div>
    <PublicNav tournament={tournament} activeAgeGroupId={ageGroupId} />
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: '0 0 1rem' }}>{ag.name} — Tabula</h1>

      <Link to={`/t/${slug}/${ageGroupId}/fixtures`} className="btn-secondary btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>
        Spēļu grafiks →
      </Link>

      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th><th>Komanda</th><th>S</th><th>U</th><th>N</th><th>Z</th><th>GV</th><th>GS</th><th>GS±</th><th>P</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={row.team.id}>
                <td>{i + 1}</td>
                <td><Link to={`/t/${slug}/${ageGroupId}/teams/${row.team.id}`} style={{ color: 'var(--color-accent)' }}>{row.team.name}</Link></td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.drawn}</td>
                <td>{row.lost}</td>
                <td>{row.gf}</td>
                <td>{row.ga}</td>
                <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                <td><strong>{row.points}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  )
}
