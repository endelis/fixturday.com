import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import SingleEliminationBracket from '../../components/SingleEliminationBracket'
import { useSEO } from '../../hooks/useSEO'

const KO_FORMATS = ['group_knockout', 'knockout']

export default function Playoff() {
  const { slug, ageGroup: ageGroupId } = useParams()
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const seoTitle = data?.ag ? `${data.ag.tournaments.name} — ${data.ag.name} Playoff` : 'Playoff Bracket'
  useSEO({ title: seoTitle, path: `/t/${slug}/${ageGroupId}/playoff` })

  useEffect(() => {
    async function load() {
      const { data: ag, error: agErr } = await supabase
        .from('age_groups')
        .select('*, tournaments(id, name, slug, sport, start_date, end_date)')
        .eq('id', ageGroupId)
        .single()
      if (agErr || !ag) { setLoading(false); return }

      // Only fetch fixtures for formats that actually have a playoff bracket
      if (!KO_FORMATS.includes(ag.format)) {
        setData({ ag, siblings: [], knockoutFixtures: [], results: [] })
        setLoading(false)
        return
      }

      const [{ data: siblings }, { data: fixtures, error: fxErr }] = await Promise.all([
        supabase.from('age_groups').select('id, name').eq('tournament_id', ag.tournaments.id).order('name'),
        supabase.from('fixtures')
          .select('id, round, round_name, home_team_id, away_team_id, status, group_label, home_placeholder, away_placeholder, home_team:teams!home_team_id(id,name), away_team:teams!away_team_id(id,name), stages!inner(age_group_id)')
          .eq('stages.age_group_id', ageGroupId)
          .is('group_label', null),
      ])

      if (fxErr || !fixtures?.length) {
        setData({ ag, siblings: siblings ?? [], knockoutFixtures: [], results: [] })
        setLoading(false)
        return
      }

      const { data: results } = await supabase
        .from('fixture_results').select('*').in('fixture_id', fixtures.map(f => f.id))

      setData({
        ag,
        siblings: siblings ?? [],
        knockoutFixtures: fixtures,
        results: results ?? [],
      })
      setLoading(false)
    }
    load()
  }, [ageGroupId])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (!data?.ag) return <Navigate to={`/t/${slug}`} replace />

  const { ag, siblings, knockoutFixtures, results } = data
  const tournament = ag.tournaments

  // Redirect round-robin divisions to standings (no bracket for them)
  if (!KO_FORMATS.includes(ag.format)) return <Navigate to={`/t/${slug}/${ageGroupId}`} replace />

  // Hide register button if admin closed registration or any KO game has been played
  const showRegister = !!ag.registration_open && results.length === 0

  return (
    <div>
      <PublicNav tournament={tournament} ageGroups={siblings} activeAgeGroupId={ageGroupId} showPlayoff showRegister={showRegister} />
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 4vw, 2rem)', margin: '0 0 0.25rem' }}>
          {tournament.name} — {ag.name}
        </h1>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-accent)', margin: '0 0 1.5rem' }}>
          {t('standings.knockoutPhase')}
        </h2>

        {knockoutFixtures.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</p>
        ) : (
          <SingleEliminationBracket knockoutFixtures={knockoutFixtures} results={results} />
        )}
      </div>
      <Footer />
    </div>
  )
}
