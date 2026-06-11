import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useRegistration } from '../../hooks/useRegistration'
import PublicNav from '../../components/PublicNav'

export default function Registration() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const { tournament, ageGroups, submit, loading, error } = useRegistration(slug)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const [success, setSuccess] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [submitError, setSubmitError] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    document.title = `${t('registration.title')} — Fixturday`
    return () => { document.title = 'Fixturday' }
  }, [t])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  async function onSubmit(values) {
    setSubmitError(null)
    try {
      await submit(values)
      reset()
      setSuccess(true)
      setCooldown(60)
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        setCooldown(c => {
          if (c <= 1) { clearInterval(intervalRef.current); return 0 }
          return c - 1
        })
      }, 1000)
    } catch (err) {
      setSubmitError(err.message || t('common.error'))
    }
  }

  if (loading) return <div className="loading">{t('common.loading')}</div>

  if (error || !tournament) return (
    <div>
      <PublicNav />
      <div className="container" style={{ paddingTop: '2rem' }}>
        <p style={{ color: 'var(--color-muted)' }}>{t('register.notFound')}</p>
      </div>
    </div>
  )

  if (success) return (
    <div>
      <PublicNav tournament={tournament} />
      <div className="container" style={{ paddingTop: '3rem', maxWidth: '560px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>
          {t('registration.successTitle')}
        </h1>
        <p style={{ color: 'var(--color-text)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          {t('registration.successMessage')}
        </p>
        {cooldown > 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
            {t('registration.cooldownMessage', { seconds: cooldown })}
          </p>
        ) : (
          <button className="btn-secondary" onClick={() => setSuccess(false)}>
            {t('registration.registerAnother')}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <PublicNav tournament={tournament} />
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '560px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '1.75rem' }}>
          {t('registration.title')}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>

          {/* Team name */}
          <div className="form-group">
            <label>{t('registration.teamName')} *</label>
            <input {...register('team_name', { required: t('registration.errors.required') })} />
            {errors.team_name && <span className="error-message">{errors.team_name.message}</span>}
          </div>

          {/* Age group */}
          <div className="form-group">
            <label>{t('registration.ageGroup')} *</label>
            <select {...register('age_group_id', { required: t('registration.errors.required') })}>
              <option value="">{t('common.select')}</option>
              {ageGroups.map(ag => (
                <option key={ag.id} value={ag.id}>{ag.name}</option>
              ))}
            </select>
            {errors.age_group_id && <span className="error-message">{errors.age_group_id.message}</span>}
          </div>

          {/* Manager name */}
          <div className="form-group">
            <label>{t('registration.managerName')} *</label>
            <input {...register('manager_name', { required: t('registration.errors.required') })} />
            {errors.manager_name && <span className="error-message">{errors.manager_name.message}</span>}
          </div>

          {/* Manager email */}
          <div className="form-group">
            <label>{t('registration.managerEmail')} *</label>
            <input
              type="email"
              {...register('manager_email', {
                required: t('registration.errors.required'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('registration.errors.email'),
                },
              })}
            />
            {errors.manager_email && <span className="error-message">{errors.manager_email.message}</span>}
          </div>

          {/* Manager phone */}
          <div className="form-group">
            <label>{t('registration.managerPhone')}</label>
            <input type="tel" {...register('manager_phone')} />
          </div>

          {/* Player roster */}
          <div className="form-group">
            <label>{t('registration.playerRoster')}</label>
            <textarea
              {...register('player_roster')}
              rows={6}
              placeholder={t('registration.playerRosterHint')}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Honeypot — hidden via CSS; bots fill visible fields, humans never see this */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <label htmlFor="homepage_url">Website</label>
            <input
              type="text"
              id="homepage_url"
              {...register('homepage_url')}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {submitError && (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem', margin: 0 }}>
              {submitError}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%' }}
          >
            {isSubmitting ? t('registration.submitting') : t('registration.submit')}
          </button>

        </form>
      </div>
    </div>
  )
}
