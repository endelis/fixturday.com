import { useEffect, useState } from 'react'
import { useParams, Link, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase'

export default function TournamentOverview() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { tournament, stepsComplete } = useOutletContext()
  const [stats, setStats] = useState(null)
  const [ageGroups, setAgeGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const [{ data: agData, error: agErr }, { count: venuesCount, error: venErr }] = await Promise.all([
        supabase.from('age_groups').select('id, name').eq('tournament_id', id).order('name'),
        supabase.from('venues').select('id', { count: 'exact', head: true }).eq('tournament_id', id),
      ])
      if (agErr || venErr) { setLoading(false); return }

      const ags = agData ?? []
      setAgeGroups(ags)
      const agIds = ags.map(ag => ag.id)

      if (agIds.length === 0) {
        setStats({ ageGroups: 0, teams: 0, fixtures: 0, completed: 0, venues: venuesCount ?? 0 })
        setLoading(false)
        return
      }

      const [{ data: stageData, error: stErr }, { count: teamsCount, error: tmErr }] = await Promise.all([
        supabase.from('stages').select('id').in('age_group_id', agIds),
        supabase.from('teams').select('id', { count: 'exact', head: true }).in('age_group_id', agIds).eq('status', 'confirmed'),
      ])
      if (stErr || tmErr) { setLoading(false); return }
      const stageIds = (stageData ?? []).map(s => s.id)

      const [{ count: fixturesCount, error: fxErr }, { count: completedCount, error: cErr }] = await Promise.all([
        stageIds.length
          ? supabase.from('fixtures').select('id', { count: 'exact', head: true }).in('stage_id', stageIds)
          : Promise.resolve({ count: 0 }),
        stageIds.length
          ? supabase.from('fixtures').select('id', { count: 'exact', head: true }).in('stage_id', stageIds).eq('status', 'completed')
          : Promise.resolve({ count: 0 }),
      ])
      if (fxErr || cErr) { setLoading(false); return }

      setStats({
        ageGroups: ags.length,
        teams: teamsCount ?? 0,
        fixtures: fixturesCount ?? 0,
        completed: completedCount ?? 0,
        venues: venuesCount ?? 0,
      })
      setLoading(false)
    }
    loadStats()
  }, [id])

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>{t('workspace.navOverview')}</h1>
        <span className={`badge ${tournament.is_active ? 'badge-success' : 'badge-muted'}`}>
          {tournament.is_active ? t('tournament.active') : t('tournament.inactive')}
        </span>
      </div>

      {/* Setup guide banner — shown while any setup step is incomplete */}
      {stepsComplete && stepsComplete.some(s => !s) && (
        <a
          href="/guide"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '1rem', padding: '1rem 1.25rem',
            background: 'rgba(240,165,0,0.08)',
            border: '1px solid rgba(240,165,0,0.3)',
            borderRadius: '10px', marginBottom: '1.75rem',
            textDecoration: 'none', cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-accent)', marginBottom: '0.2rem' }}>
              {t('workspace.setupGuideTitle')}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              {t('workspace.setupGuideDesc')}
            </div>
          </div>
          <span style={{
            flexShrink: 0, padding: '0.5rem 1rem',
            background: 'var(--color-accent)', color: '#0a1628',
            borderRadius: '6px', fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 700,
          }}>
            {t('workspace.setupGuideBtn')}
          </span>
        </a>
      )}

      {/* Quick stats */}
      {!loading && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { labelKey: 'workspace.statAgeGroups', value: stats.ageGroups, path: 'age-groups' },
            { labelKey: 'workspace.statTeams',     value: stats.teams,     path: 'age-groups' },
            { labelKey: 'workspace.statFixtures',  value: stats.fixtures,  path: 'age-groups' },
            { labelKey: 'workspace.statCompleted', value: stats.completed, path: 'age-groups' },
          ].map(s => (
            <Link key={s.labelKey} to={`/admin/tournaments/${id}/${s.path}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--color-accent)' }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{t(s.labelKey)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Age groups with per-group print links */}
      {ageGroups.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>
            {t('workspace.navAgeGroups')}
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {ageGroups.map(ag => (
              <div key={ag.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
                <Link
                  to={`/admin/tournaments/${id}/age-groups`}
                  style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-text)', textDecoration: 'none' }}
                >
                  {ag.name}
                </Link>
                <a
                  href={`/admin/tournaments/${id}/print?agId=${ag.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'none',
                    padding: '0.3rem 0.625rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '5px',
                    flexShrink: 0,
                  }}
                >
                  🖨 {t('workspace.printLink')}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
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
        <a
          href="/guide"
          target="_blank"
          rel="noreferrer"
          className="card"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.875rem 1rem' }}
        >
          <span>📖</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem' }}>{t('workspace.guideLink')}</span>
        </a>
      </div>
    </div>
  )
}
