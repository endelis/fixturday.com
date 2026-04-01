import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { lv } from 'date-fns/locale'
import { toast } from '../../components/Toast'

export default function Matchday() {
  const [fixtures, setFixtures] = useState([])
  const [scores, setScores] = useState({})
  const [saving, setSaving] = useState({})
  const [loading, setLoading] = useState(true)

  async function load() {
    const today = new Date()
    const start = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const end = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    const { data: fx } = await supabase
      .from('fixtures')
      .select(`
        *,
        home_team:teams!home_team_id(name),
        away_team:teams!away_team_id(name),
        pitch:pitches(name, venues(name)),
        fixture_results(id, home_goals, away_goals),
        stages(age_groups(name, tournaments(name)))
      `)
      .gte('kickoff_time', start)
      .lte('kickoff_time', end)
      .order('kickoff_time')

    const allFx = fx ?? []
    setFixtures(allFx)

    const initialScores = {}
    allFx.forEach(f => {
      const r = f.fixture_results?.[0]
      initialScores[f.id] = { home: r?.home_goals ?? 0, away: r?.away_goals ?? 0 }
    })
    setScores(initialScores)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveScore(f) {
    setSaving(prev => ({ ...prev, [f.id]: true }))
    const existing = f.fixture_results?.[0]
    const score = scores[f.id]

    const { error } = existing
      ? await supabase.from('fixture_results').update({ home_goals: score.home, away_goals: score.away }).eq('id', existing.id)
      : await supabase.from('fixture_results').insert({ fixture_id: f.id, home_goals: score.home, away_goals: score.away })

    if (error) { toast(`Kļūda: ${error.message}`, 'error'); setSaving(prev => ({ ...prev, [f.id]: false })); return }

    await supabase.from('fixtures').update({ status: 'completed' }).eq('id', f.id)
    toast('Rezultāts saglabāts!')
    setSaving(prev => ({ ...prev, [f.id]: false }))
    load()
  }

  async function setStatus(fixtureId, status) {
    const { error } = await supabase.from('fixtures').update({ status }).eq('id', fixtureId)
    if (error) { toast(`Kļūda: ${error.message}`, 'error'); return }
    load()
  }

  const STATUS_LABELS = { scheduled: 'Ieplānota', live: 'Tiešraidē', completed: 'Pabeigta', postponed: 'Atlikta' }

  if (loading) return <div className="loading">Ielādē...</div>

  return (
    <div>
      <nav className="admin-nav">
        <Link to="/admin/dashboard" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
          ← Fixturday Admin
        </Link>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {format(new Date(), 'd. MMMM yyyy', { locale: lv })}
        </span>
      </nav>

      <div className="container" style={{ paddingTop: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '1.5rem' }}>Spēļu diena</h1>

        {fixtures.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Šodien nav ieplānotu spēļu.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {fixtures.map(f => {
              const score = scores[f.id] ?? { home: 0, away: 0 }
              const tournament = f.stages?.age_groups?.tournaments?.name
              const ageGroupName = f.stages?.age_groups?.name

              return (
                <div key={f.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      {tournament} · {ageGroupName}
                      {f.kickoff_time && ` · ${format(new Date(f.kickoff_time), 'HH:mm')}`}
                      {f.pitch && ` · ${f.pitch.venues?.name} — ${f.pitch.name}`}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {f.status !== 'live' && f.status !== 'completed' && (
                        <button className="btn-primary btn-sm" onClick={() => setStatus(f.id, 'live')}>▶ Live</button>
                      )}
                      {f.status === 'live' && (
                        <span className="live-badge">LIVE</span>
                      )}
                      <button className="btn-secondary btn-sm" onClick={() => setStatus(f.id, 'postponed')}>Atlikt</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ flex: 1, textAlign: 'right', fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>
                      {f.home_team?.name}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={score.home}
                        onChange={e => setScores(prev => ({ ...prev, [f.id]: { ...prev[f.id], home: Number(e.target.value) } }))}
                        style={{ width: '3.5rem', textAlign: 'center', fontSize: '1.5rem', fontFamily: 'var(--font-heading)', background: 'var(--color-surface-2)', border: '2px solid var(--color-accent)', color: 'var(--color-text)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}
                      />
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-text-muted)' }}>:</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={score.away}
                        onChange={e => setScores(prev => ({ ...prev, [f.id]: { ...prev[f.id], away: Number(e.target.value) } }))}
                        style={{ width: '3.5rem', textAlign: 'center', fontSize: '1.5rem', fontFamily: 'var(--font-heading)', background: 'var(--color-surface-2)', border: '2px solid var(--color-accent)', color: 'var(--color-text)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}
                      />
                    </div>

                    <span style={{ flex: 1, fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>
                      {f.away_team?.name}
                    </span>

                    <button
                      className="btn-primary"
                      onClick={() => saveScore(f)}
                      disabled={saving[f.id]}
                    >
                      {saving[f.id] ? '...' : f.fixture_results?.[0] ? 'Atjaunināt' : 'Saglabāt'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
