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
  const [schedFirst, setSchedFirst] = useState('09:00')
  const [schedLast, setSchedLast] = useState('18:00')
  const [schedLunchEnabled, setSchedLunchEnabled] = useState(false)
  const [schedLunchStart, setSchedLunchStart] = useState('')
  const [schedLunchEnd, setSchedLunchEnd] = useState('')
  const [schedResult, setSchedResult] = useState(null)
  const [saving, setSaving] = useState(false)

  // Sync tournament scheduling defaults when ageGroup data arrives
  useEffect(() => {
    if (!ageGroup?.tournaments) return
    const { first_game_time, last_game_time, lunch_start, lunch_end } = ageGroup.tournaments
    if (first_game_time) setSchedFirst(first_game_time.slice(0, 5))
    if (last_game_time) setSchedLast(last_game_time.slice(0, 5))
    if (lunch_start) setSchedLunchStart(lunch_start.slice(0, 5))
    if (lunch_end) setSchedLunchEnd(lunch_end.slice(0, 5))
  }, [ageGroup])

  if (!open) return null

  function runPreview() {
    if (!isValid(parse(schedDateDisplay, 'dd/MM/yyyy', new Date()))) {
      toast(t('tournament.invalidDate'), 'error'); return
    }
    const result = generateSchedule({
      fixtures: fixtures.map(f => ({ id: f.id, homeTeamId: f.home_team_id, awayTeamId: f.away_team_id })),
      pitchCount: Number(schedPitches),
      gameDuration: ageGroup?.game_duration_minutes || 20,
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
    setSaving(true)
    try {
      const updates = schedResult.schedule.map(item =>
        supabase
          .from('fixtures')
          .update({ kickoff_time: item.kickoff, pitch_id: pitches[item.pitchIndex]?.id || null })
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

  const inputStyle = { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '2rem', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
        <style>{`
          input[type="time"]::-webkit-datetime-edit-ampm-field { display: none; }
          input[type="time"] { -webkit-appearance: none; }
        `}</style>

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
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('fixture.schedPitches')}
            <input type="number" min={1} value={schedPitches} onChange={e => setSchedPitches(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('fixture.schedFirstGame')}
            <input type="time" step="60" value={schedFirst} onChange={e => setSchedFirst(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('fixture.schedLastGame')}
            <input type="time" step="60" value={schedLast} onChange={e => setSchedLast(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={schedLunchEnabled} onChange={e => setSchedLunchEnabled(e.target.checked)} />
            {t('fixture.schedLunchToggle')}
          </label>
          {schedLunchEnabled && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                {t('fixture.schedLunchStart')}
                <input type="time" step="60" value={schedLunchStart} onChange={e => setSchedLunchStart(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                {t('fixture.schedLunchEnd')}
                <input type="time" step="60" value={schedLunchEnd} onChange={e => setSchedLunchEnd(e.target.value)} style={inputStyle} />
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
                        const pitchLabel = pitches[item.pitchIndex]
                          ? `${pitches[item.pitchIndex].venue_name} — ${pitches[item.pitchIndex].name}`
                          : `${t('fixture.pitch')} ${item.pitchIndex + 1}`
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
                  <button className="btn-secondary" onClick={runPreview}>
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
