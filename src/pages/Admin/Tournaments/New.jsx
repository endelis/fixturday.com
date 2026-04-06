import { useRef, useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { parse, isValid, format } from 'date-fns'
import { Upload } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'

const SPORTS = [
  'Futbols', 'Telpu futbols', 'Basketbols', 'Volejbols',
  'Handbols', 'Florbols', 'Teniss', 'Badmintons', 'Regbijs', 'Cits',
]

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

function parseDateToISO(str) {
  if (!str) return null
  const d = parse(str, 'dd/MM/yyyy', new Date())
  return isValid(d) ? format(d, 'yyyy-MM-dd') : null
}

export default function TournamentNew() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { sport: 'Futbols', is_active: true, first_game_time: '09:00', last_game_time: '18:00' }
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFileName, setLogoFileName] = useState(null)
  const [lunchEnabled, setLunchEnabled] = useState(false)
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
      start_date: parseDateToISO(values.start_date),
      end_date: parseDateToISO(values.end_date),
      lunch_start: lunchEnabled ? values.lunch_start || null : null,
      lunch_end: lunchEnabled ? values.lunch_end || null : null,
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
        const { data: { publicUrl } } = supabase.storage.from('tournament-logos').getPublicUrl(path)
        await supabase.from('tournaments').update({ logo_url: publicUrl }).eq('id', data.id)
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
        await supabase.from('tournaments').update({ attachments: uploaded }).eq('id', data.id)
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
          {/* Name */}
          <div className="form-group">
            <label>{t('tournament.name')} *</label>
            <input
              {...nameField}
              onChange={e => { nameField.onChange(e); setValue('slug', slugify(e.target.value)) }}
            />
            {errors.name && <span className="error-message">{errors.name.message}</span>}
          </div>

          {/* Slug */}
          <div className="form-group">
            <label>{t('tournament.slug')} *</label>
            <input {...register('slug', { required: t('common.required') })} />
            {errors.slug && <span className="error-message">{errors.slug.message}</span>}
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

          {/* Active checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input type="checkbox" id="is_active" {...register('is_active')} />
            <label htmlFor="is_active">{t('tournament.activeLabel')}</label>
          </div>

          {/* Attachments */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
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

          {/* Submit */}
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
