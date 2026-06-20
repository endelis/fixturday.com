import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'beach-volleyball-scoring-rules',
  title: 'Beach Volleyball Scoring Rules Explained — Sets, Points, and Tiebreakers',
  description: 'Beach volleyball scoring rules: sets 1 and 2 to 21 points, deciding set to 15, win by 2 in all sets. How set ratio and point ratio are calculated for pool standings.',
  date: '2026-06-20',
  readTime: '5 min read',
  tags: ['beach volleyball', 'scoring', 'rules'],
  keywords: ['beach volleyball scoring rules', 'beach volleyball points', 'beach volleyball set rules', 'beach volleyball tiebreakers', 'beach volleyball pool standings'],
}

const faqs = [
  {
    q: 'How many sets are in a beach volleyball match?',
    a: 'A beach volleyball match is the best of three sets. Sets 1 and 2 are played to 21 points; if the match is tied 1-1 after two sets, a deciding third set is played to 15 points. If either team wins both sets 1 and 2, the match ends 2-0 and no deciding set is played.',
  },
  {
    q: 'What is the win-by-2 rule in beach volleyball?',
    a: 'A team must win each set by a margin of at least 2 points. If a set in rounds 1 or 2 reaches 20-20, play continues at 21-22, 22-23, and so on until one team leads by 2. The same rule applies to the deciding set: 14-14 continues until someone leads 16-14 or more. There is no cap on how high the score can go.',
  },
  {
    q: 'What does set ratio mean in beach volleyball pool standings?',
    a: 'Set ratio is sets won divided by sets played. A team that won 4 sets and lost 2 in pool play has a set ratio of 0.667. It is the first tiebreaker applied after match wins. A team with more match wins always ranks higher regardless of set ratio — set ratio only separates teams with the same number of match wins.',
  },
  {
    q: 'What does point ratio mean in beach volleyball standings?',
    a: 'Point ratio is total points scored divided by total points played (scored plus conceded). It is the tiebreaker applied after set ratio. A team that scored 189 points and conceded 155 in pool play has a point ratio of 189 ÷ 344 = 0.549. A higher ratio means a higher ranking when match wins and set ratio are equal.',
  },
  {
    q: 'How is the pool winner determined if two teams have the same record?',
    a: 'The sequence is: (1) most match wins, (2) higher set ratio, (3) higher point ratio, (4) head-to-head result between the tied teams. Head-to-head is rarely needed in practice because set ratio and point ratio almost always separate teams after three or more pool matches.',
  },
]

