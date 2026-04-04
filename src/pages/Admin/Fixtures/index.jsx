import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { generateRoundRobin } from '../../../utils/generators/roundRobin'
import { generateKnockout } from '../../../utils/generators/knockout'
import { generateGroupStage } from '../../../utils/generators/groupStage'
import { toast } from '../../../components/Toast'
import FixtureList from './FixtureList'
import SchedulerModal from './SchedulerModal'

export default function Fixtures() {
  const { ageGroupId } = useParams()
  const [ageGroup, setAgeGroup] = useState(null)
  const [teams, setTeams] = useState([])
  const [stages, setStages] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [schedulerOpen, setSchedulerOpen] = useState(false)

  async function load() {
    const [{ data: ag }, { data: tm }, { data: st }, { data: fx }] = await Promise.all([
      supabase.from('age_groups').select('*, tournaments(id, name, first_game_time, last_game_time, lunch_start, lunch_end)').eq('id', ageGroupId).single(),
      supabase.from('teams').select('*').eq('age_group_id', ageGroupId).eq('status', 'confirmed'),
      supabase.from('stages').select('*').eq('age_group_id', ageGroupId).order('sequence'),
      supabase.from('fixtures').select('*, round_name, group_label, home_placeholder, away_placeholder, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), pitch:pitches(name), stages!inner(age_group_id, type)').eq('stages.age_group_id', ageGroupId).order('round'),
    ])
    setAgeGroup(ag)
    setTeams(tm ?? [])
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

    if (ageGroup.format === 'group_knockout') {
      const groupsCount = ageGroup.groups_count ?? 2
      const teamsAdvancing = ageGroup.teams_advancing ?? 2

      const { data: groupStage, error: gsError } = await supabase.from('stages').insert({ age_group_id: ageGroupId, name: 'Grupu posms', type: 'group', sequence: stages.length + 1 }).select().single()
      if (gsError) { toast(`Kļūda: ${gsError.message}`, 'error'); setGenerating(false); return }

      const { groupFixtures, knockoutFixtures } = generateGroupStage(teams, groupsCount, teamsAdvancing)
      const groupRows = groupFixtures.map(f => ({ stage_id: groupStage.id, home_team_id: f.homeTeamId, away_team_id: f.awayTeamId, round: f.round, group_label: f.group ?? null, round_name: null, status: 'scheduled' }))
      const { error: gfError } = await supabase.from('fixtures').insert(groupRows)
      if (gfError) { toast(`Kļūda: ${gfError.message}`, 'error'); setGenerating(false); return }

      const { data: knockoutStage, error: ksError } = await supabase.from('stages').insert({ age_group_id: ageGroupId, name: 'Izslēgšanas kārtas', type: 'knockout', sequence: stages.length + 2 }).select().single()
      if (ksError) { toast(`Kļūda: ${ksError.message}`, 'error'); setGenerating(false); return }

      if (knockoutFixtures.length > 0) {
        const knockoutRows = knockoutFixtures.map(f => ({
          stage_id: knockoutStage.id,
          home_team_id: null,
          away_team_id: null,
          round: f.round,
          round_name: null,
          group_label: null,
          home_placeholder: f.home_placeholder,
          away_placeholder: f.away_placeholder,
          status: 'scheduled',
        }))
        const { error: kfError } = await supabase.from('fixtures').insert(knockoutRows)
        if (kfError) { toast(`Kļūda: ${kfError.message}`, 'error'); setGenerating(false); return }
      }

      toast(`${groupRows.length} grupu spēles un ${knockoutFixtures.length} izslēgšanas spēles ģenerētas!`)
      setGenerating(false); load(); return
    }

    const stageConfig = ageGroup.format === 'knockout'
      ? { name: 'Izslēgšanas kārtas', type: 'knockout' }
      : { name: 'Apļa turnīrs', type: 'round_robin' }
    const { data: stage, error: stageError } = await supabase.from('stages').insert({ age_group_id: ageGroupId, ...stageConfig, sequence: stages.length + 1 }).select().single()
    if (stageError) { toast(`Kļūda: ${stageError.message}`, 'error'); setGenerating(false); return }

    let rounds
    if (ageGroup.format === 'knockout') {
      const knockoutRounds = generateKnockout(teams)
      rounds = knockoutRounds.flatMap(r => r.fixtures.map(f => ({ ...f, round_name: r.name })))
    } else {
      rounds = generateRoundRobin(teams).flat()
    }
    const fixtureRows = rounds.filter(f => f.home?.id && f.away?.id).map(f => ({ stage_id: stage.id, home_team_id: f.home.id, away_team_id: f.away.id, round: f.round, round_name: f.round_name ?? null, status: 'scheduled' }))
    const { error: fxError } = await supabase.from('fixtures').insert(fixtureRows)
    if (fxError) { toast(`Kļūda: ${fxError.message}`, 'error'); setGenerating(false); return }
    toast(`${fixtureRows.length} spēles ģenerētas!`)
    setGenerating(false); load()
  }

  async function updateFixture(fixtureId, changes) {
    const { error } = await supabase.from('fixtures').update(changes).eq('id', fixtureId)
    if (error) { toast(`Kļūda: ${error.message}`, 'error'); return }
    load()
  }

  function openScheduler() {
    if (pitches.length === 0) { toast('Nav konfigurētu laukumu. Pievienojiet laukumus sadaļā Vietas.', 'warning'); return }
    setSchedulerOpen(true)
  }

  if (loading) return <div className="loading">Ielādē...</div>

  const byRound = fixtures.reduce((acc, f) => { const r = f.round ?? 0; (acc[r] = acc[r] ?? []).push(f); return acc }, {})

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
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {fixtures.length === 0 && (
              <button className="btn-primary" onClick={generateFixtures} disabled={generating}>
                {generating ? 'Ģenerē...' : '⚡ Ģenerēt spēles'}
              </button>
            )}
            {fixtures.length > 0 && (
              <button className="btn-primary" onClick={openScheduler}>Ieplānot spēles</button>
            )}
          </div>
        </div>
        <FixtureList byRound={byRound} pitches={pitches} teams={teams} updateFixture={updateFixture} />
      </div>
      <SchedulerModal
        open={schedulerOpen}
        onClose={() => setSchedulerOpen(false)}
        fixtures={fixtures}
        pitches={pitches}
        ageGroup={ageGroup}
        onSaved={load}
      />
    </div>
  )
}
