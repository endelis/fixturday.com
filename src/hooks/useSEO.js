import { useEffect } from 'react'

const BASE = 'https://www.fixturday.com'
const DEFAULT_IMAGE = `${BASE}/og-image.png`
const DEFAULT_TITLE = 'Fixturday — Free Tournament Management Software'

/**
 * Sets page-level SEO: <title>, meta description, OG tags, Twitter card,
 * canonical <link>, and optional JSON-LD structured data.
 *
 * @param {object}  params
 * @param {string}  params.title        Page title (suffix " — Fixturday" added automatically)
 * @param {string}  params.description  Meta description, 120–160 chars ideal
 * @param {string}  [params.path]       Canonical path, e.g. "/t/my-tournament". Defaults to current URL.
 * @param {string}  [params.image]      Absolute OG image URL. Defaults to site OG image.
 * @param {boolean} [params.noSuffix]   Suppress " — Fixturday" suffix (e.g. homepage).
 * @param {object}  [params.schema]     JSON-LD schema.org graph to inject as <script type="application/ld+json">.
 */
export function useSEO({ title, description, path, image, noSuffix = false, schema = null }) {
  useEffect(() => {
    const fullTitle = noSuffix ? title : `${title} — Fixturday`
    const canonical = path ? `${BASE}${path}` : window.location.href.split('?')[0]
    const ogImage = image ?? DEFAULT_IMAGE

    document.title = fullTitle

    setMeta('name',     'description',       description)
    setMeta('property', 'og:title',          fullTitle)
    setMeta('property', 'og:description',    description)
    setMeta('property', 'og:url',            canonical)
    setMeta('property', 'og:image',          ogImage)
    setMeta('name',     'twitter:card',      'summary_large_image')
    setMeta('name',     'twitter:title',     fullTitle)
    setMeta('name',     'twitter:description', description)
    setMeta('name',     'twitter:image',     ogImage)

    const linkEl = document.querySelector('link[rel="canonical"]')
    if (linkEl) linkEl.setAttribute('href', canonical)

    // Inject / update / remove page-level JSON-LD
    let schemaEl = document.getElementById('page-schema')
    if (schema) {
      if (!schemaEl) {
        schemaEl = document.createElement('script')
        schemaEl.id = 'page-schema'
        schemaEl.type = 'application/ld+json'
        document.head.appendChild(schemaEl)
      }
      schemaEl.textContent = JSON.stringify(schema)
    } else if (schemaEl) {
      schemaEl.remove()
    }

    return () => {
      document.title = DEFAULT_TITLE
      document.getElementById('page-schema')?.remove()
    }
  }, [title, description, path, image, noSuffix, schema])
}

function setMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}
