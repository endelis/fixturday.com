import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'how-to-organize-a-catch-n-serve-ball-tournament',
  title: 'How to Organize a Catch\'n Serve Ball Tournament: A Step-by-Step Guide',
  description: 'Organize a Catch\'n Serve Ball tournament from registration to the final. Covers formats, scoring rules, scheduling, and what tournament software handles automatically.',
  date: '2026-06-28',
  readTime: '7 min read',
  tags: ['catch\'n serve', 'organisation', 'guide'],
  keywords: ['how to organize a catch\'n serve ball tournament', 'catch\'n serve ball tournament', 'catch and serve ball tournament', 'catch serve tournament', 'cs ball tournament format'],
}

const faqs = [
  {
    q: 'What format should I use for a Catch\'n Serve Ball tournament?',
    a: 'Pool play followed by a knockout bracket is the most common format and the one recommended by Latvian organisers. Divide teams into groups of 3 to 5 and play a round robin within each group. The top 1 or 2 finishers from each group advance to the knockout stage. For small events with up to 6 teams, a single round robin pool with a final is sufficient.',
  },
  {
    q: 'How many players does a Catch\'n Serve Ball team need?',
    a: 'Six players are on court at one time. Most tournament regulations allow a squad of up to 10 or 12 players for substitutions. Check the specific event regulations — some set a fixed squad size that must be declared before the first match.',
  },
  {
    q: 'Who can participate in a Catch\'n Serve Ball tournament?',
    a: 'Catch\'n Serve Ball is a women\'s sport. Most tournaments in Latvia follow the ICSBF eligibility rules: any woman aged 30 or older, or any mother regardless of age. Players who compete in professional volleyball leagues are typically excluded. Always specify eligibility clearly in your tournament regulations before registration opens.',
  },
  {
    q: 'What scoring rules does ICSBF use for Catch\'n Serve Ball?',
    a: 'Latvian tournaments use 15/15/11 scoring: sets 1 and 2 are played to 15 points, the deciding set to 11 points. All sets must be won by at least 2 points. International events may use 25/25/15 scoring instead. The match point system awards 3 points for a 2:0 win, 2 points for a 2:1 win, 1 point for a 2:1 loss, and 0 points for a 2:0 loss.',
  },
  {
    q: 'Do I need specialist software to run a Catch\'n Serve Ball tournament?',
    a: 'Software is not strictly required for small events, but it removes a significant amount of manual calculation. Catch\'n Serve Ball standings use a 3/2/1/0 point system with set ratio and point ratio as tiebreakers — this is tedious to calculate by hand across multiple pools. Fixturday supports Catch\'n Serve Ball natively, including the correct scoring system, standings calculation, and fixture generation.',
  },
]

