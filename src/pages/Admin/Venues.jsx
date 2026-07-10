import { useEffect, useRef, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import QRCode from 'qrcode'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'
import VenueDivisionScheduler from './Fixtures/VenueDivisionScheduler'

const BASE_URL = 'https://www.fixturday.com'
const GAMES_PER_PAGE = 25
const MIN_LAST_PAGE = 5

function paginateFixtures(fixtures) {
  if (fixtures.length === 0) return [[]]
  const chunks = []
  for (let i = 0; i < fixtures.length; i += GAMES_PER_PAGE) {
    chunks.push(fixtures.slice(i, i + GAMES_PER_PAGE))
  }
  if (chunks.length > 1 && chunks[chunks.length - 1].length < MIN_LAST_PAGE) {
    const last = chunks.pop()
    const prev = chunks.pop()
    const combined = [...prev, ...last]
    const mid = Math.ceil(combined.length / 2)
    chunks.push(combined.slice(0, mid))
    chunks.push(combined.slice(mid))
  }
  return chunks
}

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 15mm; }

  @media print {
    body.venue-print-mode * { visibility: hidden !important; }
    body.venue-print-mode .print-active,
    body.venue-print-mode .print-active * { visibility: visible !important; }
    body.venue-print-mode .print-active {
      position: absolute !important;
      left: 0; top: 0;
      width: 100%;
      background: white !important;
    }
    /* Show collapsed pitch content */
    body.venue-print-mode .print-active .pitch-content { display: block !important; }
    /* Show pitch header inside any active print target */
    body.venue-print-mode .print-active .print-pitch-header { display: flex !important; }
    /* Page break before continuation pages within a pitch */
    body.venue-print-mode .print-active .print-page-break {
      break-before: page !important;
      page-break-before: always !important;
    }
    /* Let pitch content flow naturally across pages */
    body.venue-print-mode .pitch-print-container {
      overflow: visible !important;
      break-inside: auto !important;
      page-break-inside: auto !important;
      border: none !important;
      border-radius: 0 !important;
    }
    /* Fixture rows stay together */
    body.venue-print-mode .print-active tr { break-inside: avoid; page-break-inside: avoid; }
    /* Hide all UI chrome */
    body.venue-print-mode .no-print { visibility: hidden !important; }
  }
