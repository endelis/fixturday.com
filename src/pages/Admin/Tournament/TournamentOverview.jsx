import { useEffect, useState } from 'react'
import { useParams, Link, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase'

export default function TournamentOverview() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { tournament, ageGroupCount } = useOutletContext()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const { data: ageGroups } = await supabase
        .from('age_groups')
        .select('id')
        .eq('tournament_id', id)

      const agIds = (ageGroups ?? []).map(ag => ag.id)

      const { count: venuesCount } = await supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', id)

      if (agIds.length === 0) {
        setStats({ teams: 0, fixtures: 0, completed: 0, venues: venuesCount ?? 0 })
        setLoading(false)
        return
      }

      const { data: stageData } = await supabase
        .from('stages')
        .select('id')
        .in('age_group_id', agIds)
      const stageIds = (stageData ?? []).map(s => s.id)

      const [
        { count: teamsCount },
        { count: fixturesCount },
        { count: completedCount },
      ] = await Promise.all([
        supabase.from('teams').select('id', { count: 'exact', head: true }).in('age_group_id', agIds).eq('status', 'confirmed'),
        stageIds.length
          ? supabase.from('fixtures').select('id', { count: 'exact', head: true }).in('stage_id', stageIds)
          : Promise.resolve({ count: 0 }),
        stageIds.length
          ? supabase.from('fixtures').select('id', { count: 'exact', head: true }).in('stage_id', stageIds).eq('status', 'completed')
          : Promise.resolve({ count: 0 }),
      ])

      setStats({
        teams: teamsCount ?? 0,
        fixtures: fixturesCount ?? 0,
        completed: completedCount ?? 0,
        venues: venuesCount ?? 0,
      })
      setLoading(false)
    }
    loadStats()
  }, [id])

  const setupSteps = [
    { labelKey: 'workspace.setupStep1', done: (ageGroupCount ?? 0) > 0, path: 'age-groups' },
    { labelKey: 'workspace.setupStep2', done: (stats?.venues ?? 0) > 0, path: 'venues' },
    { labelKey: 'workspace.setupStep3', done: (stats?.teams ?? 0) > 0, path: 'age-groups' },
    { labelKey: 'workspace.setupStep4', done: (stats?.fixtures ?? 0) > 0, path: 'age-groups' },
  ]
  const setupDone = setupSteps.every(s => s.done)

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>{t('workspace.navOverview')}</h1>
        <span className={`badge ${tournament.is_active ? 'badge-success' : 'badge-muted'}`}>
          {tournament.is_active ? t('tournament.active') : t('tournament.inactive')}
        </span>
      </div>

      {/* Quick stats */}
      {!loading && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { labelKey: 'workspace.statAgeGroups', value: ageGroupCount ?? 0, path: 'age-groups' },
            { labelKey: 'workspace.statTeams',     value: stats.teams,         path: 'age-groups' },
            { labelKey: 'workspace.statFixtures',  value: stats.fixtures,      path: 'age-groups' },
            { labelKey: 'workspace.statCompleted', value: stats.completed,     path: 'age-groups' },
          ].map(s => (
            <Link key={s.labelKey} to={`/admin/tournaments/${id}/${s.path}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--color-accent)' }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>{t(s.labelKey)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Setup progress (hidden once all done) */}
      {!setupDone && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-accent)' }}>
            {t('wizard.setupProgress')}
          </h3>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {setupSteps.map((step, i) => (
              <Link
                key={i}
                to={`/admin/tournaments/${id}/${step.path}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  color: step.done ? 'var(--color-muted)' : 'var(--color-text)',
                  padding: '0.5rem 0.25rem',
                  opacity: step.done ? 0.6 : 1,
                }}
              >
                <span style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: step.done ? 'var(--color-success)' : 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', flexShrink: 0,
                  color: step.done ? '#fff' : 'var(--color-muted)',
                }}>
                  {step.done ? '✓' : i + 1}
                </span>
                <span style={{ fontSize: '0.9rem', textDecoration: step.done ? 'line-through' : 'none' }}>
                  {t(step.labelKey)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-muted)' }}>
        {t('workspace.quickLinks')}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        {[
          { labelKey: 'workspace.navAgeGroups', path: 'age-groups', icon: '👥' },
          { labelKey: 'workspace.navVenues',    path: 'venues',     icon: '🏟' },
          { labelKey: 'workspace.navStats',     path: 'stats',      icon: '📊' },
          { labelKey: 'workspace.navSettings',  path: 'settings',   icon: '⚙' },
        ].map(link => (
          <Link
            key={link.path}
            to={`/admin/tournaments/${id}/${link.path}`}
            className="card"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.875rem 1rem' }}
          >
            <span>{link.icon}</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem' }}>{t(link.labelKey)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
