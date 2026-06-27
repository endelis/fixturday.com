import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'catch-n-serve-ball-scoring-rules',
  title: 'Catch\'n Serve Ball Scoring Rules Explained: Sets, Points, and Standings',
  description: 'Catch\'n Serve Ball scoring rules: 15/15/11 sets, the 3/2/1/0 match point system, tiebreakers, and how Latvian standings differ from international format.',
  date: '2026-06-28',
  readTime: '6 min read',
  tags: ['catch\'n serve', 'scoring', 'rules'],
  keywords: ['catch\'n serve ball scoring rules', 'catch\'n serve ball rules', 'catch and serve ball scoring', 'cs ball scoring system', 'catch serve ball points'],
}

const faqs = [
  {
    q: 'What is the scoring system in Catch\'n Serve Ball?',
    a: 'Latvian tournaments use 15/15/11 scoring. Sets 1 and 2 are played to 15 points. The deciding set (set 3) is played to 11 points. All sets must be won by a margin of at least 2 points — there is no cap. International events may use 25/25/15 instead, which is the ICSBF extended format.',
  },
  {
    q: 'How are match points awarded in Catch\'n Serve Ball?',
    a: 'Match points use a 3/2/1/0 system based on the set score. A 2:0 win earns 3 match points for the winner and 0 for the loser. A 2:1 win earns 2 match points for the winner and 1 for the loser. This means every match gives out 3 points total, and even a team that loses 2:1 earns 1 point — rewarding competitive performance.',
  },
  {
    q: 'What are the tiebreakers for Catch\'n Serve Ball standings?',
    a: 'When two or more teams are tied on match points after pool play, tiebreakers are applied in order: (1) set ratio — total sets won divided by total sets played; (2) point ratio — total points scored divided by total points played; (3) head-to-head result between the tied teams; (4) alphabetical order as a final resort.',
  },
  {
    q: 'When do teams change sides during a Catch\'n Serve Ball match?',
    a: 'In sets 1 and 2, teams change sides between sets. In the deciding set (set 3), teams also change sides when one team reaches 6 points (standard format) or 8 points (extended 25/25/15 format). The mid-set side change prevents any court advantage from persisting through an entire deciding set.',
  },
  {
    q: 'What is the difference between Latvian and international Catch\'n Serve Ball scoring?',
    a: 'Latvian tournaments use 15/15/11 scoring, which was chosen to make matches faster-paced and more suitable for recreational tournament formats. The international ICSBF format uses 25/25/15 scoring, more similar to indoor volleyball. Both formats use the same 3/2/1/0 match point system and the same win-by-2 rule.',
  },
]