export default function BeachVolleyballScoringPost() {
  useEffect(() => {
    const id = 'faq-ld-bvb-scoring'
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
        Beach volleyball scoring rules are simple to follow once you understand the structure: a match
        is three sets maximum, every set has a minimum winning margin, and pool standings use set ratio
        and point ratio to break ties. Here is what each of those means in practice.
      </p>

      <h2>Match Structure: Best of Three Sets</h2>
      <p>
        Every beach volleyball match is best of three sets. The first team to win two sets wins the match.
      </p>
      <ul>
        <li><strong>Set 1:</strong> first to 21 points, win by at least 2</li>
        <li><strong>Set 2:</strong> first to 21 points, win by at least 2</li>
        <li><strong>Set 3 (deciding set, if needed):</strong> first to 15 points, win by at least 2</li>
      </ul>
      <p>
        A match that ends 2-0 lasted only two sets. A match that goes 2-1 played all three — the losing
        team won one set and came close to a full three-set contest.
      </p>
      <p>
        There are no draws in beach volleyball. Every match produces a clear winner. This makes scoring
        simpler than indoor volleyball and pool standings more decisive.
      </p>

      <h2>The Win-by-2 Rule</h2>
      <p>
        Every set requires a minimum 2-point winning margin. Reaching the target score of 21 (or 15 in
        the deciding set) is not enough if the other team is at 20 (or 14). Play continues.
      </p>
      <p>
        If set 1 reaches 20-20, the score continues at 21-21, 22-22, and so on until one team opens
        a two-point gap. The set ends at 22-20, 25-23, 31-29 — whatever it takes. There is no cap.
      </p>
      <p>
        The same applies to the deciding set. A score of 14-14 in set 3 means play continues at 15-15,
        16-16, until one team leads by 2. In practice, sets rarely extend past 25-23. Extended sets are
        memorable — and exhausting — when they do happen.
      </p>
      <p>
        For tournament organizers: factor in the possibility of long sets when estimating match duration.
        A scheduled 40-minute match can run 55 minutes if both sets reach 24-22. Build some buffer into
        your schedule.
      </p>

      <h2>Rally Point Scoring</h2>
      <p>
        Beach volleyball uses rally scoring: a point is awarded on every rally regardless of which team
        served. There are no side-out-only points. The team that wins the rally scores the point — and if
        they were the receiving team, they also take the serve.
      </p>
      <p>
        Teams switch sides every 7 points in sets 1 and 2 and every 5 points in the deciding set. This
        reduces the advantage of wind direction or sun angle on outdoor courts.
      </p>
      <p>
        Each team is allowed one technical time-out (30 seconds) per set, which occurs automatically
        when the leading team reaches 21 points in sets 1 and 2 — only if it has not been used. Each
        team also has one discretionary time-out (30 seconds) per set.
      </p>

      <h2>How Pool Standings Work</h2>
      <p>
        In pool play, teams are ranked by four criteria applied in sequence:
      </p>
      <ol>
        <li><strong>Match wins</strong> — the number of matches won, not sets</li>
        <li><strong>Set ratio</strong> — sets won ÷ sets played</li>
        <li><strong>Point ratio</strong> — points scored ÷ total points played (scored + conceded)</li>
        <li><strong>Head-to-head result</strong> — only between the tied teams</li>
      </ol>
      <p>
        Match wins always come first. A team with 3 match wins ranks above a team with 2, regardless of
        how dominant or narrow the victories were.
      </p>
      <p>
        Set ratio and point ratio become decisive when two or more teams have the same number of match
        wins — which is common in a 4-team pool where every team goes 1-2 or 2-1.
      </p>

      <h2>Set Ratio in Practice</h2>
      <p>
        Set ratio = sets won ÷ sets played.
      </p>
      <p>
        A team that wins two matches 2-0 and loses one match 0-2 has set ratio 4 ÷ 6 = 0.667.
        A team that wins two matches 2-1 and loses one match 1-2 has set ratio 5 ÷ 9 = 0.556.
        The first team ranks higher on set ratio even if both teams won the same number of matches.
      </p>
      <p>
        This rewards dominant victories and penalises teams that win matches narrowly while dropping sets
        unnecessarily. Winning 2-0 is always better for your pool ranking than winning 2-1.
      </p>

      <h2>Point Ratio in Practice</h2>
      <p>
        Point ratio = points scored ÷ (points scored + points conceded).
      </p>
      <p>
        Suppose two teams both have set ratio 0.667. Team A scored 187 points and conceded 140: ratio
        187 ÷ 327 = 0.572. Team B scored 162 points and conceded 120: ratio 162 ÷ 282 = 0.574. Team B
        ranks higher on point ratio despite scoring fewer total points.
      </p>
      <p>
        Point ratio rewards teams that score points efficiently relative to what they concede. A team that
        wins 21-10 gains more on point ratio than one that wins 21-19, even though both won the set.
      </p>
      <p>
        The practical implication: play for every point even in a set you are comfortably winning. Letting
        up at 20-8 costs you on point ratio — and in a tight pool, it could cost you advancement.
      </p>

      <h2>How Fixturday Applies These Rules</h2>
      <p>
        When you enter scores set by set in{' '}
        <Link to="/beach-volleyball-tournament-software">Fixturday</Link>, the system validates
        each set against the win-by-2 rule and the set target before saving. A score of 21-20 is
        rejected — not a valid winning margin. A score of 20-21 is rejected — the first team has not
        reached the target. Only valid scores are accepted.
      </p>
      <p>
        Pool standings update after every result, recalculating set ratio and point ratio for all teams
        in the pool. When a tiebreaker is resolved by head-to-head, the standings table reflects that
        automatically. You never open a calculator on match day.
      </p>
      <p>
        Read more:{' '}
        <Link to="/blog/how-to-organize-a-beach-volleyball-tournament">
          How to Organize a Beach Volleyball Tournament: A Step-by-Step Guide
        </Link>
      </p>
      <p>
        <Link to="/admin/register">Run your beach volleyball tournament free on Fixturday →</Link>
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
