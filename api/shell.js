export const config = { runtime: 'edge' }

export default async function handler(req) {
  try {
    const { searchParams, origin } = new URL(req.url)
    const slug = searchParams.get('slug') ?? ''
    const agId = searchParams.get('agId') ?? ''
    const type = searchParams.get('type') ?? 'overview'

    const ogImage =
      `https://www.fixturday.com/api/og` +
      `?slug=${encodeURIComponent(slug)}` +
      `&ag=${encodeURIComponent(agId)}` +
      `&type=${type}`

    const htmlRes = await fetch(`${origin}/index.html`)
    if (!htmlRes.ok) throw new Error('index.html not found')

    const html = await htmlRes.text()

    const modified = html
      .replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/gi, `$1${ogImage}$2`)
      .replace(/(<meta\s+property="og:image:secure_url"\s+content=")[^"]*(")/gi, `$1${ogImage}$2`)
      .replace(
        /<\/head>/i,
        `<meta name="twitter:card" content="summary_large_image">` +
        `<meta name="twitter:image" content="${ogImage}">` +
        `</head>`
      )

    return new Response(modified, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=3600',
      },
    })
  } catch {
    try {
      const { origin } = new URL(req.url)
      const html = await fetch(`${origin}/index.html`).then(r => r.text())
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    } catch {
      return new Response('Internal error', { status: 500 })
    }
  }
}
