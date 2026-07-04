import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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

      const files = await readdir(postsDir)
      let count = 0

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

        const html = template
          .replace(/<title>.*?<\/title>/, `<title>${esc(pageTitle)}</title>`)
          .replace(
            /<meta name="description" content="[^"]*"[^>]*>/,
            `<meta name="description" content="${esc(description)}">`
          )
          .replace(/<meta property="og:type" content="[^"]*"[^>]*>/, '<meta property="og:type" content="article">')
          .replace('</head>', [
            `  <meta property="og:title" content="${esc(pageTitle)}">`,
            `  <meta property="og:description" content="${esc(description)}">`,
            `  <meta property="og:url" content="${canonical}">`,
            `  <link rel="canonical" href="${canonical}">`,
            `  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}","description":"${description.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}","url":"${canonical}","datePublished":"${date}","publisher":{"@type":"Organization","name":"Fixturday","url":"https://www.fixturday.com"}}</script>`,
            '</head>',
          ].join('\n'))

        const dir = join(distDir, 'blog', slug)
        await mkdir(dir, { recursive: true })
        await writeFile(join(dir, 'index.html'), html)
        count++
      }

      console.log(`[blog-prerender-meta] Generated ${count} blog HTML files`)
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
