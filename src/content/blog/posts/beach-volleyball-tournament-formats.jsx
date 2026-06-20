import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'beach-volleyball-tournament-formats',
  title: 'Beach Volleyball Tournament Formats Explained: All 5 Options Compared',
  description: 'Pool Play, Double Elimination, Single Elimination, Pool Play + Single Elimination, or Pool Play + Double Elimination — compare all five beach volleyball tournament formats with match counts and when to use each.',
  date: '2026-06-20',
  readTime: '6 min read',
  tags: ['beach volleyball', 'tournament format', 'organisation'],
  keywords: ['beach volleyball tournament format', 'pool play tournament', 'double elimination beach volleyball', 'beach volleyball bracket', 'beach volleyball tournament structure'],
}

const faqs = [
  {
    q: 'What is the most common beach volleyball tournament format?',
    a: 'Pool Play + Double Elimination is the standard format for competitive beach volleyball events. Teams play round-robin within pools to establish seeding, then enter a double-elimination bracket where one loss drops you to the losers bracket rather than eliminating you outright.',
  },
  {
    q: 'What is the difference between Pool Play and Round Robin in beach volleyball?',
    a: 'They are the same structure — every team in the pool plays every other team once. "Pool Play" is simply the beach volleyball term for a round-robin group stage. The winner is determined by points (wins), then set ratio, then point ratio.',
  },
  {
    q: 'How does Double Elimination work in beach volleyball?',
    a: 'Every team starts in the Winners Bracket. A first loss drops you to the Losers Bracket — you are still in the tournament. A second loss eliminates you. The Winners Bracket final winner and the Losers Bracket final winner meet in the Grand Final. If the Losers Bracket finalist wins, a Grand Final Reset is played.',
  },
  {
    q: 'How many teams do I need for each beach volleyball format?',
    a: 'Pool Play works with any number from 3 upward. Single Elimination works best with 8, 16 teams (powers of 2). Double Elimination is typically run with 8–16 teams. Pool Play + Single/Double Elimination works well with 8–24 teams split into 2–4 pools.',
  },
  {
    q: 'Which beach volleyball format gives teams the most games?',
    a: 'Double Elimination guarantees the most games per team — you need two losses to be eliminated, so every team plays at least 2 matches, and most play 3 or more. Pool Play + Double Elimination gives the most total game time across the whole event.',
  },
]

