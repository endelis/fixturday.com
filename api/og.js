import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const SUPABASE_URL = 'https://bvxfadleksghrqzwgiod.supabase.co'

const SPORT_LABELS = {
  football: 'Football',
  beach_volleyball: 'Beach Volleyball',
  catch_serve: "Catch'n Serve",
  rugby: 'Rugby',
}

async function loadFont() {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } }
    ).then(r => r.text())
    const url = css.match(/src: url\(([^)]+)\) format\('woff2'\)/)?.[1]
    if (!url) return null
    return fetch(url).then(r => r.arrayBuffer())
  } catch {
    return null
  }
}

function dbFetch(path, anon) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  }).then(r => r.json())
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') ?? ''
    const agId  = searchParams.get('ag')   ?? ''
    const type  = searchParams.get('type') ?? 'overview'
    const anon  = process.env.VITE_SUPABASE_ANON_KEY ?? ''

    const [tournaments, fontData] = await Promise.all([
      dbFetch(`tournaments?slug=eq.${encodeURIComponent(slug)}&select=id,name,sport,location,start_date,end_date&limit=1`, anon),
      loadFont(),
    ])

    const tour = tournaments?.[0]
    const fonts = fontData ? [{ name: 'Barlow Condensed', data: fontData, weight: 700, style: 'normal' }] : []
    const ff    = fontData ? 'Barlow Condensed' : 'system-ui'

    if (!tour) return img(fallbackEl(ff), fonts)

    const sport      = tour.sport ?? 'football'
    const sportLabel = SPORT_LABELS[sport] ?? sport
    const name       = tour.name ?? ''
    const location   = tour.location ?? ''
    const fmt = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
    const start = fmt(tour.start_date)
    const end   = fmt(tour.end_date)
    const dateStr = start && end && start !== end ? `${start} – ${end}` : (start || end || '')

    // ── Standings variant ────────────────────────────────────────────────────
    if (type === 'standings' && agId) {
      try {
        const stages = await dbFetch(`stages?age_group_id=eq.${encodeURIComponent(agId)}&select=id`, anon)
        const stageIds = Array.isArray(stages) ? stages.map(s => s.id) : []

        let top3 = []
        if (stageIds.length > 0) {
          const [fixtures, teams] = await Promise.all([
            dbFetch(`fixtures?stage_id=in.(${stageIds.join(',')})&status=eq.completed&select=id,home_team_id,away_team_id,group_label&limit=500`, anon),
            dbFetch(`teams?age_group_id=eq.${encodeURIComponent(agId)}&status=eq.confirmed&select=id,name`, anon),
          ])
          const groupFx = Array.isArray(fixtures) ? fixtures.filter(f => f.group_label) : []
          const fxIds   = groupFx.map(f => f.id)

          if (fxIds.length > 0) {
            const results = await dbFetch(`fixture_results?fixture_id=in.(${fxIds.join(',')})&select=fixture_id,home_goals,away_goals`, anon)
            const wins = {}
            for (const r of (Array.isArray(results) ? results : [])) {
              const fx = groupFx.find(f => f.id === r.fixture_id)
              if (!fx) continue
              const h = Number(r.home_goals) || 0
              const a = Number(r.away_goals) || 0
              if (h > a) wins[fx.home_team_id] = (wins[fx.home_team_id] ?? 0) + 1
              else if (a > h) wins[fx.away_team_id] = (wins[fx.away_team_id] ?? 0) + 1
            }
            top3 = [...(Array.isArray(teams) ? teams : [])]
              .sort((a, b) => (wins[b.id] ?? 0) - (wins[a.id] ?? 0))
              .slice(0, 3)
          }
        }

        return img(standingsEl({ name, sportLabel, dateStr, location, top3, ff }), fonts)
      } catch {
        return img(overviewEl({ name, sportLabel, dateStr, location, teamCount: 0, ff }), fonts)
      }
    }

    // ── Schedule variant ─────────────────────────────────────────────────────
    if (type === 'schedule' && agId) {
      try {
        const stages = await dbFetch(`stages?age_group_id=eq.${encodeURIComponent(agId)}&select=id`, anon)
        const stageIds = Array.isArray(stages) ? stages.map(s => s.id) : []

        let match = null
        if (stageIds.length > 0) {
          const fixtures = await dbFetch(
            `fixtures?stage_id=in.(${stageIds.join(',')})&status=neq.completed&home_team_id=not.is.null&away_team_id=not.is.null&order=kickoff_time.asc.nullslast&select=id,home_team_id,away_team_id,kickoff_time&limit=1`,
            anon
          )
          const next = Array.isArray(fixtures) ? fixtures[0] : null
          if (next) {
            const teamData = await dbFetch(`teams?id=in.(${next.home_team_id},${next.away_team_id})&select=id,name`, anon)
            const tm = Object.fromEntries((Array.isArray(teamData) ? teamData : []).map(t => [t.id, t.name]))
            const time = next.kickoff_time
              ? new Date(next.kickoff_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              : ''
            match = { home: tm[next.home_team_id] ?? '', away: tm[next.away_team_id] ?? '', time }
          }
        }

        return img(scheduleEl({ name, sportLabel, dateStr, location, match, ff }), fonts)
      } catch {
        return img(overviewEl({ name, sportLabel, dateStr, location, teamCount: 0, ff }), fonts)
      }
    }

    // ── Overview (default) ───────────────────────────────────────────────────
    let teamCount = 0
    if (agId) {
      const teams = await dbFetch(`teams?age_group_id=eq.${encodeURIComponent(agId)}&status=eq.confirmed&select=id`, anon)
      teamCount = Array.isArray(teams) ? teams.length : 0
    }
    return img(overviewEl({ name, sportLabel, dateStr, location, teamCount, ff }), fonts)
  } catch {
    return new Response('Error generating image', { status: 500 })
  }
}

