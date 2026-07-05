import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static pages that need per-page canonical + meta baked into HTML at build time.
// Googlebot gets a real response instead of the generic SPA shell, which fixes
// "Duplicate without user-selected canonical" and "Crawled - currently not indexed".
const STATIC_PAGES = [
  {
    path: '/about',
    title: 'About Fixturday — Sports Tournament Software',
    description: 'Fixturday helps organizers run better tournaments. Automatic schedules, live standings, online registration, and a public participant page. Free to use.',
    noSuffix: true,
  },
  {
    path: '/guide',
    title: 'How to Organize a Sports Tournament',
    description: 'Step-by-step guide to organizing any sports tournament with Fixturday. Create your schedule, manage teams, run match day, and track results — all free.',
  },
]

function blogPrerenderMeta() {
  return {
    name: 'blog-prerender-meta',
    apply: 'build',
    async closeBundle() {
      const { readdir, readFile, writeFile, mkdir } = await import('node:fs/promises')
      const { join } = await import('node:path')
      const cwd = process.cwd()

      const postsDir = join(cwd, 'src/content/blog/posts')
      const distDir = join(cwd, 'dist')
      const template = await readFile(join(distDir, 'index.html'), 'utf-8')

      function extractMeta(src, key) {
        let m = src.match(new RegExp(`${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`))
        if (m) return m[1].replace(/\\'/g, "'")
        m = src.match(new RegExp(`${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"` ))
        if (m) return m[1].replace(/\\"/g, '"')
        return ''
      }

      function esc(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      }

      function buildHtml(template, { pageTitle, description, canonical, type = 'website', ldJson = null }) {
        let html = template
          .replace(/<title>.*?<\/title>/, `<title>${esc(pageTitle)}</title>`)
          .replace(
            /<meta name="description" content="[^"]*"[^>]*>/,
            `<meta name="description" content="${esc(description)}">`
          )
        if (type !== 'website') {
          html = html.replace(/<meta property="og:type" content="[^"]*"[^>]*>/, `<meta property="og:type" content="${type}">`)
        }
        const extras = [
          `  <meta property="og:title" content="${esc(pageTitle)}">`,
          `  <meta property="og:description" content="${esc(description)}">`,
          `  <meta property="og:url" content="${canonical}">`,
          `  <link rel="canonical" href="${canonical}">`,
        ]
        if (ldJson) extras.push(`  <script type="application/ld+json">${ldJson}</script>`)
        extras.push('</head>')
        return html.replace('</head>', extras.join('\n'))
      }

      // ── Blog posts ────────────────────────────────────────────────
      const files = await readdir(postsDir)
      let blogCount = 0

      for (const file of files) {
        if (!file.endsWith('.jsx')) continue
        const src = await readFile(join(postsDir, file), 'utf-8')
        const slug = extractMeta(src, 'slug')
        const title = extractMeta(src, 'title')
        const description = extractMeta(src, 'description')
        const date = extractMeta(src, 'date')
        if (!slug || !title || !description) continue

        const pageTitle = `${title} | Fixturday`
        const canonical = `https://www.fixturday.com/blog/${slug}`
        const ldJson = JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Article',
          headline: title, description, url: canonical, datePublished: date,
          publisher: { '@type': 'Organization', name: 'Fixturday', url: 'https://www.fixturday.com' },
        })

        const html = buildHtml(template, { pageTitle, description, canonical, type: 'article', ldJson })
        const dir = join(distDir, 'blog', slug)
        await mkdir(dir, { recursive: true })
        await writeFile(join(dir, 'index.html'), html)
        blogCount++
      }

      // ── Static pages ──────────────────────────────────────────────
      let staticCount = 0

      for (const page of STATIC_PAGES) {
        const pageTitle = page.noSuffix ? page.title : `${page.title} — Fixturday`
        const canonical = `https://www.fixturday.com${page.path}`
        const html = buildHtml(template, { pageTitle, description: page.description, canonical })
        const dir = join(distDir, page.path.slice(1)) // strip leading /
        await mkdir(dir, { recursive: true })
        await writeFile(join(dir, 'index.html'), html)
        staticCount++
      }

      console.log(`[blog-prerender-meta] Generated ${blogCount} blog + ${staticCount} static HTML files`)
    },
  }
}

export default defineConfig({
  plugins: [react(), blogPrerenderMeta()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui':       ['lucide-react', 'date-fns'],
          'vendor-i18n':     ['i18next', 'react-i18next'],
        },
      },
    },
  },
})
