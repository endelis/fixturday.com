import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Returns the public URL for a logo, preferring the Storage-backed path
 * over the legacy logo_url text field.
 *
 * @param {string|null} logoPath  Supabase Storage object path
 * @param {string|null} logoUrl   Legacy free-text URL
 * @param {string}      bucket    Storage bucket name
 * @returns {string|null}
 */
export function getLogoUrl(logoPath, logoUrl, bucket) {
  if (logoPath) {
    return supabase.storage.from(bucket).getPublicUrl(logoPath).data.publicUrl
  }
  return logoUrl ?? null
}

/**
 * useMatch
 *
 * Fetches a single fixture by id with all related data needed for the
 * Match detail page, and subscribes to Realtime updates on fixture_results.
 *
 * @param {string} matchId  UUID of the fixture row
 * @returns {{ match: object|null, loading: boolean, error: object|null }}
 */
export function useMatch(matchId) {
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMatch = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('fixtures')
      .select(`
        id,
        kickoff_time,
        status,
        group_label,
        round_name,
        stages(
          id,
          type,
          age_groups(
            id,
            name,
            tournaments(id, name, slug, logo_path, logo_url)
          )
        ),
        home_team:teams!home_team_id(id, name, logo_path, country_code),
        away_team:teams!away_team_id(id, name, logo_path, country_code),
        pitch:pitches(id, name, venues(id, name, address)),
        fixture_results(home_goals, away_goals)
      `)
      .eq('id', matchId)
      .single()

    if (err) {
      setError(err)
      setLoading(false)
      return
    }
    setMatch(data)
    setLoading(false)
  }, [matchId])

  useEffect(() => {
    if (!matchId) return
    fetchMatch()

    const channel = supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fixture_results',
        filter: `fixture_id=eq.${matchId}`,
      }, fetchMatch)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [matchId, fetchMatch])

  return { match, loading, error }
}
