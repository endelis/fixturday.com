import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
export { getLogoUrl } from './useMatch'

function computeRecord(fixtures, teamId) {
  const rec = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
  for (const f of fixtures) {
    if (f.status !== 'completed') continue
    const result = f.fixture_results?.[0]
    if (!result) continue
    const isHome = f.home_team_id === teamId
    const myGoals  = isHome ? (result.home_goals ?? 0) : (result.away_goals ?? 0)
    const oppGoals = isHome ? (result.away_goals ?? 0) : (result.home_goals ?? 0)
    rec.played++
    rec.gf += myGoals
    rec.ga += oppGoals
    if (myGoals > oppGoals)      { rec.won++;   rec.points += 3 }
    else if (myGoals < oppGoals) { rec.lost++ }
    else                         { rec.drawn++; rec.points++ }
  }
  rec.gd = rec.gf - rec.ga
  return rec
}

/**
 * useTeamProfile
 *
 * Fetches team metadata, tournament context, and all fixtures involving
 * the team within its age group. Computes a mini W/D/L record inline.
 *
 * @param {string} slug    Tournament slug (used for URL validation context)
 * @param {string} teamId  UUID of the team row
 * @returns {{ team, tournament, fixtures, record, loading, error }}
 */
export function useTeamProfile(slug, teamId) {
  const [team,       setTeam]       = useState(null)
  const [tournament, setTournament] = useState(null)
  const [fixtures,   setFixtures]   = useState([])
  const [record,     setRecord]     = useState(
    { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
  )
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!teamId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      // 1. Team — joined to age_group and tournament for hero / breadcrumb
      const { data: teamData, error: teamErr } = await supabase
        .from('teams')
        .select(`
          id, name, logo_path, country_code, manager_name,
          age_groups(
            id, name,
            tournaments(id, name, slug, logo_path, logo_url)
          )
        `)
        .eq('id', teamId)
        .single()

      if (teamErr) {
        if (!cancelled) { setError(teamErr); setLoading(false) }
        return
      }

      const tournamentData = teamData.age_groups?.tournaments
      if (!cancelled) {
        setTeam(teamData)
        setTournament(tournamentData)
      }

      const ageGroupId = teamData.age_groups?.id
      if (!ageGroupId) {
        if (!cancelled) setLoading(false)
        return
      }

      // 2. Stage IDs for this age group
      const { data: stagesData, error: stagesErr } = await supabase
        .from('stages')
        .select('id')
        .eq('age_group_id', ageGroupId)

      if (stagesErr) {
        if (!cancelled) { setError(stagesErr); setLoading(false) }
        return
      }

      const stageIds = stagesData?.map(s => s.id) ?? []
      if (stageIds.length === 0) {
        if (!cancelled) setLoading(false)
        return
      }

      // 3. Fixtures in those stages where this team is home or away
      const { data: fixturesData, error: fixturesErr } = await supabase
        .from('fixtures')
        .select(`
          id, kickoff_time, status, home_team_id, away_team_id, group_label, round_name,
          home_team:teams!home_team_id(id, name, logo_path),
          away_team:teams!away_team_id(id, name, logo_path),
          pitch:pitches(name, venues(name)),
          fixture_results(home_goals, away_goals)
        `)
        .in('stage_id', stageIds)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('kickoff_time', { ascending: true })

      if (fixturesErr) {
        if (!cancelled) { setError(fixturesErr); setLoading(false) }
        return
      }

      const fx = fixturesData ?? []
      if (!cancelled) {
        setFixtures(fx)
        setRecord(computeRecord(fx, teamId))
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [slug, teamId])

  return { team, tournament, fixtures, record, loading, error }
}
