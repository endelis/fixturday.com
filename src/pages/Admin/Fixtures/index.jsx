import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { generateRoundRobin } from '../../../utils/generators/roundRobin'
import { generateKnockout } from '../../../utils/generators/knockout'
import { generateGroupStage } from '../../../utils/generators/groupStage'
import { toast } from '../../../components/Toast'
import FixtureList from './FixtureList'
import SchedulerModal from './SchedulerModal'

export default function Fixtures() {
  const { ageGroupId } = useParams()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [ageGroup, setAgeGroup] = useState(null)
  const [teams, setTeams] = useState([])
  const [stages, setStages] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [schedulerOpen, setSchedulerOpen] = useState(false)

  async function load() {
    const [agRes, tmRes, stRes, fxRes] = await Promise.all([
      supabase.from('age_groups').select('*, tournaments(id, name, sport, start_date, first_game_time, last_game_time, lunch_start, lunch_end)').eq('id', ageGroupId).single(),
      supabase.from('teams').select('*').eq('age_group_id', ageGroupId).eq('status', 'confirmed'),
      supabase.from('stages').select('*').eq('age_group_id', ageGroupId).order('sequence'),
      supabase.from('fixtures').select('*, round_name, group_label, home_placeholder, away_placeholder, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), pitch:pitches(name), stages!inner(age_group_id, type), fixture_results(home_goals, away_goals)').eq('stages.age_group_id', ageGroupId).order('round'),
    ])
    if (agRes.error || tmRes.error || stRes.error || fxRes.error) {
      toast(t('common.error'), 'error')
      setLoading(false)
      return
    }
    const { data: ag } = agRes
    const { data: tm } = tmRes
    const { data: st } = stRes
    const { data: fx } = fxRes
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
  useEffect(() => { if (schedulerOpen) load() }, [schedulerOpen])

  async function regenerateFixtures() {
    if (teams.length < 2) { toast(t('fixture.needMoreTeams'), 'warning'); return }
    if (!confirm(t('fixture.confirmRegenerate'))) return
    setGenerating(true)
    const { error: delError } = await supabase.from('stages').delete().eq('age_group_id', ageGroupId)
    if (delError) { toast(t('common.error'), 'error'); setGenerating(false); return }
    setStages([])
    setFixtures([])
    await generateFixtures(0)
  }

  async function generateFixtures(stageOffset = stages.length) {
    if (teams.length < 2) { toast(t('fixture.needMoreTeams'), 'warning'); return }
    setGenerating(true)

    if (ageGroup.format === 'group_knockout') {
      // Use groups_count set by organiser; fall back to derivation from teams_per_group for legacy age groups
      const groupsCount = ageGroup.groups_count
        ?? Math.max(2, Math.ceil(teams.length / (ageGroup.teams_per_group ?? 4)))
      const teamsAdvancing = ageGroup.teams_advancing ?? 2
      const bracketSeeding = ageGroup.bracket_seeding ?? 'cross'

      const { data: groupStage, error: gsError } = await supabase.from('stages').insert({ age_group_id: ageGroupId, name: t('fixture.stageGroupStage'), type: 'group_stage', sequence: stageOffset + 1 }).select().single()
      if (gsError) { toast(t('common.error'), 'error'); setGenerating(false); return }

      const { groupFixtures, knockoutFixtures } = generateGroupStage(teams, groupsCount, teamsAdvancing, null, bracketSeeding)
      const groupRows = groupFixtures.map(f => ({ stage_id: groupStage.id, home_team_id: f.homeTeamId, away_team_id: f.awayTeamId, round: f.round, group_label: f.group ?? null, round_name: null, status: 'scheduled' }))
      const { error: gfError } = await supabase.from('fixtures').insert(groupRows)
      if (gfError) { toast(t('common.error'), 'error'); setGenerating(false); return }

      const { data: knockoutStage, error: ksError } = await supabase.from('stages').insert({ age_group_id: ageGroupId, name: t('fixture.stageKnockout'), type: 'knockout', sequence: stageOffset + 2 }).select().single()
      if (ksError) { toast(t('common.error'), 'error'); setGenerating(false); return }

      if (knockoutFixtures.length > 0) {
        const knockoutRows = knockoutFixtures.map(f => ({
          stage_id: knockoutStage.id,
          home_team_id: null,
          away_team_id: null,
          round: f.round,
          round_name: f.round_name ?? null,
          group_label: null,
          home_placeholder: f.home_placeholder,
          away_placeholder: f.away_placeholder,
          status: 'scheduled',
        }))
        const { error: kfError } = await supabase.from('fixtures').insert(knockoutRows)
        if (kfError) { toast(t('common.error'), 'error'); setGenerating(false); return }
      }

      toast(t('fixture.generated'))
      setGenerating(false); load(); return
    }

    const stageConfig = ageGroup.format === 'knockout'
      ? { name: t('fixture.stageKnockout'), type: 'knockout' }
      : { name: t('fixture.stageRoundRobin'), type: 'round_robin' }
    const { data: stage, error: stageError } = await supabase.from('stages').insert({ age_group_id: ageGroupId, ...stageConfig, sequence: stageOffset + 1 }).select().single()
    if (stageError) { toast(t('common.error'), 'error'); setGenerating(false); return }

    let rounds
    if (ageGroup.format === 'knockout') {
      const knockoutRounds = generateKnockout(teams)
      rounds = knockoutRounds.flatMap(r => r.fixtures.map(f => ({ ...f, round_name: r.name })))
    } else {
      rounds = generateRoundRobin(teams, ageGroup.rr_circles ?? 1).flat()
    }
    const fixtureRows = rounds.filter(f => f.home?.id && f.away?.id).map(f => ({ stage_id: stage.id, home_team_id: f.home.id, away_team_id: f.away.id, round: f.round, round_name: f.round_name ?? null, status: 'scheduled' }))
    const { error: fxError } = await supabase.from('fixtures').insert(fixtureRows)
    if (fxError) { toast(t('common.error'), 'error'); setGenerating(false); return }
    toast(t('fixture.generated'))
    setGenerating(false); load()
  }

  async function updateFixture(fixtureId, changes) {
    const { error } = await supabase.from('fixtures').update(changes).eq('id', fixtureId)
    if (error) { toast(t('common.error'), 'error'); return }
    // No load() — kickoff draft and uncontrolled pitch select already reflect the
    // saved state; reloading would clear kickoffDrafts mid-edit via byRound change.
  }

  function openScheduler() {
    if (pitches.length === 0) { toast(t('fixture.noPitchesWarning'), 'warning'); return }
    setSchedulerOpen(true)
  }

  if (authLoading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />
  if (loading) return <div className="loading">{t('common.loading')}</div>

  return (
    <div>
      <nav className="admin-nav">
        <Link to={`/admin/tournaments/${ageGroup?.tournaments?.id}/age-groups`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
          ← {ageGroup?.tournaments?.name} / {ageGroup?.name}
        </Link>
      </nav>
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>{t('fixture.title')} — {ageGroup?.name}</h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {fixtures.length === 0 && (
              <button className="btn-primary" onClick={() => generateFixtures()} disabled={generating}>
                {generating ? t('fixture.generating') : `⚡ ${t('fixture.generate')}`}
              </button>
            )}
            {fixtures.length > 0 && (
              <>
                <button className="btn-secondary" onClick={regenerateFixtures} disabled={generating}>{t('fixture.regenerate')}</button>
                <button className="btn-primary" onClick={openScheduler}>{t('fixture.schedule')}</button>
              </>
            )}
          </div>
        </div>
        {fixtures.length > 0 && (
          <div style={{ borderLeft: '3px solid var(--color-accent)', background: 'var(--color-surface)', padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
            {t('fixture.addTeamsFirst')}
          </div>
        )}
        <FixtureList fixtures={fixtures} format={ageGroup?.format} pitches={pitches} teams={teams} updateFixture={updateFixture} />
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