export default function CatchNServeScoringPost() {
  useEffect(() => {
    const id = 'faq-ld-cs-scoring'
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
        Catch&apos;n Serve Ball uses a scoring system that rewards every competitive set, not just match
        wins. If you&apos;re entering your first tournament or setting one up, understanding the 15/15/11
        set structure, the 3/2/1/0 match point system, and how tiebreakers work will help you compete
        more strategically — and set up standings correctly.
      </p>

      <h2>The Set Scoring System: 15/15/11</h2>
      <p>
        A Catch&apos;n Serve Ball match is best of three sets. In Latvian tournaments, the scoring targets are:
      </p>
      <ul>
        <li><strong>Set 1:</strong> First to 15 points, win by 2</li>
        <li><strong>Set 2:</strong> First to 15 points, win by 2</li>
        <li><strong>Set 3 (deciding):</strong> First to 11 points, win by 2</li>
      </ul>
      <p>
        There is no point cap. If a set reaches 15–15, play continues until one team leads by 2 (17–15,
        18–16, and so on). The same applies to the deciding set at 11: once both teams reach 10–10, the
        set plays out until someone leads by 2.
      </p>
      <p>
        The shorter deciding set (to 11 rather than 15) is intentional. A third set tends to be
        high-pressure and slower-paced; the lower target keeps momentum high and prevents matches from
        running significantly over time.
      </p>
      <p>
        In set 3, teams change sides when the leading team reaches 6 points. This mid-set side change
        prevents any lighting, wind, or surface advantage from persisting through the entire deciding set.
      </p>

      <h2>The Match Point System: 3/2/1/0</h2>
      <p>
        Catch&apos;n Serve Ball does not use a simple win/loss point system. Instead, every match distributes
        exactly 3 points between the two teams depending on the set score:
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-muted, #8892a4)' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Result</th>
            <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem' }}>Winner pts</th>
            <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem' }}>Loser pts</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '0.5rem 0.75rem' }}>2:0 (win without dropping a set)</td>
            <td style={{ textAlign: 'center', padding: '0.5rem 0.75rem' }}>3</td>
            <td style={{ textAlign: 'center', padding: '0.5rem 0.75rem' }}>0</td>
          </tr>
          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
            <td style={{ padding: '0.5rem 0.75rem' }}>2:1 (win after losing a set)</td>
            <td style={{ textAlign: 'center', padding: '0.5rem 0.75rem' }}>2</td>
            <td style={{ textAlign: 'center', padding: '0.5rem 0.75rem' }}>1</td>
          </tr>
        </tbody>
      </table>
      <p>
        The practical implication: a team that wins two matches 2:0 earns 6 points, while a team that
        wins the same two matches 2:1 earns only 4 points. Teams are rewarded for dominant performance,
        not just for reaching a result. Equally, a team that loses 2:1 twice earns 2 points — still
        relevant for tiebreakers and potential advancement in some formats.
      </p>
      <p>
        This system is borrowed from volleyball and futsal leagues and makes late-stage pool matches
        meaningful even when playoff places are already decided. It discourages teams from playing
        passively once a match result is secured.
      </p>

      <h2>How Standings Are Calculated</h2>
      <p>
        Pool standings sort teams by match points first. When teams finish with equal match points,
        tiebreakers are applied in order:
      </p>
      <ol>
        <li><strong>Set ratio</strong> — total sets won ÷ total sets played across all pool matches</li>
        <li><strong>Point ratio</strong> — total points scored ÷ total points played across all pool matches</li>
        <li><strong>Head-to-head result</strong> — the result of the direct match between tied teams</li>
        <li><strong>Alphabetical order</strong> — used only if all other tiebreakers are equal</li>
      </ol>
      <p>
        Set ratio and point ratio are calculated as fractions, not differences. A team that won 8 sets
        out of 10 played has a set ratio of 0.80. This matters: a team that played fewer matches (because
        one opponent withdrew) gets a proportionally fairer comparison than a simple sets-won count would
        give.
      </p>
      <p>
        Head-to-head is only applied <em>after</em> ratios. Many recreational tournaments skip ratio
        calculation and jump to head-to-head, which can produce unintuitive results when three teams are
        tied. The correct order is: points → set ratio → point ratio → h2h → alphabet.
      </p>

      <h2>What Happens in the Deciding Set</h2>
      <p>
        Set 3 to 11 is faster than sets 1 and 2, but the rules around it are otherwise identical. The
        serving team scores a point on every rally (rally scoring). A team wins the set as soon as it
        reaches 11 with a 2-point lead. The side change at 6 points applies.
      </p>
      <p>
        One common misunderstanding: the deciding set does <em>not</em> start from 0–0 on the side each
        team finished on after set 2. Teams select or flip for serving and court side at the start of set
        3, as if it were the first set. Some formats use a coin flip; others use the set 1 serving team
        reversing. Check your specific event regulations.
      </p>

      <h2>The Extended Scoring Format: 25/25/15</h2>
      <p>
        ICSBF international events use a longer scoring format: sets 1 and 2 to 25 points, set 3 to 15
        points. The match point system (3/2/1/0) and win-by-2 rule are unchanged.
      </p>
      <p>
        The 25/25/15 format produces longer matches — typically 45 to 60 minutes versus 30 to 40 minutes
        for the Latvian standard. International tournaments use it because longer sets give technical teams
        more time to impose their style. For recreational one-day events, 15/15/11 is better suited to
        fitting multiple rounds and a bracket into a single day.
      </p>
      <p>
        In 25/25/15 play, the mid-deciding-set side change happens at 8 points (not 6) to reflect the
        longer set duration.
      </p>
      <p>
        Fixturday supports both formats. You can set scoring per division — so a tournament with a Junior
        division on 15/15/11 and an Open division on 25/25/15 works without any manual configuration. See
        the <Link to="/guide">tournament setup guide</Link> for how to configure divisions.
      </p>

      <h2>Common Scoring Mistakes to Avoid</h2>
      <p>
        <strong>Entering final set scores instead of set-by-set scores.</strong> Catch&apos;n Serve Ball
        standings depend on point totals across every individual set, not just the final match score.
        Always record each set score separately.
      </p>
      <p>
        <strong>Using volleyball point rules.</strong> Standard volleyball uses a 25/25/15 cap where
        teams must win by 2 but the cap stops the extension (e.g. 25–24 is not possible; play continues
        until 26–24). Catch&apos;n Serve Ball has no cap — a set can go 20–18 if needed.
      </p>
      <p>
        <strong>Applying simple win/loss points.</strong> Some organisers new to the sport treat a CS
        match like a football match: 3 points for a win, 0 for a loss. This ignores the 2:1 result, which
        should award 2 and 1 respectively.
      </p>
      <p>
        <Link to="/blog/how-to-organize-a-catch-n-serve-ball-tournament">
          How to Organize a Catch&apos;n Serve Ball Tournament →
        </Link>
      </p>
      <p>
        <Link to="/blog/pool-play-format-volleyball-tournaments">
          Pool Play Format for Volleyball Tournaments →
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
