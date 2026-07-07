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
      'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&display=swap',
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
    const agId = searchParams.get('ag') ?? ''
    const anon = process.env.VITE_SUPABASE_ANON_KEY ?? ''

    const [tournaments, fontData] = await Promise.all([
      dbFetch(`tournaments?slug=eq.${encodeURIComponent(slug)}&select=id,name,sport,location,start_date,end_date&limit=1`, anon),
      loadFont(),
    ])

    const t = tournaments?.[0]
    const fonts = fontData
      ? [{ name: 'Barlow Condensed', data: fontData, weight: 700, style: 'normal' }]
      : []
    const ff = fontData ? 'Barlow Condensed' : 'system-ui'

    if (!t) return branded('Tournament', null, null, null, 0, ff, fonts)

    let teamCount = 0
    if (agId) {
      const teams = await dbFetch(
        `teams?age_group_id=eq.${encodeURIComponent(agId)}&status=eq.confirmed&select=id`,
        anon
      )
      teamCount = Array.isArray(teams) ? teams.length : 0
    }

    const sport = t.sport ?? 'football'
    const sportLabel = SPORT_LABELS[sport] ?? sport
    const fmt = d => d
      ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : null
    const start = fmt(t.start_date)
    const end = fmt(t.end_date)
    const dateStr = start && end && start !== end ? `${start} – ${end}` : (start || end || null)

    return branded(t.name, sportLabel, dateStr, t.location, teamCount, ff, fonts)
  } catch (e) {
    return new Response('Error generating image', { status: 500 })
  }
}

function branded(name, sportLabel, dateStr, location, teamCount, ff, fonts) {
  const nameLen = (name ?? '').length
  const nameFontSize = nameLen > 40 ? 52 : nameLen > 28 ? 66 : nameLen > 18 ? 78 : 90

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#0a0f1e',
        fontFamily: ff,
      }}
    >
      {/* Amber left stripe */}
      <div style={{ width: 10, background: '#f0a500', flexShrink: 0 }} />

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '52px 68px',
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 42,
          }}
        >
          <div
            style={{
              fontSize: 17,
              color: '#f0a500',
              fontWeight: 700,
              letterSpacing: 5,
            }}
          >
            FIXTURDAY
          </div>
          {sportLabel && (
            <div
              style={{
                fontSize: 13,
                color: '#8892a4',
                border: '1px solid #1e2d4a',
                borderRadius: 6,
                padding: '5px 14px',
                letterSpacing: 2,
              }}
            >
              {sportLabel.toUpperCase()}
            </div>
          )}
        </div>

        {/* Tournament name */}
        <div
          style={{
            fontSize: nameFontSize,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.05,
            marginBottom: 28,
            textTransform: 'uppercase',
            letterSpacing: -1,
          }}
        >
          {name}
        </div>

        {/* Date + location */}
        {(dateStr || location) && (
          <div
            style={{
              display: 'flex',
              gap: 18,
              color: '#6b7a99',
              fontSize: 24,
              alignItems: 'center',
              marginBottom: 0,
            }}
          >
            {dateStr && <span>{dateStr}</span>}
            {dateStr && location && (
              <span style={{ color: '#1e2d4a' }}>·</span>
            )}
            {location && <span>{location}</span>}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              fontSize: 19,
              color: '#3a4864',
              letterSpacing: 0.5,
            }}
          >
            {teamCount > 0 ? `${teamCount} teams` : ''}
          </div>
          <div
            style={{
              fontSize: 15,
              color: '#253348',
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            fixturday.com
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts,
      headers: { 'cache-control': 'public, max-age=3600, s-maxage=3600' },
    }
  )
}
