import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'how-to-configure-group-stage-brackets',
  title: 'How to Configure Group Stage Brackets: 2, 3, or 4 Groups?',
  description: 'Choosing the right number of groups changes how fair your tournament feels and how long it runs. This guide walks through the maths so you can decide before the first whistle.',
  date: '2026-06-17',
  readTime: '5 min read',
  tags: ['group stage', 'tournament format', 'brackets'],
  keywords: ['group stage tournament bracket generator', 'how many groups in a tournament', 'tournament group stage setup', 'football tournament groups'],
}

const faqs = [
  {
    q: 'How do I decide how many groups to use in a tournament?',
    a: 'Divide your confirmed team count by the number of groups and aim for 3–5 teams per group. For 12 teams: 2 groups of 6, 3 groups of 4, or 4 groups of 3 are all valid. More groups means shorter group stages but fewer guaranteed games per team before knockout.',
  },
  {
    q: 'Can I have an odd number of teams in a group?',
    a: 'Yes — one team in the group will receive a bye each round. With 3 teams in a group, each team plays 2 group games. The bracket generator handles this automatically using the circle-method rotation.',
  },
  {
    q: 'What happens if teams are unevenly distributed across groups?',
    a: 'Fixturday uses snake seeding: the strongest-seeded teams are spread across groups so that no single group is stacked. Extra teams from an uneven split go to the earlier groups.',
  },
]

export default function GroupStageBracketsPost() {
  useEffect(() => {
    const id = 'faq-ld-group-brackets'
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
        Most tournament software just picks the number of groups for you. Fixturday doesn't — because
        the organiser knows their event better than an algorithm does. Here's how to make the right call.
      </p>

      <h2>Why Group Count Is a Real Decision</h2>
      <p>
        The number of groups controls three things at once: how many games each team plays before knockout,
        how balanced the bracket feels, and how long the group stage runs. Getting it wrong means teams
        are knocked out after two games, or the group stage eats the entire day.
      </p>
      <p>
        Most tournament software either fixes two groups or auto-calculates based on a target group size.
        Neither approach lets the organiser weigh up the actual trade-offs. Fixturday gives you a selector —
        2, 3, or 4 groups — and shows the advancing-per-group maths live before you save.
      </p>

      <h2>The Basic Maths</h2>
      <p>
        Start with your confirmed team count and your planned playoff depth. The number of advancing spots
        in the playoff equals: <strong>2 for a Final, 4 for Semi-Finals, 8 for Quarter-Finals,
        16 for a Round of 16</strong>. Divide that by your group count to get the teams advancing per group —
        that number must be a whole number, otherwise the bracket doesn't close.
      </p>
      <p>
        Example: 12 teams, Semi-Finals (4 playoff spots).
      </p>
      <ul>
        <li><strong>2 groups</strong> → 6 teams per group, top 2 advance. Each team plays 5 group games. Long group stage.</li>
        <li><strong>4 groups</strong> → 3 teams per group, top 1 advances. Each team plays 2 group games. Very short group stage.</li>
        <li><strong>3 groups × 4 spots = 1.33 per group</strong> → this doesn't divide evenly. Fixturday blocks the save and tells you why.</li>
      </ul>
      <p>
        So for 12 teams with Semi-Finals, the valid options are 2 groups (top 2) or 4 groups (top 1).
        Which you pick depends on your available time and how much group-stage football you want.
      </p>

      <h2>Practical Scenarios</h2>
      <p>
        <strong>8 teams, one afternoon:</strong> 2 groups of 4, top 2 advance to Semi-Finals. Each team
        plays 3 group games plus potentially 2 knockout games. Fits comfortably in 4–5 hours on two pitches.
      </p>
      <p>
        <strong>16 teams, full day:</strong> 4 groups of 4, top 2 advance to Quarter-Finals. Each team
        plays 3 group games plus up to 3 knockout games. Needs two pitches minimum and ~7 hours.
      </p>
      <p>
        <strong>10 teams, flexible format:</strong> 2 groups of 5, top 2 advance to Semi-Finals.
        Or expand to Quarter-Finals: top 4 per group can't work with 2 groups of 5 (that's 8 spots
        from 10 teams — fine mathematically). Choose based on how deep you want the knockout phase.
      </p>

      <h2>The Lock-In Rule</h2>
      <p>
        Once the first group-stage result has been entered, the group count and advancing count are locked.
        Fixturday enforces this because changing group structure after results exist would invalidate
        standings and break the bracket. Plan before you generate — changing your mind later means
        deleting fixtures and starting again.
      </p>

      <h2>How to Set It in Fixturday</h2>
      <ol>
        <li>Go to <strong>Divisions</strong> and click Edit on the relevant division.</li>
        <li>Set the format to <strong>Group + Knockout</strong>.</li>
        <li>Choose <strong>Number of groups</strong> (2, 3, or 4) and <strong>Playoff depth</strong>.</li>
        <li>The live validation row shows advancing teams per group. Green means it divides cleanly; red means pick a different combination.</li>
        <li>Save, then generate fixtures from the Fixtures page.</li>
      </ol>
      <p>
        The group bracket generator then seeds teams using snake order — first team to Group A,
        second to Group B, third to Group C, fourth back to Group B, and so on — so no single group
        ends up loaded with all the top-registered teams.
      </p>

      <h2>Related Reading</h2>
      <p>
        Once your groups are configured, the next decision is how teams advance into the knockout bracket.
        See{' '}
        <Link to="/blog/tournament-bracket-seeding-explained" style={{ color: 'var(--color-accent)' }}>
          Cross vs Mirror vs Ranked Seeding
        </Link>{' '}
        and{' '}
        <Link to="/blog/how-to-choose-tournament-playoff-depth" style={{ color: 'var(--color-accent)' }}>
          Choosing Your Playoff Depth
        </Link>{' '}
        for the next steps.
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
