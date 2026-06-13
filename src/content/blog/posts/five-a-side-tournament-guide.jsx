import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'five-a-side-tournament-guide',
  title: 'How to Organize a 5-a-Side Tournament: The Complete Guide',
  description: 'Everything you need to run a 5-a-side tournament — rules, pitch setup, format selection, scheduling for any number of teams, and match day management. Free tournament software included.',
  date: '2026-06-13',
  readTime: '8 min read',
  tags: ['5-a-side', 'football', 'tournament organization'],
  keywords: ['5-a-side tournament', 'five a side tournament', 'organize 5 a side tournament', '5v5 football tournament', '5-a-side tournament rules'],
}

const faqs = [
  {
    q: 'How many players are in a 5-a-side team?',
    a: 'A 5-a-side team has 5 players on the pitch at once, including the goalkeeper. Squad sizes for a tournament are typically 7–8 players to allow rolling substitutions throughout the event.',
  },
  {
    q: 'What are the standard rules for 5-a-side football?',
    a: '5-a-side is typically played on a smaller pitch with no offside rule, rolling substitutions (players can be swapped at any time without stopping play), a smaller goal, and a kick-in or roll-in instead of a throw-in when the ball goes out. Exact rules vary by organiser — the key is to set and communicate them before the first game.',
  },
  {
    q: 'How long does a 5-a-side tournament take?',
    a: 'With 8 teams in a round-robin on one pitch and 12-minute games, the tournament takes around 3.5 hours. Add a second pitch and it drops to under 2 hours. Efficient scheduling is what makes 5-a-side ideal for evenings and short venue hire windows.',
  },
  {
    q: 'How many teams can you have in a 5-a-side tournament?',
    a: 'There is no hard limit. 6–10 teams is the sweet spot for a one-pitch, single-day event. For larger competitions, split into groups and run multiple pitches simultaneously. Fixturday handles any number of teams and pitches automatically.',
  },
  {
    q: 'Is offside used in 5-a-side football?',
    a: 'Most 5-a-side tournaments do not use offside. The pitch is too small and the game moves too fast for offside to be called accurately without trained referees. Removing offside also speeds up play and reduces disputes.',
  },
  {
    q: 'What size pitch do you need for a 5-a-side tournament?',
    a: 'A standard 5-a-side pitch is roughly 30–40 metres long and 20–30 metres wide. Indoor sports halls and astroturf cage pitches typically already match these dimensions. For outdoor events on a full pitch, mark out the smaller area with cones.',
  },
]

