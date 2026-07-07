/**
 * Vercel Edge Middleware — injects tournament-specific og:image into the
 * SPA shell before social crawlers see it.
 *
 * Crawlers don't execute JS, so the useSEO hook's dynamic meta tags are
 * invisible to them. This middleware fetches index.html, replaces the
 * static og:image URL with a /api/og URL that renders a per-tournament
 * image, then returns the modified HTML. Browsers are unaffected.
 */

export const config = {
  matcher: [
    '/t/:slug/:agId',
    '/t/:slug/:agId/overview',
    '/t/:slug/:agId/fixtures',
  ],
}

export default async function middleware(request) {
  try {
    const url   = new URL(request.url)
    const parts = url.pathname.split('/').filter(Boolean)
    // parts: ['t', slug, agId, ...optional]
    const slug = parts[1] ?? ''
    const agId = parts[2] ?? ''
    const page = parts[3] ?? ''

    // Skip if agId looks like a known non-uuid word (safety guard)
    if (!slug || !agId || agId === 'register' || agId === 'info') {
      return passthrough(request)
    }

    const type = page === 'fixtures' ? 'schedule'
               : page === 'overview' ? 'overview'
               : 'standings'

    const ogImage =
      `https://www.fixturday.com/api/og` +
      `?slug=${encodeURIComponent(slug)}` +
      `&ag=${encodeURIComponent(agId)}` +
      `&type=${type}`

    // Fetch the static SPA shell
    const htmlRes = await fetch(new URL('/index.html', request.url))
    if (!htmlRes.ok) return passthrough(request)

    const html = await htmlRes.text()

    // Replace the static og:image URLs with the dynamic one
    const modified = html
      .replace(
        /(<meta\s+property="og:image"\s+content=")[^"]*(")/gi,
        `$1${ogImage}$2`
      )
      .replace(
        /(<meta\s+property="og:image:secure_url"\s+content=")[^"]*(")/gi,
        `$1${ogImage}$2`
      )
      .replace(
        /<\/head>/i,
        `<meta name="twitter:card" content="summary_large_image">` +
        `<meta name="twitter:image" content="${ogImage}">` +
        `</head>`
      )

    return new Response(modified, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // CDN caches for 1 hour; browsers always revalidate
        'cache-control': 'public, max-age=0, s-maxage=3600',
      },
    })
  } catch {
    return passthrough(request)
  }
}

async function passthrough(request) {
  try {
    const res  = await fetch(new URL('/index.html', request.url))
    const html = await res.text()
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  } catch {
    return new Response('Internal error', { status: 500 })
  }
}
