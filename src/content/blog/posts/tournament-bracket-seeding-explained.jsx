import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'tournament-bracket-seeding-explained',
  title: 'Cross, Mirror, or Ranked: Tournament Bracket Seeding Explained',
  description: 'How teams advance from group stage into the knockout bracket changes who plays who — and when. Here\'s what cross, mirror, and ranked seeding actually mean, with concrete examples.',
  date: '2026-06-17',
  readTime: '5 min read',
  tags: ['bracket seeding', 'tournament format', 'group stage'],
  keywords: ['tournament bracket seeding', 'cross seeding tournament', 'mirror bracket seeding', 'ranked tournament bracket', 'group stage to knockout'],
}

const faqs = [
  {
    q: 'What is cross seeding in a tournament bracket?',
    a: 'Cross seeding pairs the best team from one group against the worst qualifier in the first round of knockout. For example, in a 4-team bracket drawn from 2 groups: Group A 1st vs Group B 2nd, and Group B 1st vs Group A 2nd. Teams from the same group cannot meet until the Final.',
  },
  {
    q: 'What is the difference between cross and mirror seeding?',
    a: 'Cross seeding ensures best vs worst matchups in round one and keeps same-group teams apart for as long as possible. Mirror seeding deliberately pairs teams from the same group — A1 vs A2, B1 vs B2 — so the group rivals meet immediately in the knockout stage.',
  },
  {
    q: 'When should I use ranked bracket seeding?',
    a: 'Use ranked seeding when you want the overall best group-stage performer to face the worst qualifier regardless of which group they came from. It is the purest meritocratic approach but requires all group fixtures to finish before the bracket can be set.',
  },
]

export default function BracketSeedingPost() {
  useEffect(() => {
    const id = 'faq-ld-seeding'
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
        You've split your teams into groups and the group stage is done. Now the bracket needs to be drawn.
        The seeding method you choose changes who plays who in round one — and whether the two strongest
        teams can even meet before the Final. Most tournament tools give you no choice. Here's what each
        option actually means.
      </p>

      <h2>The Scenario</h2>
      <p>
        Eight teams, two groups of four, top two from each group advance to a four-team knockout (Semi-Finals
        plus Final). The four advancing teams are: <strong>A1, A2, B1, B2</strong> (ranked by group standings).
        How they pair up in the bracket depends entirely on the seeding method.
      </p>

      <h2>Cross Seeding (Default)</h2>
      <p>
        Cross seeding pairs by position first, alternating groups: the bracket slots fill as
        A1, B1, A2, B2 — then paired best-vs-worst.
      </p>
      <ul>
        <li>Semi-Final 1: <strong>A1 vs B2</strong></li>
        <li>Semi-Final 2: <strong>B1 vs A2</strong></li>
      </ul>
      <p>
        The group winners get the easier draw (they face the runner-up from the other group).
        The two group winners cannot meet until the Final. This is the fairest approach for rewarding
        strong group-stage performance and is the standard used in most professional tournaments.
      </p>
      <p>
        <strong>Use cross seeding when:</strong> you want to reward the group winner with a softer
        round-one draw and keep potential finalists apart for as long as possible.
      </p>

      <h2>Mirror Seeding</h2>
      <p>
        Mirror seeding pairs group-first: A1 vs A2, B1 vs B2. The group rivals play each other
        immediately in the knockout round.
      </p>
      <ul>
        <li>Semi-Final 1: <strong>A1 vs A2</strong></li>
        <li>Semi-Final 2: <strong>B1 vs B2</strong></li>
      </ul>
      <p>
        This creates a rematch of group-stage rivals in the very first knockout game. It can make
        for a dramatic day — the group rivalry continues — but it means the best team in one group
        plays a harder round-one match than the best team in the other group. That feels unfair to
        some organisers.
      </p>
      <p>
        <strong>Use mirror seeding when:</strong> the storyline of group rivals meeting again matters
        more than bracket fairness — for example, a local derby tournament where the narrative is
        the point.
      </p>

      <h2>Ranked Seeding</h2>
      <p>
        Ranked seeding ignores group labels entirely. Once all group games are complete, all advancing
        teams are sorted by an overall standings comparison (points → goal difference → goals scored
        → alphabetical). The overall Rank 1 faces Rank 4, Rank 2 faces Rank 3.
      </p>
      <ul>
        <li>Semi-Final 1: <strong>Overall Rank 1 vs Overall Rank 4</strong></li>
        <li>Semi-Final 2: <strong>Overall Rank 2 vs Overall Rank 3</strong></li>
      </ul>
      <p>
        This is the purest meritocratic bracket. The best group-stage performer always gets the
        easiest knockout draw, regardless of which group they were in. The trade-off: you cannot
        print the knockout bracket until all group games are done, because the rankings aren't final
        until the last whistle.
      </p>
      <p>
        <strong>Use ranked seeding when:</strong> you want the bracket to fully reflect group-stage
        performance and are comfortable with a short wait after the last group game before announcing
        the knockout pairings.
      </p>

      <h2>How to Set Seeding in Fixturday</h2>
      <p>
        In the Divisions editor, under the Group + Knockout format settings, there is a
        <strong> Bracket seeding</strong> selector with all three options. Choose before generating
        fixtures. The bracket is built at fixture-generation time for cross and mirror (placeholders
        like "Group A-1" and "Group B-2" are set immediately). For ranked, the placeholders are
        "Rank 1", "Rank 2", etc. — and they are filled in when the admin clicks
        <em> Advance teams to playoff</em> after the group stage is complete.
      </p>
      <p>
        The seeding setting is locked once the first group-stage result is entered. Decide before match day.
      </p>

      <h2>Related Reading</h2>
      <p>
        Before choosing seeding, make sure your{' '}
        <Link to="/blog/how-to-configure-group-stage-brackets" style={{ color: 'var(--color-accent)' }}>
          group count and advancing numbers
        </Link>{' '}
        are configured correctly — seeding is meaningless if the advancing-per-group maths don't work out.
        Also see{' '}
        <Link to="/blog/how-to-choose-tournament-playoff-depth" style={{ color: 'var(--color-accent)' }}>
          Choosing Your Playoff Depth
        </Link>{' '}
        for how deep your knockout stage should go.
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
