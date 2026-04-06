#!/usr/bin/env node
/**
 * Generates public/og-image.png (1200x630) for Fixturday social sharing.
 * Run once: node scripts/gen-og.js
 */

import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'og-image.png')

const W = 1200
const H = 630

// ── Colours ──────────────────────────────────────────────────────
const BG       = '#0a1628'   // dark navy
const ACCENT   = '#f0a500'   // amber/gold
const TEXT     = '#ffffff'
const MUTED    = '#8892a4'

// ── SVG template ─────────────────────────────────────────────────
const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
     xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- Background gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="35%" r="65%">
      <stop offset="0%"   stop-color="${ACCENT}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${BG}"      stop-opacity="1"/>
    </radialGradient>

    <!-- Grid pattern -->
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none"
            stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>

    <!-- Glow filter for accent elements -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Base background -->
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>

  <!-- Accent line top -->
  <rect x="0" y="0" width="${W}" height="4" fill="${ACCENT}"/>

  <!-- Left decorative block -->
  <rect x="80" y="120" width="6" height="390" rx="3"
        fill="${ACCENT}" opacity="0.25"/>

  <!-- Trophy / bracket icon (simplified geometric) -->
  <!-- Cup body -->
  <rect x="532" y="190" width="136" height="90" rx="12"
        fill="none" stroke="${ACCENT}" stroke-width="3" opacity="0.5"
        filter="url(#glow)"/>
  <!-- Cup stem -->
  <rect x="591" y="280" width="18" height="40" rx="2"
        fill="${ACCENT}" opacity="0.4"/>
  <!-- Cup base -->
  <rect x="563" y="318" width="74" height="10" rx="5"
        fill="${ACCENT}" opacity="0.4"/>
  <!-- Cup handles -->
  <path d="M 532 210 Q 508 210 508 240 Q 508 270 532 270"
        fill="none" stroke="${ACCENT}" stroke-width="3" opacity="0.4"/>
  <path d="M 668 210 Q 692 210 692 240 Q 692 270 668 270"
        fill="none" stroke="${ACCENT}" stroke-width="3" opacity="0.4"/>

  <!-- Wordmark: FIXTURDAY -->
  <text x="600" y="430"
        font-family="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif"
        font-size="96" font-weight="700" letter-spacing="-1"
        fill="${TEXT}" text-anchor="middle"
        dominant-baseline="auto">FIXTURDAY</text>

  <!-- Tagline -->
  <text x="600" y="488"
        font-family="'Inter', Arial, sans-serif"
        font-size="24" font-weight="400" letter-spacing="2"
        fill="${MUTED}" text-anchor="middle"
        dominant-baseline="auto">TURNĪRU ORGANIZĒŠANAS PLATFORMA</text>

  <!-- Pill badge -->
  <rect x="454" y="515" width="292" height="44" rx="22"
        fill="none" stroke="${ACCENT}" stroke-width="1.5" opacity="0.5"/>
  <text x="600" y="543"
        font-family="'Inter', Arial, sans-serif"
        font-size="16" font-weight="600" letter-spacing="3"
        fill="${ACCENT}" text-anchor="middle"
        dominant-baseline="auto">LATVIJA · BEZMAKSAS</text>

  <!-- Domain watermark bottom-right -->
  <text x="${W - 48}" y="${H - 30}"
        font-family="'Inter', Arial, sans-serif"
        font-size="18" font-weight="500"
        fill="${MUTED}" text-anchor="end"
        dominant-baseline="auto" opacity="0.6">fixturday.com</text>
</svg>
`.trim()

mkdirSync(join(__dirname, '..', 'public'), { recursive: true })

await sharp(Buffer.from(svg))
  .resize(W, H)
  .png({ quality: 95, compressionLevel: 9 })
  .toFile(OUT)

console.log(`✓ og-image.png written → ${OUT}`)
