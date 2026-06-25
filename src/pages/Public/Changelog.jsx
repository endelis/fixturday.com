import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { useSEO } from '../../hooks/useSEO'

const updates = [
  {
    label: 'June 24, 2026',
    title: 'Beach volleyball, tournament info page & public page redesign',
    summary: 'Full beach volleyball support lands alongside a new public tournament page structure, a dedicated info page for participants, and automatic registration cutoffs.',
    features: [
      {
        name: 'Beach volleyball',
        detail: 'Create BV tournaments with double elimination or pool play formats, FIVB set-by-set scoring, pair registration, and FIVB-standard standings (sets won/lost, point ratio).',
      },
      {
        name: 'Public tournament page tabs',
        detail: 'The public page now has four tabs — Info, Schedule, Standings, Teams — so participants jump straight to what they need instead of scrolling past everything.',
      },
      {
        name: 'Tournament info page',
        detail: 'Publish rules, upload a PDF, and show venue details on a dedicated /info page. Participants arrive knowing the format — the organiser gets fewer questions on match day.',
      },
      {
        name: 'Auto-close registration',
        detail: 'Registration closes automatically when the division hits its team cap, within 24 hours of the first kickoff, or once results start coming in. No manual action needed.',
      },
      {
        name: 'QR code on admin overview',
        detail: 'Each tournament shows a QR code in the admin panel linking to its public page. Print and post at the venue — participants scan for live standings and the schedule.',
      },
    ],
  },
  {
    label: 'June 17, 2026',
    title: 'Playoff bracket redesign & smarter scheduling',
    summary: 'The playoff bracket gets a visual overhaul, standings get division tabs, and the fixture scheduler picks up conflict detection across divisions.',
    features: [
      {
        name: 'Playoff bracket redesign',
        detail: 'Clean two-row match cards with the winner highlighted in amber. The Final gets a gold border. The bracket stacks vertically on mobile — no horizontal scrollbar.',
      },
      {
        name: 'Division tabs on standings',
        detail: 'Multi-division tournaments show pill tabs at the top of the Standings page so admins can switch categories in one click. Print still outputs all divisions.',
      },
      {
        name: 'Cross-division pitch conflict detection',
        detail: 'When scheduling fixtures, the system checks existing bookings across all divisions on the same pitches and date, then works around them automatically.',
      },
      {
        name: 'Scheduler improvements',
        detail: 'Defaults to the tournament\'s planned start date. Shows named pitches from your venue. Playoff slot previews display their bracket placeholders.',
      },
    ],
  },
]

export default function Changelog() {
  useSEO({
    title: 'What\'s new — Fixturday',
    description: 'Product updates, new features, and improvements to the Fixturday tournament management platform.',
    path: '/changelog',
  })

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNav />

      <main style={{ maxWidth: 740, margin: '0 auto', padding: '3.5rem 1.25rem 5rem', flex: 1 }}>
        <header style={{ marginBottom: '3.5rem' }}>
          <p style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            What's new
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, margin: '0 0 0.75rem' }}>
            Fixturday updates
          </h1>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 520, margin: 0 }}>
            New features and improvements, in plain language.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {updates.map((update, idx) => (
            <article
              key={idx}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              {/* Card header */}
              <div style={{
                padding: '1.75rem 2rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <p style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.8125rem',
                  fontFamily: 'var(--font-heading)',
                  margin: '0 0 0.6rem',
                  letterSpacing: '0.04em',
                }}>
                  {update.label}
                </p>
                <h2 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.15rem, 3vw, 1.4rem)',
                  fontWeight: 700,
                  margin: '0 0 0.75rem',
                  lineHeight: 1.3,
                }}>
                  {update.title}
                </h2>
                <p style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.9375rem',
                  lineHeight: 1.65,
                  margin: 0,
                }}>
                  {update.summary}
                </p>
              </div>

              {/* Feature list */}
              <div style={{ padding: '0.25rem 0' }}>
                {update.features.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '180px 1fr',
                      gap: '0.75rem',
                      padding: '1rem 2rem',
                      borderBottom: i < update.features.length - 1 ? '1px solid var(--color-border)' : 'none',
                      alignItems: 'baseline',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      lineHeight: 1.5,
                    }}>
                      {f.name}
                    </span>
                    <span style={{
                      color: 'var(--color-text-muted)',
                      fontSize: '0.875rem',
                      lineHeight: 1.65,
                    }}>
                      {f.detail}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
