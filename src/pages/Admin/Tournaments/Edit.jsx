import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'

export default function TournamentEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [attachUploading, setAttachUploading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm()

  useEffect(() => {
    supabase.from('tournaments').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        const { attachments: att, logo_url, ...formData } = data
        reset(formData)
        setAttachments(att ?? [])
        if (logo_url) setLogoPreview(logo_url)
      }
      setLoading(false)
    })
  }, [id, reset])

  if (authLoading || loading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />

  async function onSubmit(values) {
    const { error } = await supabase.from('tournaments').update(values).eq('id', id)
    if (error) { toast(`${t('common.error')}: ${error.message}`, 'error'); return }
    toast(t('tournament.saved'))
    navigate('/admin/dashboard')
  }

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (error) { toast(`${t('common.error')}: ${error.message}`, 'error'); return }
    navigate('/admin/dashboard')
  }

  async function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast(t('tournament.logoTooLarge'), 'error'); return }
    setLogoUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('tournament-logos').upload(path, file)
    if (upErr) { toast(t('tournament.logoUploadError'), 'error'); setLogoUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('tournament-logos').getPublicUrl(path)
    const { error: updateErr } = await supabase.from('tournaments').update({ logo_url: publicUrl }).eq('id', id)
    if (updateErr) { toast(t('common.error'), 'error'); setLogoUploading(false); return }
    setLogoPreview(publicUrl)
    setLogoUploading(false)
    toast(t('tournament.logoSaved'))
  }

  async function handleAttachmentUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast(t('tournament.attachmentTooLarge'), 'error'); return }
    setAttachUploading(true)
    const ext = file.name.split('.').pop().toLowerCase()
    const type = ext === 'pdf' ? 'pdf' : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) ? 'image' : 'other'
    const path = `${id}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('tournament-attachments').upload(path, file)
    if (upErr) { toast(t('tournament.attachmentUploadError'), 'error'); setAttachUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('tournament-attachments').getPublicUrl(path)
    const newAttachments = [...attachments, { name: file.name, url: publicUrl, type }]
    const { error: updateErr } = await supabase.from('tournaments').update({ attachments: newAttachments }).eq('id', id)
    if (updateErr) { toast(t('common.error'), 'error'); setAttachUploading(false); return }
    setAttachments(newAttachments)
    setAttachUploading(false)
    e.target.value = ''
  }

  async function handleAttachmentDelete(index) {
    const newAttachments = attachments.filter((_, i) => i !== index)
    const { error } = await supabase.from('tournaments').update({ attachments: newAttachments }).eq('id', id)
    if (error) { toast(t('common.error'), 'error'); return }
    setAttachments(newAttachments)
    toast(t('tournament.attachmentDeleted'))
  }

  function attachmentIcon(type) {
    if (type === 'pdf') return '📄'
    if (type === 'image') return '🖼'
    return '📎'
  }

  return (
    <div>
      <nav className="admin-nav">
        <Link to="/admin/dashboard" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
          ← Fixturday Admin
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/admin/tournaments/${id}/age-groups`} className="btn-secondary btn-sm">{t('ageGroup.title')}</Link>
          <Link to={`/admin/tournaments/${id}/venues`} className="btn-secondary btn-sm">{t('venue.title')}</Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '2rem', maxWidth: '700px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>{t('tournament.editTitle')}</h1>
          <button
            className={deleteConfirm ? 'btn-danger btn-sm' : 'btn-secondary btn-sm'}
            onClick={handleDelete}
          >
            {deleteConfirm ? t('tournament.confirmDelete') : t('tournament.delete')}
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>
          <div className="form-group">
            <label>{t('tournament.name')} *</label>
            <input {...register('name', { required: t('common.required') })} />
            {errors.name && <span className="error-message">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label>{t('tournament.slug')}</label>
            <input {...register('slug')} />
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
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo"
                style={{ display: 'block', maxHeight: '80px', marginBottom: '0.5rem', borderRadius: '4px' }}
              />
            )}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.svg"
              onChange={handleLogoChange}
              disabled={logoUploading}
              style={{ display: 'block' }}
            />
            {logoUploading && (
              <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{t('tournament.logoUploading')}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input type="checkbox" id="is_active" {...register('is_active')} />
            <label htmlFor="is_active">{t('tournament.activeLabel')}</label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </button>
            <Link to="/admin/dashboard" className="btn-secondary">{t('common.cancel')}</Link>
          </div>
        </form>

        {/* Attachments — saved immediately to DB, outside the main form */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-surface)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
            {t('tournament.attachments')}
          </h3>

          {attachments.length > 0 && (
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
              {attachments.map((att, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}
                >
                  <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
                    {attachmentIcon(att.type)} {att.name}
                  </a>
                  <button className="btn-secondary btn-sm" onClick={() => handleAttachmentDelete(i)}>✕</button>
                </div>
              ))}
            </div>
          )}

          <label className="btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
            {attachUploading ? t('tournament.attachmentUploading') : t('tournament.attachmentAdd')}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleAttachmentUpload}
              disabled={attachUploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
