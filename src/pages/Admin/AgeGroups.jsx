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
  const [lockedGroups, setLockedGroups] = useState(false)
  const [hasFixtures, setHasFixtures] = useState(false)
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm()
  const watchedFormat = watch('format')
  const watchedDepth  = watch('playoff_depth')
  const watchedGroups = watch('groups_count')

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

  async function startEdit(ag) {
    if (editingId === ag.id && showForm) { cancelForm(); return }
    setEditingId(ag.id)
    setValue('name', ag.name)
    setValue('format', ag.format)
    setValue('max_teams', ag.max_teams ?? '')
    setValue('groups_count', ag.groups_count ?? 2)
    setValue('playoff_depth', ag.playoff_depth ?? 'sf')
    setValue('bracket_seeding', ag.bracket_seeding ?? 'cross')
    setValue('registration_open', ag.registration_open)
    setValue('auto_approve', ag.auto_approve ?? false)

    // Lock groups_count once any group stage game has a result
    let locked = false
    let fixturesExist = false
    if (ag.format === 'group_knockout') {
      const { data: stages } = await supabase
        .from('stages').select('id').eq('age_group_id', ag.id).eq('type', 'group_stage')
      if (stages?.length) {
        const { data: fxData } = await supabase
          .from('fixtures').select('id').in('stage_id', stages.map(s => s.id))
        if (fxData?.length) {
          fixturesExist = true
          const { count } = await supabase
            .from('fixture_results').select('id', { count: 'exact', head: true })
            .in('fixture_id', fxData.map(f => f.id))
          locked = (count ?? 0) > 0
        }
      }
    }
    setLockedGroups(locked)
    setHasFixtures(fixturesExist)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setLockedGroups(false)
    setHasFixtures(false)
    reset()
  }

  function startNew() {
    setEditingId(null)
    reset()
    setShowForm(true)
  }

  const PLAYOFF_SLOTS = { final: 2, sf: 4, qf: 8, r16: 16 }

  async function onSubmit(values) {
    const isGroupKnockout = values.format === 'group_knockout'
    const groupsCount = isGroupKnockout ? Number(values.groups_count ?? 2) : null
    const playoffDepth = isGroupKnockout ? (values.playoff_depth ?? 'sf') : null
    const slots = isGroupKnockout ? (PLAYOFF_SLOTS[playoffDepth] ?? 4) : null
    const teamsAdvancing = isGroupKnockout ? slots / groupsCount : null

    if (isGroupKnockout && !Number.isInteger(teamsAdvancing)) {
      toast(t('ageGroup.advancingMismatch'), 'error')
      return
    }

    const payload = {
      name: values.name,
      format: values.format,
      tournament_id: tournamentId,
      max_teams: values.max_teams ? Number(values.max_teams) : null,
      registration_open: !!values.registration_open,
      auto_approve: !!values.auto_approve,
      groups_count: groupsCount,
      playoff_depth: playoffDepth,
      bracket_seeding: isGroupKnockout ? (values.bracket_seeding ?? 'cross') : null,
      teams_advancing: teamsAdvancing,
    }

    if (editingId) {
      const { error } = await supabase.from('age_groups').update(payload).eq('id', editingId)
      if (error) { toast(t('common.error'), 'error'); return }

      if (isGroupKnockout) {
        // stages → fixtures → fixture_results all cascade on delete
        await supabase.from('stages').delete().eq('age_group_id', editingId)
        toast(t('ageGroup.savedAndCleared'))
      } else {
        toast(t('common.saved'))
      }
    } else {
      const { error } = await supabase.from('age_groups').insert(payload)
      if (error) { console.error('[AgeGroups] insert:', error); toast(t('common.error'), 'error'); return }
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
              watchedFormat={watchedFormat}
              watchedDepth={watchedDepth}
              watchedGroups={watchedGroups}
              locked={false}
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
                        <span style={{ marginLeft: '0.5rem', color: confirmed >= 2 ? 'var(--color-success)' : 'var(--color-text-muted)', fontSize: '0.875rem' }}>
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
                    {ag.auto_approve && (
                      <span className="badge badge-warning" title={t('ageGroup.autoApprove')}>
                        ⚡ {t('ageGroup.autoApprove')}
                      </span>
                    )}
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
                      {t('ageGroup.edit')} — {ag.name}
                    </h2>
                    <AgeGroupForm
                      register={register}
                      handleSubmit={handleSubmit}
                      errors={errors}
                      isSubmitting={isSubmitting}
                      watchedFormat={watchedFormat}
                      watchedDepth={watchedDepth}
                      watchedGroups={watchedGroups}
                      locked={lockedGroups}
                      hasFixtures={hasFixtures}
                      fixturesUrl={`/admin/age-groups/${ag.id}/fixtures`}
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

const PLAYOFF_SLOTS = { final: 2, sf: 4, qf: 8, r16: 16 }

function AgeGroupForm({ register, handleSubmit, errors, isSubmitting, watchedFormat, watchedDepth, watchedGroups, locked, hasFixtures, fixturesUrl, onSubmit, onCancel, t }) {
  const isGroupKnockout = watchedFormat === 'group_knockout'
  const slots = PLAYOFF_SLOTS[watchedDepth] ?? 4
  const groups = Number(watchedGroups) || 2
  const advancingPerGroup = slots / groups
  const advancingValid = Number.isInteger(advancingPerGroup) && advancingPerGroup >= 1

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
      </div>

      {isGroupKnockout && hasFixtures && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '6px', padding: '0.65rem 0.9rem', fontSize: '0.82rem', color: 'var(--color-accent)' }}>
          <span style={{ flexShrink: 0, marginTop: '0.05rem' }}>⚠</span>
          <span>
            {t('ageGroup.fixturesExistWarning')}{' '}
            <Link to={fixturesUrl} style={{ color: 'var(--color-accent)', fontWeight: 600 }}>→ Fixtures</Link>
          </span>
        </div>
      )}

      {isGroupKnockout && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1rem', display: 'grid', gap: '1rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            {t('ageGroup.groupKnockoutSettings')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>{t('ageGroup.groupsCount')}</label>
              <select {...register('groups_count')}>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
              {locked && (
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  {t('ageGroup.configLocked')}
                </span>
              )}
            </div>
            <div className="form-group">
              <label>{t('ageGroup.playoffDepth')}</label>
              <select {...register('playoff_depth')}>
                <option value="final">{t('ageGroup.playoffDepths.final')}</option>
                <option value="sf">{t('ageGroup.playoffDepths.sf')}</option>
                <option value="qf">{t('ageGroup.playoffDepths.qf')}</option>
                <option value="r16">{t('ageGroup.playoffDepths.r16')}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('ageGroup.bracketSeeding')}</label>
              <select {...register('bracket_seeding')}>
                <option value="cross">{t('ageGroup.bracketSeedings.cross')}</option>
                <option value="mirror">{t('ageGroup.bracketSeedings.mirror')}</option>
                <option value="ranked">{t('ageGroup.bracketSeedings.ranked')}</option>
              </select>
            </div>
          </div>
          <div style={{
            padding: '0.6rem 0.75rem',
            borderRadius: '6px',
            background: advancingValid ? 'rgba(46,204,113,0.08)' : 'rgba(231,76,60,0.1)',
            border: `1px solid ${advancingValid ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.3)'}`,
            fontSize: '0.82rem',
            color: advancingValid ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            {advancingValid
              ? `${groups} ${t('ageGroup.groupsCount').toLowerCase()} × ${advancingPerGroup} ${t('ageGroup.advancingPerGroup')} = ${slots} ${t('ageGroup.playoffSlots')}`
              : t('ageGroup.advancingMismatch', { groups, slots })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input type="checkbox" id="reg_open" {...register('registration_open')} />
          <label htmlFor="reg_open">{t('ageGroup.registrationOpen')}</label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input type="checkbox" id="auto_approve" {...register('auto_approve')} />
          <label htmlFor="auto_approve">{t('ageGroup.autoApprove')}</label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="btn-primary" disabled={isSubmitting || (isGroupKnockout && !advancingValid)}>
          {isSubmitting ? t('common.saving') : t('common.save')}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
