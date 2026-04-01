import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { lv } from 'date-fns/locale'
import PublicNav from '../../components/PublicNav'

export default function Schedule() {
  const { slug, ageGroup: ageGroupId } = useParams()
  const [ag, setAg] = useState(null)
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: agData } = await supabase
        .from('age_groups')
        .select('*, tournaments(name, slug)')
        .eq('id', ageGroupId)
        .single()

      const { data: fx } = await supabase
        .from('fixtures')
        .select(`
          *,
          home_team:teams!home_team_id(id, name),
          away_team:teams!away_team_id(id, name),
          pitch:pitches(name, venues(name)),
          fixture_results(home_goals, away_goals),
          stages!inner(age_group_id)
        `)
        .eq('stages.age_group_id', ageGroupId)
        .order('kickoff_time', { ascending: true })

      setAg(agData)
      setFixtures(fx ?? [])
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('schedule-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixture_results' }, () => load())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [ageGroupId])

  if (loading) return <div className="loading">Ielādē...</div>

  const grouped = fixtures.reduce((acc, f) => {
    const day = f.kickoff_time ? format(new Date(f.kickoff_time), 'yyyy-MM-dd') : 'nav-datuma'
    ;(acc[day] = acc[day] ?? []).push(f)
    return acc
  }, {})

  return (
    <div>
    <PublicNav tournament={ag?.tournaments} activeAgeGroupId={ageGroupId} />
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: '0 0 1.5rem' }}>
        {ag?.name} — Spēļu grafiks
      </h1>

      {Object.keys(grouped).sort().map(day => (
        <div key={day} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
            {day === 'nav-datuma' ? 'Datums nav norādīts' : format(new Date(day), 'd. MMMM yyyy', { locale: lv })}
          </h2>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {grouped[day].map(f => {
              const result = f.fixture_results?.[0]
              return (
                <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem' }}>
                  {f.kickoff_time && (
                    <span style={{ color: 'var(--color-text-muted)', minWidth: '3.5rem', fontSize: '0.875rem' }}>
                      {format(new Date(f.kickoff_time), 'HH:mm')}
                    </span>
                  )}
                  <span style={{ flex: 1, textAlign: 'right' }}>{f.home_team?.name ?? '?'}</span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', minWidth: '4rem', textAlign: 'center' }}>
                    {result ? `${result.home_goals} : ${result.away_goals}` : (
                      f.status === 'live'
                        ? <span className="live-badge">LIVE</span>
                        : 'pret'
                    )}
                  </span>
                  <span style={{ flex: 1 }}>{f.away_team?.name ?? '?'}</span>
                  {f.pitch && (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      {f.pitch.venues?.name} — {f.pitch.name}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {fixtures.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>Nav spēļu.</p>}
    </div>
    </div>
  )
}
