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

  const publicUrl = tournament.slug
    ? `https://www.fixturday.com/t/${tournament.slug}`
    : null

  function printQR() {
    if (!publicUrl) return
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}&margin=6`
    const win = window.open('', '_blank', 'width=520,height=680')
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${tournament.name} – Fixturday</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}
    .card{text-align:center;max-width:360px;width:100%}
    .brand{font-size:0.7rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#aaa;margin-bottom:1.75rem}
    h1{font-size:1.6rem;font-weight:700;line-height:1.2;margin-bottom:1.75rem}
    .qr-wrap{display:inline-block;border:3px solid #f0a500;border-radius:10px;padding:10px;margin-bottom:1.25rem}
    .qr-wrap img{display:block}
    .url{font-size:0.8rem;color:#555;word-break:break-all;margin-bottom:0.5rem}
    .hint{font-size:0.78rem;color:#999;margin-bottom:1.75rem}
    .btn{padding:0.55rem 1.5rem;background:#f0a500;color:#000;border:none;border-radius:6px;font-weight:700;font-size:0.9rem;cursor:pointer;letter-spacing:0.03em}
    @media print{.btn{display:none}body{padding:0}h1{font-size:1.3rem}}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Fixturday</div>
    <h1>${tournament.name}</h1>
    <div class="qr-wrap"><img src="${qrUrl}" width="280" height="280" alt="QR code" /></div>
    <p class="url">${publicUrl}</p>
    <p class="hint">${t('workspace.qrHint')}</p>
    <button class="btn" onclick="window.print()">Print</button>
  </div>
</body>
</html>`)
    win.document.close()
  }

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>{t('workspace.navOverview')}</h1>
        <span className={`badge ${tournament.is_active ? 'badge-success' : 'badge-muted'}`}>
          {tournament.is_active ? t('tournament.active') : t('tournament.inactive')}
        </span>
      </div>

      {/* Hero: public page + QR print */}
      {publicUrl && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(240,165,0,0.07) 0%, rgba(240,165,0,0.02) 100%)',
          border: '1px solid rgba(240,165,0,0.22)',
          borderLeft: '4px solid var(--color-accent)',
          borderRadius: 'var(--radius)',
          marginBottom: '1.75rem',
        }}>
          {/* QR preview */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}&margin=4`}
            alt="QR"
            width={90}
            height={90}
            style={{ borderRadius: '6px', flexShrink: 0, background: '#fff', padding: '4px' }}
          />

          {/* URL + actions */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
              {t('workspace.heroLabel')}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-accent)', marginBottom: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {publicUrl.replace('https://', '')}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
                {t('workspace.openPublicPage')} ↗
              </a>
              <button type="button" className="btn-primary btn-sm" onClick={printQR}>
                🖨 {t('workspace.printQR')}
              </button>
            </div>
          </div>
        </div>
      )}

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
