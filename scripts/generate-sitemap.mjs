/**
 * generate-sitemap.mjs
 *
 * Runs at build time (before vite build) to append live tournament slugs
 * to public/sitemap.xml. Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 *
 * Usage:  node scripts/generate-sitemap.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SITEMAP_PATH = resolve(ROOT, 'public', 'sitemap.xml')
const BASE_URL = 'https://www.fixturday.com'
const TODAY = new Date().toISOString().split('T')[0]

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('[sitemap] Missing Supabase env vars — skipping dynamic entries')
  process.exit(0)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('slug, start_date')
    .eq('is_active', true)
    .order('start_date', { ascending: false })

  if (error) {
    console.error('[sitemap] Supabase error:', error.message)
    process.exit(0)
  }

  if (!tournaments?.length) {
    console.log('[sitemap] No active tournaments found — skipping dynamic entries')
    process.exit(0)
  }

  // Build <url> blocks for each tournament
  const tournamentEntries = tournaments.map(t => {
    const lastmod = t.start_date ? t.start_date.split('T')[0] : TODAY
    return `  <url>
    <loc>${BASE_URL}/t/${t.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`
  }).join('\n')

  // Read current sitemap and insert before closing </urlset>
  let xml = readFileSync(SITEMAP_PATH, 'utf8')

  // Remove any previously generated dynamic block
  xml = xml.replace(/\n\s*<!-- BEGIN:dynamic-tournaments -->[\s\S]*<!-- END:dynamic-tournaments -->/g, '')

  const dynamicBlock = `\n  <!-- BEGIN:dynamic-tournaments -->\n${tournamentEntries}\n  <!-- END:dynamic-tournaments -->`
  xml = xml.replace('</urlset>', `${dynamicBlock}\n</urlset>`)

  writeFileSync(SITEMAP_PATH, xml, 'utf8')
  console.log(`[sitemap] Added ${tournaments.length} tournament URLs to sitemap.xml`)
}

run().catch(err => {
  console.error('[sitemap] Fatal:', err)
  process.exit(0) // Non-fatal — build continues even if this fails
})
