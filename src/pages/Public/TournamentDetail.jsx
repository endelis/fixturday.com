import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import PublicNav from '../../components/PublicNav'

function attachmentIcon(type) {
  if (type === 'pdf') return '📄'
  if (type === 'image') return '🖼'
  return '📎'
}

export default function TournamentDetail() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const [tournament, setTournament] = useState(null)
  const [ageGroups, setAgeGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [rulesOpen, setRulesOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: tourney } = await supabase
        .from('tournaments')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!tourney) { setLoading(false); return }
      setTournament(tourney)

      const { data: ag } = await supabase
        .from('age_groups')
        .select('*')
        .eq('tournament_id', tourney.id)
        .order('name')

      setAgeGroups(ag ?? [])
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (!tournament) return <div className="loading">{t('register.notFound')}</div>

  const attachments = tournament.attachments ?? []

  return (
    <div>
      <PublicNav tournament={tournament} ageGroups={ageGroups} />
      <div className="container" style={{ paddingTop: '2rem' }}>
        {tournament.logo_url && (
          <img
            src={tournament.logo_url}
            alt={tournament.name}
            style={{ maxHeight: '80px', marginBottom: '1rem', display: 'block' }}
          />
        )}
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--color-accent)' }}>
          {tournament.name}
        </h1>

        {tournament.description && (
          <p style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>{tournament.description}</p>
        )}

        {tournament.rules && (
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => setRulesOpen(o => !o)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent)',
                fontFamily: 'var(--font-heading)',
                fontSize: '1.125rem',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {rulesOpen ? t('tournament.rulesHide') : t('tournament.rulesShow')} {rulesOpen ? '▴' : '▾'}
            </button>
            {rulesOpen && (
              <div
                className="card"
                style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', color: 'var(--color-text)', lineHeight: '1.6' }}
              >
                {tournament.rules}
              </div>
            )}
          </div>
        )}

        {attachments.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', marginBottom: '0.75rem' }}>
              {t('tournament.attachments')}
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {attachments.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                    background: 'var(--color-surface)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px'
                  }}
                >
                  {attachmentIcon(att.type)} {att.name}
                </a>
              ))}
            </div>
          </div>
        )}

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
          {t('ageGroup.title')}
        </h2>
        {ageGroups.some(ag => ag.registration_open) && (
          <Link
            to={`/t/${tournament.slug}/register`}
            className="btn-primary"
            style={{ display: 'inline-block', marginBottom: '1.5rem', fontSize: '1rem' }}
          >
            {t('tournament.registerCTA')}
          </Link>
        )}
        {ageGroups.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {ageGroups.map(ag => (
              <Link key={ag.id} to={`/t/${slug}/${ag.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>{ag.name}</span>
                  <span className={`badge ${ag.registration_open ? 'badge-success' : 'badge-muted'}`}>
                    {ag.registration_open ? t('ageGroup.regOpen') : t('ageGroup.regClosed_label')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
