import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { generateRoundRobin } from '../../utils/generators/roundRobin'
import { generateKnockout } from '../../utils/generators/knockout'
import { generateGroupStage } from '../../utils/generators/groupStage'
import { format } from 'date-fns'
import { toast } from '../../components/Toast'

export default function Fixtures() {
  const { ageGroupId } = useParams()
  const [ageGroup, setAgeGroup] = useState(null)
  const [teams, setTeams] = useState([])
  const [stages, setStages] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  async function load() {
    const [{ data: ag }, { data: t }, { data: st }, { data: fx }] = await Promise.all([
      supabase.from('age_groups').select('*, tournaments(id, name)').eq('id', ageGroupId).single(),
      supabase.from('teams').select('*').eq('age_group_id', ageGroupId).eq('status', 'confirmed'),
      supabase.from('stages').select('*').eq('age_group_id', ageGroupId).order('sequence'),
      supabase.from('fixtures').select(`*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), pitch:pitches(name), stages!inner(age_group_id)`).eq('stages.age_group_id', ageGroupId).order('round'),
    ])
    setAgeGroup(ag)
    setTeams(t ?? [])
    setStages(st ?? [])
    setFixtures(fx ?? [])

    if (ag?.tournaments?.id) {
      const { data: venues } = await supabase.from('venues').select('*, pitches(*)').eq('tournament_id', ag.tournaments.id)
      setPitches((venues ?? []).flatMap(v => (v.pitches ?? []).map(p => ({ ...p, venue_name: v.name }))))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [ageGroupId])

  async function generateFixtures() {
    if (teams.length < 2) { toast('Nepieciešamas vismaz 2 apstiprinātas komandas.', 'warning'); return }
    setGenerating(true)

    const { data: stage, error: stageError } = await supabase.from('stages').insert({
      age_group_id: ageGroupId,
      name: ageGroup.format === 'knockout' ? 'Izslēgšanas kārtas' : 'Apļa turnīrs',
      type: ageGroup.format === 'knockout' ? 'knockout' : 'round_robin',
      sequence: stages.length + 1,
    }).select().single()

    if (stageError) { toast(`Kļūda: ${stageError.message}`, 'error'); setGenerating(false); return }

    let rounds
    if (ageGroup.format === 'knockout') {
      rounds = generateKnockout(teams).flatMap(r => r.fixtures)
    } else if (ageGroup.format === 'group_knockout') {
      const { allFixtures } = generateGroupStage(teams)
      rounds = allFixtures
    } else {
      rounds = generateRoundRobin(teams).flat()
    }

    const fixtureRows = rounds
      .filter(f => f.home?.id && f.away?.id)
      .map(f => ({
        stage_id: stage.id,
        home_team_id: f.home.id,
        away_team_id: f.away.id,
        round: f.round,
        status: 'scheduled',
      }))

    const { error: fxError } = await supabase.from('fixtures').insert(fixtureRows)
    if (fxError) { toast(`Kļūda: ${fxError.message}`, 'error'); setGenerating(false); return }

    toast(`${fixtureRows.length} spēles ģenerētas!`)
    setGenerating(false)
    load()
  }

  async function updateFixture(fixtureId, changes) {
    const { error } = await supabase.from('fixtures').update(changes).eq('id', fixtureId)
    if (error) { toast(`Kļūda: ${error.message}`, 'error'); return }
    load()
  }

  if (loading) return <div className="loading">Ielādē...</div>

  const byRound = fixtures.reduce((acc, f) => {
    const r = f.round ?? 0
    ;(acc[r] = acc[r] ?? []).push(f)
    return acc
  }, {})

  return (
    <div>
      <nav className="admin-nav">
        <Link to={`/admin/tournaments/${ageGroup?.tournaments?.id}/age-groups`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
          ← {ageGroup?.tournaments?.name} / {ageGroup?.name}
        </Link>
      </nav>

      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>Spēles — {ageGroup?.name}</h1>
          {fixtures.length === 0 && (
            <button className="btn-primary" onClick={generateFixtures} disabled={generating}>
              {generating ? 'Ģenerē...' : '⚡ Ģenerēt spēles'}
            </button>
          )}
        </div>

        {fixtures.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p>Nav spēļu. Apstiprinātas komandas: <strong style={{ color: 'var(--color-text)' }}>{teams.length}</strong></p>
          </div>
        ) : (
          Object.keys(byRound).sort((a, b) => Number(a) - Number(b)).map(round => (
            <div key={round} style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
                Kārta {round}
              </h2>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {byRound[round].map(f => (
                  <div key={f.id} className="card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>{f.home_team?.name}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>pret</span>
                      <span style={{ flex: 1, fontWeight: 600 }}>{f.away_team?.name}</span>
                      <input
                        type="datetime-local"
                        defaultValue={f.kickoff_time ? format(new Date(f.kickoff_time), "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={e => updateFixture(f.id, { kickoff_time: e.target.value || null })}
                        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}
                      />
                      <select
                        defaultValue={f.pitch_id ?? ''}
                        onChange={e => updateFixture(f.id, { pitch_id: e.target.value || null })}
                        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}
                      >
                        <option value="">Laukums...</option>
                        {pitches.map(p => <option key={p.id} value={p.id}>{p.venue_name} — {p.name}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
