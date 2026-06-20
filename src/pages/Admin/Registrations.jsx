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
  const { registrations, capacity, approve, reject, loading, error } = useRegistrations(tournament.id)
  const [tab, setTab] = useState('pending')
  const [approvingAll, setApprovingAll] = useState(false)

  if (authLoading || loading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />

  const pending  = registrations.filter(r => r.status === 'pending')
  const approved = registrations.filter(r => r.status === 'approved')
  const rejected = registrations.filter(r => r.status === 'rejected')
  const displayed = { pending, approved, rejected }[tab]

  function isDivisionFull(ageGroupId) {
    const cap = capacity[ageGroupId]
    return cap ? cap.confirmed >= cap.max : false
  }

  function capacityLabel(ageGroupId) {
    const cap = capacity[ageGroupId]
    if (!cap) return null
    if (cap.confirmed >= cap.max) return { text: t('admin.registrations.divisionFull'), full: true }
    const left = cap.max - cap.confirmed
    return { text: `${cap.confirmed}/${cap.max}`, full: false, left }
  }

  async function handleApprove(id, ageGroupId) {
    if (isDivisionFull(ageGroupId)) {
      toast(t('team.maxTeamsReached'), 'error')
      return
    }
    if (!window.confirm(t('admin.registrations.approveConfirm'))) return
    try {
      await approve(id)
      toast(t('admin.registrations.approved'))
    } catch (err) {
      toast(err?.message === 'MAX_TEAMS_REACHED' ? t('team.maxTeamsReached') : t('common.error'), 'error')
    }
  }

  async function handleApproveAll() {
    if (!window.confirm(t('admin.registrations.approveAllConfirm', { count: pending.length }))) return
    setApprovingAll(true)
    let approved = 0
    let hitCapacity = false
    for (const reg of pending) {
      if (hitCapacity) break
      try {
        await approve(reg.id)
        approved++
      } catch (err) {
        if (err?.message === 'MAX_TEAMS_REACHED') { hitCapacity = true }
      }
    }
    setApprovingAll(false)
    if (hitCapacity) {
      toast(t('team.maxTeamsReached'), 'error')
    } else {
      toast(t('admin.registrations.approveAllDone'), 'success')
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
    color: tab === key ? 'var(--color-accent)' : 'var(--color-text-muted)',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: 0 }}>
          {t('admin.registrations.title')}
        </h1>
        {tab === 'pending' && pending.length > 0 && (
          <button
            className="btn-primary btn-sm"
            disabled={approvingAll}
            onClick={handleApproveAll}
          >
            {approvingAll ? t('common.saving') : t('admin.registrations.approveAll', { count: pending.length })}
          </button>
        )}
      </div>

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
        <p style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</p>
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
              {displayed.map(reg => {
                const cap = capacityLabel(reg.age_group_id)
                const full = isDivisionFull(reg.age_group_id)
                return (
                  <tr key={reg.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {format(new Date(reg.created_at), 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td style={{ fontWeight: 600 }}>{reg.team_name}</td>
                    <td>
                      <span>{reg.age_group?.name ?? '—'}</span>
                      {cap && (
                        <span style={{
                          marginLeft: '0.4rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: cap.full ? 'rgba(231,76,60,0.15)' : 'rgba(240,165,0,0.12)',
                          color: cap.full ? 'var(--color-danger)' : 'var(--color-accent)',
                          border: `1px solid ${cap.full ? 'rgba(231,76,60,0.3)' : 'rgba(240,165,0,0.3)'}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {cap.text}
                        </span>
                      )}
                    </td>
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
                            onClick={() => handleApprove(reg.id, reg.age_group_id)}
                            disabled={full}
                            title={full ? t('team.maxTeamsReached') : undefined}
                            style={full ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
