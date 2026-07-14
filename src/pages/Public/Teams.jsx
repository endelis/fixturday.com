import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { useSEO } from '../../hooks/useSEO'

export default function PublicTeams() {
  const { slug, ageGroup: ageGroupId } = useParams()
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const seoTitle = data?.ag ? `${data.ag.tournaments.name} — ${data.ag.name} Teams` : 'Teams'
  useSEO({ title: seoTitle, path: `/t/${slug}/${ageGroupId}/teams` })

  useEffect(() => {
    async function load() {
      const { data: ag, error: agErr } = await supabase
        .from('age_groups')
        .select('*, tournaments(id, name, slug, sport, start_date, end_date)')
        .eq('id', ageGroupId)
        .single()
      if (agErr || !ag) { setLoading(false); return }

      const [{ data: siblings }, { data: teams }] = await Promise.all([
        supabase.from('age_groups').select('id, name').eq('tournament_id', ag.tournaments.id).order('name'),
        supabase.from('teams').select('id, name, club, status').eq('age_group_id', ageGroupId).neq('status', 'rejected').order('name'),
      ])

      setData({ ag, siblings: siblings ?? [], teams: teams ?? [] })
      setLoading(false)
    }
    load()
  }, [ageGroupId])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (!data?.ag) return <Navigate to={`/t/${slug}`} replace />

  const { ag, siblings, teams } = data
  const tournament = ag.tournaments

  const STATUS_STYLE = {
    confirmed: { label: t('team.statusConfirmed'), bg: 'rgba(46,204,113,0.12)', color: 'var(--color-success)' },
    pending:   { label: t('team.statusPending'),   bg: 'rgba(240,165,0,0.12)',  color: 'var(--color-accent)'  },
  }

  const confirmed = teams.filter(t => t.status === 'confirmed')
  const pending   = teams.filter(t => t.status === 'pending')

  function TeamCard({ team, index }) {
    const st = STATUS_STYLE[team.status] ?? STATUS_STYLE.pending
    return (
      <Link to={`/t/${slug}/${ageGroupId}/teams/${team.id}`} style={{ textDecoration: 'none' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', marginBottom: '0.4rem' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--color-text-muted)', minWidth: '1.5rem', textAlign: 'right' }}>
            {index + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {team.name}
            </div>
            {team.club && (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {team.club}
              </div>
            )}
          </div>
          <span style={{
            fontSize: '0.68rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '0.2rem 0.55rem', borderRadius: '4px',
            background: st.bg, color: st.color, flexShrink: 0,
          }}>
            {st.label}
          </span>
        </div>
      </Link>
    )
  }

  return (
    <div>
      <PublicNav tournament={tournament} ageGroups={siblings} activeAgeGroupId={ageGroupId} showRegister={false} showPlayoff={ag?.format === 'group_knockout' || ag?.format === 'knockout'} />
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 4vw, 2rem)', margin: '0 0 1.5rem' }}>
          {tournament.name} — {ag.name}
        </h1>

        {teams.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('team.noTeamsPublic')}</p>
        ) : (
          <>
            {confirmed.length > 0 && (
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                  {t('team.statusConfirmed')} · {confirmed.length}
                </h2>
                {confirmed.map((team, i) => <TeamCard key={team.id} team={team} index={i} />)}
              </section>
            )}
            {pending.length > 0 && (
              <section>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                  {t('team.statusPending')} · {pending.length}
                </h2>
                {pending.map((team, i) => <TeamCard key={team.id} team={team} index={i} />)}
              </section>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
