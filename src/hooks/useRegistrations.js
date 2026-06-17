import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useRegistrations
 *
 * Fetches all team_registrations for a tournament and exposes approve/reject
 * actions. approve() creates the team row in confirmed status. Local state is
 * updated optimistically after each action so the UI reflects changes without
 * a full refetch.
 *
 * @param {string} tournamentId  UUID of the tournament
 * @returns {{ registrations, approve, reject, loading, error }}
 */
export function useRegistrations(tournamentId) {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!tournamentId) return
    let cancelled = false

    async function load() {
      const { data, error: fetchErr } = await supabase
        .from('team_registrations')
        .select(`
          id, tournament_id, age_group_id,
          team_name, manager_name, manager_email, manager_phone,
          status, rejection_reason, created_at, reviewed_at,
          age_group:age_groups(id, name)
        `)
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false })

      if (fetchErr) {
        if (!cancelled) { setError(fetchErr); setLoading(false) }
        return
      }
      if (!cancelled) { setRegistrations(data ?? []); setLoading(false) }
    }

    load()
    return () => { cancelled = true }
  }, [tournamentId])

  async function approve(id) {
    const { data: { user } } = await supabase.auth.getUser()
    const now = new Date().toISOString()

    // Fetch registration + age group limit before approving
    const { data: reg, error: regErr } = await supabase
      .from('team_registrations')
      .select('team_name, age_group_id, manager_name, manager_email, manager_phone, age_group:age_groups(max_teams)')
      .eq('id', id)
      .single()

    if (regErr) throw regErr

    // Enforce max_teams: count confirmed teams and block if at limit
    const maxTeams = reg.age_group?.max_teams
    if (maxTeams) {
      const { count, error: cntErr } = await supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('age_group_id', reg.age_group_id)
        .eq('status', 'confirmed')
      if (!cntErr && count >= maxTeams) throw new Error('MAX_TEAMS_REACHED')
    }

    const { error: updErr } = await supabase
      .from('team_registrations')
      .update({ status: 'approved', reviewed_at: now, reviewed_by: user?.id })
      .eq('id', id)

    if (updErr) throw updErr

    const { error: teamErr } = await supabase
      .from('teams')
      .insert({
        name:          reg.team_name,
        age_group_id:  reg.age_group_id,
        contact_name:  reg.manager_name,
        contact_email: reg.manager_email,
        contact_phone: reg.manager_phone || null,
        status:        'confirmed',
      })

    if (teamErr) throw teamErr

    setRegistrations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'approved', reviewed_at: now } : r)
    )
  }

  async function reject(id, reason) {
    const { data: { user } } = await supabase.auth.getUser()
    const now = new Date().toISOString()

    const { error: updErr } = await supabase
      .from('team_registrations')
      .update({
        status:           'rejected',
        rejection_reason: reason || null,
        reviewed_at:      now,
        reviewed_by:      user?.id,
      })
      .eq('id', id)

    if (updErr) throw updErr

    setRegistrations(prev =>
      prev.map(r => r.id === id
        ? { ...r, status: 'rejected', rejection_reason: reason, reviewed_at: now }
        : r
      )
    )
  }

  return { registrations, approve, reject, loading, error }
}
