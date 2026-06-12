import { useEffect } from 'react'

const BASE = 'https://www.fixturday.com'
const DEFAULT_IMAGE = `${BASE}/og-image.png`

/**
 * Sets page-level SEO tags: <title>, meta description, og:title,
 * og:description, og:url, og:image, and canonical <link>.
 *
 * Call once per page-level component. Pass reactive values (e.g. tournament
 * name) and the hook will re-run whenever they change.
 *
 * @param {object} params
 * @param {string} params.title        Full page title (no suffix needed — suffix added automatically)
 * @param {string} params.description  Meta description, 120–160 chars ideal
 * @param {string} [params.path]       Canonical path, e.g. "/tournaments". Defaults to current pathname.
 * @param {string} [params.image]      Absolute URL to OG image. Defaults to site OG image.
 * @param {boolean} [params.noSuffix]  Pass true to suppress " — Fixturday" suffix (e.g. homepage)
 */
export function useSEO({ title, description, path, image, noSuffix = false }) {
  useEffect(() => {
    const fullTitle = noSuffix ? title : `${title} — Fixturday`
    const canonical = path ? `${BASE}${path}` : window.location.href.split('?')[0]
    const ogImage = image ?? DEFAULT_IMAGE

    document.title = fullTitle

    setMeta('name', 'description', description)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonical)
    setMeta('property', 'og:image', ogImage)

    const linkCanonical = document.querySelector('link[rel="canonical"]')
    if (linkCanonical) linkCanonical.setAttribute('href', canonical)
  }, [title, description, path, image, noSuffix])
}

function setMeta(attr, key, value) {
  const el = document.querySelector(`meta[${attr}="${key}"]`)
  if (el) el.setAttribute('content', value)
}
