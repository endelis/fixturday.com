import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { parse, isValid, format, parseISO } from 'date-fns'
import { Upload } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'

const SPORTS = [
  'Futbols', 'Telpu futbols', 'Basketbols', 'Volejbols',
  'Handbols', 'Florbols', 'Teniss', 'Badmintons', 'Regbijs', 'Cits',
]

function parseDateToISO(str) {
  if (!str) return null
  const d = parse(str, 'dd/MM/yyyy', new Date())
  return isValid(d) ? format(d, 'yyyy-MM-dd') : null
}

function isoToDisplay(str) {
  if (!str) return ''
  try { return format(parseISO(str), 'dd/MM/yyyy') } catch { return '' }
}

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
  const [lunchEnabled, setLunchEnabled] = useState(false)
  const logoInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm()

  useEffect(() => {
    supabase.from('tournaments').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        const { attachments: att, logo_url, ...rest } = data
        reset({
          ...rest,
          start_date: isoToDisplay(data.start_date),
          end_date: isoToDisplay(data.end_date),
        })
        setAttachments(att ?? [])
        if (logo_url) setLogoPreview(logo_url)
        setLunchEnabled(!!(data.lunch_start || data.lunch_end))
      }
      setLoading(false)
    })
  }, [id, reset])

  if (authLoading || loading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />

  async function onSubmit(values) {
    const submitData = {
      ...values,
      start_date: parseDateToISO(values.start_date),
      end_date: parseDateToISO(values.end_date),
      lunch_start: lunchEnabled ? values.lunch_start || null : null,
      lunch_end: lunchEnabled ? values.lunch_end || null : null,
    }
    const { error } = await supabase.from('tournaments').update(submitData).eq('id', id)
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
          {/* Name */}
          <div className="form-group">
            <label>{t('tournament.name')} *</label>
            <input {...register('name', { required: t('common.required') })} />
            {errors.name && <span className="error-message">{errors.name.message}</span>}
          </div>

          {/* Slug */}
          <div className="form-group">
            <label>{t('tournament.slug')}</label>
            <input {...register('slug')} />
          </div>

          {/* Sport dropdown */}
          <div className="form-group">
            <label>{t('tournament.sport')}</label>
            <select {...register('sport')}>
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Dates — dd/MM/yyyy text inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>{t('tournament.startDate')}</label>
              <input
                placeholder="dd/mm/gggg"
                {...register('start_date', {
                  validate: v => !v || isValid(parse(v, 'dd/MM/yyyy', new Date())) || t('tournament.invalidDate'),
                })}
              />
              {errors.start_date && <span className="error-message">{errors.start_date.message}</span>}
            </div>
            <div className="form-group">
              <label>{t('tournament.endDate')}</label>
              <input
                placeholder="dd/mm/gggg"
                {...register('end_date', {
                  validate: v => !v || isValid(parse(v, 'dd/MM/yyyy', new Date())) || t('tournament.invalidDate'),
                })}
              />
              {errors.end_date && <span className="error-message">{errors.end_date.message}</span>}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>{t('tournament.description')}</label>
            <textarea {...register('description')} rows={4} />
          </div>

          {/* Organizer contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>{t('tournament.organizerEmail')}</label>
              <input type="email" {...register('organizer_email')} />
            </div>
            <div className="form-group">
              <label>{t('tournament.organizerPhone')}</label>
              <input type="tel" {...register('organizer_phone')} />
            </div>
          </div>

          {/* Rules */}
          <div className="form-group">
            <label>{t('tournament.rules')}</label>
            <textarea {...register('rules')} rows={8} />
          </div>

          {/* Scheduling defaults */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
              {t('tournament.schedulingDefaults')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>{t('tournament.firstGameTime')}</label>
                <input
                  type="text"
                  placeholder="HH:mm"
                  {...register('first_game_time', {
                    validate: v => !v || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v) || t('tournament.invalidTime'),
                  })}
                />
                {errors.first_game_time && <span className="error-message">{errors.first_game_time.message}</span>}
              </div>
              <div className="form-group">
                <label>{t('tournament.lastGameTime')}</label>
                <input
                  type="text"
                  placeholder="HH:mm"
                  {...register('last_game_time', {
                    validate: v => !v || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v) || t('tournament.invalidTime'),
                  })}
                />
                {errors.last_game_time && <span className="error-message">{errors.last_game_time.message}</span>}
              </div>
            </div>

            {/* Lunch break toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
              <input
                type="checkbox"
                id="lunchEnabled"
                checked={lunchEnabled}
                onChange={e => setLunchEnabled(e.target.checked)}
              />
              <label htmlFor="lunchEnabled" style={{ cursor: 'pointer' }}>
                {t('tournament.lunchBreakToggle')}
              </label>
            </div>
            {lunchEnabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                <div className="form-group">
                  <label>{t('tournament.lunchStart')}</label>
                  <input
                    type="text"
                    placeholder="HH:mm"
                    {...register('lunch_start', {
                      validate: v => !v || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v) || t('tournament.invalidTime'),
                    })}
                  />
                  {errors.lunch_start && <span className="error-message">{errors.lunch_start.message}</span>}
                </div>
                <div className="form-group">
                  <label>{t('tournament.lunchEnd')}</label>
                  <input
                    type="text"
                    placeholder="HH:mm"
                    {...register('lunch_end', {
                      validate: v => !v || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v) || t('tournament.invalidTime'),
                    })}
                  />
                  {errors.lunch_end && <span className="error-message">{errors.lunch_end.message}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Logo upload */}
          <div className="form-group">
            <label>{t('tournament.logoUpload')}</label>
            {logoPreview && (
              <img src={logoPreview} alt="Logo" style={{ display: 'block', maxHeight: '80px', marginBottom: '0.5rem', borderRadius: '4px' }} />
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.svg"
              onChange={handleLogoChange}
              disabled={logoUploading}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                border: '1px solid var(--color-accent)', color: 'var(--color-accent)',
                background: 'none', borderRadius: '6px', padding: '0.5rem 1rem',
                cursor: logoUploading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem', fontWeight: 500, opacity: logoUploading ? 0.6 : 1,
              }}
            >
              <Upload size={16} /> {logoUploading ? t('tournament.logoUploading') : t('tournament.uploadLogo')}
            </button>
          </div>

          {/* Active checkbox */}
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
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
            {t('tournament.attachments')}
          </h3>

          {attachments.length > 0 && (
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                    <span style={{ fontSize: '1.2rem', color: 'var(--color-accent)', flexShrink: 0 }}>
                      {attachmentIcon(att.type)}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                      {att.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-accent)', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 500 }}
                    >
                      ↓ {t('common.download', 'Lejupielādēt')}
                    </a>
                    <button
                      onClick={() => handleAttachmentDelete(i)}
                      style={{
                        color: 'var(--color-danger)', background: 'none',
                        border: '1px solid var(--color-danger)', borderRadius: '4px',
                        cursor: 'pointer', fontSize: '0.78rem', padding: '0.2rem 0.5rem', lineHeight: 1.4,
                      }}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleAttachmentUpload}
            disabled={attachUploading}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={attachUploading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              border: '1px solid var(--color-accent)', color: 'var(--color-accent)',
              background: 'none', borderRadius: '6px', padding: '0.5rem 1rem',
              cursor: attachUploading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem', fontWeight: 500, opacity: attachUploading ? 0.6 : 1,
            }}
          >
            📎 {attachUploading ? t('tournament.attachmentUploading') : t('tournament.attachmentAdd')}
          </button>
        </div>
      </div>
    </div>
  )
}