`

async function makeQR(url) {
  return QRCode.toDataURL(url, { width: 180, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
}

function triggerPrint(key) {
  const el = document.querySelector(`[data-print="${key}"]`)
  if (!el) return

  // Set page breaks between pitches (except the first)
  const pitches = [...el.querySelectorAll('.pitch-print-container')]
  pitches.forEach((p, i) => {
    if (i > 0) { p.style.pageBreakBefore = 'always'; p.style.breakBefore = 'page' }
  })

  el.classList.add('print-active')
  document.body.classList.add('venue-print-mode')
  window.print()
  document.body.classList.remove('venue-print-mode')
  el.classList.remove('print-active')
  pitches.forEach(p => { p.style.pageBreakBefore = ''; p.style.breakBefore = '' })
}

function PrintHeader({ headerClass, heading, subheading, url, qrDataUrl, t }) {
  return (
    <div
      className={headerClass}
      style={{
        display: 'none',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.25rem',
        paddingBottom: '0.875rem',
        borderBottom: '3px solid #000',
        gap: '1.25rem',
        background: 'white',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '2.2rem',
          fontWeight: 900,
          lineHeight: 1.05,
          color: '#000',
          wordBreak: 'break-word',
        }}>
          {heading.toUpperCase()}
        </div>
        {subheading && (
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1rem',
            color: '#333',
            marginTop: '0.35rem',
            fontWeight: 600,
          }}>
            {subheading}
          </div>
        )}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          marginTop: '0.85rem',
          fontSize: '0.7rem',
          color: '#777',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {t('venue.scanSchedule')}
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          color: '#000',
          marginTop: '0.1rem',
          wordBreak: 'break-all',
        }}>
          {url}
        </div>
      </div>
      {qrDataUrl && (
        <img
          src={qrDataUrl}
          alt="QR"
          style={{ width: '88px', height: '88px', flexShrink: 0, display: 'block' }}
        />
      )}
    </div>
  )
}

function FixtureRow({ fx }) {
  const d = new Date(fx.kickoff_time)
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const dateStr = format(d, 'dd.MM')
  const division = fx.stage?.age_group?.name ?? ''
  const home = fx.home_team?.name ?? fx.home_placeholder ?? '—'
  const away = fx.away_team?.name ?? fx.away_placeholder ?? '—'
  const label = fx.group_label ? `${fx.group_label} R${fx.round}` : `R${fx.round}`
  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
      <td style={{ padding: '0.35rem 0.5rem', whiteSpace: 'nowrap', color: 'var(--color-accent)', fontWeight: 600, width: '3rem' }}>{timeStr}</td>
      <td style={{ padding: '0.35rem 0.5rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', width: '3.5rem' }}>{dateStr}</td>
      <td style={{ padding: '0.35rem 0.5rem', color: 'var(--color-text-muted)', width: '4rem', fontSize: '0.78rem' }}>{division}</td>
      <td style={{ padding: '0.35rem 0.5rem', color: 'var(--color-text-muted)', width: '5rem', fontSize: '0.78rem' }}>{label}</td>
      <td style={{ padding: '0.35rem 0.5rem', fontWeight: 500 }}>{home}</td>
      <td style={{ padding: '0.35rem 0.5rem', color: 'var(--color-text-muted)', textAlign: 'center', width: '1.5rem' }}>vs</td>
      <td style={{ padding: '0.35rem 0.5rem', fontWeight: 500 }}>{away}</td>
    </tr>
  )
}

function PitchAccordion({ pitch, fixtures, expanded, onToggle, onPrint, tournament, pitchUrl, qrDataUrl, t }) {
  const pages = paginateFixtures(fixtures)
  return (
    <div
      data-print={`pitch-${pitch.id}`}
      className="pitch-print-container"
      style={{
        marginBottom: '0.5rem',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}
    >
      {/* Accordion toggle bar — screen only */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.5rem 0.75rem', background: 'var(--color-surface-2)',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>
          {pitch.name}
        </span>
        <div
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          onClick={e => e.stopPropagation()}
        >
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            {fixtures.length} {t('venue.games')}
          </span>
          <button className="btn-secondary btn-sm no-print" onClick={onPrint} title={t('venue.printSchedule')}>
            🖨
          </button>
          <span className="no-print" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', width: '1rem', textAlign: 'center' }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Content — screen: collapsible, print: always shown with one header per page */}
      <div className="pitch-content" style={{ display: expanded ? 'block' : 'none' }}>
        {fixtures.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}>
            {t('venue.noScheduledGames')}
          </p>
        ) : (
          pages.map((pageFixtures, pageIndex) => (
            <div key={pageIndex} className={pageIndex > 0 ? 'print-page-break' : ''}>
              <PrintHeader
                headerClass="print-pitch-header"
                heading={pitch.name}
                subheading={tournament?.name}
                url={pitchUrl}
                qrDataUrl={qrDataUrl}
                t={t}
              />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <tbody>
                  {pageFixtures.map(fx => <FixtureRow key={fx.id} fx={fx} />)}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function pitchPublicUrl(slug) {
  return `${BASE_URL}/t/${slug}`
}

function SchedulePanel({
  title, pitchGroups, scheduleByPitch, loading, pitchExpanded, togglePitch,
  printKey, onPrint, onClose, onPrintPitch, tournament, qrCodes, t,
}) {
  return (
    <div className="card" data-print={printKey} style={{ marginBottom: '1rem' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{
          fontFamily: 'var(--font-heading)', fontSize: '1rem',
          textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)',
        }}>
          {title}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary btn-sm" onClick={onPrint}>
            🖨 {t('venue.printSchedule')}
          </button>
          <button className="btn-secondary btn-sm" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>{t('common.loading')}</div>
      ) : (
        pitchGroups.map(({ venueLabel, pitches }) => (
          <div key={venueLabel ?? '__default'}>
            {venueLabel && (
              <div className="no-print" style={{
                fontFamily: 'var(--font-heading)', fontSize: '0.8rem', textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--color-accent)',
                marginTop: '1rem', marginBottom: '0.5rem',
                paddingBottom: '0.25rem', borderBottom: '1px solid var(--color-accent)',
              }}>
                {venueLabel}
              </div>
            )}
            {pitches.map(pitch => {
              const url = tournament ? pitchPublicUrl(tournament.slug) : ''
              return (
                <PitchAccordion
                  key={pitch.id}
                  pitch={pitch}
                  fixtures={scheduleByPitch[pitch.id] ?? []}
                  expanded={!!pitchExpanded[pitch.id]}
                  onToggle={() => togglePitch(pitch.id)}
                  onPrint={() => onPrintPitch(pitch.id)}
                  tournament={tournament}
                  pitchUrl={url}
                  qrDataUrl={qrCodes[`pitch-${pitch.id}`]}
                  t={t}
                />
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}

export default function Venues() {
  const { id: tournamentId } = useParams()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [tournament, setTournament] = useState(null)
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVenueForm, setShowVenueForm] = useState(false)
  const [pitchForms, setPitchForms] = useState({})
  const [venueScheduleOpen, setVenueScheduleOpen] = useState({})
  const [divSchedulerVenue, setDivSchedulerVenue] = useState(null)
  const [pitchExpanded, setPitchExpanded] = useState({})
  const [showFullOverview, setShowFullOverview] = useState(false)
  const [scheduleByPitch, setScheduleByPitch] = useState({})
  const [scheduleLoading, setScheduleLoading] = useState({})
  const [qrCodes, setQrCodes] = useState({})
  const loadedPitchIds = useRef(new Set())
  const qrGeneratedRef = useRef(new Set())
  const venueForm = useForm()
  const pitchForm = useForm()

  async function load() {
    const [{ data: tour, error: tErr }, { data: v, error: vErr }] = await Promise.all([
      supabase.from('tournaments').select('id, name, slug').eq('id', tournamentId).single(),
      supabase.from('venues').select('*, pitches(*)').eq('tournament_id', tournamentId).order('name'),
    ])
    if (tErr || vErr) { toast(t('common.error'), 'error'); setLoading(false); return }
    setTournament(tour)
    setVenues(v ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading || !user) return
    load()
  }, [tournamentId, authLoading, user])

  useEffect(() => {
    if (!tournament?.slug) return
    const base = `${BASE_URL}/t/${tournament.slug}`
    function gen(key, url) {
      if (qrGeneratedRef.current.has(key)) return
      qrGeneratedRef.current.add(key)
      makeQR(url).then(dataUrl => setQrCodes(prev => ({ ...prev, [key]: dataUrl })))
    }
    gen('overview', base)
    venues.forEach(v => gen(`venue-${v.id}`, base))
  }, [tournament, venues])

  useEffect(() => {
    if (!tournament?.slug) return
    const base = `${BASE_URL}/t/${tournament.slug}`
    Object.keys(scheduleByPitch).forEach(pitchId => {
      const key = `pitch-${pitchId}`
      if (qrGeneratedRef.current.has(key)) return
      qrGeneratedRef.current.add(key)
      makeQR(base).then(dataUrl => setQrCodes(prev => ({ ...prev, [key]: dataUrl })))
    })
  }, [scheduleByPitch, tournament])

  async function fetchSchedule(pitchIds, loadingKey) {
    const missing = pitchIds.filter(id => !loadedPitchIds.current.has(id))
    if (missing.length === 0) return
    setScheduleLoading(prev => ({ ...prev, [loadingKey]: true }))
    const { data: fx, error } = await supabase
      .from('fixtures')
      .select('id, kickoff_time, round, round_name, group_label, home_placeholder, away_placeholder, pitch_id, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name), stage:stages(type, age_group:age_groups(id, name))')
      .in('pitch_id', missing)
      .not('kickoff_time', 'is', null)
      .order('kickoff_time')
    if (error) { toast(t('common.error'), 'error'); setScheduleLoading(prev => ({ ...prev, [loadingKey]: false })); return }
    const grouped = {}
    for (const id of missing) { grouped[id] = []; loadedPitchIds.current.add(id) }
    for (const f of fx ?? []) {
      if (!grouped[f.pitch_id]) grouped[f.pitch_id] = []
      grouped[f.pitch_id].push(f)
    }
    setScheduleByPitch(prev => ({ ...prev, ...grouped }))
    setScheduleLoading(prev => ({ ...prev, [loadingKey]: false }))
  }

  async function toggleVenueSchedule(venue) {
    const isOpen = !!venueScheduleOpen[venue.id]
    setVenueScheduleOpen(prev => ({ ...prev, [venue.id]: !isOpen }))
    if (isOpen) return
    const pitches = venue.pitches ?? []
    if (pitches.length > 0) setPitchExpanded(prev => ({ ...prev, [pitches[0].id]: true }))
    await fetchSchedule(pitches.map(p => p.id), venue.id)
  }

  async function toggleFullOverview() {
    if (showFullOverview) { setShowFullOverview(false); return }
    setShowFullOverview(true)
    const allPitchIds = venues.flatMap(v => (v.pitches ?? []).map(p => p.id))
    await fetchSchedule(allPitchIds, 'overview')
  }

  function togglePitch(pitchId) {
    setPitchExpanded(prev => ({ ...prev, [pitchId]: !prev[pitchId] }))
  }

  function printPitch(pitchId) {
    if (!pitchExpanded[pitchId]) {
      setPitchExpanded(prev => ({ ...prev, [pitchId]: true }))
      requestAnimationFrame(() => requestAnimationFrame(() => triggerPrint(`pitch-${pitchId}`)))
    } else {
      triggerPrint(`pitch-${pitchId}`)
    }
  }

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

  if (authLoading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />
  if (loading) return <div className="loading">{t('common.loading')}</div>

  return (
    <div>
      <style>{PRINT_STYLES}</style>
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>{t('venue.title')}</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={toggleFullOverview}>
              {showFullOverview ? t('common.close') : t('venue.fullOverview')}
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

        {showFullOverview && (
          <SchedulePanel
            title={t('venue.fullOverview')}
            pitchGroups={venues.map(v => ({ venueLabel: v.name, pitches: v.pitches ?? [] }))}
            scheduleByPitch={scheduleByPitch}
            loading={!!scheduleLoading['overview']}
            pitchExpanded={pitchExpanded}
            togglePitch={togglePitch}
            printKey="overview"
            onPrint={() => triggerPrint('overview')}
            onClose={() => setShowFullOverview(false)}
            onPrintPitch={printPitch}
            tournament={tournament}
            qrCodes={qrCodes}
            t={t}
          />
        )}

        {venues.length === 0 && !showVenueForm && (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</p>
        )}

        {divSchedulerVenue && (
          <VenueDivisionScheduler
            open={!!divSchedulerVenue}
            onClose={() => setDivSchedulerVenue(null)}
            tournamentId={tournamentId}
            venue={divSchedulerVenue}
            pitches={divSchedulerVenue.pitches ?? []}
            onSaved={() => {
              loadedPitchIds.current.clear()
              setScheduleByPitch({})
            }}
          />
        )}

        {venues.map(venue => (
          <div key={venue.id}>
            <div
              className="card"
              style={{
                marginBottom: venueScheduleOpen[venue.id] ? 0 : '1rem',
                ...(venueScheduleOpen[venue.id] ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' } : {}),
              }}
            >
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

              {(venue.pitches ?? []).length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button className="btn-secondary btn-sm" onClick={() => setDivSchedulerVenue(venue)}>
                    {t('venue.scheduleDivisions')}
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => toggleVenueSchedule(venue)}>
                    {venueScheduleOpen[venue.id] ? t('venue.hideSchedule') : t('venue.pitchSchedule')}
                  </button>
                </div>
              )}
            </div>

            {venueScheduleOpen[venue.id] && (
              <SchedulePanel
                title={`${venue.name} — ${t('venue.pitchSchedule')}`}
                pitchGroups={[{ venueLabel: null, pitches: venue.pitches ?? [] }]}
                scheduleByPitch={scheduleByPitch}
                loading={!!scheduleLoading[venue.id]}
                pitchExpanded={pitchExpanded}
                togglePitch={togglePitch}
                printKey={`venue-${venue.id}`}
                onPrint={() => triggerPrint(`venue-${venue.id}`)}
                onClose={() => setVenueScheduleOpen(prev => ({ ...prev, [venue.id]: false }))}
                onPrintPitch={printPitch}
                tournament={tournament}
                qrCodes={qrCodes}
                t={t}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
