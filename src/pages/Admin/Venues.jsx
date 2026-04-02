import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'

export default function Venues() {
  const { id: tournamentId } = useParams()
  const { t } = useTranslation()
  const [tournament, setTournament] = useState(null)
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVenueForm, setShowVenueForm] = useState(false)
  const [pitchForms, setPitchForms] = useState({})
  const venueForm = useForm()
  const pitchForm = useForm()

  async function load() {
    const [{ data: t_ }, { data: v }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tournamentId).single(),
      supabase.from('venues').select('*, pitches(*)').eq('tournament_id', tournamentId).order('name'),
    ])
    setTournament(t_)
    setVenues(v ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [tournamentId])

  async function addVenue(values) {
    const { error } = await supabase.from('venues').insert({ ...values, tournament_id: tournamentId })
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('venue.added'))
    venueForm.reset()
    setShowVenueForm(false)
    load()
  }

  async function addPitch(venueId, values) {
    const { error } = await supabase.from('pitches').insert({ ...values, venue_id: venueId })
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('venue.pitchAdded'))
    pitchForm.reset()
    setPitchForms(prev => ({ ...prev, [venueId]: false }))
    load()
  }

  async function deletePitch(pitchId) {
    if (!confirm(t('common.confirmDelete'))) return
    const { error } = await supabase.from('pitches').delete().eq('id', pitchId)
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('venue.pitchDeleted'))
    load()
  }

  async function deleteVenue(venueId) {
    if (!confirm(t('venue.confirmDeleteVenue'))) return
    const { error } = await supabase.from('venues').delete().eq('id', venueId)
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('venue.deleted'))
    load()
  }

  if (loading) return <div className="loading">{t('common.loading')}</div>

  return (
    <div>
      <nav className="admin-nav">
        <Link to={`/admin/tournaments/${tournamentId}/age-groups`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
          ← {tournament?.name}
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/admin/tournaments/${tournamentId}/age-groups`} className="btn-secondary btn-sm">{t('ageGroup.title')}</Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>{t('venue.title')}</h1>
          {!showVenueForm && (
            <button className="btn-primary" onClick={() => setShowVenueForm(true)}>
              + {t('venue.new')}
            </button>
          )}
        </div>

        {showVenueForm && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>{t('venue.new')}</h2>
            <form onSubmit={venueForm.handleSubmit(addVenue)} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>{t('venue.name')} *</label>
                  <input {...venueForm.register('name', { required: t('common.required') })} />
                  {venueForm.formState.errors.name && (
                    <span className="error-message">{venueForm.formState.errors.name.message}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>{t('venue.address')}</label>
                  <input {...venueForm.register('address')} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn-primary" disabled={venueForm.formState.isSubmitting}>
                  {t('venue.addVenue')}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowVenueForm(false); venueForm.reset() }}>
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {venues.length === 0 && !showVenueForm && (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</p>
        )}

        {venues.map(venue => (
          <div key={venue.id} className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>{venue.name}</strong>
                {venue.address && (
                  <span style={{ marginLeft: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    {venue.address}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setPitchForms(prev => ({ ...prev, [venue.id]: !prev[venue.id] }))}
                >
                  + {t('venue.newPitch')}
                </button>
                <button className="btn-danger btn-sm" onClick={() => deleteVenue(venue.id)}>
                  {t('common.delete')}
                </button>
              </div>
            </div>

            {pitchForms[venue.id] && (
              <form
                onSubmit={pitchForm.handleSubmit(v => addPitch(venue.id, v))}
                style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
              >
                <input
                  {...pitchForm.register('name', { required: true })}
                  placeholder={t('venue.pitchName')}
                  style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
                />
                <button type="submit" className="btn-primary btn-sm">{t('common.add')}</button>
                <button type="button" className="btn-secondary btn-sm" onClick={() => { setPitchForms(prev => ({ ...prev, [venue.id]: false })); pitchForm.reset() }}>
                  {t('common.cancel')}
                </button>
              </form>
            )}

            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('venue.pitches')}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(venue.pitches ?? []).map(pitch => (
                  <div key={pitch.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'var(--color-surface-2)', padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                  }}>
                    <span>{pitch.name}</span>
                    <button
                      onClick={() => deletePitch(pitch.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '1rem' }}
                      title={t('common.delete')}
                    >×</button>
                  </div>
                ))}
                {(venue.pitches ?? []).length === 0 && (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('venue.noPitches')}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
