import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import PublicNav from '../../components/PublicNav'

// Redirect /t/:slug → /t/:slug/:firstAgeGroupId (Standings page)
// The Standings page is the canonical public tournament view.
export default function TournamentDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function doRedirect() {
      const { data: tourney } = await supabase
        .from('tournaments')
        .select('id')
        .eq('slug', slug)
        .single()
      if (!tourney) { setNotFound(true); return }

      const { data: ags } = await supabase
        .from('age_groups')
        .select('id')
        .eq('tournament_id', tourney.id)
        .order('name')
        .limit(1)

      if (ags?.length) {
        navigate(`/t/${slug}/${ags[0].id}`, { replace: true })
      } else {
        setNotFound(true)
      }
    }
    doRedirect()
  }, [slug, navigate])

  if (notFound) {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
        <PublicNav />
        <div className="loading">{t('register.notFound')}</div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <PublicNav />
      <div className="loading">{t('common.loading')}</div>
    </div>
  )
}
