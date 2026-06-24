import { useState } from 'react'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { useSEO } from '../../hooks/useSEO'

const entries = [
  {
    date: 'June 24, 2026',
    items: [
      {
        type: 'new',
        title: 'Tournament info page',
        body: 'A dedicated public page at /[slug]/info where you can publish your rules as text and upload a PDF. Participants get venue, format, and rules in one place before arriving. The Register button hides automatically once the tournament has results.',
      },
      {
        type: 'new',
        title: 'QR code on tournament overview',
        body: 'The admin overview now shows a QR code linking to your public tournament page. Print it, stick it on the venue board, and participants scan for live standings and the schedule — no typing, no WhatsApp messages required.',
      },
      {
        type: 'new',
        title: 'Beach volleyball legend replaced with abbreviation chips',
        body: 'PW, PL, S+, S−, PR column headers now have scannable chips below the standings table explaining each abbreviation in plain English. Cleaner than a paragraph of text, easier to reference quickly on a phone.',
      },
      {
        type: 'fix',
        title: 'Cookie banner no longer covers mobile content',
        body: 'The consent banner now pushes page content upward so buttons and CTAs at the bottom of the screen stay reachable. Works correctly even when the banner text wraps to a second line on small phones.',
      },
      {
        type: 'fix',
        title: 'Admin matchday controls have larger tap targets',
        body: 'Filter dropdowns and the Postpone button on the matchday score entry page now meet the 44 px minimum touch target size — easier to hit accurately on a phone while standing at the venue.',
      },
    ],
  },
  {
    date: 'June 22–23, 2026',
    items: [
      {
        type: 'improved',
        title: 'Schedule rewritten as compact rows',
        body: 'The public fixture list now uses a condensed one-line row per match — time, home team, score, away team, pitch — so you can scan the full day at a glance without scrolling through large cards.',
      },
      {
        type: 'new',
        title: 'Group stage advancement indicators',
        body: 'The standings table now marks which positions advance to the playoffs with a green "ADV" indicator. The number of advancing spots is calculated automatically from your playoff depth setting, so there\'s no ambiguity about who goes through.',
      },
      {
        type: 'fix',
        title: 'Registration banner hides at the right time',
        body: 'The "Register your team" banner on the schedule page was showing after kickoff times had already passed and after results had been entered. It now disappears correctly in both situations.',
      },
    ],
  },
  {
    date: 'June 21, 2026',
    items: [
      {
        type: 'new',
        title: 'FIVB-standard beach volleyball standings',
        body: 'BV standings now show Played, Won, Lost, Points Won (PW), Points Lost (PL), Set Ratio, and Point Ratio — the format used in official beach volleyball competitions. Set scores appear inline in match results.',
      },
      {
        type: 'new',
        title: 'Public tournament page redesign',
        body: 'The public page now uses navigation tabs (Info / Schedule / Standings / Teams) so participants can jump directly to what they need. Match cards use a vertical layout and the standings table fits on mobile without horizontal scrolling.',
      },
      {
        type: 'new',
        title: 'Tournament settings page redesign',
        body: 'Cleaner layout with clearly grouped sections for sport, venue, dates, and registration. All settings are easier to find and the save button stays in a consistent position.',
      },
      {
        type: 'new',
        title: 'Auto-close registration',
        body: 'Registration now closes automatically in three situations: the division hits its team cap, match results start coming in, or a kickoff time is within 24 hours. The Register button disappears and participants see a clear closed state. No manual action required from the organiser.',
      },
      {
        type: 'new',
        title: 'Venue shown on public standings page',
        body: 'The tournament venue name appears at the top of the public standings page, letting participants confirm at a glance they\'re looking at the right event.',
      },
    ],
  },
  {
    date: 'June 20, 2026',
    items: [
      {
        type: 'new',
        title: 'Beach volleyball tournament support',
        body: 'You can now create beach volleyball tournaments. The full workflow is sport-aware throughout: double elimination and pool play bracket generation, FIVB set-by-set score entry (sets to 21, deciding set to 15, win by 2), and standings calculated by sets won/lost and point ratio.',
      },
      {
        type: 'new',
        title: 'Pair registration for beach volleyball',
        body: 'When adding teams to a beach volleyball tournament, the roster captures exactly two players per pair. The standard football squad form is replaced with a simplified pair entry.',
      },
      {
        type: 'new',
        title: 'Sport-aware division format options',
        body: 'The format picker when creating a division now shows only the formats that make sense for the sport — pool play and elimination formats for beach volleyball; round-robin, knockout, and group stage for football.',
      },
      {
        type: 'improved',
        title: '"Age groups" renamed to "divisions"',
        body: 'The term "age group" has been replaced with "division" everywhere in the interface and on public pages. The change reflects how the feature is actually used — grouping teams by age, skill level, or category depending on the sport.',
      },
    ],
  },
  {
    date: 'June 17, 2026',
    items: [
      {
        type: 'new',
        title: '"Start free" button in navigation',
        body: 'A prominent call-to-action now appears in the main navigation bar on all marketing and info pages, making it easier for new visitors to create an account without hunting for a sign-up link.',
      },
      {
        type: 'new',
        title: 'Playoff bracket redesign',
        body: 'Match cards now show a clean two-row layout with the winner highlighted in amber. The Final gets a gold border and glow. The 3rd place match is clearly labelled. The horizontal scrollbar on smaller screens is gone — the bracket scrolls invisibly and stacks vertically on mobile.',
      },
      {
        type: 'new',
        title: 'Division tabs on admin Standings',
        body: 'When a tournament has multiple divisions, pill tabs appear at the top of the Standings page so you can switch between categories with a single click. Print still outputs all divisions.',
      },
      {
        type: 'improved',
        title: 'Registration closed page shows organiser contacts',
        body: 'When registration is closed, the page now displays the organiser\'s email and phone number as clickable links — so participants know exactly who to contact instead of hitting a dead end.',
      },
      {
        type: 'improved',
        title: 'Scheduler avoids cross-division pitch conflicts',
        body: 'When generating a fixture schedule, the system now checks all other divisions\' existing bookings on the same pitches and date, then automatically works around them. A banner shows how many existing games were detected.',
      },
      {
        type: 'improved',
        title: 'Admin sidebar stays visible on all pages',
        body: 'Previously the sidebar disappeared when navigating to the Teams or Fixtures pages inside a tournament. It now stays consistent across every section of the admin workspace.',
      },
      {
        type: 'improved',
        title: 'Scheduler form improvements',
        body: 'The scheduling form now defaults to the tournament\'s planned start date instead of today. The pitch selector shows named pitches from your venue instead of a generic count. Playoff fixture slots now display their bracket placeholders in the preview.',
      },
      {
        type: 'fix',
        title: 'Mobile horizontal overflow fixed',
        body: 'On some mobile browsers the logo appeared clipped on the left and tournament cards overflowed the screen. Adding overflow-x: hidden to the page root resolves this on all public pages.',
      },
    ],
  },
]

