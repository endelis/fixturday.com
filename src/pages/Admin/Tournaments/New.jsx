import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[āàáâä]/g, 'a')
    .replace(/[čç]/g, 'c')
    .replace(/[ēèéê]/g, 'e')
    .replace(/[ģ]/g, 'g')
    .replace(/[ī]/g, 'i')
    .replace(/[ķ]/g, 'k')
    .replace(/[ļ]/g, 'l')
    .replace(/[ņ]/g, 'n')
    .replace(/[š]/g, 's')
    .replace(/[ū]/g, 'u')
    .replace(/[ž]/g, 'z')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-')
}

export default function TournamentNew() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { sport: 'football', is_active: true, first_game_time: '09:00', last_game_time: '18:00' }
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  if (authLoading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />

  const nameField = register('name', { required: t('common.required') })

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast(t('tournament.logoTooLarge'), 'error'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function onSubmit(values) {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({ ...values, logo_url: null, owner_id: user.id })
      .select()
      .single()
    if (error) { toast(`${t('common.error')}: ${error.message}`, 'error'); return }

    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `${data.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('tournament-logos').upload(path, logoFile)
      if (upErr) {
        toast(t('tournament.logoUploadError'), 'error')
      } else {
        const { data: { publicUrl } } = supabase.storage.from('tournament-logos').getPublicUrl(path)
        await supabase.from('tournaments').update({ logo_url: publicUrl }).eq('id', data.id)
      }
    }

    toast(t('tournament.created'))
    navigate(`/admin/tournaments/${data.id}`)
  }

  return (
    <div>
      <nav className="admin-nav">
        <Link to="/admin/dashboard" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
          ← Fixturday Admin
        </Link>
      </nav>

      <div className="container" style={{ paddingTop: '2rem', maxWidth: '700px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '1.5rem' }}>
          {t('tournament.new')}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>
          <div className="form-group">
            <label>{t('tournament.name')} *</label>
            <input
              {...nameField}
              onChange={e => { nameField.onChange(e); setValue('slug', slugify(e.target.value)) }}
            />
            {errors.name && <span className="error-message">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label>{t('tournament.slug')} *</label>
            <input {...register('slug', { required: t('common.required') })} />
            {errors.slug && <span className="error-message">{errors.slug.message}</span>}
          </div>

          <div className="form-group">
            <label>{t('tournament.sport')}</label>
            <select {...register('sport')}>
              <option value="football">Futbols</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>{t('tournament.startDate')}</label>
              <input type="date" {...register('start_date')} />
            </div>
            <div className="form-group">
              <label>{t('tournament.endDate')}</label>
              <input type="date" {...register('end_date')} />
            </div>
          </div>

          <div className="form-group">
            <label>{t('tournament.description')}</label>
            <textarea {...register('description')} rows={4} />
          </div>

          <div className="form-group">
            <label>{t('tournament.rules')}</label>
            <textarea {...register('rules')} rows={8} />
          </div>

          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
              {t('tournament.schedulingDefaults')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>{t('tournament.firstGameTime')}</label>
                <input type="time" step="60" {...register('first_game_time')} />
              </div>
              <div className="form-group">
                <label>{t('tournament.lastGameTime')}</label>
                <input type="time" step="60" {...register('last_game_time')} />
              </div>
              <div className="form-group">
                <label>{t('tournament.lunchStart')}</label>
                <input type="time" step="60" {...register('lunch_start')} />
              </div>
              <div className="form-group">
                <label>{t('tournament.lunchEnd')}</label>
                <input type="time" step="60" {...register('lunch_end')} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>{t('tournament.logoUpload')}</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.svg"
              onChange={handleLogoChange}
              style={{ display: 'block' }}
            />
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo"
                style={{ marginTop: '0.5rem', maxHeight: '80px', borderRadius: '4px' }}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input type="checkbox" id="is_active" {...register('is_active')} />
            <label htmlFor="is_active">{t('tournament.activeLabel')}</label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('tournament.createBtn')}
            </button>
            <Link to="/admin/dashboard" className="btn-secondary">{t('common.cancel')}</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
