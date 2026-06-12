import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'
import DateTimePicker from '../../../components/admin/DateTimePicker'

/**
 * Renders fixtures with game numbers, grouped by stage section.
 * group_knockout format: "Group Stage" → "Playoff" with round sub-headers.
 * Other formats: flat list grouped by round number.
 *
 * Props: fixtures, format, pitches, teams, updateFixture, gameDuration
 */
export default function FixtureList({ fixtures, format: agFormat, pitches, teams, updateFixture, gameDuration = 50 }) {
  const { t } = useTranslation()
  const [kickoffDrafts, setKickoffDrafts] = useState({})

  useEffect(() => { setKickoffDrafts({}) }, [fixtures])

  // Sequential game numbers by kickoff time (unscheduled fixtures get no number)
  const gameNumbers = Object.fromEntries(
    [...fixtures]
      .filter(f => f.kickoff_time)
      .sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time))
      .map((f, i) => [f.id, i + 1])
  )

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

  function resolveRoundName(matches) {
    const rn = matches[0]?.round_name
    if (rn === '3rd_place') return t('playoff.thirdPlace')
    if (rn) return rn
    return matches.length === 1 ? t('playoff.final')
      : matches.length === 2 ? t('playoff.semiFinal')
      : matches.length === 4 ? t('playoff.quarterFinal')
      : t('standings.knockoutPhase')
  }

  if (fixtures.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <p>{t('fixture.noFixtures')} {t('fixture.confirmedTeams')} <strong style={{ color: 'var(--color-text)' }}>{teams.length}</strong></p>
      </div>
    )
  }

  function FixtureCard({ f }) {
    return (
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {gameNumbers[f.id] != null && (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, minWidth: '2rem', flexShrink: 0 }}>
              {t('schedule.gameNumber', { n: gameNumbers[f.id] })}
            </span>
          )}
          <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
            {f.home_team?.name ?? f.home_placeholder ?? '?'}
          </span>
          {f.fixture_results?.[0] != null ? (
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-accent)', minWidth: '4rem', textAlign: 'center' }}>
              {f.fixture_results[0].home_goals} : {f.fixture_results[0].away_goals}
            </span>
          ) : (
            <span style={{ color: 'var(--color-text-muted)' }}>{t('fixture.vs')}</span>
          )}
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
    )
  }

  // ── group_knockout: Group Stage + Playoff sections ────────────────────────
  if (agFormat === 'group_knockout') {
    const groupFixtures = [...fixtures.filter(f => f.group_label)]
      .sort((a, b) => {
        if (a.kickoff_time && b.kickoff_time) return new Date(a.kickoff_time) - new Date(b.kickoff_time)
        if (a.kickoff_time) return -1
        if (b.kickoff_time) return 1
        return (a.round ?? 0) - (b.round ?? 0)
      })
    const knockoutFixtures = fixtures.filter(f => !f.group_label)

    const knockoutRoundList = Object.entries(
      knockoutFixtures.reduce((acc, f) => {
        const key = f.round ?? 999
        if (!acc[key]) acc[key] = []
        acc[key].push(f)
        return acc
      }, {})
    ).sort(([a], [b]) => Number(a) - Number(b))
      .flatMap(([, matches]) => {
        const named = matches.filter(f => f.round_name)
        const unnamed = matches.filter(f => !f.round_name)
        if (named.length > 0 && unnamed.length > 0) {
          return [
            { roundName: resolveRoundName(named), matches: named },
            { roundName: resolveRoundName(unnamed), matches: unnamed },
          ]
        }
        const is3rd = f => f.home_placeholder?.includes('zaudētājs') || f.away_placeholder?.includes('zaudētājs')
        const thirdPlace = matches.filter(is3rd)
        const finals = matches.filter(f => !is3rd(f))
        if (thirdPlace.length > 0 && finals.length > 0) {
          return [
            { roundName: t('playoff.thirdPlace'), matches: thirdPlace },
            { roundName: t('playoff.final'), matches: finals },
          ]
        }
        return [{ roundName: resolveRoundName(matches), matches }]
      })

    return (
      <>
        {groupFixtures.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
              {t('fixture.stageGroupStage')}
            </h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {groupFixtures.map(f => <FixtureCard key={f.id} f={f} />)}
            </div>
          </div>
        )}
        {knockoutFixtures.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>
              {t('fixture.stageKnockout')}
            </h2>
            {knockoutRoundList.map(({ roundName, matches }, idx) => (
              <div key={idx} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  {roundName}
                </h3>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {matches.map(f => <FixtureCard key={f.id} f={f} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  // ── Other formats: flat list by round ─────────────────────────────────────
  const byRound = fixtures.reduce((acc, f) => {
    const r = f.round ?? 0
    ;(acc[r] = acc[r] ?? []).push(f)
    return acc
  }, {})

  return (
    <>
      {Object.keys(byRound).sort((a, b) => {
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
              {byRound[round].map(f => <FixtureCard key={f.id} f={f} />)}
            </div>
          </div>
        )
      })}
    </>
  )
}
