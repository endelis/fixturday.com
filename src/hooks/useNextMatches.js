import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useNextMatches
 *
 * Fetches the next N upcoming scheduled fixtures for a tournament and
 * subscribes to Realtime so the widget stays current without a page refresh.
 * Returns null for `error` and an empty array for `matches` when no fixtures
 * exist — callers should render nothing rather than an empty state.
 *
 * @param {string} tournamentId  UUID of the tournament
 * @param {number} [limit=10]   Max rows to return
 * @returns {{ matches: Array, loading: boolean, error: object|null }}
 */
export function useNextMatches(tournamentId, limit = 10) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!tournamentId) return
    let cancelled = false

    async function load() {
      // 1. Age group IDs for this tournament
      const { data: ags, error: agsErr } = await supabase
        .from('age_groups')
        .select('id')
        .eq('tournament_id', tournamentId)

      if (agsErr) {
        if (!cancelled) { setError(agsErr); setLoading(false) }
        return
      }

      const agIds = (ags ?? []).map(a => a.id)
      if (agIds.length === 0) {
        if (!cancelled) { setMatches([]); setLoading(false) }
        return
      }

      // 2. Stage IDs for those age groups
      const { data: stagesData, error: stErr } = await supabase
        .from('stages')
        .select('id')
        .in('age_group_id', agIds)

      if (stErr) {
        if (!cancelled) { setError(stErr); setLoading(false) }
        return
      }

      const stageIds = (stagesData ?? []).map(s => s.id)
      if (stageIds.length === 0) {
        if (!cancelled) { setMatches([]); setLoading(false) }
        return
      }

      // 3. Upcoming scheduled fixtures
      const now = new Date().toISOString()
      const { data, error: fxErr } = await supabase
        .from('fixtures')
        .select(`
          id, kickoff_time, status,
          home_team:teams!home_team_id(id, name, logo_path),
          away_team:teams!away_team_id(id, name, logo_path),
          stage:stages(age_group:age_groups(id, name)),
          pitch:pitches(name, venues(name))
        `)
        .in('stage_id', stageIds)
        .eq('status', 'scheduled')
        .gte('kickoff_time', now)
        .order('kickoff_time', { ascending: true })
        .limit(limit)

      if (fxErr) {
        if (!cancelled) { setError(fxErr); setLoading(false) }
        return
      }

      if (!cancelled) {
        setMatches(data ?? [])
        setError(null)
        setLoading(false)
      }
    }

    load()

    const channel = supabase
      .channel(`next-matches-${tournamentId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fixtures' }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fixtures' }, () => load())
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [tournamentId, limit])

  return { matches, loading, error }
}
