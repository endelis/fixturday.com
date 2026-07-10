import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { format, parse, isValid } from 'date-fns'
import { generateSchedule } from '../../../utils/scheduler'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'

export default function VenueDivisionScheduler({ open, onClose, tournamentId, venue, pitches, onSaved }) {
  const { t } = useTranslation()

  const [schedDate, setSchedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [schedDateDisplay, setSchedDateDisplay] = useState(format(new Date(), 'dd/MM/yyyy'))
  const [schedFirst, setSchedFirst] = useState('09:00')
  const [schedPitchGap, setSchedPitchGap] = useState(5)
  const [schedLunchEnabled, setSchedLunchEnabled] = useState(false)
  const [schedLunchStart, setSchedLunchStart] = useState('')
  const [schedLunchEnd, setSchedLunchEnd] = useState('')
  const [mixMode, setMixMode] = useState(false)

  const [divisions, setDivisions] = useState([])
  const [divConfig, setDivConfig] = useState({})
  const [loading, setLoading] = useState(false)
  // preview shape: { mode: 'sequential'|'mix', maxDuration?: number, groups: [{agId, agName, items, warnings}] }
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !tournamentId) return
    let cancelled = false
    setLoading(true)
    setPreview(null)
    setMixMode(false)
    ;(async () => {
      const [{ data: ags, error: agsErr }, { data: tour, error: tourErr }] = await Promise.all([
        supabase
          .from('age_groups')
          .select(`id, name, game_duration_minutes, pitch_gap_minutes, team_rest_minutes,
            stages(id, type, fixtures(id, round, group_label, home_team_id, away_team_id,
              home_placeholder, away_placeholder, status,
              home_team:teams!home_team_id(id, name),
              away_team:teams!away_team_id(id, name)
            ))`)
          .eq('tournament_id', tournamentId)
          .order('name'),
        supabase
          .from('tournaments')
          .select('start_date, first_game_time, lunch_start, lunch_end')
          .eq('id', tournamentId)
          .single(),
      ])
      if (cancelled) return
      if (agsErr) { toast(t('common.error'), 'error'); setLoading(false); return }

      if (tour && !tourErr) {
        if (tour.start_date) {
          setSchedDate(tour.start_date)
          setSchedDateDisplay(format(new Date(tour.start_date + 'T00:00'), 'dd/MM/yyyy'))
        }
        if (tour.first_game_time) setSchedFirst(tour.first_game_time.slice(0, 5))
        if (tour.lunch_start) setSchedLunchStart(tour.lunch_start.slice(0, 5))
        if (tour.lunch_end) setSchedLunchEnd(tour.lunch_end.slice(0, 5))
        if (tour.lunch_start && tour.lunch_end) setSchedLunchEnabled(true)
      }

      const divs = (ags ?? []).map(ag => ({
        ag,
        fixtures: (ag.stages ?? []).flatMap(s => s.fixtures ?? []),
      })).filter(d => d.fixtures.length > 0)

      setDivisions(divs)

      const allPitchIds = pitches.map(p => p.id)
      const cfg = {}
      for (const d of divs) {
        cfg[d.ag.id] = {
          included: false,
          gameDuration: d.ag.game_duration_minutes ?? 20,
          pitchIds: new Set(allPitchIds),
          firstGameTime: '',
        }
      }
      setDivConfig(cfg)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [open, tournamentId])

  if (!open) return null

  function handleDateChange(val) {
    setSchedDateDisplay(val)
    const parsed = parse(val, 'dd/MM/yyyy', new Date())
    if (isValid(parsed)) setSchedDate(format(parsed, 'yyyy-MM-dd'))
    setPreview(null)
  }

  function updateDivConfig(agId, key, value) {
    setDivConfig(prev => ({ ...prev, [agId]: { ...prev[agId], [key]: value } }))
    setPreview(null)
  }

  function buildPreviewItem(item, pitchLookup, fx) {
    return {
      ...item,
      home: fx?.home_team?.name ?? fx?.home_placeholder ?? '?',
      away: fx?.away_team?.name ?? fx?.away_placeholder ?? '?',
      pitchLabel: pitchLookup[item.pitchId] ?? '?',
    }
  }

  function shuffleArr(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
  }

  function runPreview(shuffle = false) {
    if (!isValid(parse(schedDateDisplay, 'dd/MM/yyyy', new Date()))) {
      toast(t('tournament.invalidDate'), 'error'); return
    }
    const included = divisions.filter(d => divConfig[d.ag.id]?.included)
    if (included.length === 0) {
      toast(t('venueSched.noDivisionsSelected'), 'error'); return
    }

    const pitchLookup = Object.fromEntries(pitches.map(p => [p.id, p.name]))
    const lunchStart = schedLunchEnabled ? (schedLunchStart || null) : null
    const lunchEnd = schedLunchEnabled ? (schedLunchEnd || null) : null

    if (mixMode) {
      const allSelectedPitchIds = [...new Set(included.flatMap(d => [...divConfig[d.ag.id].pitchIds]))]
      if (allSelectedPitchIds.length === 0) return
      const maxDuration = Math.max(...included.map(d => divConfig[d.ag.id].gameDuration))

      const fixtureToAg = {}
      const allMapped = []
      for (const { ag, fixtures } of included) {
        for (const f of fixtures) {
          fixtureToAg[f.id] = { agId: ag.id, agName: ag.name, fixture: f }
          allMapped.push({
            id: f.id,
            homeTeamId: f.home_team_id,
            awayTeamId: f.away_team_id,
            home_placeholder: f.home_placeholder ?? null,
            away_placeholder: f.away_placeholder ?? null,
            round: f.round ?? null,
          })
        }
      }
      if (shuffle) shuffleArr(allMapped)

      const result = generateSchedule({
        fixtures: allMapped,
        pitchCount: allSelectedPitchIds.length,
        pitchIds: allSelectedPitchIds,
        gameDuration: maxDuration,
        firstGameTime: schedFirst || '09:00',
        lastGameTime: '23:59',
        lunchStart, lunchEnd,
        date: schedDate,
        pitchGap: schedPitchGap,
        teamRest: null,
        blockedSlots: [],
      })

      const divMap = {}
      for (const { ag } of included) {
        divMap[ag.id] = { agId: ag.id, agName: ag.name, items: [], warnings: [] }
      }
      for (const item of result.schedule) {
        const meta = fixtureToAg[item.fixtureId]
        if (!meta || !divMap[meta.agId]) continue
        divMap[meta.agId].items.push(buildPreviewItem(item, pitchLookup, meta.fixture))
      }
      if (result.warnings?.length > 0) divMap[included[0].ag.id].warnings = result.warnings

      setPreview({ mode: 'mix', maxDuration, groups: Object.values(divMap) })
      return
    }

    // Sequential mode: schedule each division in order; each division's slots block the next
    const accumulated = []
    const groups = []

    for (const { ag, fixtures } of included) {
      const cfg = divConfig[ag.id]
      const selectedPitchIds = [...cfg.pitchIds]
      if (selectedPitchIds.length === 0) continue

      const gameDuration = cfg.gameDuration
      const firstGameTime = cfg.firstGameTime || schedFirst || '09:00'

      const mapped = fixtures.map(f => ({
        id: f.id,
        homeTeamId: f.home_team_id,
        awayTeamId: f.away_team_id,
        home_placeholder: f.home_placeholder ?? null,
        away_placeholder: f.away_placeholder ?? null,
        round: f.round ?? null,
      }))
      if (shuffle) shuffleArr(mapped)

      const result = generateSchedule({
        fixtures: mapped,
        pitchCount: selectedPitchIds.length,
        pitchIds: selectedPitchIds,
        gameDuration,
        firstGameTime,
        lastGameTime: '23:59',
        lunchStart, lunchEnd,
        date: schedDate,
        pitchGap: schedPitchGap,
        teamRest: ag.team_rest_minutes ?? null,
        blockedSlots: accumulated.filter(b => selectedPitchIds.includes(b.pitchId)),
      })

      for (const item of result.schedule) {
        if (!item.pitchId) continue
        const d = new Date(item.kickoff)
        const startMins = d.getHours() * 60 + d.getMinutes()
        accumulated.push({ pitchId: item.pitchId, startMins, endMins: startMins + gameDuration })
      }

      groups.push({
        agId: ag.id, agName: ag.name, warnings: result.warnings,
        items: result.schedule.map(item => {
          const fx = fixtures.find(f => f.id === item.fixtureId)
          return buildPreviewItem(item, pitchLookup, fx)
        }),
      })
    }

    setPreview({ mode: 'sequential', groups })
  }

  async function confirmSchedule() {
    if (!preview?.groups?.length) return
    setSaving(true)
    try {
      const allItems = preview.groups.flatMap(p => p.items)
      const fixtureIds = allItems.map(i => i.fixtureId)

      if (fixtureIds.length > 0) {
        const { count } = await supabase
          .from('fixture_results')
          .select('fixture_id', { count: 'exact', head: true })
          .in('fixture_id', fixtureIds)
          .not('home_goals', 'is', null)
        if (count > 0 && !window.confirm(t('fixture.regenerateWarning', { count }))) {
          setSaving(false); return
        }
      }

      const results = await Promise.all(
        allItems.map(item =>
          supabase.from('fixtures')
            .update({ kickoff_time: item.kickoff, pitch_id: item.pitchId })
            .eq('id', item.fixtureId)
        )
      )
      const failed = results.find(r => r.error)
      if (failed) throw failed.error

      toast(t('fixture.schedSaved'))
      setPreview(null)
      onClose()
      onSaved?.()
    } catch (err) {
      toast(`${t('common.error')}: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
    color: 'var(--color-text)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '2rem', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.2rem' }}>
          {t('venueSched.title')}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {venue.name}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('fixture.schedDate')}
            <input placeholder="dd/mm/yyyy" value={schedDateDisplay} onChange={e => handleDateChange(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('fixture.schedFirstGame')}
            <input type="text" placeholder="HH:MM" maxLength={5} value={schedFirst} onChange={e => { setSchedFirst(e.target.value); setPreview(null) }} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
            {t('scheduler.pitchGap')}
            <input type="number" min={0} value={schedPitchGap} onChange={e => { setSchedPitchGap(Number(e.target.value)); setPreview(null) }} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', alignSelf: 'flex-end', paddingBottom: '0.1rem' }}>
            <input type="checkbox" checked={schedLunchEnabled} onChange={e => { setSchedLunchEnabled(e.target.checked); setPreview(null) }} />
            {t('fixture.schedLunchToggle')}
          </label>
          {schedLunchEnabled && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                {t('fixture.schedLunchStart')}
                <input type="text" placeholder="HH:MM" maxLength={5} value={schedLunchStart} onChange={e => { setSchedLunchStart(e.target.value); setPreview(null) }} style={inputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                {t('fixture.schedLunchEnd')}
                <input type="text" placeholder="HH:MM" maxLength={5} value={schedLunchEnd} onChange={e => { setSchedLunchEnd(e.target.value); setPreview(null) }} style={inputStyle} />
              </label>
            </>
          )}
        </div>

        <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          {t('venueSched.selectDivisions')}
        </p>

        {loading && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('common.loading')}</p>}
        {!loading && divisions.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('venueSched.noFixtures')}</p>
        )}

        {!loading && divisions.map(({ ag, fixtures }) => {
          const cfg = divConfig[ag.id]
          if (!cfg) return null
          return (
            <div key={ag.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', overflow: 'hidden', opacity: cfg.included ? 1 : 0.65 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--color-surface-2)', cursor: 'pointer' }}
                onClick={() => updateDivConfig(ag.id, 'included', !cfg.included)}
              >
                <input type="checkbox" checked={cfg.included} onChange={e => { e.stopPropagation(); updateDivConfig(ag.id, 'included', e.target.checked) }} />
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, flex: 1 }}>{ag.name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {fixtures.length} {t('scheduler.fixtures')}
                </span>
              </div>
              {cfg.included && (
                <div style={{ padding: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                    {t('scheduler.gameDuration')}
                    <input type="number" min={5} max={120} value={cfg.gameDuration}
                      onChange={e => updateDivConfig(ag.id, 'gameDuration', Number(e.target.value))}
                      style={{ ...inputStyle, width: '5rem' }} />
                  </label>
                  {!mixMode && (
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                      {t('venueSched.divFirstGame')}
                      <input
                        type="text" placeholder={schedFirst || '09:00'} maxLength={5}
                        value={cfg.firstGameTime}
                        onChange={e => updateDivConfig(ag.id, 'firstGameTime', e.target.value)}
                        style={{ ...inputStyle, width: '5rem' }}
                      />
                    </label>
                  )}
                  <div>
                    <p style={{ fontSize: '0.875rem', marginBottom: '0.375rem' }}>{t('venueSched.pitchAssign')}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {pitches.map(p => (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', background: 'var(--color-surface)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                          <input type="checkbox"
                            checked={cfg.pitchIds.has(p.id)}
                            onChange={e => {
                              const next = new Set(cfg.pitchIds)
                              if (e.target.checked) next.add(p.id); else next.delete(p.id)
                              updateDivConfig(ag.id, 'pitchIds', next)
                            }} />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Action row */}
        <div style={{ marginTop: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={runPreview}>{t('fixture.schedPreview')}</button>
          <button
            onClick={() => { setMixMode(m => !m); setPreview(null) }}
            title={t('venueSched.mixHint')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: mixMode ? 'rgba(240,165,0,0.18)' : 'var(--color-surface-2)',
              border: mixMode ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
              color: mixMode ? 'var(--color-accent)' : 'var(--color-text-muted)',
              borderRadius: 'var(--radius-sm)', padding: mixMode ? '0.35rem 0.85rem' : '0.4rem 0.85rem',
              cursor: 'pointer', fontWeight: 800, fontSize: '0.875rem', letterSpacing: '0.04em',
            }}
          >
            {mixMode ? '✓' : '⊕'} MIX
          </button>
          {mixMode && (
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', flex: 1 }}>
              {t('venueSched.mixNote')}
            </span>
          )}
        </div>

        {/* MIX slot note */}
        {preview?.mode === 'mix' && (
          <div style={{ background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {t('venueSched.mixSlotNote', { duration: preview.maxDuration })}
          </div>
        )}

        {/* Preview tables grouped by division */}
        {preview?.groups?.map(({ agId, agName, items, warnings }) => (
          <div key={agId} style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '0.375rem' }}>
              {agName} — {items.length} {t('scheduler.fixtures')}
            </p>
            {warnings?.length > 0 && (
              <div style={{ background: 'rgba(255,200,0,0.12)', border: '1px solid rgba(255,200,0,0.35)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                {warnings.map((w, i) => <div key={i}>{w}</div>)}
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>{t('fixture.schedColTime')}</th>
                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>{t('fixture.schedColPitch')}</th>
                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>{t('fixture.home')}</th>
                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'center', width: '2rem' }}>vs</th>
                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>{t('fixture.away')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.3rem 0.5rem', color: 'var(--color-accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.kickoff?.slice(11, 16)}</td>
                      <td style={{ padding: '0.3rem 0.5rem', color: 'var(--color-text-muted)' }}>{item.pitchLabel}</td>
                      <td style={{ padding: '0.3rem 0.5rem', fontWeight: 500 }}>{item.home}</td>
                      <td style={{ padding: '0.3rem 0.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>vs</td>
                      <td style={{ padding: '0.3rem 0.5rem', fontWeight: 500 }}>{item.away}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {preview?.groups?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={confirmSchedule} disabled={saving}>
              {saving ? t('common.saving') : t('fixture.schedConfirm')}
            </button>
            <button className="btn-secondary" onClick={() => runPreview(true)}>
              {t('fixture.schedRegenerate')}
            </button>
            <button className="btn-secondary" onClick={() => setPreview(null)}>{t('common.cancel')}</button>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
