import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'how-to-choose-tournament-playoff-depth',
  title: 'Quarter-Final, Semi-Final, or Final Only: Choosing Your Playoff Depth',
  description: 'The number of playoff rounds you run depends on team count, available time, and how many guaranteed games each team should get. Here\'s the decision framework.',
  date: '2026-06-17',
  readTime: '5 min read',
  tags: ['playoff format', 'tournament format', 'scheduling'],
  keywords: ['tournament playoff format', 'quarter-final semi-final tournament', 'how many playoff rounds', 'football tournament knockout depth'],
}

const faqs = [
  {
    q: 'How deep should the playoff be for a 16-team tournament?',
    a: 'With 16 teams and a group stage, the standard is Quarter-Finals (8 playoff spots from 4 groups of 4, top 2 advancing) or Semi-Finals (4 playoff spots from 2 groups of 8, top 2 advancing). Quarter-Finals gives each team more knockout games; Semi-Finals makes the group stage longer.',
  },
  {
    q: 'Can I have a Final Only playoff with 8 teams?',
    a: 'Yes — two groups of 4, top 1 advances, straight to a Final. Each team plays 3 group games and one Final match at most. This is a very short format but works if time is severely limited.',
  },
  {
    q: 'Why does Fixturday block odd advancing numbers?',
    a: 'A bracket requires a power-of-2 number of teams at each round (2 for Final, 4 for Semi-Finals, 8 for QF). If your groups_count × teams_advancing doesn\'t produce a power of 2, the bracket structure breaks. Fixturday shows a live error and blocks saving until the numbers work.',
  },
]

export default function PlayoffDepthPost() {
  useEffect(() => {
    const id = 'faq-ld-playoff-depth'
    let el = document.getElementById(id)
    if (!el) {
      el = document.createElement('script')
      el.id = id
      el.type = 'application/ld+json'
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    })
    return () => { document.getElementById(id)?.remove() }
  }, [])

  return (
    <div className="post-content">
      <p className="post-lead">
        "Playoff depth" sounds like a coaching term. In tournament organisation it means something
        precise: how many knockout rounds run after the group stage. The choice sets the total number
        of games, the minimum games each team is guaranteed, and the shape of your match day.
      </p>

      <h2>The Four Levels</h2>
      <p>
        Fixturday supports four playoff depths, each requiring a specific number of playoff slots:
      </p>
      <ul>
        <li><strong>Final Only</strong> — 2 playoff slots. One match decides the winner. Used when time is very tight or the group stage is long enough on its own.</li>
        <li><strong>Semi-Finals</strong> — 4 playoff slots. Two semi-finals plus a Final. The most common format for club and school tournaments.</li>
        <li><strong>Quarter-Finals</strong> — 8 playoff slots. Adds a quarterfinal round before the semis. Requires more advancing teams or more groups.</li>
        <li><strong>Round of 16</strong> — 16 playoff slots. Only practical for large tournaments with many groups or a very generous time window.</li>
      </ul>

      <h2>The Constraint: Playoff Slots ÷ Groups = Whole Number</h2>
      <p>
        The advancing teams per group must be a whole number. This isn't a software preference — it's
        bracket arithmetic. If you choose Semi-Finals (4 slots) with 3 groups, you'd need 1.33 teams
        advancing per group, which is impossible. Fixturday shows this validation live in the Divisions
        editor and blocks saving until the numbers work.
      </p>
      <p>
        It also enforces that the advancing count is even — you cannot advance an odd number of teams
        per group, because that produces a bracket with a bye in round one, which typically isn't
        what organisers intend for a group-stage format.
      </p>

      <h2>A Decision Table</h2>
      <p>These combinations work cleanly:</p>
      <ul>
        <li>8 teams, 2 groups → Semi-Finals (top 2 per group) — the classic one-day format</li>
        <li>8 teams, 4 groups → Final Only (top 1 per group) — very short format, 2 group games per team</li>
        <li>12 teams, 2 groups → Quarter-Finals (top 4 per group) — 6 teams per group, 5 group games each</li>
        <li>12 teams, 4 groups → Semi-Finals (top 1 per group) — 3 teams per group, 2 group games each</li>
        <li>16 teams, 4 groups → Quarter-Finals (top 2 per group) — 4 teams per group, 3 group games each</li>
        <li>16 teams, 2 groups → Quarter-Finals (top 4 per group) — 8 teams per group, 7 group games each</li>
      </ul>

      <h2>Time As the Real Constraint</h2>
      <p>
        Playoff depth directly determines how many total games you need to schedule. For each knockout
        round you add, you add roughly <em>n/2</em> games (where n is the number of teams in that round).
        With two pitches running simultaneously, a Semi-Final round adds about 1–2 time slots; a
        Quarter-Final round adds 2–4.
      </p>
      <p>
        The{' '}
        <Link to="/blog/how-to-estimate-tournament-duration" style={{ color: 'var(--color-accent)' }}>
          Fixturday duration estimator
        </Link>{' '}
        in the scheduler shows the total expected match day length before you generate the schedule.
        If your target finish time won't fit, you have three levers: fewer groups, shallower playoffs,
        or shorter game duration.
      </p>

      <h2>3rd Place Match</h2>
      <p>
        Whenever Semi-Finals are part of the bracket, Fixturday automatically generates a 3rd place
        match between the two semi-final losers. It runs in the same time slot as the Final (parallel
        on a second pitch if available, or immediately before on a single pitch). You don't need to
        configure this separately.
      </p>

      <h2>How to Set It</h2>
      <p>
        In the Divisions editor: set format to Group + Knockout, choose Playoff depth, then pick
        your group count. The live validation row shows the advancing-per-group number in green
        (valid) or red (invalid). Once it's green, save and generate fixtures from the Fixtures page.
        The full bracket — group games and all knockout placeholder matchups — is generated in one step.
      </p>
      <p>
        The setting is locked after the first group game result is entered. If you change your mind
        after generating fixtures but before any results, delete the fixtures and regenerate.
      </p>

      <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
        <h2>Frequently Asked Questions</h2>
        {faqs.map((f, i) => (
          <div key={i} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>{f.q}</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 0 }}>{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
