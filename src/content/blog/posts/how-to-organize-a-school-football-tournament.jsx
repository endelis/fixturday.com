import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'how-to-organize-a-school-football-tournament',
  title: 'How to Organize a School Football Tournament',
  description: 'Guide for teachers and PE coaches running a school football tournament. Covers format, scheduling, safeguarding, zero budget, and keeping it fun.',
  date: '2026-06-13',
  readTime: '7 min read',
  tags: ['school football', 'tournament organization', 'guide'],
  keywords: ['school football tournament', 'organize school football', 'school sports day football', 'school football competition', 'pe teacher football tournament'],
}

const faqs = [
  {
    q: 'What is the best format for a school football tournament?',
    a: 'For most school tournaments, round-robin is the best format. Every team plays multiple games, which keeps engagement high and avoids the situation where a team travels to school, loses one game, and sits out for the rest of the day. Save knockout brackets for the final stage once groups have been decided.',
  },
  {
    q: 'How many teams can you fit in a school lunchtime tournament?',
    a: 'On one pitch with 10-minute games and 2-minute changeovers, a lunchtime slot of 45 minutes fits roughly 5–6 teams in a round-robin. For more teams, run a two-day format or split across two pitches.',
  },
  {
    q: 'Do you need qualified referees for a school football tournament?',
    a: 'Not necessarily. For primary-age or informal inter-class tournaments, self-refereed games with teachers monitoring work well. For inter-school competitions or older age groups, a neutral referee per pitch reduces conflict and improves the experience significantly.',
  },
  {
    q: 'How do you handle big skill differences between teams in a school tournament?',
    a: 'Use smaller squads and shorter matches to reduce scoreline inflation. Award points for goals scored up to a cap (e.g. maximum 5 goals counted per game) to prevent heavy defeats from dominating the standings. A fair play award alongside the winner also shifts the culture.',
  },
  {
    q: 'What equipment do you need for a school football tournament?',
    a: 'At minimum: match balls (one per pitch), coloured bibs for team identification, a whistle per pitch, a scoreboard or results sheet, and basic first aid supplies. Cones for pitch boundaries are essential if you are using a field not already marked.',
  },
  {
    q: 'Do parents need to give consent for a school football tournament?',
    a: 'For intra-school events held on school grounds during the school day, existing parental consent for PE typically covers it. For inter-school events, travel, or events outside school hours, specific consent letters are usually required. Check your school\'s safeguarding policy.',
  },
]

