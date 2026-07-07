import { useRef, useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import DateTimePicker from '../../../components/admin/DateTimePicker'
import { Upload } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'


function slugify(text) {
  return text
    .toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[āàáâä]/g, 'a').replace(/[čç]/g, 'c').replace(/[ēèéê]/g, 'e')
    .replace(/[ģ]/g, 'g').replace(/[ī]/g, 'i').replace(/[ķ]/g, 'k')
    .replace(/[ļ]/g, 'l').replace(/[ņ]/g, 'n').replace(/[š]/g, 's')
    .replace(/[ū]/g, 'u').replace(/[ž]/g, 'z')
    .replace(/[^\w-]/g, '').replace(/--+/g, '-')
}


export default function TournamentNew() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { sport: 'football', is_active: true }
  })
  const selectedSport = watch('sport')
  const isActive = watch('is_active')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFileName, setLogoFileName] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState([])
  const logoInputRef = useRef(null)
  const attachInputRef = useRef(null)

  if (authLoading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />

  const nameField = register('name', { required: t('common.required') })

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast(t('tournament.logoTooLarge'), 'error'); return }
    setLogoFile(file)
    setLogoFileName(file.name)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleAttachmentSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast(t('tournament.attachmentTooLarge'), 'error'); return }
    setPendingAttachments(prev => [...prev, { file, name: file.name }])
    e.target.value = ''
  }

  function removePendingAttachment(index) {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index))
  }

  function attachmentIcon(name) {
    const ext = name.split('.').pop().toLowerCase()
    if (ext === 'pdf') return '📄'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼'
    return '📎'
  }

  async function onSubmit(values) {
    const submitData = {
      ...values,
      participant_type: 'team',
      start_date: startDate || null,
      end_date: endDate || null,
      logo_url: null,
      owner_id: user.id,
    }

    const { data, error } = await supabase
      .from('tournaments')
      .insert(submitData)
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
        await supabase.from('tournaments').update({ logo_path: path }).eq('id', data.id)
      }
    }

    if (pendingAttachments.length > 0) {
      const uploaded = []
      for (const { file, name } of pendingAttachments) {
        const ext = name.split('.').pop().toLowerCase()
        const type = ext === 'pdf' ? 'pdf' : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) ? 'image' : 'other'
        const path = `${data.id}/${Date.now()}-${name}`
        const { error: upErr } = await supabase.storage.from('tournament-attachments').upload(path, file)
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('tournament-attachments').getPublicUrl(path)
          uploaded.push({ name, url: publicUrl, type })
        }
      }
      if (uploaded.length > 0) {
        const { error: attErr } = await supabase.from('tournaments').update({ attachments: uploaded }).eq('id', data.id)
        if (attErr) toast(t('common.error'), 'error')
      }
    }

    toast(t('tournament.created'))
    navigate(`/admin/tournaments/${data.id}`)
  }

  return (
    <div>
      <nav className="admin-nav">
        <Link to="/admin/dashboard" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
          {t('common.backToAdmin')}
        </Link>
      </nav>

      <div className="container" style={{ paddingTop: '2rem', maxWidth: '700px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '1.5rem' }}>
          {t('tournament.new')}
        </h1>

        {/* Sport selector + active toggle — meta row above form */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
            {[
              { value: 'football',         label: t('sports.football'),         emoji: '⚽' },
              { value: 'beach_volleyball', label: t('sports.beach_volleyball'), emoji: '🏐' },
              { value: 'catch_serve',      label: t('sports.catch_serve'),      emoji: '🤾‍♀️' },
              { value: 'rugby',            label: t('sports.rugby'),            emoji: '🏉' },
            ].map(({ value, label, emoji }) => {
              const active = selectedSport === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('sport', value, { shouldValidate: true })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '999px',
                    border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: active ? 'rgba(240,165,0,0.12)' : 'transparent',
                    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontWeight: active ? 600 : 400,
                    fontSize: '0.82rem',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span>{emoji}</span> {label}
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>
          <input type="hidden" {...register('sport')} />

          {/* Name */}
          <div className="form-group">
            <label>{t('tournament.name')} *</label>
            <input
              {...nameField}
              onChange={e => { nameField.onChange(e); setValue('slug', slugify(e.target.value)) }}
            />
            {errors.name && <span className="error-message">{errors.name.message}</span>}
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>{t('tournament.startDate')}</label>
              <DateTimePicker dateOnly value={startDate} onChange={setStartDate} />
            </div>
            <div className="form-group">
              <label>{t('tournament.endDate')}</label>
              <DateTimePicker dateOnly value={endDate} onChange={setEndDate} />
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

          {/* Logo upload */}
          <div className="form-group">
            <label>{t('tournament.logoUpload')}</label>
            <input
              ref={logoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.svg"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                border: '1px solid var(--color-accent)', color: 'var(--color-accent)',
                background: 'none', borderRadius: '6px', padding: '0.5rem 1rem',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
              }}
            >
              <Upload size={16} /> {t('tournament.uploadLogo')}
            </button>
            {logoFileName && (
              <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {logoFileName}
              </span>
            )}
            {logoPreview && (
              <img src={logoPreview} alt="Logo" style={{ display: 'block', marginTop: '0.5rem', maxHeight: '80px', borderRadius: '4px' }} />
            )}
          </div>

          {/* Slug */}
          <div className="form-group">
            <label>{t('tournament.slug')} *</label>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '0 0 0.3rem' }}>
              fixturday.com/t/…
            </p>
            <input {...register('slug', { required: t('common.required') })} />
            {errors.slug && <span className="error-message">{errors.slug.message}</span>}
          </div>

          {/* Active toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', width: 'fit-content' }}>
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

          {/* Submit */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('tournament.createBtn')}
            </button>
            <Link to="/admin/dashboard" className="btn-secondary">{t('common.cancel')}</Link>
          </div>
        </form>

        {/* Attachments — outside form, collected and uploaded on submit via pending state */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
            {t('tournament.attachments')}
          </h3>
          {pendingAttachments.length > 0 && (
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {pendingAttachments.map((att, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '6px', padding: '0.5rem 0.75rem', gap: '0.75rem',
                }}>
                  <span style={{ fontSize: '0.9rem' }}>
                    {attachmentIcon(att.name)} {att.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePendingAttachment(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={attachInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleAttachmentSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => attachInputRef.current?.click()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              border: '1px solid var(--color-accent)', color: 'var(--color-accent)',
              background: 'none', borderRadius: '6px', padding: '0.5rem 1rem',
              cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
            }}
          >
            📎 {t('tournament.attachmentAdd')}
          </button>
        </div>
      </div>
    </div>
  )
}