export default function HowToOrganizeCatchNServePost() {
  useEffect(() => {
    const id = 'faq-ld-cs-organise'
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
        Catch&apos;n Serve Ball is one of the fastest-growing recreational sports in Latvia — and one of
        the least documented when it comes to tournament organisation. This guide covers everything an
        organiser needs to know: choosing a format, setting up registration, generating a schedule, and
        running match day without a spreadsheet in sight.
      </p>

      <h2>What Is Catch&apos;n Serve Ball?</h2>
      <p>
        Catch&apos;n Serve Ball is a women&apos;s net sport played on a volleyball court. The key difference
        from volleyball is that players <em>catch</em> the ball and then serve it over the net rather than
        hitting it in flight. This makes the game highly accessible — fast reflexes and jumping ability
        matter less than positioning and teamwork — which is why it has grown rapidly among recreational
        players and community sports clubs.
      </p>
      <p>
        Six players compete per side. Matches are best of three sets with a 15-point scoring system
        (or 25 points for international events). The sport is governed by the ICSBF — the International
        Catch&apos;n Serve Ball Federation — whose 2024 rule set is the standard used at Latvian tournaments.
      </p>

      <h2>Choose Your Format Before You Set a Date</h2>
      <p>
        The most practical format for a Catch&apos;n Serve Ball tournament is <strong>pool play followed by a
        knockout bracket</strong>. Divide teams into groups of 3 to 5 teams and play a round robin within
        each group. Pool standings determine seeding into the knockout stage, where the top 1 or 2 teams
        from each group advance.
      </p>
      <p>
        This format works well for 8 to 24 teams — the range most Latvian CS events fall into. It
        guarantees every team a minimum number of matches regardless of the knockout result, which matters
        when teams have travelled to compete.
      </p>
      <p>
        For smaller events with 4 to 6 teams, a single round robin pool followed by a final is enough.
        For very large events, split into two separate leagues after the pool stage — the top half of the
        field competes for the championship, the bottom half for a consolation placing.
      </p>
      <p>
        See the <Link to="/blog/pool-play-format-volleyball-tournaments">pool play format guide</Link> for
        a detailed breakdown of how pool standings and bracket seeding work together.
      </p>

      <h2>Plan Courts and Time</h2>
      <p>
        A standard Catch&apos;n Serve Ball court uses volleyball court dimensions. Allow at least one court
        per 4 teams in the pool stage to avoid excessive wait times between matches.
      </p>
      <p>
        CS matches typically run 30 to 45 minutes including changeover. Use 35 minutes as your planning
        estimate: a 4-team pool plays 6 matches, which takes roughly 3.5 hours on one court. Two pools
        running in parallel on two courts can process 8 teams in the same window.
      </p>
      <p>
        Work backwards from your target finish time. A 09:00 start with a 17:00 finish gives 8 hours —
        roughly 13 match slots per court. Three courts gives you 39 slots, which is enough for a
        12-team group stage (18 pool matches) plus a 6-team knockout bracket with a final.
      </p>

      <h2>Set Up Registration Properly</h2>
      <p>
        Catch&apos;n Serve Ball has specific eligibility rules. Most Latvian tournaments follow the ICSBF
        standard: women aged 30 or older, or mothers of any age. Players in professional volleyball
        leagues are excluded. State these rules clearly in your tournament regulations before you open
        registration — disputes about eligibility after the draw has been made are difficult to resolve.
      </p>
      <p>
        Capture the minimum at registration: team name, contact person, contact email, and player names
        (up to the squad limit you set). If your event requires players to bring a signed entry form with
        health declarations, state that requirement in the registration confirmation email.
      </p>
      <p>
        Set a hard registration deadline 5 to 7 days before the event. This gives you time to finalise
        the team list, draw pools, and generate the fixture schedule before sending it to teams. A late
        entry after the pools are drawn forces a reseed — avoid it.
      </p>
      <p>
        Fixturday gives every tournament a public registration page. Teams register from their phone;
        you approve entries from the admin panel and the team cap closes registration automatically when
        the limit is reached. Read more in the{' '}
        <Link to="/blog/how-to-limit-tournament-registration">registration limits guide</Link>.
      </p>

      <h2>Generate the Schedule</h2>
      <p>
        Once registration closes and pools are drawn, generate the fixture schedule. A round robin within
        each pool produces n × (n − 1) / 2 matches per group: 3 teams = 3 matches, 4 teams = 6 matches,
        5 teams = 10 matches. Spread fixtures so no team plays back-to-back on the same court — every
        team should have at least one match gap between consecutive games.
      </p>
      <p>
        For the knockout bracket, generate fixtures after pool play is complete and seedings are confirmed.
        The standard seeding pattern places pool winners on opposite sides of the bracket.
      </p>
      <p>
        Fixturday generates both the round robin and the knockout bracket automatically. Set the number
        of courts and match duration; the scheduler distributes fixtures without conflicts. See the{' '}
        <Link to="/guide">tournament setup guide</Link> for a step-by-step walkthrough.
      </p>

      <h2>Run Match Day from a Phone</h2>
      <p>
        The day before: confirm courts are marked correctly, nets are at the right height, and you have
        spare balls available. Send the fixture schedule to all teams — post it to the tournament public
        page the evening before so captains can plan their day.
      </p>
      <p>
        On match day, open the matchday board as soon as the first whistle blows. Enter scores set by
        set — Fixturday validates each score against the correct CS rules and rejects impossible results
        before they corrupt your standings. Pool tables update after every result is saved.
      </p>
      <p>
        Teams and spectators check live standings and upcoming fixtures on the public tournament page on
        their phone. Print a paper copy of the bracket as a backup if the venue has poor signal. The QR
        code on the admin overview links directly to the public page — stick it to the scoreboard so
        players can scan it themselves.
      </p>

      <h2>What Fixturday Handles Automatically</h2>
      <p>
        Catch&apos;n Serve Ball standings are not simple to calculate by hand. The system awards 3 points for
        a 2:0 win, 2 points for a 2:1 win, 1 point for a 2:1 loss, and 0 points for a 2:0 loss. Tiebreakers
        require set ratio and point ratio — both calculated across all pool matches. Doing this with a pen
        and paper after six rounds of play on three courts is a realistic source of errors and disputes.
      </p>
      <p>
        Fixturday handles all of it: scoring validation, standings calculation with correct tiebreakers,
        and bracket progression. It supports both 15/15/11 scoring (the Latvian standard) and 25/25/15
        scoring (international events) — set per division so mixed-format events work without confusion.
      </p>
      <p>
        <Link to="/admin/register">Start your Catch&apos;n Serve Ball tournament on Fixturday →</Link>
      </p>
      <p>
        Also useful:{' '}
        <Link to="/blog/how-to-organize-a-sports-tournament">
          How to Organize a Sports Tournament: The Complete Guide
        </Link>
        {' '}·{' '}
        <Link to="/blog/catch-n-serve-ball-scoring-rules">
          Catch&apos;n Serve Ball Scoring Rules Explained
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
