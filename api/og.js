import satori from 'satori'
import sharp from 'sharp'

const SUPABASE_URL = 'https://bvxfadleksghrqzwgiod.supabase.co'
const STATIC_FALLBACK = 'https://www.fixturday.com/og-image.png'

// Cached across warm Lambda invocations
let _font = null

async function loadFont() {
  if (_font) return _font
  try {
    // Request old CSS API — returns TTF format, which satori accepts
    const css = await fetch(
      'https://fonts.googleapis.com/css?family=Barlow+Condensed:700',
      { headers: { 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0)' } }
    ).then(r => r.text())
    const url = css.match(/url\(([^)]+)\)/)?.[1]
    if (url) _font = await fetch(url).then(r => r.arrayBuffer())
  } catch { /* fall through — missing font triggers fallback */ }
  return _font
}

function card(name) {
  const fs = name.length > 50 ? 54 : name.length > 35 ? 66 : 80
  const h = (style, children) => ({ type: 'div', props: { style, children } })

  return h(
    {
      display: 'flex', flexDirection: 'column',
      width: '1200px', height: '630px',
      background: '#1a1a2e',
    },
    [
      // Top amber bar
      h({ width: '100%', height: '6px', background: '#f0a500', flexShrink: 0 }, null),

      // Main content
      h(
        {
          display: 'flex', flexDirection: 'column', flex: 1,
          padding: '52px 72px 52px',
        },
        [
          // Header row
          h({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
            // Wordmark
            h({
              fontSize: '26px', fontWeight: 700, color: '#f0a500',
              letterSpacing: '0.1em', fontFamily: '"Barlow Condensed"',
            }, 'FIXTURDAY'),
            // Live badge
            h({
              display: 'flex', alignItems: 'center', gap: '10px',
              border: '1px solid rgba(240,165,0,0.4)', borderRadius: '6px',
              padding: '7px 18px', color: '#f0a500',
              fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em',
              fontFamily: '"Barlow Condensed"',
            }, [
              h({ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71', flexShrink: 0 }, null),
              'LIVE TOURNAMENT',
            ]),
          ]),

          // Spacer
          h({ flex: 1, minHeight: '20px' }, null),

          // Tournament name
          h({
            fontSize: `${fs}px`, fontWeight: 700, color: '#ffffff',
            lineHeight: 1.1, letterSpacing: '0.02em',
            textTransform: 'uppercase', fontFamily: '"Barlow Condensed"',
            maxWidth: '1040px', overflow: 'hidden',
          }, name),

          // Gap
          h({ height: '28px', flexShrink: 0 }, null),

          // Footer
          h({
            fontSize: '20px', color: '#8892a4',
            letterSpacing: '0.04em', fontFamily: '"Barlow Condensed"',
          }, 'fixturday.com  ·  Live results & standings'),
        ]
      ),

      // Bottom amber bar
      h({ width: '100%', height: '4px', background: '#f0a500', flexShrink: 0 }, null),
    ]
  )
}

export default async function handler(req, res) {
  const slug = req.query?.slug ?? ''
  const anon = process.env.VITE_SUPABASE_ANON_KEY ?? ''

  // Fetch tournament name
  let name = ''
  try {
    const rows = await fetch(
      `${SUPABASE_URL}/rest/v1/tournaments?slug=eq.${encodeURIComponent(slug)}&select=name&limit=1`,
      { headers: { apikey: anon, Authorization: `Bearer ${anon}` } }
    ).then(r => r.json())
    name = rows?.[0]?.name ?? ''
  } catch { /* fall through */ }

  if (!name) {
    res.status(302).setHeader('Location', STATIC_FALLBACK).end()
    return
  }

  const fontData = await loadFont()
  if (!fontData) {
    res.status(302).setHeader('Location', STATIC_FALLBACK).end()
    return
  }

  try {
    const svg = await satori(card(name), {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Barlow Condensed', data: fontData, weight: 700, style: 'normal' }],
    })

    const png = await sharp(Buffer.from(svg)).png().toBuffer()

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
    res.end(png)
  } catch {
    res.status(302).setHeader('Location', STATIC_FALLBACK).end()
  }
}
