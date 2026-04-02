import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { generateRoundRobin } from '../../utils/generators/roundRobin'
import { generateKnockout } from '../../utils/generators/knockout'
import { generateGroupStage } from '../../utils/generators/groupStage'
import { generateSchedule } from '../../utils/scheduler'
import { format } from 'date-fns'
import { toast } from '../../components/Toast'

export default function Fixtures() {
  const { ageGroupId } = useParams()
  const { t } = useTranslation()
  const [ageGroup, setAgeGroup] = useState(null)
  const [teams, setTeams] = useState([])
  const [stages, setStages] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Scheduler modal state
  const [schedulerOpen, setSchedulerOpen] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')
  const [schedDate, setSchedDate] = useState(today)
  const [schedPitches, setSchedPitches] = useState(1)
  const [schedFirst, setSchedFirst] = useState('09:00')
  const [schedLast, setSchedLast] = useState('18:00')
  const [schedLunchEnabled, setSchedLunchEnabled] = useState(false)
  const [schedLunchStart, setSchedLunchStart] = useState('')
  const [schedLunchEnd, setSchedLunchEnd] = useState('')
  const [schedResult, setSchedResult] = useState(null)
  const [schedSaving, setSchedSaving] = useState(false)

  async function load() {
    const [{ data: ag }, { data: t }, { data: st }, { data: fx }] = await Promise.all([
      supabase.from('age_groups').select('*, tournaments(id, name, first_game_time, last_game_time, lunch_start, lunch_end)').eq('id', ageGroupId).single(),
      supabase.from('teams').select('*').eq('age_group_id', ageGroupId).eq('status', 'confirmed'),
      supabase.from('stages').select('*').eq('age_group_id', ageGroupId).order('sequence'),
      supabase.from('fixtures').select(`*, round_name, group_label, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), pitch:pitches(name), stages!inner(age_group_id, type)`).eq('stages.age_group_id', ageGroupId).order('round'),
    ])
    setAgeGroup(ag)
    setTeams(t ?? [])
    setStages(st ?? [])
    setFixtures(fx ?? [])

    // Initialise scheduler defaults from tournament settings
    if (ag?.tournaments) {
      if (ag.tournaments.first_game_time) setSchedFirst(ag.tournaments.first_game_time.slice(0, 5))
      if (ag.tournaments.last_game_time) setSchedLast(ag.tournaments.last_game_time.slice(0, 5))
      if (ag.tournaments.lunch_start) setSchedLunchStart(ag.tournaments.lunch_start.slice(0, 5))
      if (ag.tournaments.lunch_end) setSchedLunchEnd(ag.tournaments.lunch_end.slice(0, 5))
    }

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
      // Stage 1: group stage
      const { data: groupStage, error: gsError } = await supabase.from('stages').insert({
        age_group_id: ageGroupId,
        name: 'Grupu posms',
        type: 'group',
        sequence: stages.length + 1,
      }).select().single()
      if (gsError) { toast(`Kļūda: ${gsError.message}`, 'error'); setGenerating(false); return }

      const { allFixtures } = generateGroupStage(teams)
      const groupRows = allFixtures
        .filter(f => f.home?.id && f.away?.id)
        .map(f => ({
          stage_id: groupStage.id,
          home_team_id: f.home.id,
          away_team_id: f.away.id,
          round: f.round,
          group_label: f.group ?? null,
          round_name: null,
          status: 'scheduled',
        }))
      const { error: gfError } = await supabase.from('fixtures').insert(groupRows)
      if (gfError) { toast(`Kļūda: ${gfError.message}`, 'error'); setGenerating(false); return }

      // Stage 2: knockout stage (empty, filled later)
      const { error: ksError } = await supabase.from('stages').insert({
        age_group_id: ageGroupId,
        name: 'Izslēgšanas kārtas',
        type: 'knockout',
        sequence: stages.length + 2,
      })
      if (ksError) { toast(`Kļūda: ${ksError.message}`, 'error'); setGenerating(false); return }

      toast(`${groupRows.length} spēles ģenerētas!`)
      setGenerating(false)
      load()
      return
    }

    // knockout or round_robin
    const stageConfig = ageGroup.format === 'knockout'
      ? { name: 'Izslēgšanas kārtas', type: 'knockout' }
      : { name: 'Apļa turnīrs', type: 'round_robin' }

    const { data: stage, error: stageError } = await supabase.from('stages').insert({
      age_group_id: ageGroupId,
      ...stageConfig,
      sequence: stages.length + 1,
    }).select().single()

    if (stageError) { toast(`Kļūda: ${stageError.message}`, 'error'); setGenerating(false); return }

    let rounds
    if (ageGroup.format === 'knockout') {
      const knockoutRounds = generateKnockout(teams)
      rounds = knockoutRounds.flatMap(r => r.fixtures.map(f => ({ ...f, round_name: r.name })))
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
        round_name: f.round_name ?? null,
        status: 'scheduled',
      }))

    const { error: fxError } = await supabase.from('fixtures').insert(fixtureRows)
    if (fxError) { toast(`Kļūda: ${fxError.message}`, 'error'); setGenerating(false); return }

    toast(`${fixtureRows.length} spēles ģenerētas!`)
    setGenerating(false)
    load()
  }

  function openScheduler() {
    if (pitches.length === 0) {
      toast('Nav konfigurētu laukumu. Pievienojiet laukumus sadaļā Vietas.', 'warning')
      return
    }
    setSchedResult(null)
    setSchedulerOpen(true)
  }

  function runPreview() {
    console.log('[Scheduler] fixtures count:', fixtures.length)
    console.log('[Scheduler] params:', { schedDate, schedPitches, schedFirst, schedLast })
    const result = generateSchedule({
      fixtures: fixtures.map(f => ({ id: f.id, homeTeamId: f.home_team_id, awayTeamId: f.away_team_id })),
      pitchCount: Number(schedPitches),
      gameDuration: ageGroup.game_duration_minutes || 20,
      firstGameTime: schedFirst || '09:00',
      lastGameTime: schedLast || '18:00',
      lunchStart: schedLunchEnabled ? (schedLunchStart || null) : null,
      lunchEnd: schedLunchEnabled ? (schedLunchEnd || null) : null,
      date: schedDate,
    })
    setSchedResult(result)
  }

  async function confirmSchedule() {
    if (!schedResult?.schedule?.length) return
    console.log('[Scheduler] confirming', schedResult.schedule.length, 'slots')
    setSchedSaving(true)
    try {
      for (const item of schedResult.schedule) {
        const { error } = await supabase
          .from('fixtures')
          .update({ kickoff_time: item.kickoff, pitch_id: pitches[item.pitchIndex]?.id || null })
          .eq('id', item.fixtureId)
        if (error) throw error
      }
      toast(t('fixture.schedSaved'))
      setSchedulerOpen(false)
      setSchedResult(null)
      load()
    } catch (err) {
      console.error('[Scheduler] confirm error:', err)
      toast(`${t('common.error')}: ${err.message}`, 'error')
    } finally {
      setSchedSaving(false)
    }
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
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {fixtures.length === 0 && (
              <button className="btn-primary" onClick={generateFixtures} disabled={generating}>
                {generating ? 'Ģenerē...' : '⚡ Ģenerēt spēles'}
              </button>
            )}
            {fixtures.length > 0 && (
              <button className="btn-primary" onClick={openScheduler}>
                {t('fixture.schedule')}
              </button>
            )}
          </div>
        </div>

        {fixtures.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p>Nav spēļu. Apstiprinātas komandas: <strong style={{ color: 'var(--color-text)' }}>{teams.length}</strong></p>
          </div>
        ) : (
          Object.keys(byRound).sort((a, b) => Number(a) - Number(b)).map(round => {
            const sampleFixture = byRound[round][0]
            const roundLabel = sampleFixture?.round_name || `Kārta ${round}`
            return (
            <div key={round} style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
                {roundLabel}
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
          )})
        )}
      </div>

      {schedulerOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={e => { if (e.target === e.currentTarget) setSchedulerOpen(false) }}
        >
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: '2rem', width: '100%', maxWidth: '680px',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
              {t('fixture.schedulerTitle')}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                {t('fixture.schedDate')}
                <input
                  type="date"
                  value={schedDate}
                  onChange={e => setSchedDate(e.target.value)}
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                {t('fixture.schedPitches')}
                <input
                  type="number"
                  min={1}
                  value={schedPitches}
                  onChange={e => setSchedPitches(e.target.value)}
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                {t('fixture.schedFirstGame')}
                <input
                  type="time"
                  value={schedFirst}
                  onChange={e => setSchedFirst(e.target.value)}
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                {t('fixture.schedLastGame')}
                <input
                  type="time"
                  value={schedLast}
                  onChange={e => setSchedLast(e.target.value)}
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
                />
              </label>

              {/* Lunch toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={schedLunchEnabled}
                  onChange={e => setSchedLunchEnabled(e.target.checked)}
                />
                {t('fixture.schedLunchToggle')}
              </label>

              {schedLunchEnabled && (
                <>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                    {t('fixture.schedLunchStart')}
                    <input type="time" value={schedLunchStart} onChange={e => setSchedLunchStart(e.target.value)}
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                    {t('fixture.schedLunchEnd')}
                    <input type="time" value={schedLunchEnd} onChange={e => setSchedLunchEnd(e.target.value)}
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }} />
                  </label>
                </>
              )}
            </div>

            <button className="btn-primary" onClick={runPreview} style={{ marginBottom: '1.5rem' }}>
              {t('fixture.schedPreview')}
            </button>

            {schedResult && (
              <>
                {schedResult.warnings?.length > 0 && (
                  <div style={{ background: 'rgba(255,200,0,0.15)', border: '1px solid rgba(255,200,0,0.4)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    <strong>{t('fixture.schedWarnings')}:</strong>
                    <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                      {schedResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}

                {schedResult.schedule?.length > 0 && (
                  <>
                    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Laiks</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Laukums</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Mājas</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>pret</th>
                            <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Viesi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedResult.schedule.map((item, i) => {
                            const fx = fixtures.find(f => f.id === item.fixtureId)
                            const pitchLabel = pitches[item.pitchIndex]
                              ? `${pitches[item.pitchIndex].venue_name} — ${pitches[item.pitchIndex].name}`
                              : `Laukums ${item.pitchIndex + 1}`
                            return (
                              <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '0.5rem 0.75rem' }}>{item.kickoff ? item.kickoff.slice(11, 16) : ''}</td>
                                <td style={{ padding: '0.5rem 0.75rem' }}>{pitchLabel}</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{fx?.home_team?.name ?? ''}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>pret</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{fx?.away_team?.name ?? ''}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <button className="btn-primary" onClick={confirmSchedule} disabled={schedSaving}>
                      {schedSaving ? 'Saglabā...' : t('fixture.schedConfirm')}
                    </button>
                  </>
                )}
              </>
            )}

            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button
                onClick={() => setSchedulerOpen(false)}
                style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              >
                Aizvērt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
