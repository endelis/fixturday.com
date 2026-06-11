import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'
import DateTimePicker from '../../../components/admin/DateTimePicker'

/**
 * Renders fixtures grouped by round with inline kickoff and pitch editors.
 * Props: byRound, pitches, teams, updateFixture
 */
export default function FixtureList({ byRound, pitches, teams, updateFixture, gameDuration = 50 }) {
  const { t } = useTranslation()
  const [kickoffDrafts, setKickoffDrafts] = useState({})

  useEffect(() => { setKickoffDrafts({}) }, [byRound])

  async function handleKickoffBlur(f, value) {
    const kickoffValue = value || null
    updateFixture(f.id, { kickoff_time: kickoffValue })

    if (kickoffValue && f.pitch_id) {
      const kickoffMs = new Date(kickoffValue).getTime()
      const ourEnd = new Date(kickoffMs + gameDuration * 60000).toISOString()
      const windowStart = new Date(kickoffMs - gameDuration * 60000).toISOString()

      const { data: conflicts } = await supabase
        .from('fixtures')
        .select('id, home_team:home_team_id(name), away_team:away_team_id(name)')
        .eq('pitch_id', f.pitch_id)
        .neq('id', f.id)
        .lt('kickoff_time', ourEnd)
        .gt('kickoff_time', windowStart)

      if (conflicts?.length) {
        const names = conflicts.map(c =>
          `${c.home_team?.name ?? '?'} - ${c.away_team?.name ?? '?'}`
        ).join(', ')
        toast(t('fixture.pitchConflict', { games: names }), 'warning')
      }
    }
  }

  if (Object.keys(byRound).length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <p>{t('fixture.noFixtures')} {t('fixture.confirmedTeams')} <strong style={{ color: 'var(--color-text)' }}>{teams.length}</strong></p>
      </div>
    )
  }

  return (
    <>
      {Object.keys(byRound).sort((a, b) => {
        // Group rounds (no placeholders) before playoff rounds, then by round number.
        const aPlayoff = byRound[a].some(f => f.home_placeholder != null || f.away_placeholder != null) ? 1 : 0
        const bPlayoff = byRound[b].some(f => f.home_placeholder != null || f.away_placeholder != null) ? 1 : 0
        if (aPlayoff !== bPlayoff) return aPlayoff - bPlayoff
        return Number(a) - Number(b)
      }).map(round => {
        const sample = byRound[round][0]
        const roundLabel = sample?.round_name || `${t('fixture.round')} ${round}`
        return (
          <div key={round} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
              {roundLabel}
            </h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {byRound[round].map(f => (
                <div key={f.id} className="card" style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
                      {f.home_team?.name ?? f.home_placeholder ?? '?'}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('fixture.vs')}</span>
                    <span style={{ flex: 1, fontWeight: 600 }}>
                      {f.away_team?.name ?? f.away_placeholder ?? '?'}
                    </span>
                    <DateTimePicker
                      value={kickoffDrafts[f.id] ?? (f.kickoff_time ? format(new Date(f.kickoff_time.replace('Z', '')), "yyyy-MM-dd'T'HH:mm") : '')}
                      onChange={v => {
                        setKickoffDrafts(d => ({ ...d, [f.id]: v ?? '' }))
                        if (v) updateFixture(f.id, { kickoff_time: v })
                      }}
                      onBlur={v => handleKickoffBlur(f, v)}
                    />
                    <select
                      defaultValue={f.pitch_id ?? ''}
                      onChange={e => updateFixture(f.id, { pitch_id: e.target.value || null })}
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}
                    >
                      <option value="">{t('fixture.pitchSelect')}</option>
                      {pitches.map(p => <option key={p.id} value={p.id}>{p.venue_name} — {p.name}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}
