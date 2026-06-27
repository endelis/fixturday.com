import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'pool-play-format-volleyball-tournaments',
  title: 'Pool Play Format for Volleyball Tournaments: How It Works and When to Use It',
  description: 'Pool play tournament format explained: how pool play works, how many teams per group, tiebreakers, advancing to the bracket, and when it beats a pure round robin.',
  date: '2026-06-28',
  readTime: '6 min read',
  tags: ['formats', 'scheduling', 'beach volleyball', 'catch\'n serve'],
  keywords: ['pool play tournament format', 'pool play format', 'volleyball pool play', 'how does pool play work', 'pool play vs round robin'],
}

const faqs = [
  {
    q: 'What is pool play in a tournament?',
    a: 'Pool play is a format where teams are divided into small groups (pools) and play a round robin within their group before advancing to a knockout stage. Every team plays the same number of pool matches regardless of results. Standings within each pool determine which teams qualify for the bracket, and at what seed.',
  },
  {
    q: 'How many teams should be in each pool?',
    a: 'Three to five teams per pool is standard for volleyball-based sports. Four teams is the most balanced: each team plays 3 matches, the total pool round takes 6 matches, and pools fit cleanly into a time block. Three-team pools play faster (3 matches total) but give each team fewer data points for tiebreaking. Five-team pools are thorough but slow — 10 matches per pool means the stage takes longer than most one-day event schedules allow.',
  },
  {
    q: 'How does seeding work when teams advance from pool play?',
    a: 'The standard approach is to seed teams across pools rather than filling the bracket pool-by-pool. Pool winners from each group are spread to opposite sides of the bracket, so pool winners cannot meet until the final. Second-place finishers fill in around them. This prevents the situation where strong pools eliminate each other early while weaker pools fill the other side of the bracket.',
  },
  {
    q: 'What happens when there is a three-way tie in pool play?',
    a: 'Most volleyball formats handle three-way ties by first comparing match points, then set ratio (sets won ÷ sets played), then point ratio (points scored ÷ points played), then the head-to-head results among only the tied teams. Applying head-to-head before ratios is a common mistake that can give counterintuitive results — use ratios first.',
  },
  {
    q: 'Can pool play work for beach volleyball and Catch\'n Serve Ball on the same day?',
    a: 'Yes — and it is common at multi-sport recreational events. The two sports can share courts with different match durations (beach volleyball matches are typically slightly longer). Run pools concurrently across the available courts, treating each sport as a separate division. The schedule generator needs to be told the number of courts allocated per sport so it does not double-book.',
  },
]

