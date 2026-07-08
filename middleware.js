const SUPABASE_URL = 'https://bvxfadleksghrqzwgiod.supabase.co'

const BOTS = /whatsapp|telegram|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|googlebot|bingbot|duckduckbot|yahoo|applebot|pinterest|iframely|vkshare|w3c_validator/i

export const config = {
  matcher: ['/t/:path*'],
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') ?? ''
  if (!BOTS.test(ua)) return  // humans get the SPA

  const url = new URL(request.url)
  const slug = url.pathname.split('/')[2]  // /t/{slug}/...
  if (!slug) return

  const anon = process.env.VITE_SUPABASE_ANON_KEY ?? ''
  let tournamentName = null
  try {
    const rows = await fetch(
      `${SUPABASE_URL}/rest/v1/tournaments?slug=eq.${encodeURIComponent(slug)}&select=name&limit=1`,
      { headers: { apikey: anon, Authorization: `Bearer ${anon}` } }
    ).then(r => r.json())
    tournamentName = rows?.[0]?.name ?? null
  } catch { /* pass through on error */ }

  if (!tournamentName) return

  const title = `${tournamentName} — Fixturday`
  const desc = `Live standings, schedule, and results for ${tournamentName}. Follow the tournament on Fixturday.`
  const canonical = `https://www.fixturday.com/t/${slug}`
  const ogImg = `https://www.fixturday.com/api/og?slug=${encodeURIComponent(slug)}`

  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Fixturday">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ogImg}">
<link rel="canonical" href="${canonical}">
</head>
<body>
<p><a href="${canonical}">${esc(title)}</a></p>
</body>
</html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }
  )
}