// ── Image wrapper ────────────────────────────────────────────────────────────

function img(el, fonts) {
  return new ImageResponse(el, {
    width: 1200,
    height: 630,
    fonts,
    headers: { 'cache-control': 'public, max-age=3600, s-maxage=3600' },
  })
}

// ── Shared shell ─────────────────────────────────────────────────────────────

function shell({ sportLabel, name, dateStr, location, ff, children }) {
  const nameLen = name.length
  const nameFontSize = nameLen > 40 ? 52 : nameLen > 28 ? 64 : nameLen > 18 ? 76 : 88

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0a0f1e', fontFamily: ff }}>
      <div style={{ width: 10, background: '#f0a500', flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px 64px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 16, color: '#f0a500', fontWeight: 700, letterSpacing: 5 }}>FIXTURDAY</span>
          {sportLabel && (
            <span style={{ fontSize: 12, color: '#6b7a99', border: '1px solid #1e2d4a', borderRadius: 6, padding: '4px 12px', letterSpacing: 2 }}>
              {sportLabel.toUpperCase()}
            </span>
          )}
        </div>

        {/* Tournament name */}
        <div style={{ fontSize: nameFontSize, fontWeight: 700, color: '#ffffff', lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: -1, marginBottom: 20 }}>
          {name}
        </div>

        {/* Date + location */}
        {(dateStr || location) && (
          <div style={{ display: 'flex', gap: 16, color: '#5a6a85', fontSize: 22, alignItems: 'center', marginBottom: 24 }}>
            {dateStr && <span>{dateStr}</span>}
            {dateStr && location && <span style={{ color: '#1e2d4a' }}>·</span>}
            {location && <span>{location}</span>}
          </div>
        )}

        {/* Page-specific content */}
        {children}

        {/* Footer */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 14, color: '#1e2d4a', fontWeight: 700, letterSpacing: 2 }}>fixturday.com</span>
        </div>

      </div>
    </div>
  )
}

// ── Overview element ─────────────────────────────────────────────────────────

function overviewEl({ name, sportLabel, dateStr, location, teamCount, ff }) {
  return shell({ name, sportLabel, dateStr, location, ff, children: teamCount > 0 ? (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 18, color: '#3a4864' }}>{teamCount} teams registered</span>
    </div>
  ) : null })
}

// ── Standings element ────────────────────────────────────────────────────────

function standingsEl({ name, sportLabel, dateStr, location, top3, ff }) {
  const rankColors  = ['#f0a500', '#94a3b8', '#cd7f32']
  const rankLabels  = ['1', '2', '3']

  return shell({ name, sportLabel, dateStr, location, ff, children: top3.length > 0 ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 11, color: '#f0a500', letterSpacing: 4, marginBottom: 4 }}>TOP STANDINGS</span>
      {top3.map((team, i) => (
        <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 16, flexShrink: 0,
            background: rankColors[i] + '18',
            border: `1.5px solid ${rankColors[i]}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: rankColors[i],
          }}>
            {rankLabels[i]}
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#e0e0e0' }}>{team.name}</span>
        </div>
      ))}
    </div>
  ) : null })
}

// ── Schedule element ─────────────────────────────────────────────────────────

function scheduleEl({ name, sportLabel, dateStr, location, match, ff }) {
  return shell({ name, sportLabel, dateStr, location, ff, children: match ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 11, color: '#f0a500', letterSpacing: 4 }}>NEXT MATCH</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: '#ffffff' }}>{match.home}</span>
        <span style={{ fontSize: 22, color: '#2a3550', fontWeight: 700 }}>VS</span>
        <span style={{ fontSize: 36, fontWeight: 700, color: '#ffffff' }}>{match.away}</span>
      </div>
      {match.time && (
        <span style={{ fontSize: 20, color: '#5a6a85' }}>{match.time}</span>
      )}
    </div>
  ) : null })
}

// ── Fallback ─────────────────────────────────────────────────────────────────

function fallbackEl(ff) {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0a0f1e', alignItems: 'center', justifyContent: 'center', fontFamily: ff }}>
      <span style={{ fontSize: 32, color: '#f0a500', fontWeight: 700, letterSpacing: 5 }}>FIXTURDAY</span>
    </div>
  )
}