export default function PoolPlayFormatPost() {
  useEffect(() => {
    const id = 'faq-ld-poolplay'
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
        Pool play is the most widely used format in recreational volleyball and Catch&apos;n Serve Ball
        tournaments. It combines the fairness of a round robin — every team plays multiple matches — with
        the excitement of a knockout bracket at the end. This guide explains how to structure it, how
        standings work within each pool, and how to seed the knockout stage correctly.
      </p>

      <h2>What Is Pool Play?</h2>
      <p>
        Pool play divides teams into smaller groups, called pools, where every team plays every other
        team in the same pool exactly once. This is a round robin within the pool. After all pool matches
        are complete, standings are calculated for each pool and teams advance to a knockout bracket based
        on their standing.
      </p>
      <p>
        The key feature: every team is guaranteed a fixed number of pool matches before the bracket
        begins. A team cannot be eliminated in the first round the way they can in a pure knockout. This
        makes pool play popular for day-trip tournaments where teams travel to compete and want more than
        one or two matches for the entry fee.
      </p>
      <p>
        Pool play is the standard format used by beach volleyball and{' '}
        <Link to="/blog/how-to-organize-a-catch-n-serve-ball-tournament">
          Catch&apos;n Serve Ball
        </Link>{' '}
        tournament organisers across Latvia and Northern Europe.
      </p>

      <h2>How Many Teams Per Pool?</h2>
      <p>
        The number of teams per pool determines how many matches each team plays in the group stage. The
        formula is n × (n − 1) / 2, where n is the number of teams in the pool:
      </p>
      <ul>
        <li><strong>3 teams:</strong> 3 matches per pool — each team plays 2 matches</li>
        <li><strong>4 teams:</strong> 6 matches per pool — each team plays 3 matches</li>
        <li><strong>5 teams:</strong> 10 matches per pool — each team plays 4 matches</li>
      </ul>
      <p>
        Four teams per pool is the standard choice for most events. Three matches gives enough data for
        reliable tiebreakers, the total of 6 pool matches fits a time block with predictable duration, and
        four pools of four teams covers 16 teams — a common event size.
      </p>
      <p>
        Three-team pools make sense when the total team count does not divide evenly into groups of four,
        or when the schedule is very tight. Five-team pools are used for large international events where
        organisers want more guaranteed matches, but the 10 matches per pool requires either more courts
        or more time than most one-day events have.
      </p>

      <h2>How Pool Standings Work</h2>
      <p>
        Within each pool, teams are ranked by points earned across their pool matches. For beach
        volleyball and Catch&apos;n Serve Ball, this is the 3/2/1/0 match point system (a 2:0 win earns 3
        points; a 2:1 win earns 2 and the loser earns 1). Football pool play typically uses 3 points for
        a win, 1 for a draw, 0 for a loss.
      </p>
      <p>
        When two or more teams finish with equal points, tiebreakers apply. For set-based sports
        (volleyball, Catch&apos;n Serve Ball), the correct tiebreaker order is:
      </p>
      <ol>
        <li>Match points</li>
        <li>Set ratio (sets won ÷ sets played)</li>
        <li>Point ratio (points scored ÷ points played)</li>
        <li>Head-to-head result</li>
        <li>Alphabetical order</li>
      </ol>
      <p>
        A common mistake is applying head-to-head <em>before</em> set ratio. When three teams are tied,
        head-to-head comparisons among them often produce a circular result (A beat B, B beat C, C beat A)
        that still gives no ranking. Ratios resolve most three-way ties before head-to-head is needed.
      </p>
      <p>
        See the full tiebreaker logic in the{' '}
        <Link to="/blog/catch-n-serve-ball-scoring-rules">
          Catch&apos;n Serve Ball scoring rules guide
        </Link>
        {' '}for a detailed breakdown.
      </p>

      <h2>Advancing to the Knockout Stage</h2>
      <p>
        After all pool matches are played and standings are finalised, teams advance to the bracket.
        Most formats advance the top 1 or 2 teams per pool. Which teams advance depends on the event
        size and the bracket format:
      </p>
      <ul>
        <li>
          <strong>Top 1 per pool:</strong> Works well when you have enough pools to fill a clean bracket
          (4 pools = 4 teams in the semis). Simple, fast, and rewards winning the pool.
        </li>
        <li>
          <strong>Top 2 per pool:</strong> More inclusive. Doubles the bracket size. Requires 8 or more
          teams entering the bracket, which is typical for events with 4+ pools of 4.
        </li>
      </ul>
      <p>
        When advancing multiple teams per pool, seeding across the bracket matters. The correct approach:
        pool winners are placed in different bracket halves so they cannot meet until the final. The best
        pool winner (determined by head-to-head pool ranking among all winners) takes the top seed.
      </p>

      <h2>Pool Draw and Seeding</h2>
      <p>
        How teams are placed into pools before play begins affects the quality of competition. Two common
        approaches:
      </p>
      <p>
        <strong>Pot draw (snake seeding):</strong> Teams are ranked by known strength, previous
        tournament results, or registration order. The field is divided into seeding pots of equal size.
        Pool assignment proceeds snake-style: pool A takes pot 1, pool B takes pot 1, and so on, then
        reverses direction. This spreads strong and weak teams evenly across pools.
      </p>
      <p>
        <strong>Random draw:</strong> Simpler and fairer for events where team strength is genuinely
        unknown. All teams are drawn blind. This is common for first-time or open-entry events.
      </p>
      <p>
        For most recreational events where you do not have reliable rankings, a random draw is easier to
        run and avoids debates about seeding fairness.
      </p>

      <h2>Scheduling Pool Matches on Multiple Courts</h2>
      <p>
        Running multiple pools in parallel across several courts is the standard way to complete pool play
        within a few hours. The key constraint: no team can play two matches at the same time. Each court
        handles one match at a time; one pool can be distributed across multiple courts if needed, but you
        must ensure no team has back-to-back matches without a rest interval.
      </p>
      <p>
        A practical rule for volleyball-based sports: every team should have at least one match gap — one
        match played by others on the same court — between their own consecutive matches. With 30–40
        minute match slots, this gives teams at least half an hour of rest between games.
      </p>
      <p>
        Fixturday&apos;s scheduler generates pool play fixtures for all pools simultaneously. Set the number
        of courts and match duration; the scheduler distributes all pool matches without court conflicts
        or back-to-back violations. See the{' '}
        <Link to="/guide">tournament setup guide</Link> for a walkthrough.
      </p>

      <h2>Pool Play vs. Pure Round Robin</h2>
      <p>
        A pure round robin has every team play every other team in the event — not just teams in the same
        pool. For small events (4–6 teams), this is straightforward. For larger events, it becomes
        impractical: 12 teams × 11 opponents = 66 matches, which would take two full days on one court.
      </p>
      <p>
        Pool play solves this by trading completeness for feasibility. Not every team plays every other
        team — only those within the same pool. The knockout stage then provides cross-pool comparison.
        The tradeoff: pool composition affects which teams meet. A team in a weak pool may advance more
        easily than a stronger team in a hard pool.
      </p>
      <p>
        For tournaments with 8 to 32 teams, pool play with a knockout bracket is almost always the right
        format. Pure round robin works below 8 teams; a multi-phase group-based format works above 32.
      </p>
      <p>
        <Link to="/admin/register">Try pool play scheduling on Fixturday — free to start →</Link>
      </p>
      <p>
        Also useful:{' '}
        <Link to="/blog/how-to-organize-a-beach-volleyball-tournament">
          How to Organize a Beach Volleyball Tournament
        </Link>
        {' '}·{' '}
        <Link to="/blog/how-to-organize-a-catch-n-serve-ball-tournament">
          How to Organize a Catch&apos;n Serve Ball Tournament
        </Link>
      </p>

      <h2>Frequently Asked Questions</h2>
      <dl>
        {faqs.map((f, i) => (
          <div key={i} style={{ marginBottom: '1.25rem' }}>
            <dt><strong>{f.q}</strong></dt>
            <dd style={{ marginLeft: 0, marginTop: '0.4rem' }}>{f.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
