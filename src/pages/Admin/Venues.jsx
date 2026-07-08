import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'

export default function Venues() {
  const { id: tournamentId } = useParams()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [tournament, setTournament] = useState(null)
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVenueForm, setShowVenueForm] = useState(false)
  const [pitchForms, setPitchForms] = useState({})
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleByPitch, setScheduleByPitch] = useState({})
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const venueForm = useForm()
  const pitchForm = useForm()

  async function load() {
    const [{ data: t_, error: tErr }, { data: v, error: vErr }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tournamentId).single(),
      supabase.from('venues').select('*, pitches(*)').eq('tournament_id', tournamentId).order('name'),
    ])
    if (tErr || vErr) { toast(t('common.error'), 'error'); setLoading(false); return }
    setTournament(t_)
    setVenues(v ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading || !user) return
    load()
  }, [tournamentId, authLoading, user])

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

  async function openSchedule() {
    setScheduleLoading(true)
    setShowSchedule(true)
    const allPitchIds = venues.flatMap(v => (v.pitches ?? []).map(p => p.id))
    if (allPitchIds.length === 0) { setScheduleLoading(false); return }
    const { data: fx, error: fxErr } = await supabase
      .from('fixtures')
      .select('id, kickoff_time, round, round_name, group_label, home_placeholder, away_placeholder, pitch_id, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), stage:stages(type, age_group:age_groups(name))')
      .in('pitch_id', allPitchIds)
      .not('kickoff_time', 'is', null)
      .order('kickoff_time')
    if (fxErr) { toast(t('common.error'), 'error'); setScheduleLoading(false); return }
    const grouped = {}
    for (const f of fx ?? []) {
      if (!grouped[f.pitch_id]) grouped[f.pitch_id] = []
      grouped[f.pitch_id].push(f)
    }
    setScheduleByPitch(grouped)
    setScheduleLoading(false)
  }

  if (authLoading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />
  if (loading) return <div className="loading">{t('common.loading')}</div>

  return (
    <div>
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>{t('venue.title')}</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={showSchedule ? () => setShowSchedule(false) : openSchedule}>
              {showSchedule ? t('common.close') : t('venue.scheduleByPitch')}
            </button>
            {!showVenueForm && (
              <button className="btn-primary" onClick={() => setShowVenueForm(true)}>
                + {t('venue.new')}
              </button>
            )}
          </div>
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

        {showSchedule && (
          <div className="pitch-schedule-panel" style={{ marginBottom: '2rem' }}>
            <style>{`
              @media print {
                body * { visibility: hidden; }
                .pitch-schedule-panel, .pitch-schedule-panel * { visibility: visible; }
                .pitch-schedule-panel { position: absolute; left: 0; top: 0; width: 100%; padding: 1rem; }
                .pitch-schedule-no-print { display: none !important; }
              }
            `}</style>
            <div className="pitch-schedule-no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('venue.scheduleByPitch')}
              </span>
              <button className="btn-secondary btn-sm" onClick={() => window.print()}>
                🖨 {t('venue.printSchedule')}
              </button>
            </div>
            {scheduleLoading ? (
              <div style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>{t('common.loading')}</div>
            ) : (
              venues.flatMap(v => v.pitches ?? []).map(pitch => (
                <div key={pitch.id} style={{ marginBottom: '1.5rem', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div style={{
                    fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700,
                    borderBottom: '2px solid var(--color-accent)', paddingBottom: '0.25rem', marginBottom: '0.5rem',
                  }}>
                    {pitch.name}
                  </div>
                  {(scheduleByPitch[pitch.id] ?? []).length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t('venue.noScheduledGames')}</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <tbody>
                        {(scheduleByPitch[pitch.id] ?? []).map(fx => {
                          const d = new Date(fx.kickoff_time)
                          const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                          const dateStr = format(d, 'dd.MM')
                          const division = fx.stage?.age_group?.name ?? ''
                          const home = fx.home_team?.name ?? fx.home_placeholder ?? '—'
                          const away = fx.away_team?.name ?? fx.away_placeholder ?? '—'
                          const label = fx.round_name ?? (fx.group_label ? `${fx.group_label} R${fx.round}` : `R${fx.round}`)
                          return (
                            <tr key={fx.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '0.35rem 0.5rem', whiteSpace: 'nowrap', color: 'var(--color-accent)', fontWeight: 600, width: '3rem' }}>{timeStr}</td>
                              <td style={{ padding: '0.35rem 0.5rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', width: '3.5rem' }}>{dateStr}</td>
                              <td style={{ padding: '0.35rem 0.5rem', color: 'var(--color-text-muted)', width: '4rem', fontSize: '0.78rem' }}>{division}</td>
                              <td style={{ padding: '0.35rem 0.5rem', color: 'var(--color-text-muted)', width: '5rem', fontSize: '0.78rem' }}>{label}</td>
                              <td style={{ padding: '0.35rem 0.5rem', fontWeight: 500 }}>{home}</td>
                              <td style={{ padding: '0.35rem 0.5rem', color: 'var(--color-text-muted)', textAlign: 'center', width: '1.5rem' }}>vs</td>
                              <td style={{ padding: '0.35rem 0.5rem', fontWeight: 500 }}>{away}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              ))
            )}
          </div>
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
