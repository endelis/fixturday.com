import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'

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

  async function load() {
    setLoading(true)
    const start = new Date(selectedDate + 'T00:00:00').toISOString()
    const end   = new Date(selectedDate + 'T23:59:59').toISOString()

    const { data: fx, error } = await supabase
      .from('fixtures')
      .select(`
        *,
        home_team:teams!home_team_id(name),
        away_team:teams!away_team_id(name),
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

    // Derive tournament ID for back button
    const tId = allFx[0]?.stages?.age_groups?.tournaments?.id ?? null
    setTournamentId(tId)

    const init = {}
    allFx.forEach(f => {
      const r = f.fixture_results?.[0]
      init[f.id] = { home: r?.home_goals ?? 0, away: r?.away_goals ?? 0 }
    })
    setScores(init)
    setLoading(false)
  }

  useEffect(() => { load() }, [selectedDate])

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
          style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--color-text)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.875rem' }}
        />
      </nav>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '1.25rem' }}>
          {t('matchday.title')}
        </h1>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <select
            value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
            style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--color-text)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.875rem' }}
          >
            <option value="all">{t('matchday.filterAll')}</option>
            {ageGroupNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--color-text)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.875rem' }}
          >
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
                    return (
                      <div key={f.id} className="card" style={{ opacity: isPostponed ? 0.5 : 1 }}>
                        {/* Top row: time, pitch, status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                            {f.kickoff_time && format(new Date(f.kickoff_time), 'HH:mm')}
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