export default function FiveASidePost() {
  useEffect(() => {
    const id = 'faq-ld-five-a-side'
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
        5-a-side is the most efficient format in amateur football. Small squads, short games, no need for a
        full pitch — you can run a competitive tournament with 8 teams in a sports hall in under three hours.
        But that efficiency only shows up if the organisation is right. This guide covers everything from
        setting the rules to handing out the prize at the end.
      </p>

      <h2>1. Set the Rules Before Anyone Arrives</h2>
      <p>
        5-a-side has no single universal ruleset. Organisations and regions have their own variations,
        and grassroots tournaments often adapt further. What matters is that your rules are clear,
        written down, and communicated to every team captain before the first kick-off.
      </p>
      <p>The decisions you need to make:</p>
      <ul>
        <li>
          <strong>Offside:</strong> Almost all 5-a-side tournaments play without offside. The pitch is too
          small for offside to be enforced fairly without dedicated linesmen, and removing it speeds the game up.
        </li>
        <li>
          <strong>Restart when ball goes out:</strong> Kick-in (the ball is placed on the line and kicked
          back into play) or roll-in (goalkeeper rolls it in from the side). Kick-ins are more common outdoors;
          roll-ins work well in cage pitches. No throw-ins — they are impractical with gloves on.
        </li>
        <li>
          <strong>Goalkeeper restrictions:</strong> Decide whether keepers can handle back passes and
          how far they can distribute. Many 5-a-side tournaments restrict keepers from crossing the halfway
          line.
        </li>
        <li>
          <strong>Rolling substitutions:</strong> Players come off and on without stopping play. This is
          standard in 5-a-side and is what allows a squad of 7–8 to stay fresh through multiple games.
        </li>
        <li>
          <strong>Match duration:</strong> 10–15 minutes per game is standard for a tournament. Enough
          for the game to breathe, short enough to fit many teams into a day.
        </li>
        <li>
          <strong>Heading:</strong> For youth or mixed-age events, consider banning heading for safety.
          Many modern small-sided formats do this.
        </li>
      </ul>
      <p>
        Write these on a single page and either email it to teams before the event or post it at the
        entrance on the day. "That is not the rule we play by" mid-tournament is avoidable.
      </p>

      <h2>2. Choose Your Tournament Format</h2>
      <p>
        5-a-side suits three main formats, depending on how many teams you have and how much time you have:
      </p>
      <ul>
        <li>
          <strong>Round-robin (6–8 teams, one pitch):</strong> Every team plays every other team. All teams
          get multiple games. Best for a half-day event where you want maximum game time per team.
          With 8 teams on one pitch at 12 minutes per game, the full round-robin takes about 3.5 hours.
        </li>
        <li>
          <strong>Group stage + knockout (8–16 teams):</strong> Split into groups of 4, play a round-robin
          within each group, top 2 from each group advance to knockout rounds. This is the most satisfying
          structure for larger competitions — everyone gets guaranteed games, and the best teams meet in the final.
        </li>
        <li>
          <strong>Straight knockout (any size):</strong> Works when you have a lot of teams and limited time.
          Fast and dramatic, but teams that travel to play one game and lose go home quickly. Avoid for
          community or social events.
        </li>
      </ul>
      <p>
        For a deep comparison of formats,{' '}
        <Link to="/blog/knockout-vs-round-robin">read our full guide on knockout vs round-robin tournaments</Link>.
      </p>

      <h2>3. Plan the Pitch and Equipment</h2>
      <p>
        A 5-a-side pitch is roughly 30–40 metres long and 20–30 metres wide. If you are hiring a dedicated
        5-a-side or futsal facility, the pitch is already the right size. If you are using a full football
        pitch or a school field, mark out the boundaries with cones.
      </p>
      <p>Equipment checklist per pitch:</p>
      <ul>
        <li>Match ball (size 4 for youth, size 5 for adults) — bring 2 per pitch as spares</li>
        <li>Two small goals — standard 5-a-side goals are 3m wide × 1.2m high</li>
        <li>Cones for boundary lines if not marked</li>
        <li>Coloured bibs — at least 4 colour sets to avoid kit clashes</li>
        <li>Whistle and stopwatch per pitch</li>
        <li>Basic first aid kit</li>
        <li>Results sheet or phone for entering scores</li>
      </ul>
      <p>
        If you are running multiple pitches simultaneously, assign one person per pitch whose only job is
        keeping time and reporting the final score immediately after each game. Waiting for score updates
        is the most common cause of schedule delays.
      </p>

      <h2>4. Build the Schedule</h2>
      <p>
        5-a-side scheduling follows the same principles as any round-robin tournament, but the short game
        times make rest management more important. A team that plays three 12-minute games in a row with
        no break is at a significant disadvantage — fatigue shows fast in small-sided football.
      </p>
      <p>
        The basic rule: every team should have at least one game gap between appearances. With one pitch
        and 6 teams, 5 games are running at any given round — the two teams not playing are resting.
        With multiple pitches running simultaneously, rest gaps shrink and need to be checked explicitly.
      </p>
      <p>
        <Link to="/">Fixturday</Link> builds the schedule automatically — enter your teams, set match
        duration and number of pitches, and it generates a timed fixture list that respects rest periods
        and distributes games evenly.{' '}
        <Link to="/blog/how-to-make-a-football-tournament-schedule">
          Read our full scheduling guide if you want to build it manually →
        </Link>
      </p>

      <h2>5. Manage the Day</h2>
      <p>
        5-a-side moves fast. Games finish and the next one needs to start within a few minutes or the
        schedule slips. A few things that keep everything on track:
      </p>
      <ul>
        <li>
          <strong>Brief all team captains together before the first game.</strong> Cover the rules, the schedule,
          where to report scores, and what to do if a player is injured. 10 minutes upfront saves 30 minutes
          of individual conversations during the event.
        </li>
        <li>
          <strong>Post the schedule visibly.</strong> A printed version at each pitch entrance and a live
          version on the Fixturday public page. Players checking "when do we play next" should be able to
          find the answer without asking you.
        </li>
        <li>
          <strong>Enter results immediately.</strong> Every team wants to see the standings. The moment
          a game ends, the score goes in — then the standing table is live for everyone to see on their phone.
        </li>
        <li>
          <strong>Call teams to their pitch 3 minutes early.</strong> Announce the upcoming game across
          the event area. Teams straggling from the sideline is the single biggest cause of 5-a-side
          schedule slippage.
        </li>
        <li>
          <strong>Have a rain plan ready.</strong> Outdoor 5-a-side pitches are usually playable in light
          rain but not in storms or heavy hail. Know in advance whether you delay, move indoors, or cancel,
          and communicate that policy to teams before the event.
        </li>
      </ul>

      <h2>6. Run the Final and Prize Ceremony</h2>
      <p>
        For group stage formats, the final is the natural climax. For round-robin, the winner is determined
        by the standings — make this announcement a moment, not an afterthought.
      </p>
      <p>
        Keep the ceremony brief. Announce the standings from third place up. Hand out medals or trophies
        on the pitch, not in a car park. If you have a fair play award or top scorer, announce those
        alongside the winner. Two minutes of ceremony is enough — the teams have other plans.
      </p>
      <p>
        After the event, the Fixturday public page retains the full results and standings permanently.
        Share the link in your team group chat — it is a clean record of the day that everyone can look
        back on.
      </p>

      <p>
        <Link to="/admin/register">Set up your 5-a-side tournament on Fixturday — free →</Link>
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
