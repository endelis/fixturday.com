import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { formatTime, formatDate } from '../../utils/dateFormat'
import PublicNav from '../../components/PublicNav'

export default function TeamRoster() {
  const { slug, ageGroup: ageGroupId, teamId } = useParams()
  const { t } = useTranslation()
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [siblings, setSiblings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: td, error: tErr }, { data: p, error: pErr }, { data: fx, error: fxErr }] = await Promise.all([
        supabase.from('teams').select('id, name, club, age_groups(id, name, tournament_id, tournaments(id, name, slug))').eq('id', teamId).single(),
        supabase.from('team_players').select('id, name, number').eq('team_id', teamId).order('number'),
        supabase.from('fixtures')
          .select('id, round, kickoff_time, status, group_label, home_team_id, away_team_id, home_placeholder_label, away_placeholder_label, home_team:teams!home_team_id(id, name), away_team:teams!away_team_id(id, name), pitch:pitches(name, venues(name))')
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .order('kickoff_time', { ascending: true, nullsFirst: false }),
      ])
      if (tErr) { setLoading(false); return }
      setTeam(td)
      document.title = `${td.name} — Fixturday`
      setPlayers(pErr ? [] : (p ?? []))

      if (!fxErr && fx?.length) {
        const fixtureIds = fx.map(f => f.id)
        const { data: results } = await supabase
          .from('fixture_results').select('fixture_id, home_goals, away_goals').in('fixture_id', fixtureIds)
        const resultMap = Object.fromEntries((results ?? []).map(r => [r.fixture_id, r]))
        setFixtures(fx.map(f => ({ ...f, result: resultMap[f.id] ?? null })))
      }

      if (td?.age_groups?.tournaments?.id) {
        const { data: sibs, error: sibErr } = await supabase
          .from('age_groups').select('id, name')
          .eq('tournament_id', td.age_groups.tournaments.id).order('name')
        if (!sibErr) setSiblings(sibs ?? [])
      }
      setLoading(false)
    }
    load()
    return () => { document.title = 'Fixturday' }
  }, [teamId])

  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (!team) return <div className="loading">{t('team.notFound')}</div>

  const tournament = team.age_groups?.tournaments

  function teamName(teamId, name, placeholder) {
    if (teamId) return name ?? '?'
    if (placeholder) return <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{placeholder}</span>
    return '?'
  }

  return (
    <div>
    <PublicNav tournament={tournament} ageGroups={siblings} activeAgeGroupId={ageGroupId} />
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <p><Link to={`/t/${slug}/${ageGroupId}`} style={{ color: 'var(--color-accent)' }}>← {team.age_groups?.name} {t('standings.title')}</Link></p>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 5vw, 2rem)', margin: '0.5rem 0 0.25rem' }}>{team.name}</h1>
      {team.club && <p style={{ color: 'var(--color-text-muted)' }}>{team.club}</p>}

      {/* Games section */}
      {fixtures.length > 0 && (
        <>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>
            {t('nav.schedule')}
          </h2>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {fixtures.map(f => {
              const isHome = f.home_team_id === teamId
              const opponent = isHome
                ? teamName(f.away_team_id, f.away_team?.name, f.away_placeholder_label)
                : teamName(f.home_team_id, f.home_team?.name, f.home_placeholder_label)
              const score = f.result
                ? isHome
                  ? `${f.result.home_goals} : ${f.result.away_goals}`
                  : `${f.result.away_goals} : ${f.result.home_goals}`
                : null
              return (
                <div key={f.id} className="card" style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', flexShrink: 0, minWidth: '3.5rem', color: score ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                      {score ?? t('fixture.vs')}
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opponent}
                    </span>
                    {f.group_label && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                        {t('standings.group')} {f.group_label}
                      </span>
                    )}
                  </div>
                  {(f.kickoff_time || f.pitch) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>{f.kickoff_time ? `${formatDate(f.kickoff_time)} ${formatTime(f.kickoff_time)}` : ''}</span>
                      {f.pitch && <span>{f.pitch.venues?.name} — {f.pitch.name}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Players section */}
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>{t('team.players')}</h2>
      {players.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>{t('team.noRegistered')}</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>{t('team.colNumber')}</th><th>{t('team.colName')}</th></tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id}>
                <td>{p.number ?? '—'}</td>
                <td>{p.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    </div>
  )
}
