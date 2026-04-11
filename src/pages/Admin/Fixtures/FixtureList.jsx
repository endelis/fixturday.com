import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'

/**
 * Renders fixtures grouped by round with inline kickoff and pitch editors.
 * Props: byRound, pitches, teams, updateFixture
 */
export default function FixtureList({ byRound, pitches, teams, updateFixture }) {
  const { t } = useTranslation()

  if (Object.keys(byRound).length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <p>{t('fixture.noFixtures')} {t('fixture.confirmedTeams')} <strong style={{ color: 'var(--color-text)' }}>{teams.length}</strong></p>
      </div>
    )
  }

  return (
    <>
      {Object.keys(byRound).sort((a, b) => Number(a) - Number(b)).map(round => {
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
                    <input
                      type="datetime-local"
                      defaultValue={f.kickoff_time ? format(new Date(f.kickoff_time.replace('Z', '')), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={e => updateFixture(f.id, { kickoff_time: e.target.value || null })}
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}
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
