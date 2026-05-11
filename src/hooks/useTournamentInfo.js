import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useTournamentInfo
 *
 * Resolves a tournament by slug, then fetches its info page row.
 * Returns null for `info` when no row exists — the UI shows an empty state,
 * not an error.
 *
 * @param {string} tournamentSlug  Public URL slug of the tournament
 * @returns {{ tournament: object|null, info: object|null, loading: boolean, error: object|null }}
 */
export function useTournamentInfo(tournamentSlug) {
  const [tournament, setTournament] = useState(null)
  const [info,       setInfo]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    if (!tournamentSlug) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data: tournamentData, error: tErr } = await supabase
        .from('tournaments')
        .select('id, name, slug, logo_path, logo_url')
        .eq('slug', tournamentSlug)
        .single()

      if (tErr) {
        if (!cancelled) { setError(tErr); setLoading(false) }
        return
      }

      if (!cancelled) setTournament(tournamentData)

      const { data: infoData, error: iErr } = await supabase
        .from('tournament_info')
        .select('content_md, contact_email, contact_phone, updated_at')
        .eq('tournament_id', tournamentData.id)
        .maybeSingle()

      if (iErr) {
        if (!cancelled) { setError(iErr); setLoading(false) }
        return
      }

      if (!cancelled) {
        setInfo(infoData)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [tournamentSlug])

  return { tournament, info, loading, error }
}
