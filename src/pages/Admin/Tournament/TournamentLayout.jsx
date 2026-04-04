import { useEffect, useState } from 'react'
import { Outlet, NavLink, Link, useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'

const WIZARD_STEPS = [
  { titleKey: 'wizard.step1Title', descKey: 'wizard.step1Desc', path: 'age-groups' },
  { titleKey: 'wizard.step2Title', descKey: 'wizard.step2Desc', path: 'venues' },
  { titleKey: 'wizard.step3Title', descKey: 'wizard.step3Desc', path: 'age-groups' },
  { titleKey: 'wizard.step4Title', descKey: 'wizard.step4Desc', path: 'age-groups' },
]

const NAV_ITEMS = [
  { path: 'overview',    icon: '◎', labelKey: 'workspace.navOverview' },
  { path: 'age-groups',  icon: '👥', labelKey: 'workspace.navAgeGroups' },
  { path: 'venues',      icon: '🏟', labelKey: 'workspace.navVenues' },
  { path: 'stats',       icon: '📊', labelKey: 'workspace.navStats' },
  { path: 'settings',    icon: '⚙',  labelKey: 'workspace.navSettings' },
]

export default function TournamentLayout() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [tournament, setTournament] = useState(null)
  const [ageGroupCount, setAgeGroupCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [wizardDismissed, setWizardDismissed] = useState(
    () => localStorage.getItem(`fixturday_wizard_dismissed_${id}`) === 'true'
  )

  useEffect(() => {
    async function load() {
      const [{ data: tourney }, { count }] = await Promise.all([
        supabase.from('tournaments').select('id, name, sport, is_active').eq('id', id).single(),
        supabase.from('age_groups').select('id', { count: 'exact', head: true }).eq('tournament_id', id),
      ])
      setTournament(tourney)
      setAgeGroupCount(count ?? 0)
      setLoading(false)
    }
    load()
  }, [id])

  if (authLoading || loading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />
  if (!tournament) return <div className="loading">{t('workspace.notFound')}</div>

  const showWizard = ageGroupCount === 0 && !wizardDismissed

  function dismissWizard() {
    localStorage.setItem(`fixturday_wizard_dismissed_${id}`, 'true')
    setWizardDismissed(true)
  }

  function skipStep() {
    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep(s => s + 1)
    } else {
      dismissWizard()
    }
  }

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

      {/* Sidebar */}
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
              <span style={{ width: '1.25rem', textAlign: 'center', fontSize: '1rem' }}>{item.icon}</span>
              {t(item.labelKey)}
            </NavLink>
          ))}
          <Link
            to="/admin/matchday"
            style={navLinkStyle({ isActive: false })}
            onClick={() => setSidebarOpen(false)}
          >
            <span style={{ width: '1.25rem', textAlign: 'center', fontSize: '1rem' }}>⚽</span>
            {t('workspace.navMatchday')}
          </Link>
        </nav>

        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--color-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            ← {t('workspace.backToDashboard')}
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      <div
        className={`t-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <main className="t-main">
        <div style={{
          padding: '0.75rem 1.25rem',
          background: 'var(--color-surface)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <button
            className="t-hamburger btn-secondary btn-sm"
            onClick={() => setSidebarOpen(o => !o)}
          >
            ☰
          </button>
          <span style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>{tournament.name}</span>
        </div>

        <Outlet context={{ tournament, ageGroupCount }} />
      </main>

      {/* Setup wizard overlay */}
      {showWizard && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 500, padding: '1rem',
        }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '460px',
          }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)', marginBottom: '0.35rem' }}>
              {t('wizard.title')}
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {t('wizard.subtitle')}
            </p>

            {/* Progress bar */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '1.75rem' }}>
              {WIZARD_STEPS.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: '4px', borderRadius: '2px',
                  background: i <= wizardStep ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
                  transition: 'background 0.25s',
                }} />
              ))}
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
                {t('wizard.stepLabel', { current: wizardStep + 1, total: WIZARD_STEPS.length })}
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '0.4rem' }}>
                {t(WIZARD_STEPS[wizardStep].titleKey)}
              </h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                {t(WIZARD_STEPS[wizardStep].descKey)}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <NavLink
                to={`/admin/tournaments/${id}/${WIZARD_STEPS[wizardStep].path}`}
                className="btn-primary"
                onClick={() => setSidebarOpen(false)}
              >
                {t('wizard.open')}
              </NavLink>
              <button className="btn-secondary" onClick={skipStep}>
                {wizardStep < WIZARD_STEPS.length - 1 ? t('wizard.skip') : t('wizard.finish')}
              </button>
              <button
                onClick={dismissWizard}
                style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '0.82rem', padding: '0.4rem 0.5rem' }}
              >
                {t('wizard.dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
