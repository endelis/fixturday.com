import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FileText, Upload, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'

export default function TournamentInfo() {
  const { t } = useTranslation()
  const { tournament } = useOutletContext()
  const [tab, setTab] = useState('edit')
  const [loadingData, setLoadingData] = useState(true)
  const [rulesPdf, setRulesPdf] = useState(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const pdfInputRef = useRef(null)

  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { content_md: '', contact_email: '', contact_phone: '', rules_md: '' },
  })

  const contentMd = watch('content_md')

  useEffect(() => {
    async function load() {
      const [
        { data: infoData, error: infoErr },
        { data: tourneyData, error: tourneyErr },
      ] = await Promise.all([
        supabase
          .from('tournament_info')
          .select('content_md, contact_email, contact_phone')
          .eq('tournament_id', tournament.id)
          .maybeSingle(),
        supabase
          .from('tournaments')
          .select('rules, attachments')
          .eq('id', tournament.id)
          .single(),
      ])

      if (infoErr || tourneyErr) {
        toast(t('common.error'), 'error')
        setLoadingData(false)
        return
      }

      reset({
        content_md: infoData?.content_md ?? '',
        contact_email: infoData?.contact_email ?? '',
        contact_phone: infoData?.contact_phone ?? '',
        rules_md: tourneyData?.rules ?? '',
      })

      const pdf = (tourneyData?.attachments ?? []).find(a => a.type === 'rules')
      setRulesPdf(pdf ?? null)
      setLoadingData(false)
    }
    load()
  }, [tournament.id, reset])

  async function onSubmit(values) {
    const [{ error: infoErr }, { error: tErr }] = await Promise.all([
      supabase.from('tournament_info').upsert({
        tournament_id: tournament.id,
        content_md: values.content_md,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
        updated_at: new Date().toISOString(),
      }),
      supabase.from('tournaments')
        .update({ rules: values.rules_md || null })
        .eq('id', tournament.id),
    ])

    if (infoErr || tErr) {
      toast(t('common.error'), 'error')
    } else {
      toast(t('tournamentInfo.saved'))
    }
  }

  async function handlePdfUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast(t('tournament.attachmentTooLarge'), 'error'); return }
    setPdfUploading(true)

    const path = `${tournament.id}/rules-${Date.now()}.pdf`
    const { error: upErr } = await supabase.storage
      .from('tournament-attachments')
      .upload(path, file, { upsert: true })

    if (upErr) { toast(t('common.error'), 'error'); setPdfUploading(false); return }

    const { data: { publicUrl } } = supabase.storage
      .from('tournament-attachments')
      .getPublicUrl(path)

    const { data: current } = await supabase
      .from('tournaments').select('attachments').eq('id', tournament.id).single()

    const updated = [
      ...(current?.attachments ?? []).filter(a => a.type !== 'rules'),
      { name: file.name, url: publicUrl, type: 'rules' },
    ]
    await supabase.from('tournaments').update({ attachments: updated }).eq('id', tournament.id)

    setRulesPdf({ name: file.name, url: publicUrl })
    setPdfUploading(false)
    toast(t('tournamentInfo.rulesPdfUploaded'))
    e.target.value = ''
  }

  async function handlePdfRemove() {
    const { data: current } = await supabase
      .from('tournaments').select('attachments').eq('id', tournament.id).single()

    const updated = (current?.attachments ?? []).filter(a => a.type !== 'rules')
    const { error } = await supabase
      .from('tournaments').update({ attachments: updated }).eq('id', tournament.id)

    if (error) { toast(t('common.error'), 'error'); return }
    setRulesPdf(null)
    toast(t('tournamentInfo.rulesPdfRemoved'))
  }

  if (loadingData) return <div className="loading">{t('common.loading')}</div>

  const tabBtn = (key) => ({
    background: tab === key ? 'var(--color-accent)' : 'var(--color-surface)',
    color: tab === key ? '#000' : 'var(--color-text-muted)',
    border: 'none',
    padding: '0.4rem 1.1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: tab === key ? 600 : 400,
    fontSize: '0.875rem',
  })

  const sectionLabel = {
    display: 'block',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.78rem',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.75rem',
  }

  const divider = {
    marginTop: '2rem',
    paddingTop: '1.75rem',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  }

  return (
    <div style={{ padding: '2rem 1.25rem', maxWidth: '780px' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', marginBottom: '1.75rem' }}>
        {t('tournamentInfo.title')}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>

        {/* ── About / Info ──────────────────────────────── */}
        <span style={sectionLabel}>{t('tournamentInfo.aboutSection')}</span>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <button type="button" style={tabBtn('edit')} onClick={() => setTab('edit')}>
            {t('tournamentInfo.tabEdit')}
          </button>
          <button type="button" style={tabBtn('preview')} onClick={() => setTab('preview')}>
            {t('tournamentInfo.tabPreview')}
          </button>
        </div>

        {tab === 'edit' ? (
          <textarea
            {...register('content_md')}
            placeholder={t('tournamentInfo.contentPlaceholder')}
            style={{
              width: '100%', minHeight: '180px', fontFamily: 'monospace', fontSize: '0.875rem',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
              padding: '0.75rem', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
        ) : (
          <div style={{
            minHeight: '180px', background: 'var(--color-surface)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.75rem 1rem',
          }}>
            {contentMd
              ? <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, color: 'var(--color-text)', fontSize: '0.9rem', lineHeight: 1.6 }}>{contentMd}</pre>
              : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('tournamentInfo.previewEmpty')}</span>
            }
          </div>
        )}

        {/* ── Rules ─────────────────────────────────────── */}
        <div style={divider}>
          <span style={sectionLabel}>{t('tournamentInfo.rulesSection')}</span>

          <textarea
            {...register('rules_md')}
            placeholder={t('tournamentInfo.rulesPlaceholder')}
            rows={6}
            style={{
              width: '100%', fontFamily: 'monospace', fontSize: '0.875rem',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
              padding: '0.75rem', resize: 'vertical', boxSizing: 'border-box',
            }}
          />

          <div style={{ marginTop: '0.875rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              {t('tournamentInfo.rulesPdfLabel')}
            </div>

            {rulesPdf ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: '6px', padding: '0.5rem 0.875rem', maxWidth: '100%',
              }}>
                <FileText size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <a
                  href={rulesPdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.875rem', color: 'var(--color-text)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {rulesPdf.name}
                </a>
                <button
                  type="button"
                  onClick={handlePdfRemove}
                  title={t('tournamentInfo.rulesPdfRemove')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', padding: '0.1rem', borderRadius: '3px', flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={pdfUploading}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    border: '1px solid rgba(240,165,0,0.4)', color: 'var(--color-accent)',
                    background: 'none', borderRadius: '6px', padding: '0.4rem 0.875rem',
                    cursor: pdfUploading ? 'not-allowed' : 'pointer',
                    fontSize: '0.8125rem', fontWeight: 500, opacity: pdfUploading ? 0.6 : 1,
                  }}
                >
                  <Upload size={13} />
                  {pdfUploading ? t('tournamentInfo.rulesPdfUploading') : t('tournamentInfo.rulesPdfUpload')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Contact ───────────────────────────────────── */}
        <div style={divider}>
          <span style={sectionLabel}>{t('tournamentInfo.contactSection')}</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                {t('tournamentInfo.contactEmailLabel')}
              </label>
              <input type="email" {...register('contact_email')} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                {t('tournamentInfo.contactPhoneLabel')}
              </label>
              <input type="text" {...register('contact_phone')} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.75rem' }}>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : t('tournamentInfo.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
