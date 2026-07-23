import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify the caller is a real authenticated user
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const { tournament_id, email } = await req.json()
    const normalizedEmail = email.trim().toLowerCase()

    // Verify caller owns this tournament
    const { data: tournament } = await supabaseAdmin
      .from('tournaments')
      .select('id, name, owner_id')
      .eq('id', tournament_id)
      .single()

    if (!tournament || tournament.owner_id !== user.id) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders })
    }

    // Check if this email already has a Fixturday account (so we can set user_id immediately
    // rather than waiting for the auto-claim trigger)
    const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const existingUser = usersPage?.users?.find(u => u.email?.toLowerCase() === normalizedEmail)

    // Insert the member record — service role bypasses RLS here
    const { data: member, error: memberErr } = await supabaseAdmin
      .from('tournament_members')
      .insert({
        tournament_id,
        invited_email: normalizedEmail,
        user_id: existingUser?.id ?? null,
      })
      .select()
      .single()

    if (memberErr) {
      if (memberErr.code === '23505') {
        return new Response(JSON.stringify({ error: 'already_invited' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw memberErr
    }

    // Send email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      const isRegistered = !!existingUser

      const subject = isRegistered
        ? `You've been added to "${tournament.name}" on Fixturday`
        : `You're invited to collaborate on "${tournament.name}" — Fixturday`

      const html = isRegistered
        ? `
          <p>Hi,</p>
          <p>You've been added as a co-editor on <strong>${tournament.name}</strong> on Fixturday.</p>
          <p><a href="https://fixturday.com/admin/dashboard">Open your dashboard</a> to access the tournament right away.</p>
          <p style="color:#888;font-size:12px">Fixturday — Tournament management platform</p>
        `
        : `
          <p>Hi,</p>
          <p>You've been invited to co-edit <strong>${tournament.name}</strong> on Fixturday.</p>
          <p>
            <a href="https://fixturday.com/admin">Create a free account</a> using this email address
            (<strong>${normalizedEmail}</strong>) and the tournament will appear in your dashboard automatically.
          </p>
          <p style="color:#888;font-size:12px">Fixturday — Tournament management platform</p>
        `

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Fixturday <noreply@fixturday.com>',
          to: normalizedEmail,
          subject,
          html,
        }),
      })
    }

    return new Response(JSON.stringify({ member }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
