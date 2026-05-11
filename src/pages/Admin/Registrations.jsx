import { useState } from 'react'
import { useOutletContext, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { useRegistrations } from '../../hooks/useRegistrations'
import { toast } from '../../components/Toast'

export default function Registrations() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useTranslation()
  const { tournament } = useOutletContext()
  const { registrations, approve, reject, loading, error } = useRegistrations(tournament.id)
  const [tab, setTab] = useState('pending')

  if (authLoading || loading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />

  const pending  = registrations.filter(r => r.status === 'pending')
  const approved = registrations.filter(r => r.status === 'approved')
  const rejected = registrations.filter(r => r.status === 'rejected')
  const displayed = { pending, approved, rejected }[tab]

  async function handleApprove(id) {
    if (!window.confirm(t('admin.registrations.approveConfirm'))) return
    try {
      await approve(id)
      toast(t('admin.registrations.approved'))
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  async function handleReject(id) {
    const reason = window.prompt(t('admin.registrations.rejectPrompt'))
    if (reason === null) return
    try {
      await reject(id, reason)
      toast(t('admin.registrations.rejected'))
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  const tabBtn = (key) => ({
    background: 'none',
    border: 'none',
    borderBottom: tab === key ? '2px solid var(--color-accent)' : '2px solid transparent',
    color: tab === key ? 'var(--color-accent)' : 'var(--color-muted)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '0.9375rem',
    padding: '0.75rem 1.25rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    minHeight: '44px',
  })

  return (
    <div style={{ padding: '2rem 1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', marginBottom: '1.5rem' }}>
        {t('admin.registrations.title')}
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <button style={tabBtn('pending')} onClick={() => setTab('pending')}>
          {t('admin.registrations.tabPending')}
          {pending.length > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: '0.5rem', minWidth: '1.25rem', height: '1.25rem',
              borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
              background: 'var(--color-accent)', color: '#000', padding: '0 0.3rem',
            }}>
              {pending.length}
            </span>
          )}
        </button>
        <button style={tabBtn('approved')} onClick={() => setTab('approved')}>
          {t('admin.registrations.tabApproved')}
        </button>
        <button style={tabBtn('rejected')} onClick={() => setTab('rejected')}>
          {t('admin.registrations.tabRejected')}
        </button>
      </div>

      {/* Content */}
      {displayed.length === 0 ? (
        <p style={{ color: 'var(--color-muted)' }}>{t('common.noData')}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('admin.registrations.colSubmitted')}</th>
                <th>{t('admin.registrations.colTeam')}</th>
                <th>{t('admin.registrations.colAgeGroup')}</th>
                <th>{t('admin.registrations.colManager')}</th>
                <th>{t('admin.registrations.colEmail')}</th>
                {tab === 'pending' && <th>{t('admin.registrations.colActions')}</th>}
              </tr>
            </thead>
            <tbody>
              {displayed.map(reg => (
                <tr key={reg.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                    {format(new Date(reg.created_at), 'dd.MM.yyyy HH:mm')}
                  </td>
                  <td style={{ fontWeight: 600 }}>{reg.team_name}</td>
                  <td>{reg.age_group?.name ?? '—'}</td>
                  <td>{reg.manager_name}</td>
                  <td>
                    <a
                      href={`mailto:${reg.manager_email}`}
                      style={{ color: 'var(--color-accent)', textDecoration: 'none' }}
                    >
                      {reg.manager_email}
                    </a>
                  </td>
                  {tab === 'pending' && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => handleApprove(reg.id)}
                        >
                          {t('admin.registrations.approve')}
                        </button>
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => handleReject(reg.id)}
                          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        >
                          {t('admin.registrations.reject')}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
