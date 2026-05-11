import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { toast } from '../Toast'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024

/**
 * Managed logo upload for the 'team-logos' Storage bucket.
 * Writes the Storage object path (not URL) to teams.logo_path.
 */
export default function TeamLogoUpload({ teamId, currentLogoPath, onChange }) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const previewUrl = currentLogoPath
    ? supabase.storage.from('team-logos').getPublicUrl(currentLogoPath).data.publicUrl
    : null

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast(t('admin.teamLogo.invalidFormat'), 'error')
      e.target.value = ''
      return
    }
    if (file.size > MAX_BYTES) {
      toast(t('admin.teamLogo.fileTooLarge'), 'error')
      e.target.value = ''
      return
    }

    setBusy(true)
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${teamId}/${crypto.randomUUID()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('team-logos')
      .upload(path, file)

    if (upErr) {
      toast(`${t('common.error')}: ${upErr.message}`, 'error')
      setBusy(false)
      e.target.value = ''
      return
    }

    const { error: dbErr } = await supabase
      .from('teams')
      .update({ logo_path: path })
      .eq('id', teamId)

    if (dbErr) {
      toast(`${t('common.error')}: ${dbErr.message}`, 'error')
      await supabase.storage.from('team-logos').remove([path])
      setBusy(false)
      e.target.value = ''
      return
    }

    onChange(path)
    toast(t('admin.teamLogo.uploadSuccess'))
    setBusy(false)
    e.target.value = ''
  }

  async function handleRemove() {
    if (!confirmRemove) { setConfirmRemove(true); return }

    setBusy(true)
    setConfirmRemove(false)

    const { error: storErr } = await supabase.storage
      .from('team-logos')
      .remove([currentLogoPath])

    if (storErr) {
      toast(`${t('common.error')}: ${storErr.message}`, 'error')
      setBusy(false)
      return
    }

    const { error: dbErr } = await supabase
      .from('teams')
      .update({ logo_path: null })
      .eq('id', teamId)

    if (dbErr) {
      toast(`${t('common.error')}: ${dbErr.message}`, 'error')
      setBusy(false)
      return
    }

    onChange(null)
    toast(t('admin.teamLogo.removeSuccess'))
    setBusy(false)
  }

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.35rem' }}>
        {t('admin.teamLogo.title')}
      </div>

      {previewUrl && (
        <div style={{ marginBottom: '0.5rem' }}>
          <img
            src={previewUrl}
            alt={t('admin.teamLogo.title')}
            style={{
              display: 'block',
              maxHeight: '56px',
              maxWidth: '112px',
              objectFit: 'contain',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.04)',
              padding: '3px',
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          disabled={busy}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          onClick={() => { setConfirmRemove(false); fileInputRef.current?.click() }}
          disabled={busy}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            border: '1px solid var(--color-accent)', color: 'var(--color-accent)',
            background: 'none', borderRadius: '6px', padding: '0.35rem 0.7rem',
            cursor: busy ? 'not-allowed' : 'pointer',
            fontSize: '0.78rem', fontWeight: 500,
            opacity: busy ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          <Upload size={13} />
          {busy ? t('admin.teamLogo.uploading') : t('admin.teamLogo.upload')}
        </button>

        {currentLogoPath && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            style={{
              display: 'inline-flex', alignItems: 'center',
              border: `1px solid ${confirmRemove ? 'var(--color-danger)' : 'rgba(255,255,255,0.2)'}`,
              color: confirmRemove ? 'var(--color-danger)' : 'var(--color-muted)',
              background: 'none', borderRadius: '6px', padding: '0.35rem 0.7rem',
              cursor: busy ? 'not-allowed' : 'pointer',
              fontSize: '0.78rem', fontWeight: 500,
              opacity: busy ? 0.6 : 1,
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            {confirmRemove ? t('admin.teamLogo.removeConfirm') : t('admin.teamLogo.remove')}
          </button>
        )}
      </div>
    </div>
  )
}
