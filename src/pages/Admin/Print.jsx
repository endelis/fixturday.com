import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'

export default function Print() {
  const { id: tournamentId } = useParams()
  const [tournament, setTournament] = useState(null)
  const [ageGroups, setAgeGroups] = useState([])
  const [fixturesByGroup, setFixturesByGroup] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single()
      if (!t) { setLoading(false); return }
      setTournament(t)

      const { data: ag } = await supabase
        .from('age_groups').select('*').eq('tournament_id', tournamentId).order('name')

      const groups = ag ?? []
      setAgeGroups(groups)

      const result = {}
      await Promise.all(groups.map(async g => {
        const { data: fx } = await supabase
          .from('fixtures')
          .select(`
            *,
            home_team:teams!home_team_id(name),
            away_team:teams!away_team_id(name),
            pitch:pitches(name, venues(name)),
            fixture_results(home_goals, away_goals),
            stages!inner(age_group_id)
          `)
          .eq('stages.age_group_id', g.id)
          .order('kickoff_time', { ascending: true })
        result[g.id] = fx ?? []
      }))

      setFixturesByGroup(result)
      setLoading(false)
    }
    load()
  }, [tournamentId])

  useEffect(() => {
    if (!loading && tournament) {
      setTimeout(() => window.print(), 500)
    }
  }, [loading, tournament])

  if (loading) return <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>Sagatavo drukāšanai...</div>
  if (!tournament) return <div style={{ padding: '2rem' }}>Turnīrs nav atrasts.</div>

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#000', background: '#fff', padding: '1.5cm' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', borderBottom: '2px solid #000', paddingBottom: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2rem', margin: 0 }}>{tournament.name}</h1>
          {tournament.start_date && (
            <p style={{ margin: '0.25rem 0 0', color: '#555', fontSize: '0.875rem' }}>
              {format(new Date(tournament.start_date), 'dd/MM/yyyy')}
              {tournament.end_date && ` – ${format(new Date(tournament.end_date), 'dd/MM/yyyy')}`}
            </p>
          )}
        </div>
        <p style={{ margin: 0, color: '#555', fontSize: '0.75rem' }}>fixturday.com</p>
      </div>

      {ageGroups.map(ag => {
        const fixtures = fixturesByGroup[ag.id] ?? []
        if (fixtures.length === 0) return null

        const byRound = fixtures.reduce((acc, f) => {
          const r = f.round ?? 0
          ;(acc[r] = acc[r] ?? []).push(f)
          return acc
        }, {})

        return (
          <div key={ag.id} style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.4rem', margin: '0 0 0.75rem', borderBottom: '1px solid #ccc', paddingBottom: '0.25rem' }}>
              {ag.name}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #ccc', padding: '0.3rem 0.5rem', textAlign: 'left' }}>Kārta</th>
                  <th style={{ border: '1px solid #ccc', padding: '0.3rem 0.5rem', textAlign: 'left' }}>Laiks</th>
                  <th style={{ border: '1px solid #ccc', padding: '0.3rem 0.5rem', textAlign: 'left' }}>Laukums</th>
                  <th style={{ border: '1px solid #ccc', padding: '0.3rem 0.5rem', textAlign: 'right' }}>Mājas</th>
                  <th style={{ border: '1px solid #ccc', padding: '0.3rem 0.5rem', textAlign: 'center', minWidth: '4rem' }}>Rezultāts</th>
                  <th style={{ border: '1px solid #ccc', padding: '0.3rem 0.5rem', textAlign: 'left' }}>Viesi</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(byRound).sort((a, b) => Number(a) - Number(b)).flatMap(round =>
                  byRound[round].map(f => {
                    const result = f.fixture_results?.[0]
                    return (
                      <tr key={f.id}>
                        <td style={{ border: '1px solid #ccc', padding: '0.3rem 0.5rem' }}>{round}</td>
                        <td style={{ border: '1px solid #ccc', padding: '0.3rem 0.5rem', whiteSpace: 'nowrap' }}>
                          {f.kickoff_time ? format(new Date(f.kickoff_time), 'dd.MM HH:mm') : '—'}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '0.3rem 0.5rem' }}>
                          {f.pitch ? `${f.pitch.venues?.name} – ${f.pitch.name}` : '—'}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '0.3rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>
                          {f.home_team?.name ?? '?'}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '0.3rem 0.5rem', textAlign: 'center', fontWeight: 700, letterSpacing: '0.05em' }}>
                          {result ? `${result.home_goals} : ${result.away_goals}` : ' : '}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '0.3rem 0.5rem', fontWeight: 600 }}>
                          {f.away_team?.name ?? '?'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
