import { useEffect, useState } from 'react'
import { Outlet, NavLink, Link, useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import {
  LayoutDashboard, Users, List, Trophy, MapPin,
  BarChart2, Settings, Info, ClipboardList, Zap, Menu, ArrowLeft,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: 'overview',       icon: <LayoutDashboard size={16} />, labelKey: 'workspace.navOverview' },
  { path: 'age-groups',     icon: <Users size={16} />,           labelKey: 'workspace.navAgeGroups' },
  { path: 'standings',      icon: <List size={16} />,            labelKey: 'workspace.navStandings' },
  { path: 'playoff',        icon: <Trophy size={16} />,          labelKey: 'workspace.navPlayoff' },
  { path: 'venues',         icon: <MapPin size={16} />,          labelKey: 'workspace.navVenues' },
  { path: 'stats',          icon: <BarChart2 size={16} />,       labelKey: 'workspace.navStats' },
  { path: 'settings',       icon: <Settings size={16} />,        labelKey: 'workspace.navSettings' },
  { path: 'info',           icon: <Info size={16} />,            labelKey: 'workspace.navInfo' },
  { path: 'registrations',  icon: <ClipboardList size={16} />,   labelKey: 'workspace.navRegistrations' },
]

export default function TournamentLayout() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // stepsComplete[0..3]: age groups, venues, confirmed teams, fixtures
  const [stepsComplete, setStepsComplete] = useState([false, false, false, false])
  const [pendingRegs, setPendingRegs] = useState(0)

  useEffect(() => {
    if (authLoading || !user) return
    async function load() {
      // Fetch tournament, age group count, and venues count in parallel
      const [{ data: tourney, error: tErr }, { count: agCnt, error: agErr }, { count: venCnt, error: venErr }] = await Promise.all([
        supabase.from('tournaments').select('id, name, sport, is_active').eq('id', id).single(),
        supabase.from('age_groups').select('id', { count: 'exact', head: true }).eq('tournament_id', id),
        supabase.from('venues').select('id', { count: 'exact', head: true }).eq('tournament_id', id),
      ])
      if (tErr || agErr || venErr) { setLoading(false); return }
      setTournament(tourney)

      // Steps 3-4 require age group IDs — only fetch if age groups exist
      let teamsCnt = 0, fixCnt = 0
      if ((agCnt ?? 0) > 0) {
        const { data: ags, error: agsErr } = await supabase
          .from('age_groups').select('id').eq('tournament_id', id)
        if (!agsErr) {
          const agIds = (ags ?? []).map(a => a.id)

          const [{ count: tc }, { count: pendingCnt }, { data: stages }] = await Promise.all([
            supabase.from('teams').select('id', { count: 'exact', head: true })
              .in('age_group_id', agIds).eq('status', 'confirmed'),
            supabase.from('team_registrations').select('id', { count: 'exact', head: true })
              .eq('tournament_id', id).eq('status', 'pending'),
            supabase.from('stages').select('id').in('age_group_id', agIds),
          ])
          teamsCnt = tc ?? 0
          setPendingRegs(pendingCnt ?? 0)

          if ((stages ?? []).length > 0) {
            const { count: fc } = await supabase.from('fixtures')
              .select('id', { count: 'exact', head: true })
              .in('stage_id', stages.map(s => s.id))
            fixCnt = fc ?? 0
          }
        }
      }

      const done = [
        (agCnt ?? 0) > 0,
        (venCnt ?? 0) > 0,
        teamsCnt > 0,
        fixCnt > 0,
      ]
      setStepsComplete(done)

      setLoading(false)
    }
    load()
  }, [id, authLoading, user])

  if (authLoading || loading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />
  if (!tournament) return <div className="loading">{t('workspace.notFound')}</div>

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 1.25rem',
    color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
    background: isActive ? 'rgba(240,165,0,0.12)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: isActive ? 600 : 400,
  })

  return (
    <>
      <style>{`
        .t-sidebar {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 240px; z-index: 200;
          background: var(--color-surface);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.22s ease;
          overflow-y: auto;
        }
        .t-sidebar.open { transform: translateX(0); }
        .t-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.5); z-index: 199;
        }
        .t-overlay.open { display: block; }
        .t-main { min-height: 100vh; }
        .t-hamburger { display: flex !important; }
        @media (min-width: 768px) {
          .t-sidebar { transform: translateX(0); }
          .t-main { margin-left: 240px; }
          .t-overlay { display: none !important; }
          .t-hamburger { display: none !important; }
        }
      `}</style>

      <aside className={`t-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-accent)', lineHeight: 1.3 }}>
            {tournament.name}
          </div>
          <span
            className={`badge ${tournament.is_active ? 'badge-success' : 'badge-muted'}`}
            style={{ marginTop: '0.4rem', fontSize: '0.7rem' }}
          >
            {tournament.is_active ? t('tournament.active') : t('tournament.inactive')}
          </span>
        </div>

        <nav style={{ flex: 1, paddingTop: '0.5rem' }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={`/admin/tournaments/${id}/${item.path}`}
              style={navLinkStyle}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ width: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{t(item.labelKey)}</span>
              {item.path === 'registrations' && pendingRegs > 0 && (
                <span style={{
                  background: 'var(--color-accent)',
                  color: '#0a1628',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                  minWidth: '1.25rem',
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}>
                  {pendingRegs}
                </span>
              )}
            </NavLink>
          ))}
          <NavLink
            to={`/admin/tournaments/${id}/matchday`}
            style={navLinkStyle}
            onClick={() => setSidebarOpen(false)}
          >
            <span style={{ width: '1.25rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={16} /></span>
            {t('workspace.navMatchday')}
          </NavLink>
        </nav>

        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={14} />{t('workspace.backToDashboard')}
          </Link>
        </div>
      </aside>

      <div className={`t-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <main className="t-main">
        <div style={{
          padding: '0.75rem 1.25rem',
          background: 'var(--color-surface)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <button className="t-hamburger btn-secondary btn-sm" onClick={() => setSidebarOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Menu size={16} />
          </button>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{tournament.name}</span>
        </div>
        <Outlet context={{ tournament, stepsComplete }} />
      </main>

    </>
  )
}
