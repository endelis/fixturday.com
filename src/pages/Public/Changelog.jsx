import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { useSEO } from '../../hooks/useSEO'

const entries = [
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
        title: 'Age group tabs on admin Standings',
        body: 'When a tournament has multiple age groups, pill tabs appear at the top of the Standings page so you can switch between categories with a single click. Print still outputs all groups.',
      },
      {
        type: 'improved',
        title: 'Registration closed page shows organiser contacts',
        body: 'When registration is closed, the page now displays the organiser\'s email and phone number as clickable links — so participants know exactly who to contact instead of hitting a dead end.',
      },
      {
        type: 'improved',
        title: 'Scheduler avoids cross-age-group pitch conflicts',
        body: 'When generating a fixture schedule, the system now checks all other age groups\' existing bookings on the same pitches and date, then automatically works around them. A banner shows how many existing games were detected.',
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

export default function Changelog() {
  useSEO({
    title: 'Changelog — Fixturday',
    description: 'See what\'s new in Fixturday — product updates, improvements, and fixes to the tournament management platform.',
    path: '/changelog',
  })

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNav />

      <main style={{ maxWidth: 740, margin: '0 auto', padding: '3.5rem 1.25rem 5rem', flex: 1 }}>
        <header style={{ marginBottom: '3.5rem' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          {entries.map(entry => (
            <section key={entry.date}>
              {/* Date header */}
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

              {/* Items */}
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
