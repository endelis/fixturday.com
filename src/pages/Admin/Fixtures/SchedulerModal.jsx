import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
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

  const [schedDate, setSchedDate] = useState(() => today)
  const [schedPitches, setSchedPitches] = useState(1)
  const [schedFirst, setSchedFirst] = useState(() => ageGroup?.tournaments?.first_game_time?.slice(0, 5) ?? '09:00')
  const [schedLast, setSchedLast] = useState(() => ageGroup?.tournaments?.last_game_time?.slice(0, 5) ?? '18:00')
  const [schedLunchEnabled, setSchedLunchEnabled] = useState(false)
  const [schedLunchStart, setSchedLunchStart] = useState(() => ageGroup?.tournaments?.lunch_start?.slice(0, 5) ?? '')
  const [schedLunchEnd, setSchedLunchEnd] = useState(() => ageGroup?.tournaments?.lunch_end?.slice(0, 5) ?? '')
  const [schedResult, setSchedResult] = useState(null)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  function runPreview() {
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
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
          {t('fixture.schedulerTitle')}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('fixture.schedDate')}
            <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('fixture.schedPitches')}
            <input type="number" min={1} value={schedPitches} onChange={e => setSchedPitches(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('fixture.schedFirstGame')}
            <input type="time" value={schedFirst} onChange={e => setSchedFirst(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('fixture.schedLastGame')}
            <input type="time" value={schedLast} onChange={e => setSchedLast(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={schedLunchEnabled} onChange={e => setSchedLunchEnabled(e.target.checked)} />
            {t('fixture.schedLunchToggle')}
          </label>
          {schedLunchEnabled && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                {t('fixture.schedLunchStart')}
                <input type="time" value={schedLunchStart} onChange={e => setSchedLunchStart(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                {t('fixture.schedLunchEnd')}
                <input type="time" value={schedLunchEnd} onChange={e => setSchedLunchEnd(e.target.value)} style={inputStyle} />
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
                <button className="btn-primary" onClick={confirmSchedule} disabled={saving}>
                  {saving ? 'Saglabā...' : t('fixture.schedConfirm')}
                </button>
              </>
            )}
          </>
        )}

        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
