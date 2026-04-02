import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import PublicNav from '../../components/PublicNav'

function ChevronIcon({ open }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s',
        flexShrink: 0,
      }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const emptyPlayer = () => ({ name: '', dob: '', jersey: '' })

export default function Register() {
  const { slug } = useParams()
  const { t } = useTranslation()

  const [tournament, setTournament] = useState(null)
  const [allAgeGroups, setAllAgeGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [playersOpen, setPlayersOpen] = useState(false)
  const [players, setPlayers] = useState([])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const selectedAgeGroupId = watch('age_group_id')

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('tournaments')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!t) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setTournament(t)

      const { data: ag } = await supabase
        .from('age_groups')
        .select('*')
        .eq('tournament_id', t.id)
        .order('name')

      setAllAgeGroups(ag ?? [])
      setLoading(false)
    }
    load()
  }, [slug])

  const openAgeGroups = allAgeGroups.filter(ag => ag.registration_open)

  const selectedGroup = allAgeGroups.find(ag => ag.id === selectedAgeGroupId)
  const selectedGroupClosed =
    selectedGroup && !selectedGroup.registration_open

  function addPlayer() {
    setPlayers(prev => [...prev, emptyPlayer()])
  }

  function removePlayer(index) {
    setPlayers(prev => prev.filter((_, i) => i !== index))
  }

  function updatePlayer(index, field, value) {
    setPlayers(prev =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  async function onSubmit(values) {
    setSubmitError('')
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          age_group_id: values.age_group_id,
          name: values.name,
          club: values.club,
          contact_name: values.contact_name,
          contact_email: values.contact_email,
          contact_phone: values.contact_phone,
          status: 'pending',
        })
        .select()
        .single()

      if (teamError) throw teamError

      if (players.length > 0) {
        const playerRows = players
          .filter(p => p.name?.trim())
          .map(p => ({
            team_id: team.id,
            name: p.name.trim(),
            dob: p.dob || null,
            jersey_number: p.jersey ? Number(p.jersey) : null,
          }))

        if (playerRows.length > 0) {
          const { error: playersError } = await supabase
            .from('team_players')
            .insert(playerRows)
          if (playersError) throw playersError
        }
      }

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setSubmitError(t('register.error'))
    }
  }

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>
  }

  if (notFound) {
    return (
      <div className="loading">{t('register.notFound')}</div>
    )
  }

  if (submitted) {
    return (
      <div>
        <PublicNav tournament={tournament} />
        <div
          className="container"
          style={{ paddingTop: '4rem', textAlign: 'center', maxWidth: '480px' }}
        >
          <div className="card" style={{ padding: '2rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2rem',
                color: 'var(--color-accent)',
                marginBottom: '1rem',
              }}
            >
              {t('register.successTitle')}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              {t('register.successBody')}
            </p>
            <Link to={`/t/${slug}`} className="btn-secondary">
              {t('register.backToTournament')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const registrationClosed = openAgeGroups.length === 0 || selectedGroupClosed

  return (
    <div>
      <PublicNav tournament={tournament} />
      <div
        className="container"
        style={{ paddingTop: '2rem', maxWidth: '600px', padding: '2rem 1rem' }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            marginBottom: '1.5rem',
          }}
        >
          {t('register.title')} — {tournament.name}
        </h1>

        {openAgeGroups.length === 0 ? (
          <div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              {t('register.closed')}
            </p>
            <Link to={`/t/${slug}`} className="btn-secondary">
              {t('register.backToTournament')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>

            {/* Age group */}
            <div className="form-group">
              <label>{t('register.ageGroup')} *</label>
              <select
                {...register('age_group_id', { required: true })}
              >
                <option value="">Izvēlieties...</option>
                {openAgeGroups.map(ag => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
              {errors.age_group_id && (
                <span className="error-message">{t('common.required')}</span>
              )}
              {selectedGroupClosed && (
                <div style={{ marginTop: '0.75rem' }}>
                  <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    {t('register.closed')}
                  </p>
                  <Link to={`/t/${slug}`} className="btn-secondary">
                    {t('register.backToTournament')}
                  </Link>
                </div>
              )}
            </div>

            {!selectedGroupClosed && (
              <>
                {/* Team name */}
                <div className="form-group">
                  <label>{t('register.teamName')} *</label>
                  <input {...register('name', { required: true })} />
                  {errors.name && (
                    <span className="error-message">{t('common.required')}</span>
                  )}
                </div>

                {/* Club */}
                <div className="form-group">
                  <label>{t('register.club')} *</label>
                  <input {...register('club', { required: true })} />
                  {errors.club && (
                    <span className="error-message">{t('common.required')}</span>
                  )}
                </div>

                {/* Contact name */}
                <div className="form-group">
                  <label>{t('register.contactName')} *</label>
                  <input {...register('contact_name', { required: true })} />
                  {errors.contact_name && (
                    <span className="error-message">{t('common.required')}</span>
                  )}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label>{t('register.email')} *</label>
                  <input
                    type="email"
                    {...register('contact_email', { required: true })}
                  />
                  {errors.contact_email && (
                    <span className="error-message">{t('common.required')}</span>
                  )}
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label>{t('register.phone')} *</label>
                  <input {...register('contact_phone', { required: true })} />
                  {errors.contact_phone && (
                    <span className="error-message">{t('common.required')}</span>
                  )}
                </div>

                {/* Players collapsible */}
                <div
                  style={{
                    border: '1px solid var(--color-border, #e2e8f0)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPlayersOpen(o => !o)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--color-surface, #f8fafc)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textAlign: 'left',
                      gap: '0.5rem',
                    }}
                  >
                    <span>
                      {t('register.players')}{' '}
                      {!playersOpen && (
                        <span
                          style={{
                            fontWeight: 400,
                            color: 'var(--color-text-muted)',
                            fontSize: '0.875rem',
                          }}
                        >
                          {t('register.playersOptional')}
                        </span>
                      )}
                    </span>
                    <ChevronIcon open={playersOpen} />
                  </button>

                  {playersOpen && (
                    <div style={{ padding: '1rem' }}>
                      {players.length === 0 && (
                        <p
                          style={{
                            color: 'var(--color-text-muted)',
                            fontSize: '0.875rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          {t('register.playersOptional')}
                        </p>
                      )}

                      {players.map((player, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'flex-end',
                            marginBottom: '0.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div className="form-group" style={{ flex: '2 1 160px', margin: 0 }}>
                            {index === 0 && (
                              <label style={{ fontSize: '0.8rem' }}>
                                {t('register.playerName')}
                              </label>
                            )}
                            <input
                              type="text"
                              placeholder={t('register.playerName')}
                              value={player.name}
                              onChange={e => updatePlayer(index, 'name', e.target.value)}
                            />
                          </div>

                          <div className="form-group" style={{ flex: '1 1 130px', margin: 0 }}>
                            {index === 0 && (
                              <label style={{ fontSize: '0.8rem' }}>
                                {t('register.playerDob')}
                              </label>
                            )}
                            <input
                              type="date"
                              value={player.dob}
                              onChange={e => updatePlayer(index, 'dob', e.target.value)}
                            />
                          </div>

                          <div className="form-group" style={{ flex: '0 1 90px', margin: 0 }}>
                            {index === 0 && (
                              <label style={{ fontSize: '0.8rem' }}>
                                {t('register.playerJersey')}
                              </label>
                            )}
                            <input
                              type="number"
                              min={1}
                              max={99}
                              placeholder="#"
                              value={player.jersey}
                              onChange={e => updatePlayer(index, 'jersey', e.target.value)}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removePlayer(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--color-text-muted)',
                              fontSize: '1.1rem',
                              padding: '0.4rem',
                              alignSelf: 'flex-end',
                              marginBottom: '2px',
                            }}
                            aria-label="Noņemt spēlētāju"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={addPlayer}
                        style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}
                      >
                        {t('register.addPlayer')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit error */}
                {submitError && (
                  <div className="error-message">{submitError}</div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('register.submitting') : t('register.submit')}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
