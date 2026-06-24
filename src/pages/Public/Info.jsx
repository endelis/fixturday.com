import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTournamentInfo } from '../../hooks/useTournamentInfo'
import TournamentLogo from '../../components/TournamentLogo'
import PublicNav from '../../components/PublicNav'

export default function Info() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const { tournament, info, loading, error } = useTournamentInfo(slug)
  const [ageGroups, setAgeGroups] = useState([])
  const [tourneyDetails, setTourneyDetails] = useState({ rules: null, attachments: [] })

  useEffect(() => {
    if (!tournament?.id) return
    Promise.all([
      supabase.from('age_groups').select('id, name').eq('tournament_id', tournament.id).order('name'),
      supabase.from('tournaments').select('rules, attachments').eq('id', tournament.id).single(),
    ]).then(([{ data: agData }, { data: tData }]) => {
      setAgeGroups(agData ?? [])
      setTourneyDetails({
        rules: tData?.rules ?? null,
        attachments: tData?.attachments ?? [],
      })
    })
  }, [tournament?.id])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (error || !tournament) return <div className="loading">{t('common.error')}</div>

  const hasContent = info?.content_md?.trim()
  const hasContact = info?.contact_email || info?.contact_phone
  const rulesPdf = tourneyDetails.attachments.find(a => a.type === 'rules')
  const hasRules = tourneyDetails.rules?.trim() || rulesPdf

  const sectionLabel = {
    display: 'block',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.78rem',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '0.875rem',
  }

  return (
    <div>
      <PublicNav tournament={tournament} ageGroups={ageGroups} activeAgeGroupId={ageGroups[0]?.id} />
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <Link to={`/t/${tournament.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <TournamentLogo logoPath={tournament.logo_path} logoUrl={tournament.logo_url} size="sm" alt={tournament.name} />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-accent)' }}>
              {tournament.name}
            </span>
          </Link>
          <span style={{ color: 'var(--color-text-muted)', lineHeight: 1 }}>›</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{t('info.title')}</span>
        </div>

        {/* Empty state */}
        {!hasContent && !hasRules && !hasContact && (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('info.noContent')}</p>
        )}

        {/* About */}
        {hasContent && (
          <div style={{ marginBottom: hasRules || hasContact ? '2.5rem' : 0 }}>
            <span style={sectionLabel}>{t('info.aboutSection')}</span>
            <div style={{
              whiteSpace: 'pre-wrap', fontFamily: 'inherit',
              maxWidth: '72ch', lineHeight: 1.7,
              color: 'var(--color-text)', fontSize: '0.95rem',
            }}>
              {info.content_md}
            </div>
          </div>
        )}

        {/* Rules */}
        {hasRules && (
          <div style={{ marginBottom: hasContact ? '2.5rem' : 0 }}>
            <span style={sectionLabel}>{t('info.rulesSection')}</span>

            {rulesPdf && (
              <div style={{ marginBottom: tourneyDetails.rules?.trim() ? '1rem' : 0 }}>
                <a
                  href={rulesPdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.45rem 1rem',
                    background: 'rgba(240,165,0,0.1)',
                    border: '1px solid rgba(240,165,0,0.35)',
                    borderRadius: '6px',
                    color: 'var(--color-accent)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'background var(--transition-fast)',
                  }}
                >
                  <FileText size={14} /> {t('info.downloadRules')}
                </a>
              </div>
            )}

            {tourneyDetails.rules?.trim() && (
              <div style={{
                whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                maxWidth: '72ch', lineHeight: 1.7,
                color: 'var(--color-text)', fontSize: '0.95rem',
              }}>
                {tourneyDetails.rules}
              </div>
            )}
          </div>
        )}

        {/* Contact */}
        {hasContact && (
          <div
            className="card"
            style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.65rem', padding: '1rem 1.25rem' }}
          >
            <span style={sectionLabel}>{t('info.contact')}</span>

            {info.contact_email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <a href={`mailto:${info.contact_email}`} style={{ color: 'var(--color-text)', textDecoration: 'none', fontSize: '0.9rem' }}>
                  {info.contact_email}
                </a>
              </div>
            )}

            {info.contact_phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Phone size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <a href={`tel:${info.contact_phone}`} style={{ color: 'var(--color-text)', textDecoration: 'none', fontSize: '0.9rem' }}>
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