export default function SchoolFootballPost() {
  useEffect(() => {
    const id = 'faq-ld-school-football'
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
        School football tournaments have a particular energy — the whole year group watching from the touchline,
        PE teachers sprinting between pitches with a clipboard, someone's goalkeeper arriving in school uniform
        because they forgot it was today. They are chaotic, brilliant, and completely worth the effort. But they
        also come with constraints that club tournaments do not: mixed ability levels, duty of care requirements,
        zero budget, and a school timetable to work around. This guide covers everything you need to know.
      </p>

      <h2>1. Choose the Right Format</h2>
      <p>
        The format you choose determines how many games each team plays and how long the whole event runs.
        For school tournaments, the priority is simple: every student should play as much football as possible.
      </p>
      <ul>
        <li>
          <strong>Round-robin (recommended for most school events):</strong> Every team plays every other team.
          No one goes home after one bad result. Works well for 4–8 teams in a single day.
        </li>
        <li>
          <strong>Group stage + knockout:</strong> Split teams into smaller groups for a round-robin phase,
          then the top finishers from each group go into a knockout final. Good for 8–16 teams and gives
          guaranteed games to everyone.
        </li>
        <li>
          <strong>Knockout only:</strong> Avoid this for school events unless it is a final stage. Teams
          that lose their first game spend the rest of the day watching.
        </li>
      </ul>
      <p>
        Not sure how the formats compare?{' '}
        <Link to="/blog/knockout-vs-round-robin">Read our full breakdown of knockout vs round-robin</Link>.
      </p>

      <h2>2. Set Up Divisions and Teams</h2>
      <p>
        In a school setting, the most natural split is by year group. This keeps physical development roughly
        equal and reduces the risk of older, bigger students dominating younger ones.
      </p>
      <p>Practical decisions to make upfront:</p>
      <ul>
        <li>
          <strong>Squad size:</strong> Fix it — 5 or 7 players per squad for small-sided games. Variable squad
          sizes create perception of unfairness and cause arguments about substitutions.
        </li>
        <li>
          <strong>Mixed or separated:</strong> For primary ages, mixed-gender tournaments often work well.
          For secondary ages, separate competitions or mixed teams both have merits — decide based on your
          school's culture and student preferences.
        </li>
        <li>
          <strong>Seeding:</strong> If you know some classes are significantly stronger, seed them into
          different groups so the final is competitive.
        </li>
      </ul>

      <h2>3. Sort the Logistics</h2>
      <p>
        School tournaments have specific constraints that club events do not. Get these confirmed before
        you announce the competition:
      </p>
      <ul>
        <li>
          <strong>Pitch access:</strong> Book the school field or sports hall. If sharing with other PE
          lessons, confirm the timetable is clear. Rain plan: do you have an indoor backup?
        </li>
        <li>
          <strong>Kit and bibs:</strong> Not every class has a football kit. Coloured bibs solve this.
          Have two or three colour sets available. Keep spares for muddy or torn ones.
        </li>
        <li>
          <strong>Balls:</strong> One ball per active pitch, plus two spares. Balls go over fences more
          often than you expect.
        </li>
        <li>
          <strong>First aid:</strong> A qualified first aider must be present throughout the event.
          A basic kit (ice packs, bandages, gloves) should be at each pitch.
        </li>
        <li>
          <strong>Staffing:</strong> One responsible adult per pitch minimum. Older students (Year 10+)
          can act as assistant referees or scorekeepers under teacher supervision.
        </li>
      </ul>

      <h2>4. Build the Schedule Around School Time</h2>
      <p>
        School events typically fall into one of three time formats:
      </p>
      <ul>
        <li>
          <strong>Lunchtime mini-tournament:</strong> 45–60 minutes total. One pitch, 5–6 teams,
          8–10 minute games. Great for a class competition spread across multiple lunch breaks.
        </li>
        <li>
          <strong>After-school tournament:</strong> 90–120 minutes. Two pitches, 8–12 teams, 12–15 minute
          games. Enough time for a full group stage plus a short final.
        </li>
        <li>
          <strong>Sports day format:</strong> All day, multiple pitches. Full group stage plus knockout.
          Requires the most planning but creates the best atmosphere.
        </li>
      </ul>
      <p>
        A common mistake: scheduling the final or semi-finals during a lesson slot and having half the
        school audience disappear. Build the knockout stage into lunch or the last period of the day.
      </p>
      <p>
        For generating the actual match schedule,{' '}
        <Link to="/">Fixturday</Link> produces the full fixture list automatically once you enter
        teams and the number of pitches. The public results page means students and parents can
        follow scores live from their phones.{' '}
        <Link to="/blog/how-to-make-a-football-tournament-schedule">
          See our guide to building tournament schedules step by step →
        </Link>
      </p>

      <h2>5. Safeguarding and Consent</h2>
      <p>
        For intra-school events held on school grounds during the school day, standard parental consent
        for PE activities usually applies. For anything involving external teams, travel, or events
        outside school hours, check your school's safeguarding policy — specific consent letters are
        typically required.
      </p>
      <p>Key safeguarding checkpoints:</p>
      <ul>
        <li>All supervising adults have current DBS checks (or local equivalent)</li>
        <li>First aider is present and identified to students</li>
        <li>Emergency contact numbers are available for all participants</li>
        <li>Photography and social media policy is clear — who can photograph, what can be shared</li>
        <li>Procedure for injuries is briefed to all staff before the event starts</li>
      </ul>

      <h2>6. Keep It Fun — Especially for Younger Ages</h2>
      <p>
        A school tournament should feel like an event, not a test. A few things that consistently improve
        the experience:
      </p>
      <ul>
        <li>
          <strong>Cap scorelines in standings.</strong> Count a maximum of 5 goals per game toward goal
          difference. A 12–0 win is demoralising for the losing side and creates unfair advantage in
          tiebreakers.
        </li>
        <li>
          <strong>Run a fair play award.</strong> A vote from the participating teachers for the team
          that showed the best attitude. Announce it alongside the winner — it shifts the culture noticeably.
        </li>
        <li>
          <strong>Give everyone something.</strong> Participation certificates printed from a template
          cost nothing and matter enormously to 10-year-olds. Every player should leave with something
          to show they took part.
        </li>
        <li>
          <strong>Announce scores publicly.</strong> A whiteboard with running standings, or a
          screen showing the live Fixturday results page, creates atmosphere and keeps teams invested
          in games they are not playing in.
        </li>
      </ul>

      <h2>7. After the Tournament</h2>
      <p>
        The event ends but the value does not have to. A few minutes of follow-up pays off:
      </p>
      <ul>
        <li>Share the final standings and results with the whole school — assembly, newsletter, school social media</li>
        <li>Use the results to identify students who might join the school team</li>
        <li>Ask one question in the next lesson: "What would make this better next year?" One question gets honest answers; a survey gets ignored</li>
        <li>Archive the results — knowing which class won two years ago is useful context when you are seeding groups next time</li>
      </ul>

      <p>
        Ready to set up the schedule?{' '}
        <Link to="/admin/register">Create your tournament on Fixturday — it's free →</Link>
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
