import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { format, parse, isValid } from 'date-fns'
import { generateSchedule } from '../../../utils/scheduler'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'

/**
 * Self-contained scheduler modal.
 * Props: open, onClose, fixtures, pitches, ageGroup, onSaved
 */
export default function SchedulerModal({ open, onClose, fixtures, pitches, ageGroup, onSaved }) {
  const { t } = useTranslation()
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayDisplay = format(new Date(), 'dd/MM/yyyy')

  const [schedDate, setSchedDate] = useState(today)
  const [schedDateDisplay, setSchedDateDisplay] = useState(todayDisplay)

  function handleDateChange(val) {
    setSchedDateDisplay(val)
    const parsed = parse(val, 'dd/MM/yyyy', new Date())
    if (isValid(parsed)) setSchedDate(format(parsed, 'yyyy-MM-dd'))
  }
  const [schedPitches, setSchedPitches] = useState(1)
  const [schedGameDuration, setSchedGameDuration] = useState(ageGroup?.game_duration_minutes || 20)
  const [schedPitchGap, setSchedPitchGap] = useState(ageGroup?.pitch_gap_minutes || 5)
  const [schedFirst, setSchedFirst] = useState('09:00')
  const [schedLast, setSchedLast] = useState('18:00')
  const [schedLunchEnabled, setSchedLunchEnabled] = useState(false)
  const [schedLunchStart, setSchedLunchStart] = useState('')
  const [schedLunchEnd, setSchedLunchEnd] = useState('')
  const [schedResult, setSchedResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [availablePitches, setAvailablePitches] = useState([])
  const [selectedPitchIds, setSelectedPitchIds] = useState(new Set())

  // Sync scheduling defaults when ageGroup data arrives
  useEffect(() => {
    if (!ageGroup) return
    if (ageGroup.game_duration_minutes) setSchedGameDuration(ageGroup.game_duration_minutes)
    if (ageGroup.pitch_gap_minutes != null) setSchedPitchGap(ageGroup.pitch_gap_minutes)
    if (!ageGroup.tournaments) return
    const { first_game_time, last_game_time, lunch_start, lunch_end } = ageGroup.tournaments
    if (first_game_time) setSchedFirst(first_game_time.slice(0, 5))
    if (last_game_time) setSchedLast(last_game_time.slice(0, 5))
    if (lunch_start) setSchedLunchStart(lunch_start.slice(0, 5))
    if (lunch_end) setSchedLunchEnd(lunch_end.slice(0, 5))
    if (lunch_start && lunch_end) setSchedLunchEnabled(true)
  }, [ageGroup])

  // Fetch this tournament's pitches when the modal opens so the organizer can choose which to schedule on
  useEffect(() => {
    if (!open) return
    const tournamentId = ageGroup?.tournament_id ?? ageGroup?.tournaments?.id
    if (!tournamentId) return
    let cancelled = false
    supabase
      .from('venues')
      .select('id, name, pitches(id, label)')
      .eq('tournament_id', tournamentId)
      .order('name')
      .then(({ data }) => {
        if (cancelled) return
        const flat = (data ?? []).flatMap(v =>
          (v.pitches ?? []).map(p => ({ id: p.id, label: `${v.name} — ${p.label}` }))
        )
        setAvailablePitches(flat)
        setSelectedPitchIds(new Set(flat.map(p => p.id)))
      })
    return () => { cancelled = true }
  }, [open, ageGroup])

  if (!open) return null

  function runPreview(shuffle = false) {
    if (!isValid(parse(schedDateDisplay, 'dd/MM/yyyy', new Date()))) {
      toast(t('tournament.invalidDate'), 'error'); return
    }
    let mapped = fixtures.map(f => ({
      id: f.id,
      homeTeamId: f.home_team_id,
      awayTeamId: f.away_team_id,
      home_placeholder: f.home_placeholder ?? null,
      away_placeholder: f.away_placeholder ?? null,
      round: f.round ?? null,
    }))
    if (shuffle) {
      for (let i = mapped.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mapped[i], mapped[j]] = [mapped[j], mapped[i]]
      }
    }
    const selectedPitches = availablePitches.filter(p => selectedPitchIds.has(p.id))
    const pitchIds = selectedPitches.length > 0 ? selectedPitches.map(p => p.id) : null
    const result = generateSchedule({
      fixtures: mapped,
      pitchCount: pitchIds ? pitchIds.length : Number(schedPitches),
      pitchIds,
      gameDuration: schedGameDuration,
      firstGameTime: schedFirst || '09:00',
      lastGameTime: schedLast || '18:00',
      lunchStart: schedLunchEnabled ? (schedLunchStart || null) : null,
      lunchEnd: schedLunchEnabled ? (schedLunchEnd || null) : null,
      date: schedDate,
      pitchGap: schedPitchGap,
      teamRest: ageGroup?.team_rest_minutes || null,
    })
    setSchedResult(result)
  }

  async function confirmSchedule() {
    if (!schedResult?.schedule?.length) return
    const fixtureIds = fixtures.map(f => f.id)
    if (fixtureIds.length > 0) {
      const { count } = await supabase
        .from('fixture_results')
        .select('fixture_id', { count: 'exact', head: true })
        .in('fixture_id', fixtureIds)
        .not('home_goals', 'is', null)
      if (count > 0 && !window.confirm(t('fixture.regenerateWarning', { count }))) return
    }
    setSaving(true)
    try {
      const updates = schedResult.schedule.map(item =>
        supabase
          .from('fixtures')
          .update({ kickoff_time: item.kickoff, pitch_id: item.pitchId ?? pitches[item.pitchIndex]?.id ?? null })
          .eq('id', item.fixtureId)
      )
      const results = await Promise.all(updates)
      const failed = results.find(r => r.error)
      if (failed) throw failed.error
      toast(t('fixture.schedSaved'))
      setSchedResult(null)
      onClose()
      onSaved()
    } catch (err) {
      toast(`${t('common.error')}: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  // Build team-name lookup from the fixtures already in scope so that UUID
  // tokens in scheduler warning strings can be replaced with readable names.
  const teamNameMap = Object.fromEntries(
    fixtures.flatMap(f => [
      f.home_team_id && f.home_team?.name ? [f.home_team_id, f.home_team.name] : [],
      f.away_team_id && f.away_team?.name ? [f.away_team_id, f.away_team.name] : [],
    ])
  )
  function resolveWarning(w) {
    return w.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      id => teamNameMap[id] ?? id
    )
  }

  const skippedCount = schedResult ? fixtures.length - schedResult.schedule.length : 0

  // Live duration estimate
  function parseTimeMinutes(str) {
    const parts = (str || '').split(':').map(Number)
    return parts.length === 2 && !parts.some(isNaN) ? parts[0] * 60 + parts[1] : 0
  }
  const activePitchCount = Math.max(
    availablePitches.length > 0 ? selectedPitchIds.size : Number(schedPitches) || 1,
    1
  )
  const slotsNeeded = fixtures.length > 0 ? Math.ceil(fixtures.length / activePitchCount) : 0
  const lunchMinutes = schedLunchEnabled && schedLunchStart && schedLunchEnd
    ? Math.max(0, parseTimeMinutes(schedLunchEnd) - parseTimeMinutes(schedLunchStart))
    : 0
  const totalMinutes = slotsNeeded * schedGameDuration
    + (slotsNeeded > 1 ? (slotsNeeded - 1) * schedPitchGap : 0)
    + lunchMinutes
  const estHours = Math.floor(totalMinutes / 60)
  const estMins = totalMinutes % 60
  const estimatedStr = totalMinutes > 0
    ? (estHours > 0 ? `${estHours}h ${estMins}min` : `${estMins}min`)
    : '—'

  const inputStyle = { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '2rem', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
          {t('fixture.schedulerTitle')}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('fixture.schedDate')}
            <input
              placeholder="dd/mm/gggg"
              value={schedDateDisplay}
              onChange={e => handleDateChange(e.target.value)}
              style={inputStyle}
            />
          </label>
          {availablePitches.length === 0 && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
              {t('fixture.schedPitches')}
              <input type="number" min={1} value={schedPitches} onChange={e => setSchedPitches(e.target.value)} style={inputStyle} />
            </label>
          )}
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('scheduler.gameDuration')}
            <input type="number" min={5} max={90} value={schedGameDuration} onChange={e => setSchedGameDuration(Number(e.target.value))} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('scheduler.pitchGap')}
            <input type="number" min={0} value={schedPitchGap} onChange={e => setSchedPitchGap(Number(e.target.value))} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('fixture.schedFirstGame')}
            <input type="text" placeholder="HH:MM" maxLength={5} value={schedFirst} onChange={e => setSchedFirst(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('fixture.schedLastGame')}
            <input type="text" placeholder="HH:MM" maxLength={5} value={schedLast} onChange={e => setSchedLast(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={schedLunchEnabled} onChange={e => setSchedLunchEnabled(e.target.checked)} />
            {t('fixture.schedLunchToggle')}
          </label>
          {schedLunchEnabled && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                {t('fixture.schedLunchStart')}
                <input type="text" placeholder="HH:MM" maxLength={5} value={schedLunchStart} onChange={e => setSchedLunchStart(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                {t('fixture.schedLunchEnd')}
                <input type="text" placeholder="HH:MM" maxLength={5} value={schedLunchEnd} onChange={e => setSchedLunchEnd(e.target.value)} style={inputStyle} />
              </label>
            </>
          )}
        </div>

        {availablePitches.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              {t('scheduler.pitchAssignment')}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              {t('scheduler.selectPitches')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {availablePitches.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', cursor: 'pointer', background: 'var(--color-surface-2)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <input
                    type="checkbox"
                    checked={selectedPitchIds.has(p.id)}
                    onChange={e => setSelectedPitchIds(prev => {
                      const next = new Set(prev)
                      if (e.target.checked) next.add(p.id)
                      else next.delete(p.id)
                      return next
                    })}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 1rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {t('scheduler.estimatedDuration')} · {fixtures.length} {t('scheduler.fixtures')} · {activePitchCount} {t('scheduler.pitches')}
          </span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--color-accent)', fontWeight: 700 }}>
            {estimatedStr}
          </span>
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
                  {schedResult.warnings.map((w, i) => <li key={i}>{resolveWarning(w)}</li>)}
                </ul>
              </div>
            )}
            {schedResult.schedule?.length > 0 && (
              <>
                {skippedCount > 0 && (
                  <div style={{ background: 'rgba(255,100,0,0.12)', border: '1px solid rgba(255,100,0,0.4)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {t('scheduler.skippedWarning', { count: skippedCount })}
                  </div>
                )}
                <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>{t('fixture.schedColTime')}</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>{t('fixture.schedColPitch')}</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>{t('fixture.home')}</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{t('fixture.vs')}</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>{t('fixture.away')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedResult.schedule.map((item, i) => {
                        const fx = fixtures.find(f => f.id === item.fixtureId)
                        const pitchLabel = item.pitchId
                          ? (availablePitches.find(p => p.id === item.pitchId)?.label ?? `${t('fixture.pitch')} ${item.pitchIndex + 1}`)
                          : (pitches[item.pitchIndex]
                            ? `${pitches[item.pitchIndex].venue_name} — ${pitches[item.pitchIndex].name}`
                            : `${t('fixture.pitch')} ${item.pitchIndex + 1}`)
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{item.kickoff ? item.kickoff.slice(11, 16) : ''}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{pitchLabel}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{fx?.home_team?.name ?? ''}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('fixture.vs')}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{fx?.away_team?.name ?? ''}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button className="btn-primary" onClick={confirmSchedule} disabled={saving}>
                    {saving ? t('common.saving') : t('fixture.schedConfirm')}
                  </button>
                  <button className="btn-secondary" onClick={() => runPreview(true)}>
                    {t('fixture.schedRegenerate')}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
