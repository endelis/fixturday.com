import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'

const STATUS_BADGES = { pending: 'badge-warning', confirmed: 'badge-success', rejected: 'badge-danger' }

export default function Teams() {
  const { ageGroupId } = useParams()
  const { t } = useTranslation()
  const [ageGroup, setAgeGroup] = useState(null)
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const playerForm = useForm()

  async function load() {
    const [{ data: ag }, { data: t_ }] = await Promise.all([
      supabase.from('age_groups').select('*, tournaments(id, name)').eq('id', ageGroupId).single(),
      supabase.from('teams').select('*').eq('age_group_id', ageGroupId).order('name'),
    ])
    setAgeGroup(ag)
    setTeams(t_ ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [ageGroupId])

  async function loadPlayers(teamId) {
    const { data } = await supabase.from('team_players').select('*').eq('team_id', teamId).order('number')
    setPlayers(prev => ({ ...prev, [teamId]: data ?? [] }))
  }

  async function onSubmit(values) {
    const { error } = await supabase.from('teams').insert({ ...values, age_group_id: ageGroupId, status: 'pending' })
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('team.added'))
    reset()
    setShowForm(false)
    load()
  }

  async function updateStatus(teamId, status) {
    const { error } = await supabase.from('teams').update({ status }).eq('id', teamId)
    if (error) { toast(t('common.error'), 'error'); return }
    const msg = status === 'confirmed' ? t('team.confirmed') : t('team.rejected')
    toast(msg)
    load()
  }

  async function deleteTeam(teamId) {
    if (!confirm(t('team.confirmDelete'))) return
    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('team.deleted'))
    load()
  }

  async function addPlayer(teamId, values) {
    const { error } = await supabase.from('team_players').insert({
      ...values,
      team_id: teamId,
      number: values.number ? Number(values.number) : null,
    })
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('team.playerAdded'))
    playerForm.reset()
    loadPlayers(teamId)
  }

  async function deletePlayer(playerId, teamId) {
    const { error } = await supabase.from('team_players').delete().eq('id', playerId)
    if (error) { toast(t('common.error'), 'error'); return }
    loadPlayers(teamId)
  }

  function toggleExpand(teamId) {
    if (expandedTeam === teamId) { setExpandedTeam(null); return }
    setExpandedTeam(teamId)
    loadPlayers(teamId)
  }

  async function bulkApprove() {
    if (!confirm(t('team.confirmApproveAll'))) return
    const pendingIds = teams.filter(t => t.status === 'pending').map(t => t.id)
    const { error } = await supabase
      .from('teams')
      .update({ status: 'confirmed' })
      .in('id', pendingIds)
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('team.allApproved'))
    load()
  }

  if (loading) return <div className="loading">{t('common.loading')}</div>

  return (
    <div>
      <nav className="admin-nav">
        <Link
          to={`/admin/tournaments/${ageGroup?.tournaments?.id}/age-groups`}
          style={{ color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}
        >
          ← {ageGroup?.tournaments?.name} / {ageGroup?.name}
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/admin/age-groups/${ageGroupId}/fixtures`} className="btn-secondary btn-sm">
            {t('fixture.title')}
          </Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
            {t('team.title')} — {ageGroup?.name}
          </h1>
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + {t('team.new')}
            </button>
          )}
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>{t('team.new')}</h2>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>{t('team.name')} *</label>
                  <input {...register('name', { required: t('common.required') })} />
                  {errors.name && <span className="error-message">{errors.name.message}</span>}
                </div>
                <div className="form-group">
                  <label>{t('team.club')}</label>
                  <input {...register('club')} />
                </div>
                <div className="form-group">
                  <label>{t('team.contactName')}</label>
                  <input {...register('contact_name')} />
                </div>
                <div className="form-group">
                  <label>{t('team.contactEmail')}</label>
                  <input type="email" {...register('contact_email')} />
                </div>
                <div className="form-group">
                  <label>{t('team.contactPhone')}</label>
                  <input {...register('contact_phone')} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? t('common.saving') : t('common.add')}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); reset() }}>
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {teams.some(team => team.status === 'pending') && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn-primary btn-sm" onClick={bulkApprove}>
              {t('team.approveAll')}
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {teams.map(team => (
            <div key={team.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>{team.name}</strong>
                  {team.club && (
                    <span style={{ marginLeft: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{team.club}</span>
                  )}
                  {team.contact_email && (
                    <span style={{ marginLeft: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{team.contact_email}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`badge ${STATUS_BADGES[team.status]}`}>
                    {t(`team.statuses.${team.status}`)}
                  </span>
                  {team.status === 'pending' && (
                    <>
                      <button className="btn-primary btn-sm" onClick={() => updateStatus(team.id, 'confirmed')}>
                        {t('common.confirm')}
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => updateStatus(team.id, 'rejected')}>
                        {t('team.reject')}
                      </button>
                    </>
                  )}
                  {team.status === 'rejected' && (
                    <button className="btn-secondary btn-sm" onClick={() => updateStatus(team.id, 'confirmed')}>
                      {t('common.confirm')}
                    </button>
                  )}
                  <button className="btn-secondary btn-sm" onClick={() => toggleExpand(team.id)}>
                    {expandedTeam === team.id ? t('common.close') : t('team.players')}
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => deleteTeam(team.id)}>×</button>
                </div>
              </div>

              {expandedTeam === team.id && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <table className="table" style={{ marginBottom: '1rem' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('team.playerName')}</th>
                        <th>{t('team.dob')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(players[team.id] ?? []).map(p => (
                        <tr key={p.id}>
                          <td>{p.number ?? '—'}</td>
                          <td>{p.name}</td>
                          <td>{p.date_of_birth ? format(new Date(p.date_of_birth), 'dd/MM/yyyy') : '—'}</td>
                          <td>
                            <button className="btn-danger btn-sm" onClick={() => deletePlayer(p.id, team.id)}>×</button>
                          </td>
                        </tr>
                      ))}
                      {(players[team.id] ?? []).length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
                            {t('team.noPlayers')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <form
                    onSubmit={playerForm.handleSubmit(v => addPlayer(team.id, v))}
                    style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
                  >
                    <input
                      {...playerForm.register('number')}
                      placeholder="#"
                      style={{ width: '4rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
                    />
                    <input
                      {...playerForm.register('name', { required: true })}
                      placeholder={t('team.playerName')}
                      style={{ flex: 1, minWidth: '10rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
                    />
                    <input
                      type="date"
                      {...playerForm.register('date_of_birth')}
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
                    />
                    <button type="submit" className="btn-primary btn-sm">+ {t('team.addPlayer')}</button>
                  </form>
                </div>
              )}
            </div>
          ))}
          {teams.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</p>}
        </div>
      </div>
    </div>
  )
}
