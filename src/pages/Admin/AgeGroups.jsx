import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'

export default function AgeGroups() {
  const { id: tournamentId } = useParams()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [tournament, setTournament] = useState(null)
  const [ageGroups, setAgeGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm()

  async function load() {
    const [{ data: t_, error: tErr }, { data: ag, error: agErr }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tournamentId).single(),
      supabase.from('age_groups').select('*, teams(id, status)').eq('tournament_id', tournamentId).order('name'),
    ])
    if (tErr || agErr) { toast(t('common.error'), 'error'); setLoading(false); return }
    setTournament(t_)
    setAgeGroups(ag ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading || !user) return
    load()
  }, [tournamentId, authLoading, user])

  function startEdit(ag) {
    // Toggle: if already editing this card, close the form
    if (editingId === ag.id && showForm) {
      cancelForm()
      return
    }
    setEditingId(ag.id)
    setValue('name', ag.name)
    setValue('format', ag.format)
    setValue('max_teams', ag.max_teams ?? '')
    setValue('game_duration_minutes', ag.game_duration_minutes ?? 20)
    setValue('pitch_gap_minutes', ag.pitch_gap_minutes ?? 5)
    setValue('registration_open', ag.registration_open)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    reset()
  }

  function startNew() {
    setEditingId(null)
    reset()
    setShowForm(true)
  }

  async function onSubmit(values) {
    const payload = {
      ...values,
      tournament_id: tournamentId,
      max_teams: values.max_teams ? Number(values.max_teams) : null,
      game_duration_minutes: values.game_duration_minutes ? Number(values.game_duration_minutes) : 20,
      pitch_gap_minutes: values.pitch_gap_minutes ? Number(values.pitch_gap_minutes) : 5,
    }

    if (editingId) {
      const { error } = await supabase.from('age_groups').update(payload).eq('id', editingId)
      if (error) { toast(t('common.error'), 'error'); return }
      toast(t('common.saved'))
    } else {
      const { error } = await supabase.from('age_groups').insert(payload)
      if (error) { toast(t('common.error'), 'error'); return }
      toast(t('ageGroup.added'))
    }

    cancelForm()
    load()
  }

  async function toggleRegistration(ag) {
    const { error } = await supabase
      .from('age_groups')
      .update({ registration_open: !ag.registration_open })
      .eq('id', ag.id)
    if (error) { toast(t('common.error'), 'error'); return }
    toast(ag.registration_open ? t('ageGroup.regClosed') : t('ageGroup.regOpened'))
    load()
  }

  async function deleteAgeGroup(ag) {
    if (!confirm(t('common.confirmDelete'))) return
    const { error } = await supabase.from('age_groups').delete().eq('id', ag.id)
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('ageGroup.deleted'))
    load()
  }

  if (authLoading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />
  if (loading) return <div className="loading">{t('common.loading')}</div>

  return (
    <div>
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>{t('ageGroup.title')}</h1>
          {!showForm && (
            <button className="btn-primary" onClick={startNew}>
              + {t('ageGroup.new')}
            </button>
          )}
        </div>

        {showForm && !editingId && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
              {t('ageGroup.new')}
            </h2>
            <AgeGroupForm
              register={register}
              handleSubmit={handleSubmit}
              errors={errors}
              isSubmitting={isSubmitting}

              onSubmit={onSubmit}
              onCancel={cancelForm}
              t={t}
            />
          </div>
        )}

        {ageGroups.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {ageGroups.map(ag => (
              <div key={ag.id}>
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>{ag.name}</strong>
                    <span style={{ marginLeft: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                      {t(`ageGroup.formats.${ag.format}`)}
                    </span>
                    {ag.max_teams && (
                      <span style={{ marginLeft: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        · {t('ageGroup.maxTeams').toLowerCase()} {ag.max_teams}
                      </span>
                    )}
                    {ag.game_duration_minutes && (
                      <span style={{ marginLeft: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        · {ag.game_duration_minutes} {t('ageGroup.minutes')}
                      </span>
                    )}
                    {(() => {
                      const confirmed = (ag.teams ?? []).filter(tm => tm.status === 'confirmed').length
                      const pending   = (ag.teams ?? []).filter(tm => tm.status === 'pending').length
                      return (
                        <span style={{ marginLeft: '0.5rem', color: confirmed >= 2 ? 'var(--color-success)' : 'var(--color-muted)', fontSize: '0.875rem' }}>
                          · {confirmed} {t('ageGroup.confirmedCount')}
                          {pending > 0 && <span style={{ color: 'var(--color-accent)', marginLeft: '0.25rem' }}>({pending} {t('ageGroup.pendingCount')})</span>}
                        </span>
                      )
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge ${ag.registration_open ? 'badge-success' : 'badge-muted'}`}>
                      {ag.registration_open ? t('ageGroup.regOpen') : t('ageGroup.regClosed_label')}
                    </span>
                    <button className="btn-secondary btn-sm" onClick={() => toggleRegistration(ag)}>
                      {ag.registration_open ? t('ageGroup.closeReg') : t('ageGroup.openReg')}
                    </button>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => startEdit(ag)}
                      style={editingId === ag.id && showForm ? { background: 'var(--color-accent)', color: '#fff' } : {}}
                    >
                      {t('ageGroup.edit')}
                    </button>
                    <Link to={`/admin/age-groups/${ag.id}/teams`} className="btn-secondary btn-sm">
                      {t('team.title')}
                    </Link>
                    <Link to={`/admin/age-groups/${ag.id}/fixtures`} className="btn-secondary btn-sm">
                      {t('fixture.title')}
                    </Link>
                    <button className="btn-danger btn-sm" onClick={() => deleteAgeGroup(ag)}>
                      {t('common.delete')}
                    </button>
                  </div>
                </div>

                {editingId === ag.id && showForm && (
                  <div className="card" style={{ marginTop: '0.5rem', borderTop: '2px solid var(--color-accent)' }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
                      {t('common.edit')} — {ag.name}
                    </h2>
                    <AgeGroupForm
                      register={register}
                      handleSubmit={handleSubmit}
                      errors={errors}
                      isSubmitting={isSubmitting}
        
                      onSubmit={onSubmit}
                      onCancel={cancelForm}
                      t={t}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AgeGroupForm({ register, handleSubmit, errors, isSubmitting, onSubmit, onCancel, t }) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label>{t('ageGroup.name')} *</label>
          <input {...register('name', { required: t('common.required') })} placeholder="U10" />
          {errors.name && <span className="error-message">{errors.name.message}</span>}
        </div>
        <div className="form-group">
          <label>{t('ageGroup.format')} *</label>
          <select {...register('format', { required: true })}>
            <option value="round_robin">{t('ageGroup.formats.round_robin')}</option>
            <option value="knockout">{t('ageGroup.formats.knockout')}</option>
            <option value="group_knockout">{t('ageGroup.formats.group_knockout')}</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t('ageGroup.maxTeams')}</label>
          <input type="number" {...register('max_teams')} min="2" />
        </div>
        <div className="form-group">
          <label>{t('ageGroup.gameDuration')} *</label>
          <input
            type="number"
            {...register('game_duration_minutes', { required: t('common.required'), min: 5, max: 90 })}
            defaultValue={20}
            min="5"
            max="90"
          />
          {errors.game_duration_minutes && <span className="error-message">{errors.game_duration_minutes.message}</span>}
        </div>
        <div className="form-group">
          <label>{t('ageGroup.pitchGap')}</label>
          <input
            type="number"
            {...register('pitch_gap_minutes')}
            defaultValue={5}
            min="0"
          />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <input type="checkbox" id="reg_open" {...register('registration_open')} />
        <label htmlFor="reg_open">{t('ageGroup.registrationOpen')}</label>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : t('common.save')}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
