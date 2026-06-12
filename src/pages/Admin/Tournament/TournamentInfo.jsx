import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'

export default function TournamentInfo() {
  const { t } = useTranslation()
  const { tournament } = useOutletContext()
  const [tab, setTab] = useState('edit')
  const [loadingData, setLoadingData] = useState(true)

  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { content_md: '', contact_email: '', contact_phone: '' },
  })

  const contentMd = watch('content_md')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('tournament_info')
        .select('content_md, contact_email, contact_phone')
        .eq('tournament_id', tournament.id)
        .maybeSingle()

      if (!error && data) {
        reset({
          content_md: data.content_md ?? '',
          contact_email: data.contact_email ?? '',
          contact_phone: data.contact_phone ?? '',
        })
      }
      setLoadingData(false)
    }
    load()
  }, [tournament.id, reset])

  async function onSubmit(values) {
    const { error } = await supabase
      .from('tournament_info')
      .upsert({
        tournament_id: tournament.id,
        content_md: values.content_md,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      toast(t('common.error'), 'error')
    } else {
      toast(t('tournamentInfo.saved'))
    }
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

  return (
    <div style={{ padding: '2rem 1.25rem', maxWidth: '780px' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', marginBottom: '1.75rem' }}>
        {t('tournamentInfo.title')}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
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
            style={{
              width: '100%',
              minHeight: '300px',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '0.75rem',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            style={{
              minHeight: '300px',
              background: 'var(--color-surface)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
            }}
          >
            {contentMd
              ? <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, color: 'var(--color-text)', fontSize: '0.9rem', lineHeight: 1.6 }}>{contentMd}</pre>
              : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('tournamentInfo.previewEmpty')}</span>
            }
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
              {t('tournamentInfo.contactEmailLabel')}
            </label>
            <input
              type="email"
              {...register('contact_email')}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
              {t('tournamentInfo.contactPhoneLabel')}
            </label>
            <input
              type="text"
              {...register('contact_phone')}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : t('tournamentInfo.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
