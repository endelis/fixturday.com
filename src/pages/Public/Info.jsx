import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTournamentInfo } from '../../hooks/useTournamentInfo'
import TournamentLogo from '../../components/TournamentLogo'
import PublicNav from '../../components/PublicNav'

export default function Info() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const { tournament, info, loading, error } = useTournamentInfo(slug)
  const [ageGroups, setAgeGroups] = useState([])

  useEffect(() => {
    if (!tournament?.id) return
    supabase.from('age_groups').select('id, name').eq('tournament_id', tournament.id).order('name')
      .then(({ data }) => setAgeGroups(data ?? []))
  }, [tournament?.id])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (error || !tournament) return <div className="loading">{t('common.error')}</div>

  const hasContent = info?.content_md?.trim()
  const hasContact = info?.contact_email || info?.contact_phone

  return (
    <div>
      <PublicNav tournament={tournament} ageGroups={ageGroups} activeAgeGroupId={ageGroups[0]?.id} />
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <Link
            to={`/t/${tournament.slug}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            <TournamentLogo
              logoPath={tournament.logo_path}
              logoUrl={tournament.logo_url}
              size="sm"
              alt={tournament.name}
            />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-accent)' }}>
              {tournament.name}
            </span>
          </Link>
          <span style={{ color: 'var(--color-muted)', lineHeight: 1 }}>›</span>
          <span style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>{t('info.title')}</span>
        </div>

        {/* Content */}
        {!hasContent ? (
          <p style={{ color: 'var(--color-muted)' }}>{t('info.noContent')}</p>
        ) : (
          <pre style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            maxWidth: '72ch',
            lineHeight: 1.7,
            color: 'var(--color-text)',
            fontSize: '0.95rem',
            margin: 0,
            marginBottom: hasContact ? '2rem' : 0,
          }}>
            {info.content_md}
          </pre>
        )}

        {/* Contact */}
        {hasContact && (
          <div
            className="card"
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              gap: '0.65rem',
              padding: '1rem 1.25rem',
              marginTop: !hasContent ? '1rem' : 0,
            }}
          >
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.8rem',
              color: 'var(--color-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {t('info.contact')}
            </div>

            {info.contact_email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <a
                  href={`mailto:${info.contact_email}`}
                  style={{ color: 'var(--color-text)', textDecoration: 'none', fontSize: '0.9rem' }}
                >
                  {info.contact_email}
                </a>
              </div>
            )}

            {info.contact_phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Phone size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <a
                  href={`tel:${info.contact_phone}`}
                  style={{ color: 'var(--color-text)', textDecoration: 'none', fontSize: '0.9rem' }}
                >
                  {info.contact_phone}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
