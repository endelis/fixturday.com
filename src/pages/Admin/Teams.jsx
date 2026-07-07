import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../utils/dateFormat'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'
import TeamLogoUpload from '../../components/admin/TeamLogoUpload'

const STATUS_BADGES = { pending: 'badge-warning', confirmed: 'badge-success', rejected: 'badge-danger' }

const editInputStyle = {
  width: '100%',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  padding: '0.4rem 0.75rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.875rem',
}

const editLabelStyle = {
  fontSize: '0.72rem',
  color: 'var(--color-text-muted)',
  marginBottom: '0.2rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export default function Teams() {
  const { ageGroupId } = useParams()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [ageGroup, setAgeGroup] = useState(null)
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [metaDraft, setMetaDraft] = useState({ contact_name: '', country_code: 'LV' })
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm()
  const watchedP1 = watch('player1_name', '')
  const watchedP2 = watch('player2_name', '')
  const playerForm = useForm()

  async function load() {
    const [{ data: ag, error: agErr }, { data: t_, error: tErr }] = await Promise.all([
      supabase.from('age_groups').select('*, tournaments(id, name, sport)').eq('id', ageGroupId).single(),
      supabase.from('teams').select('*').eq('age_group_id', ageGroupId).order('name'),
    ])
    if (agErr || tErr) { toast(t('common.error'), 'error'); setLoading(false); return }
    setAgeGroup(ag)
    setTeams(t_ ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading || !user) return
    load()
  }, [ageGroupId, authLoading, user])

  async function loadPlayers(teamId) {
    const { data, error } = await supabase.from('team_players').select('*').eq('team_id', teamId).order('number')
    if (error) { toast(t('common.error'), 'error'); return }
    setPlayers(prev => ({ ...prev, [teamId]: data ?? [] }))
  }

  async function onSubmit(values) {
    const isBV = ageGroup?.tournaments?.sport === 'beach_volleyball'
    const teamName = isBV
      ? `${values.player1_name.trim()} / ${values.player2_name.trim()}`
      : values.name
    const payload = {
      name: teamName,
      age_group_id: ageGroupId,
      status: 'pending',
      club: isBV ? null : (values.club || null),
      contact_name: isBV ? values.player1_name.trim() : (values.contact_name || null),
      contact_email: values.contact_email || null,
      contact_phone: values.contact_phone || null,
    }
    const { error } = await supabase.from('teams').insert(payload)
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('team.added'))
    reset()
    setShowForm(false)
    load()
  }

  async function updateStatus(teamId, status) {
    if (status === 'confirmed' && ageGroup?.max_teams) {
      const { count, error: cntErr } = await supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('age_group_id', ageGroupId)
        .eq('status', 'confirmed')
      if (!cntErr && count >= ageGroup.max_teams) {
        toast(t('team.maxTeamsReached'), 'error')
        return
      }
    }
    const { error } = await supabase.from('teams').update({ status }).eq('id', teamId)
    if (error) { toast(t('common.error'), 'error'); return }
    toast(status === 'confirmed' ? t('team.confirmed') : t('team.rejected'))
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
      position: values.position || null,
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
    const teamData = teams.find(tm => tm.id === teamId)
    setMetaDraft({
      contact_name: teamData?.contact_name ?? '',
      country_code: teamData?.country_code ?? 'LV',
    })
  }

  async function saveMeta(teamId) {
    const { error } = await supabase
      .from('teams')
      .update({ contact_name: metaDraft.contact_name || null, country_code: metaDraft.country_code || null })
      .eq('id', teamId)
    if (error) { toast(t('admin.team.metaFailed'), 'error'); return }
    setTeams(prev => prev.map(tm => tm.id === teamId ? { ...tm, ...metaDraft } : tm))
    toast(t('admin.team.metaSaved'))
  }

  function startEdit(team) {
    setEditingTeamId(team.id)
    setEditDraft({
      name: team.name ?? '',
      club: team.club ?? '',
      contact_name: team.contact_name ?? '',
      contact_email: team.contact_email ?? '',
      contact_phone: team.contact_phone ?? '',
    })
  }

  async function saveEdit(teamId) {
    const { error } = await supabase
      .from('teams')
      .update({
        name: editDraft.name.trim() || null,
        club: editDraft.club.trim() || null,
        contact_name: editDraft.contact_name.trim() || null,
        contact_email: editDraft.contact_email.trim() || null,
        contact_phone: editDraft.contact_phone.trim() || null,
      })
      .eq('id', teamId)
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('common.saved'))
    setEditingTeamId(null)
    load()
  }

  async function bulkApprove() {
    if (!confirm(t('team.confirmApproveAll'))) return
    const pendingTeams = teams.filter(tm => tm.status === 'pending')

    let idsToApprove = pendingTeams.map(tm => tm.id)

    if (ageGroup?.max_teams) {
      const { count: confirmedCount, error: cntErr } = await supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('age_group_id', ageGroupId)
        .eq('status', 'confirmed')
      if (!cntErr) {
        const slots = Math.max(0, ageGroup.max_teams - (confirmedCount ?? 0))
        if (slots === 0) {
          toast(t('team.maxTeamsReached'), 'error')
          return
        }
        idsToApprove = idsToApprove.slice(0, slots)
      }
    }

    const { error } = await supabase
      .from('teams')
      .update({ status: 'confirmed' })
      .in('id', idsToApprove)
    if (error) { toast(t('common.error'), 'error'); return }

    const skipped = pendingTeams.length - idsToApprove.length
    if (skipped > 0) {
      toast(t('team.bulkPartial', { approved: idsToApprove.length, skipped }), 'error')
    } else {
      toast(t('team.allApproved'))
    }
    load()
  }

  if (authLoading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />
  if (loading) return <div className="loading">{t('common.loading')}</div>

  const isBeachVolleyball = ageGroup?.tournaments?.sport === 'beach_volleyball'

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
          <Link to={`/admin/tournaments/${ageGroup?.tournaments?.id}/age-groups/${ageGroupId}/fixtures`} className="btn-secondary btn-sm">
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
              {isBeachVolleyball ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>{t('team.player1')} *</label>
                      <input {...register('player1_name', { required: t('common.required') })} placeholder="Ainis" autoFocus />
                      {errors.player1_name && <span className="error-message">{errors.player1_name.message}</span>}
                    </div>
                    <div className="form-group">
                      <label>{t('team.player2')} *</label>
                      <input {...register('player2_name', { required: t('common.required') })} placeholder="Kaspars" />
                      {errors.player2_name && <span className="error-message">{errors.player2_name.message}</span>}
                    </div>
                  </div>
                  {(watchedP1 || watchedP2) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '-0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('team.pairPreview')}:</span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-accent)' }}>
                        {[watchedP1, watchedP2].filter(Boolean).join(' / ')}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>{t('team.contactEmail')}</label>
                      <input type="email" {...register('contact_email')} />
                    </div>
                    <div className="form-group">
                      <label>{t('team.contactPhone')}</label>
                      <input {...register('contact_phone')} />
                    </div>
                  </div>
                </>
              ) : (
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
              )}
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
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => editingTeamId === team.id ? setEditingTeamId(null) : startEdit(team)}
                  >
                    {editingTeamId === team.id ? t('common.cancel') : t('common.edit')}
                  </button>
                  {!isBeachVolleyball && (
                    <button className="btn-secondary btn-sm" onClick={() => toggleExpand(team.id)}>
                      {expandedTeam === team.id ? t('common.close') : t('team.players')}
                    </button>
                  )}
                  <button className="btn-danger btn-sm" onClick={() => deleteTeam(team.id)}>×</button>
                </div>
              </div>

              {editingTeamId === team.id && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={editLabelStyle}>{t('team.name')}</div>
                      <input value={editDraft.name} onChange={e => setEditDraft(p => ({ ...p, name: e.target.value }))} style={editInputStyle} />
                    </div>
                    {!isBeachVolleyball && (
                      <div>
                        <div style={editLabelStyle}>{t('team.club')}</div>
                        <input value={editDraft.club} onChange={e => setEditDraft(p => ({ ...p, club: e.target.value }))} style={editInputStyle} />
                      </div>
                    )}
                    <div>
                      <div style={editLabelStyle}>{t('team.contactName')}</div>
                      <input value={editDraft.contact_name} onChange={e => setEditDraft(p => ({ ...p, contact_name: e.target.value }))} style={editInputStyle} />
                    </div>
                    <div>
                      <div style={editLabelStyle}>{t('team.contactEmail')}</div>
                      <input type="email" value={editDraft.contact_email} onChange={e => setEditDraft(p => ({ ...p, contact_email: e.target.value }))} style={editInputStyle} />
                    </div>
                    <div>
                      <div style={editLabelStyle}>{t('team.contactPhone')}</div>
                      <input value={editDraft.contact_phone} onChange={e => setEditDraft(p => ({ ...p, contact_phone: e.target.value }))} style={editInputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-primary btn-sm" onClick={() => saveEdit(team.id)}>{t('common.save')}</button>
                    <button className="btn-secondary btn-sm" onClick={() => setEditingTeamId(null)}>{t('common.cancel')}</button>
                  </div>
                </div>
              )}

              {!isBeachVolleyball && expandedTeam === team.id && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>

                  {/* Logo + meta fields */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', alignItems: 'flex-end' }}>
                    <TeamLogoUpload
                      teamId={team.id}
                      currentLogoPath={team.logo_path}
                      onChange={newPath => setTeams(prev => prev.map(tm => tm.id === team.id ? { ...tm, logo_path: newPath } : tm))}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>{t('admin.team.managerName')}</div>
                        <input
                          value={metaDraft.contact_name}
                          onChange={e => setMetaDraft(prev => ({ ...prev, contact_name: e.target.value }))}
                          placeholder={t('admin.team.managerName')}
                          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', minWidth: '12rem' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>{t('admin.team.countryCode')}</div>
                        <input
                          value={metaDraft.country_code}
                          onChange={e => setMetaDraft(prev => ({ ...prev, country_code: e.target.value.toUpperCase().slice(0, 2) }))}
                          maxLength={2}
                          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)', width: '4rem', textAlign: 'center', textTransform: 'uppercase' }}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => saveMeta(team.id)}
                      >
                        {t('admin.team.saveMeta')}
                      </button>
                    </div>
                  </div>

                  <table className="table" style={{ marginBottom: '1rem' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('team.playerName')}</th>
                        <th>{t('team.position')}</th>
                        <th>{t('team.dob')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(players[team.id] ?? []).map(p => (
                        <tr key={p.id}>
                          <td>{p.number ?? '—'}</td>
                          <td>{p.name}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {p.position ? t(`team.positions.${p.position}`) : '—'}
                          </td>
                          <td>{p.date_of_birth ? formatDate(p.date_of_birth) : '—'}</td>
                          <td>
                            <button className="btn-danger btn-sm" onClick={() => deletePlayer(p.id, team.id)}>×</button>
                          </td>
                        </tr>
                      ))}
                      {(players[team.id] ?? []).length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
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
                    <select
                      {...playerForm.register('position')}
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
                    >
                      <option value="">{t('team.positionAny')}</option>
                      <option value="goalkeeper">{t('team.positions.goalkeeper')}</option>
                      <option value="defender">{t('team.positions.defender')}</option>
                      <option value="midfielder">{t('team.positions.midfielder')}</option>
                      <option value="forward">{t('team.positions.forward')}</option>
                    </select>
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