const typeConfig = {
  new:      { label: 'New',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)' },
  improved: { label: 'Improved', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
  fix:      { label: 'Fix',      color: '#f0a500', bg: 'rgba(240,165,0,0.1)',  border: 'rgba(240,165,0,0.25)' },
}

const allItems = entries.flatMap(e => e.items)
const counts = {
  all: allItems.length,
  new: allItems.filter(i => i.type === 'new').length,
  improved: allItems.filter(i => i.type === 'improved').length,
  fix: allItems.filter(i => i.type === 'fix').length,
}

const FILTERS = [
  { id: 'all',      label: `All (${counts.all})` },
  { id: 'new',      label: `New (${counts.new})` },
  { id: 'improved', label: `Improved (${counts.improved})` },
  { id: 'fix',      label: `Fix (${counts.fix})` },
]

export default function Changelog() {
  const [activeType, setActiveType] = useState('all')

  useSEO({
    title: 'Changelog — Fixturday',
    description: 'See what\'s new in Fixturday — product updates, improvements, and fixes to the tournament management platform.',
    path: '/changelog',
  })

  const visibleEntries = entries
    .map(entry => ({
      ...entry,
      items: activeType === 'all' ? entry.items : entry.items.filter(i => i.type === activeType),
    }))
    .filter(entry => entry.items.length > 0)

  const totalVisible = visibleEntries.reduce((sum, e) => sum + e.items.length, 0)

  const pillBase = {
    border: 'none',
    borderRadius: '999px',
    padding: '0.35rem 0.9rem',
    fontSize: '0.8125rem',
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
  }

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNav />

      <main style={{ maxWidth: 740, margin: '0 auto', padding: '3.5rem 1.25rem 5rem', flex: 1 }}>
        <header style={{ marginBottom: '2.5rem' }}>
          <p style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Changelog
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, margin: '0 0 0.75rem' }}>
            What's new in Fixturday
          </h1>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 520, margin: 0 }}>
            Product updates, improvements, and fixes — in plain language.
          </p>
        </header>

        {/* Type filter */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {FILTERS.map(f => {
            const active = f.id === activeType
            return (
              <button
                key={f.id}
                onClick={() => setActiveType(f.id)}
                style={{
                  ...pillBase,
                  background: active ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: active ? '#000' : 'var(--color-text-muted)',
                  border: active ? 'none' : '1px solid var(--color-border)',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Result count */}
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '2.5rem' }}>
          {totalVisible === 0
            ? 'No entries matching this filter.'
            : `${totalVisible} entr${totalVisible !== 1 ? 'ies' : 'y'}`
          }
          {activeType !== 'all' && totalVisible > 0 && (
            <button
              onClick={() => setActiveType('all')}
              style={{ marginLeft: '0.75rem', background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '0.8125rem', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}
            >
              Clear filter
            </button>
          )}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          {visibleEntries.map(entry => (
            <section key={entry.date}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <time style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: 'var(--color-text)',
                  whiteSpace: 'nowrap',
                }}>
                  {entry.date}
                </time>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {entry.items.map((item, i) => {
                  const cfg = typeConfig[item.type]
                  return (
                    <div
                      key={i}
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.1rem 1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          color: cfg.color,
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.15rem 0.5rem',
                          flexShrink: 0,
                        }}>
                          {cfg.label}
                        </span>
                        <h2 style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1rem',
                          fontWeight: 600,
                          margin: 0,
                          color: 'var(--color-text)',
                        }}>
                          {item.title}
                        </h2>
                      </div>
                      <p style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '0.875rem',
                        lineHeight: 1.65,
                        margin: 0,
                      }}>
                        {item.body}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