export default function BeachVolleyballFormatsPost() {
  useEffect(() => {
    const id = 'faq-ld-bvb-formats'
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
        Choosing the right format is the first decision that shapes your entire beach volleyball
        event — how many games each pair plays, how long the day runs, and how satisfying the
        result feels. Here are all five formats supported by Fixturday, with match counts,
        ideal team numbers, and when each one works best.
      </p>

      <h2>Format 1: Pool Play</h2>
      <p>
        Every team in the pool plays every other team once. Results accumulate over all matches;
        the team with the best record wins the pool. No elimination — every pair plays a fixed
        number of sets regardless of results.
      </p>
      <h3>When to use it</h3>
      <ul>
        <li>3–8 teams where every pair should meet</li>
        <li>Single-day round-robin leagues</li>
        <li>Recreational events where every team wants equal playing time</li>
        <li>When time is very limited and you want a guaranteed schedule</li>
      </ul>
      <h3>Standings formula</h3>
      <p>
        Ranked by wins first, then set ratio (sets won ÷ sets played), then point ratio
        (points scored ÷ points conceded). Fixturday calculates all three automatically.
      </p>

      <h2>Format 2: Single Elimination</h2>
      <p>
        A straight bracket — lose once and you are out. Best used as a clean final stage
        when time is short or you want a fast definitive winner.
      </p>
      <h3>When to use it</h3>
      <ul>
        <li>8 or 16 teams with a tight time window</li>
        <li>Final rounds after a seeding phase has already been played elsewhere</li>
        <li>Events where the emphasis is on the climactic final rather than total games played</li>
      </ul>
      <h3>Match count</h3>
      <p>
        Always n−1 total matches. An 8-team bracket produces 7 matches; each pair plays
        1–3 matches depending on how far they advance. The team that loses in round one
        goes home after a single match.
      </p>

      <h2>Format 3: Double Elimination</h2>
      <p>
        The most popular competitive beach volleyball format. Every team starts in the Winners
        Bracket. A first loss drops you to the Losers Bracket — you remain in the tournament.
        A second loss eliminates you. The WB and LB finalists meet in the Grand Final.
      </p>
      <h3>When to use it</h3>
      <ul>
        <li>8–16 teams in a competitive event</li>
        <li>When a single bad game should not end your tournament</li>
        <li>FIVB-style formats where every team is guaranteed at least 2 matches</li>
        <li>Events where bracket drama is part of the experience</li>
      </ul>
      <h3>Grand Final Reset</h3>
      <p>
        If the Losers Bracket finalist wins the Grand Final (beating the WB finalist for
        the first time), a Grand Final Reset match is played — both teams enter with one
        loss and the winner takes the title. This rule keeps the format fair:
        the WB finalist's advantage is that they can afford to lose the Grand Final once.
      </p>
      <p>
        See the full bracket mechanics in{' '}
        <Link to="/blog/beach-volleyball-double-elimination-bracket" style={{ color: 'var(--color-accent)' }}>
          Beach Volleyball Double Elimination Bracket Explained
        </Link>.
      </p>

      <h2>Format 4: Pool Play + Single Elimination</h2>
      <p>
        Teams play round-robin within pools (Pool Play phase), then the top finishers from
        each pool advance into a single-elimination bracket. Everyone gets guaranteed pool games;
        the bracket decides the final ranking.
      </p>
      <h3>When to use it</h3>
      <ul>
        <li>8–20 teams with moderate time</li>
        <li>When you want guaranteed group games but a clean, fast bracket</li>
        <li>Recreational or mixed-level events where pool play is the highlight</li>
      </ul>
      <h3>How to configure it</h3>
      <p>
        In Fixturday, choose the number of pools (2–4) and the playoff depth (Semi-final,
        Quarter-final, etc.). The advancing-per-pool count must divide evenly into the
        bracket — for example, 2 pools advancing 2 teams each fills a 4-team Semi-final bracket.
      </p>

      <h2>Format 5: Pool Play + Double Elimination</h2>
      <p>
        Pool Play to seed teams, then a Double Elimination bracket for the playoff stage.
        The most complete format — guaranteed group games, then a forgiving bracket where
        one loss is survivable. Standard structure for serious beach volleyball tournaments.
      </p>
      <h3>When to use it</h3>
      <ul>
        <li>12–24 teams across 2–4 pools</li>
        <li>Full-day or multi-day events</li>
        <li>When competitive fairness is the priority — pool play removes seeding luck,
            DE removes single-match elimination</li>
        <li>FIVB-style club and open tournaments</li>
      </ul>
      <h3>Typical structure</h3>
      <p>
        Morning: 3 pool-play matches per pair (pools of 4 teams). Afternoon: 8-team or
        16-team Double Elimination bracket seeded by pool standings. Total games per pair:
        3 guaranteed in pools + 2–5 in the bracket.
      </p>

      <h2>Quick Comparison</h2>
      <div style={{ overflowX: 'auto', margin: '1.5rem 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
              <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Format</th>
              <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Best team count</th>
              <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Min. matches per pair</th>
              <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Best for</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Pool Play', '3–8', 'n−1 (plays everyone)', 'Leagues, recreational events'],
              ['Single Elimination', '8, 16', '1 (early exit possible)', 'Fast finals, time-tight events'],
              ['Double Elimination', '8–16', '2 (guaranteed)', 'Competitive events, FIVB-style'],
              ['Pool Play + Single Elim', '8–20', '3+ (pool guaranteed)', 'Mid-size events, mixed levels'],
              ['Pool Play + Double Elim', '12–24', '5+ (pool + 2 in bracket)', 'Full-day, serious tournaments'],
            ].map(([fmt, count, min_, best], i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{fmt}</td>
                <td style={{ padding: '0.65rem 0.75rem', color: 'var(--color-text-muted)' }}>{count}</td>
                <td style={{ padding: '0.65rem 0.75rem', color: 'var(--color-text-muted)' }}>{min_}</td>
                <td style={{ padding: '0.65rem 0.75rem', color: 'var(--color-text-muted)' }}>{best}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>How to Set the Format in Fixturday</h2>
      <p>
        Go to your tournament's <strong>Divisions</strong> section and click <em>+ New division</em>
        or <em>Settings</em> on an existing one. Select <strong>Beach Volleyball</strong> as the
        sport when creating the tournament — the format dropdown will then show all five
        beach-volleyball-specific options.
      </p>
      <p>
        For Pool Play + Single/Double Elimination, additional settings appear for number of pools
        and playoff depth. The format is locked once the first result is entered, so decide before
        match day.
      </p>
      <p>
        Not sure how long your chosen format will take?{' '}
        <Link to="/blog/how-to-organize-a-beach-volleyball-tournament" style={{ color: 'var(--color-accent)' }}>
          The beach volleyball tournament organisation guide
        </Link>{' '}
        covers scheduling and court planning in detail.
      </p>
      <p>
        <Link to="/beach-volleyball-tournament-software" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
          Try Fixturday for your next beach volleyball tournament — free →
        </Link>
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
