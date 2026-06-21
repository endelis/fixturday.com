import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { parse, isValid, format, parseISO } from 'date-fns'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'
import TournamentLogoUpload from '../../../components/admin/TournamentLogoUpload'

function parseDateToISO(str) {
  if (!str) return null
  const d = parse(str, 'dd/MM/yyyy', new Date())
  return isValid(d) ? format(d, 'yyyy-MM-dd') : null
}

function isoToDisplay(str) {
  if (!str) return ''
  try { return format(parseISO(str), 'dd/MM/yyyy') } catch { return '' }
}

const SPORT_LABELS = {
  football: '⚽ Football',
  beach_volleyball: '🏐 Beach Volleyball',
}

export default function TournamentEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [logoPath, setLogoPath] = useState(null)
  const [sport, setSport] = useState('football')
  const [attachments, setAttachments] = useState([])
  const [attachUploading, setAttachUploading] = useState(false)
  const fileInputRef = useRef(null)
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm()

  const isActive = watch('is_active')

  useEffect(() => {
    if (authLoading || !user) return
    async function load() {
      const { data, error } = await supabase.from('tournaments').select('*').eq('id', id).single()
      if (error) { toast(t('common.error'), 'error'); setLoading(false); return }
      if (data) {
        const { attachments: att, logo_url, logo_path, sport: sp, ...rest } = data
        reset({
          ...rest,
          start_date: isoToDisplay(data.start_date),
          end_date: isoToDisplay(data.end_date),
        })
        setAttachments(att ?? [])
        setLogoPath(logo_path ?? null)
        setSport(sp ?? 'football')
      }
      setLoading(false)
    }
    load()
  }, [id, reset, authLoading, user])

  if (authLoading || loading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />

  async function onSubmit(values) {
    // sport is intentionally excluded — locked at creation time
    const submitData = {
      ...values,
      participant_type: 'team',
      start_date: parseDateToISO(values.start_date),
      end_date: parseDateToISO(values.end_date) || null,
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

  const inputStyle = {}

  return (
    <div>
      <div className="container" style={{ paddingTop: '2rem', maxWidth: '700px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>{t('tournament.editTitle')}</h1>
          <button
            className={deleteConfirm ? 'btn-danger btn-sm' : 'btn-secondary btn-sm'}
            onClick={handleDelete}
          >
            {deleteConfirm ? t('tournament.confirmDelete') : t('tournament.delete')}
          </button>
        </div>

        {/* Meta row: sport chip + active toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '999px', padding: '0.28rem 0.9rem',
            fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 500,
            userSelect: 'none',
          }}>
            {SPORT_LABELS[sport] ?? sport}
          </span>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginLeft: 'auto' }}>
            <input
              type="checkbox"
              {...register('is_active')}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <span style={{ fontSize: '0.82rem', color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: 500 }}>
              {isActive ? t('tournament.activeLabel') : t('tournament.inactiveLabel')}
            </span>
            <div style={{
              position: 'relative', width: '40px', height: '22px', flexShrink: 0,
              background: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
              borderRadius: '11px', transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: '3px',
                left: isActive ? '21px' : '3px',
                width: '16px', height: '16px',
                background: isActive ? '#000' : 'rgba(255,255,255,0.45)',
                borderRadius: '50%', transition: 'left 0.2s',
                pointerEvents: 'none',
              }} />
            </div>
          </label>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>

          {/* Name */}
          <div className="form-group">
            <label>{t('tournament.name')} *</label>
            <input {...register('name', { required: t('common.required') })} />
            {errors.name && <span className="error-message">{errors.name.message}</span>}
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>{t('tournament.startDate')}</label>
              <input
                placeholder="dd/mm/yyyy"
                {...register('start_date', {
                  validate: v => !v || isValid(parse(v, 'dd/MM/yyyy', new Date())) || t('tournament.invalidDate'),
                })}
              />
              {errors.start_date && <span className="error-message">{errors.start_date.message}</span>}
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--color-text-muted)' }}>{t('tournament.endDate')}</label>
              <input
                placeholder="dd/mm/yyyy"
                {...register('end_date', {
                  validate: v => !v || isValid(parse(v, 'dd/MM/yyyy', new Date())) || t('tournament.invalidDate'),
                })}
              />
              {errors.end_date && <span className="error-message">{errors.end_date.message}</span>}
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <label>{t('tournament.location')}</label>
            <input
              {...register('location')}
              placeholder={t('tournament.locationPlaceholder')}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>{t('tournament.description')}</label>
            <textarea {...register('description')} rows={3} />
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
            <textarea {...register('rules')} rows={4} />
          </div>

          {/* Logo — single storage-backed upload */}
          <TournamentLogoUpload
            tournamentId={id}
            currentLogoPath={logoPath}
            onChange={setLogoPath}
          />

          {/* Slug */}
          <div className="form-group">
            <label>{t('tournament.slug')}</label>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '0 0 0.3rem' }}>
              fixturday.com/t/…
            </p>
            <input {...register('slug')} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </button>
            <Link to="/admin/dashboard" className="btn-secondary">{t('common.cancel')}</Link>
          </div>
        </form>

        {/* Attachments — saved immediately, outside main form */}
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
                    <span style={{ fontSize: '1.1rem', color: 'var(--color-accent)', flexShrink: 0 }}>
                      {attachmentIcon(att.type)}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
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
                      ↓ {t('common.download')}
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
