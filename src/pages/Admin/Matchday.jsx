import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { formatTime } from '../../utils/dateFormat'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'

const inputSx = {
  background: 'var(--color-surface)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'var(--color-text)',
  padding: '0.3rem 0.6rem',
  borderRadius: '6px',
  fontSize: '0.875rem',
}

export default function Matchday() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [fixtures, setFixtures] = useState([])
  const [scores, setScores] = useState({})
  const [saving, setSaving] = useState({})
  const [savingAll, setSavingAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [tournamentId, setTournamentId] = useState(null)

  // Events state: { [fixtureId]: [event, ...] }
  const [events, setEvents] = useState({})
  // Team players cache: { [teamId]: [player, ...] }
  const [teamPlayers, setTeamPlayers] = useState({})
  // Event form state per fixture: { [fixtureId]: { teamId, playerId, eventType, minute } }
  const [eventForm, setEventForm] = useState({})
  const [addingEvent, setAddingEvent] = useState({})

  async function load() {
    setLoading(true)
    const start = new Date(selectedDate + 'T00:00:00').toISOString()
    const end   = new Date(selectedDate + 'T23:59:59').toISOString()

    const { data: fx, error } = await supabase
      .from('fixtures')
      .select(`
        *,
        home_team:teams!home_team_id(id, name),
        away_team:teams!away_team_id(id, name),
        pitch:pitches(name, venues(name)),
        fixture_results(id, home_goals, away_goals),
        stages(age_groups(name, tournaments(id, name)))
      `)
      .gte('kickoff_time', start)
      .lte('kickoff_time', end)
      .order('kickoff_time')

    if (error) { toast(t('common.error'), 'error'); setLoading(false); return }

    const allFx = fx ?? []
    setFixtures(allFx)

    const tId = allFx[0]?.stages?.age_groups?.tournaments?.id ?? null
    setTournamentId(tId)

    const init = {}
    allFx.forEach(f => {
      const r = f.fixture_results?.[0]
      init[f.id] = { home: r?.home_goals ?? 0, away: r?.away_goals ?? 0 }
    })
    setScores(init)

    // Load events for all fixtures
    const fixtureIds = allFx.map(f => f.id)
    if (fixtureIds.length > 0) {
      const { data: evs } = await supabase
        .from('fixture_events')
        .select('*, player:team_players(id, name, number), team:teams(id, name)')
        .in('fixture_id', fixtureIds)
        .order('minute', { ascending: true, nullsFirst: false })
      const evMap = {}
      ;(evs ?? []).forEach(ev => {
        ;(evMap[ev.fixture_id] = evMap[ev.fixture_id] ?? []).push(ev)
      })
      setEvents(evMap)
    }

    setLoading(false)
  }

  async function loadTeamPlayers(teamId) {
    if (!teamId || teamPlayers[teamId]) return
    const { data } = await supabase
      .from('team_players')
      .select('id, name, number, position')
      .eq('team_id', teamId)
      .order('number')
    setTeamPlayers(prev => ({ ...prev, [teamId]: data ?? [] }))
  }

  useEffect(() => {
    if (authLoading || !user) return
    load()
  }, [selectedDate, authLoading, user])

  if (authLoading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />

  const ageGroupNames = [...new Set(
    fixtures.map(f => f.stages?.age_groups?.name).filter(Boolean)
  )].sort()

  const filtered = fixtures.filter(f => {
    const ag = f.stages?.age_groups?.name
    const hasResult = !!f.fixture_results?.[0]
    const agMatch = filterGroup === 'all' || ag === filterGroup
    const stMatch =
      filterStatus === 'all' ||
      (filterStatus === 'completed' && (hasResult || f.status === 'completed')) ||
      (filterStatus === 'pending' && !hasResult && f.status !== 'completed' && f.status !== 'postponed')
    return agMatch && stMatch
  })

  const byGroup = filtered.reduce((acc, f) => {
    const key = f.stages?.age_groups?.name ?? '—'
    ;(acc[key] = acc[key] ?? []).push(f)
    return acc
  }, {})

  async function saveScore(f) {
    setSaving(prev => ({ ...prev, [f.id]: true }))
    const existing = f.fixture_results?.[0]
    const score = scores[f.id] ?? { home: 0, away: 0 }

    const { error: resErr } = existing
      ? await supabase.from('fixture_results').update({ home_goals: score.home, away_goals: score.away }).eq('id', existing.id)
      : await supabase.from('fixture_results').insert({ fixture_id: f.id, home_goals: score.home, away_goals: score.away })

    if (resErr) { toast(`${t('common.error')}: ${resErr.message}`, 'error'); setSaving(prev => ({ ...prev, [f.id]: false })); return }

    await supabase.from('fixtures').update({ status: 'completed' }).eq('id', f.id)
    toast(t('common.saved'))
    setSaving(prev => ({ ...prev, [f.id]: false }))
    load()
  }

  async function saveAll() {
    setSavingAll(true)
    const updates = filtered
      .filter(f => f.status !== 'postponed')
      .map(async f => {
        const existing = f.fixture_results?.[0]
        const score = scores[f.id] ?? { home: 0, away: 0 }
        const { error: resErr } = existing
          ? await supabase.from('fixture_results').update({ home_goals: score.home, away_goals: score.away }).eq('id', existing.id)
          : await supabase.from('fixture_results').insert({ fixture_id: f.id, home_goals: score.home, away_goals: score.away })
        if (!resErr) await supabase.from('fixtures').update({ status: 'completed' }).eq('id', f.id)
        return resErr
      })
    const results = await Promise.all(updates)
    const failed = results.filter(Boolean)
    if (failed.length > 0) toast(t('common.error'), 'error')
    else toast(t('matchday.allSaved'))
    setSavingAll(false)
    load()
  }

  async function postpone(fixtureId) {
    if (!confirm(t('matchday.confirmPostpone'))) return
    const { error } = await supabase.from('fixtures').update({ status: 'postponed' }).eq('id', fixtureId)
    if (error) { toast(t('common.error'), 'error'); return }
    load()
  }

  function statusBadge(f) {
    if (f.status === 'postponed') return <span className="badge badge-muted">{t('matchday.statusPostponed')}</span>
    if (f.fixture_results?.[0] || f.status === 'completed') return <span className="badge badge-success">{t('matchday.statusCompleted')}</span>
    return <span className="badge badge-muted">{t('matchday.statusPending')}</span>
  }

  function setEF(fixtureId, patch) {
    setEventForm(prev => ({ ...prev, [fixtureId]: { ...prev[fixtureId], ...patch } }))
  }

  async function addEvent(f) {
    const form = eventForm[f.id] ?? {}
    if (!form.teamId || !form.eventType) return
    setAddingEvent(prev => ({ ...prev, [f.id]: true }))

    // Check for second yellow → auto red
    let extraRedCard = false
    if (form.eventType === 'yellow_card' && form.playerId) {
      const existing = events[f.id] ?? []
      const prevYellow = existing.find(ev => ev.player_id === form.playerId && ev.event_type === 'yellow_card')
      if (prevYellow) {
        extraRedCard = true
        toast(t('matchday.secondYellowWarning'), 'warning')
      }
    }

    const row = {
      fixture_id: f.id,
      team_id: form.teamId,
      player_id: form.playerId || null,
      event_type: form.eventType,
      minute: form.minute ? Number(form.minute) : null,
    }

    const { error } = await supabase.from('fixture_events').insert(row)
    if (error) { toast(t('common.error'), 'error'); setAddingEvent(prev => ({ ...prev, [f.id]: false })); return }

    // Auto red card for second yellow
    if (extraRedCard) {
      await supabase.from('fixture_events').insert({
        ...row,
        event_type: 'red_card',
      })
    }

    // Auto-update score for goals
    if (form.eventType === 'goal' || form.eventType === 'own_goal') {
      const isHomeTeam = form.teamId === f.home_team?.id
      const isGoal = form.eventType === 'goal'
      // goal for home team → home score up; own_goal for home team → away score up
      const homeIncrement = (isGoal && isHomeTeam) || (!isGoal && !isHomeTeam) ? 1 : 0
      const awayIncrement = (isGoal && !isHomeTeam) || (!isGoal && isHomeTeam) ? 1 : 0

      const cur = scores[f.id] ?? { home: 0, away: 0 }
      const newHome = cur.home + homeIncrement
      const newAway = cur.away + awayIncrement

      setScores(prev => ({ ...prev, [f.id]: { home: newHome, away: newAway } }))

      // Persist to fixture_results — upsert avoids stale-closure double-insert
      await supabase.from('fixture_results').upsert(
        { fixture_id: f.id, home_goals: newHome, away_goals: newAway },
        { onConflict: 'fixture_id' }
      )
      await supabase.from('fixtures').update({ status: 'completed' }).eq('id', f.id)
    }

    // Reset minute only, keep team/type for quick repeat entry
    setEF(f.id, { minute: '' })
    setAddingEvent(prev => ({ ...prev, [f.id]: false }))
    load()
  }

  async function deleteEvent(eventId, fixtureId) {
    const { error } = await supabase.from('fixture_events').delete().eq('id', eventId)
    if (error) { toast(t('common.error'), 'error'); return }
    load()
  }

  function eventLabel(ev) {
    const typeKey = {
      goal: 'eventGoal',
      own_goal: 'eventOwnGoal',
      yellow_card: 'eventYellow',
      red_card: 'eventRed',
    }[ev.event_type] ?? ev.event_type
    const name = ev.player?.name ?? '—'
    const num = ev.player?.number ? `#${ev.player.number} ` : ''
    const min = ev.minute ? `${ev.minute}'` : ''
    return `${t(`matchday.${typeKey}`)} ${num}${name}${min ? ' ' + min : ''}`
  }

  const backLink = tournamentId ? `/admin/tournaments/${tournamentId}/overview` : '/admin/dashboard'

  return (
    <div>
      <nav className="admin-nav">
        <Link to={backLink} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
          ← {t('workspace.backToDashboard')}
        </Link>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={inputSx}
        />
      </nav>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '1.25rem' }}>
          {t('matchday.title')}
        </h1>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} style={inputSx}>
            <option value="all">{t('matchday.filterAll')}</option>
            {ageGroupNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputSx}>
            <option value="all">{t('matchday.filterAll')}</option>
            <option value="pending">{t('matchday.filterPending')}</option>
            <option value="completed">{t('matchday.filterCompleted')}</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
            <p>{t('matchday.noFixtures')}</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{t('matchday.noFixturesHint')}</p>
          </div>
        ) : (
          <>
            {Object.keys(byGroup).sort().map(groupName => (
              <div key={groupName} style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
                  {groupName}
                </h2>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {byGroup[groupName].map(f => {
                    const score = scores[f.id] ?? { home: 0, away: 0 }
                    const isPostponed = f.status === 'postponed'
                    const hasResult = !!f.fixture_results?.[0]
                    const fixtureEvents = events[f.id] ?? []
                    const ef = eventForm[f.id] ?? {}
                    const selectedTeamPlayers = ef.teamId ? (teamPlayers[ef.teamId] ?? []) : []

                    return (
                      <div key={f.id} className="card" style={{ opacity: isPostponed ? 0.5 : 1 }}>
                        {/* Top row: time, pitch, status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                            {f.kickoff_time && formatTime(f.kickoff_time)}
                            {f.pitch && ` · ${f.pitch.venues?.name} — ${f.pitch.name}`}
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {statusBadge(f)}
                            {!isPostponed && (
                              <button
                                className="btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => postpone(f.id)}
                              >
                                {t('matchday.postponeBtn')}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Score row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{ flex: 1, textAlign: 'right', fontFamily: 'var(--font-heading)', fontSize: '1.1rem', minWidth: '5rem' }}>
                            {f.home_team?.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                            <input
                              type="number" min="0" max="99"
                              value={score.home}
                              disabled={isPostponed}
                              onChange={e => setScores(p => ({ ...p, [f.id]: { ...p[f.id], home: Number(e.target.value) } }))}
                              style={{ width: '3.5rem', textAlign: 'center', fontSize: '1.5rem', fontFamily: 'var(--font-heading)', padding: '0.25rem', background: 'var(--color-surface)', border: '2px solid var(--color-accent)', color: 'var(--color-text)', borderRadius: '6px' }}
                            />
                            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-muted)' }}>:</span>
                            <input
                              type="number" min="0" max="99"
                              value={score.away}
                              disabled={isPostponed}
                              onChange={e => setScores(p => ({ ...p, [f.id]: { ...p[f.id], away: Number(e.target.value) } }))}
                              style={{ width: '3.5rem', textAlign: 'center', fontSize: '1.5rem', fontFamily: 'var(--font-heading)', padding: '0.25rem', background: 'var(--color-surface)', border: '2px solid var(--color-accent)', color: 'var(--color-text)', borderRadius: '6px' }}
                            />
                          </div>
                          <span style={{ flex: 1, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', minWidth: '5rem' }}>
                            {f.away_team?.name}
                          </span>
                          {!isPostponed && (
                            <button
                              className="btn-primary"
                              style={{ flexShrink: 0, minWidth: '6rem' }}
                              onClick={() => saveScore(f)}
                              disabled={saving[f.id]}
                            >
                              {saving[f.id] ? t('common.saving') : hasResult ? t('matchday.updateBtn') : t('matchday.saveBtn')}
                            </button>
                          )}
                        </div>

                        {/* Events section */}
                        {!isPostponed && (
                          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {t('matchday.events')}
                            </div>

                            {/* Event list */}
                            {fixtureEvents.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
                                {fixtureEvents.map(ev => (
                                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem', minWidth: '2.5rem' }}>
                                      {ev.team?.name === f.home_team?.name ? '←' : '→'} {ev.minute ? `${ev.minute}'` : ''}
                                    </span>
                                    <span>{eventLabel(ev)}</span>
                                    <button
                                      onClick={() => deleteEvent(ev.id, f.id)}
                                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.75rem', padding: '0 0.25rem' }}
                                    >×</button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add event form */}
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <select
                                value={ef.teamId ?? ''}
                                onChange={e => {
                                  setEF(f.id, { teamId: e.target.value, playerId: '' })
                                  loadTeamPlayers(e.target.value)
                                }}
                                style={{ ...inputSx, fontSize: '0.8rem' }}
                              >
                                <option value="">{t('matchday.eventTeam')}</option>
                                {f.home_team && <option value={f.home_team.id}>{f.home_team.name}</option>}
                                {f.away_team && <option value={f.away_team.id}>{f.away_team.name}</option>}
                              </select>
                              <select
                                value={ef.playerId ?? ''}
                                onChange={e => setEF(f.id, { playerId: e.target.value })}
                                style={{ ...inputSx, fontSize: '0.8rem' }}
                                disabled={!ef.teamId}
                              >
                                <option value="">{t('matchday.eventPlayer')}</option>
                                {selectedTeamPlayers.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.number ? `#${p.number} ` : ''}{p.name}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={ef.eventType ?? ''}
                                onChange={e => setEF(f.id, { eventType: e.target.value })}
                                style={{ ...inputSx, fontSize: '0.8rem' }}
                              >
                                <option value="">—</option>
                                <option value="goal">{t('matchday.eventGoal')}</option>
                                <option value="own_goal">{t('matchday.eventOwnGoal')}</option>
                                <option value="yellow_card">{t('matchday.eventYellow')}</option>
                                <option value="red_card">{t('matchday.eventRed')}</option>
                              </select>
                              <input
                                type="number"
                                min="1"
                                max="120"
                                placeholder={t('matchday.eventMinute')}
                                value={ef.minute ?? ''}
                                onChange={e => setEF(f.id, { minute: e.target.value })}
                                style={{ ...inputSx, width: '4.5rem', fontSize: '0.8rem' }}
                              />
                              <button
                                className="btn-primary btn-sm"
                                disabled={!ef.teamId || !ef.eventType || addingEvent[f.id]}
                                onClick={() => addEvent(f)}
                              >
                                + {t('matchday.addEvent')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Bulk save */}
            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
              <button
                className="btn-primary"
                onClick={saveAll}
                disabled={savingAll}
                style={{ minWidth: '160px' }}
              >
                {savingAll ? t('common.saving') : t('matchday.saveAll')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
