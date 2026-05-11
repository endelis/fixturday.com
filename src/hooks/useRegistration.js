import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useRegistration
 *
 * Resolves a tournament by slug and its age groups for the public
 * registration form. Provides a submit() function that inserts into
 * team_registrations with status='pending'.
 *
 * @param {string} slug  Tournament slug from the URL
 * @returns {{ tournament, ageGroups, submit, loading, error }}
 */
export function useRegistration(slug) {
  const [tournament, setTournament] = useState(null)
  const [ageGroups,  setAgeGroups]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      const { data: tourney, error: tErr } = await supabase
        .from('tournaments')
        .select('id, name, slug')
        .eq('slug', slug)
        .single()

      if (tErr) {
        if (!cancelled) { setError(tErr); setLoading(false) }
        return
      }

      const { data: groups, error: gErr } = await supabase
        .from('age_groups')
        .select('id, name')
        .eq('tournament_id', tourney.id)
        .order('name')

      if (gErr) {
        if (!cancelled) { setError(gErr); setLoading(false) }
        return
      }

      if (!cancelled) {
        setTournament(tourney)
        setAgeGroups(groups ?? [])
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [slug])

  async function submit(formData) {
    const playerRoster = (formData.player_roster ?? '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)

    const { error: insErr } = await supabase
      .from('team_registrations')
      .insert({
        tournament_id: tournament.id,
        age_group_id:  formData.age_group_id,
        team_name:     formData.team_name,
        manager_name:  formData.manager_name,
        manager_email: formData.manager_email,
        manager_phone: formData.manager_phone || null,
        player_roster: playerRoster,
        status:        'pending',
        honeypot:      formData.homepage_url ?? '',
      })

    if (insErr) throw insErr
  }

  return { tournament, ageGroups, submit, loading, error }
}
