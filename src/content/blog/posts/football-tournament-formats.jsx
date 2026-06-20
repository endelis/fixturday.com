import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'football-tournament-formats',
  title: 'Football Tournament Formats Explained: Round Robin, Knockout, and Group Stage',
  description: 'Round robin, knockout, or group stage with playoff — which football tournament format is right for your event? Compare all three with team counts, match totals, and when to use each.',
  date: '2026-06-20',
  readTime: '5 min read',
  tags: ['tournament format', 'football', 'organisation'],
  keywords: ['football tournament format', 'round robin tournament', 'knockout tournament', 'group stage tournament', 'tournament format comparison'],
}

const faqs = [
  {
    q: 'What is the best football tournament format for a one-day event?',
    a: 'Round robin works best for small groups (4–8 teams) where every team should play multiple games. For 8–16 teams in one day, group stage plus knockout gives everyone at least 3 group games before the bracket begins.',
  },
  {
    q: 'How many games does each team play in a round robin tournament?',
    a: 'In a round robin, each team plays every other team exactly once. With n teams, each team plays n−1 games. So 6 teams each play 5 games; 8 teams each play 7 games.',
  },
  {
    q: 'How many teams do I need for a knockout tournament?',
    a: 'Knockout works cleanest with 8, 16, or 32 teams (powers of 2). Fixturday automatically pads uneven draws with byes so any team count works — a 12-team draw runs as a 16-team bracket with 4 byes in round one.',
  },
  {
    q: 'What is the difference between knockout and group stage plus knockout?',
    a: 'In a straight knockout, one bad game ends your tournament. In group stage plus knockout, teams play a round-robin group phase first — everyone gets at least 2–3 games before the bracket eliminates them. Group stage plus knockout is fairer and creates more total games.',
  },
  {
    q: 'Can I run different formats for different divisions in the same tournament?',
    a: 'Yes. Each division in Fixturday has its own format setting. You can run a round-robin for the U10s and a group stage plus knockout for the senior division — all in the same tournament.',
  },
]

export default function FootballFormatsPost() {
  useEffect(() => {
    const id = 'faq-ld-football-formats'
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
        The format you pick determines how many games each team plays, how long the day runs,
        and how fair the outcome feels. Fixturday supports three football tournament formats —
        here is what each one does, when to use it, and what the numbers look like in practice.
      </p>

      <h2>Format 1: Round Robin</h2>
      <p>
        Every team plays every other team once. The team with the most points at the end wins.
        No elimination — a bad result hurts your standing but doesn't end your day.
      </p>
      <h3>When to use it</h3>
      <ul>
        <li>4–10 teams in one division</li>
        <li>League-style events where the best team over all games should win</li>
        <li>Tournaments where every participant should play as many games as possible</li>
        <li>Youth tournaments where elimination after one loss is demoralising</li>
      </ul>
      <h3>Match count</h3>
      <p>
        Total matches = n × (n−1) ÷ 2. Six teams produce 15 games; eight teams produce 28 games.
        With more than 10 teams, a single round-robin group becomes very long — switch to group stage format instead.
      </p>
      <h3>Standings</h3>
      <p>
        Win = 3 points, Draw = 1, Loss = 0. Tiebreakers: goal difference → goals scored → head-to-head.
        Fixturday calculates and updates standings automatically after each result.
      </p>

      <h2>Format 2: Knockout</h2>
      <p>
        Single-elimination bracket — lose once and you're out. Teams are seeded by registration
        order and drawn into a bracket. The winner of each game advances; the loser goes home.
      </p>
      <h3>When to use it</h3>
      <ul>
        <li>Cup-style competitions where only one team should lift the trophy</li>
        <li>8, 16, or 32 teams (Fixturday handles uneven draws with byes)</li>
        <li>When time is very tight and you need the fewest possible games</li>
        <li>Final stages of a larger event after a group phase</li>
      </ul>
      <h3>Match count</h3>
      <p>
        Always n−1 matches total (one match eliminates one team). An 8-team bracket produces
        7 games across three rounds (QF, SF, F). Each team plays 1–3 games depending on how
        far they go — the team that loses in round one plays only once.
      </p>
      <h3>Bracket rounds</h3>
      <p>
        Fixturday labels rounds automatically: Round of 16, Quarter-final, Semi-final, Final,
        and a separate 3rd place match if you want one. The bracket is generated at fixture
        time and updates live as results come in.
      </p>

      <h2>Format 3: Group Stage + Knockout</h2>
      <p>
        Teams are split into groups for a round-robin phase. The top finishers from each group
        advance into a knockout bracket. Everyone gets guaranteed group games; the bracket decides
        the final ranking.
      </p>
      <h3>When to use it</h3>
      <ul>
        <li>8–32 teams in one division</li>
        <li>The most common format for serious club tournaments</li>
        <li>When you want guaranteed games for everyone and a clear champion at the end</li>
        <li>Multi-day tournaments (group phase day 1, knockout day 2)</li>
      </ul>
      <h3>Configuration options in Fixturday</h3>
      <ul>
        <li>
          <strong>Number of groups:</strong> 2, 3, or 4. Divide your team count by the number of groups
          to get group size — 16 teams in 4 groups of 4 is the classic World Cup structure.
        </li>
        <li>
          <strong>Playoff depth:</strong> Final only (2 teams), Semi-final (4), Quarter-final (8),
          Round of 16. The number of advancing teams must divide evenly between groups.
        </li>
        <li>
          <strong>Bracket seeding:</strong> Cross (A1 vs B2, B1 vs A2), Mirror (A1 vs A2),
          or Ranked (overall standings). Cross is the standard; it rewards strong group performance
          and keeps group rivals apart until the Final.
        </li>
      </ul>
      <p>
        For a full breakdown of seeding methods, see{' '}
        <Link to="/blog/tournament-bracket-seeding-explained" style={{ color: 'var(--color-accent)' }}>
          Tournament Bracket Seeding Explained
        </Link>.
        For configuring advancing numbers, see{' '}
        <Link to="/blog/how-to-configure-group-stage-brackets" style={{ color: 'var(--color-accent)' }}>
          How to Configure Group Stage Brackets
        </Link>.
      </p>

      <h2>Quick Comparison</h2>
      <div style={{ overflowX: 'auto', margin: '1.5rem 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
              <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Format</th>
              <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Best team count</th>
              <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Min. games per team</th>
              <th style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Best for</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Round Robin', '4–10', 'n−1 (plays everyone)', 'League, youth, small events'],
              ['Knockout', '8, 16, 32', '1 (early exit possible)', 'Cups, finals, time-tight events'],
              ['Group + Knockout', '8–32', '2–3 (group games guaranteed)', 'Club tournaments, large events'],
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
        or <em>Settings</em> on an existing one. The Format dropdown shows all three options.
        Group + Knockout reveals additional settings for group count, playoff depth, and seeding.
        The format is locked once the first result is entered — decide before match day.
      </p>
      <p>
        Not sure which format fits your schedule?{' '}
        <Link to="/blog/how-to-estimate-tournament-duration" style={{ color: 'var(--color-accent)' }}>
          The tournament duration estimator
        </Link>{' '}
        helps you check whether the match count fits your available time.
      </p>
      <p>
        <Link to="/admin/register" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
          Create your tournament on Fixturday — it's free →
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
