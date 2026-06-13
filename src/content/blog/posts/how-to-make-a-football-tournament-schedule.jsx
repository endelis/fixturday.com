import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'how-to-make-a-football-tournament-schedule',
  title: 'How to Make a Football Tournament Schedule',
  description: 'Step-by-step guide to building a football tournament schedule. Covers game counts, the round-robin algorithm, multi-pitch timing, odd team numbers, and time slot calculation.',
  date: '2026-06-13',
  readTime: '8 min read',
  tags: ['scheduling', 'football', 'round-robin'],
  keywords: ['football tournament schedule', 'how to make tournament schedule', 'round robin schedule generator', 'tournament fixture generator', 'football tournament fixture list'],
}

const faqs = [
  {
    q: 'How many games does each team play in a round-robin tournament?',
    a: 'In a round-robin with N teams, each team plays N−1 games. With 8 teams, each team plays 7 games. The total number of games across the whole tournament is N×(N−1)÷2 — so 8 teams produce 28 games in total.',
  },
  {
    q: 'How do you schedule a tournament with an odd number of teams?',
    a: 'Add a phantom "bye" to make the count even. The team that draws a bye in any round sits out that round as a rest. A well-built schedule rotates the bye evenly so no team rests twice in a row.',
  },
  {
    q: 'How long does a one-day football tournament take to run?',
    a: 'As a rough guide: 8 teams on 2 pitches with 20-minute matches and 5-minute turnaround gaps takes around 3.5–4 hours of game time. Add 30–60 minutes for delays, lunch, and the prize ceremony.',
  },
  {
    q: 'How do you run games on multiple pitches simultaneously?',
    a: 'Divide each round into simultaneous time slots based on the number of pitches. With 2 pitches you run 2 matches at once. The only hard constraint: no team can appear on both pitches in the same slot.',
  },
  {
    q: 'Can I generate a football tournament schedule automatically?',
    a: 'Yes. Fixturday generates the complete schedule automatically once you enter your teams, number of pitches, and match duration. It handles odd team counts, rest periods, and multi-pitch allocation in seconds.',
  },
]

export default function FootballSchedulePost() {
  useEffect(() => {
    const id = 'faq-ld-football-schedule'
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
        The schedule is where most tournament organisers lose hours. You can plan everything perfectly — venue
        booked, teams confirmed, trophies ordered — and still have the day fall apart because games overrun,
        pitches sit idle, or a team plays three matches in a row with no rest. This guide walks through exactly
        how to make a football tournament schedule that keeps everything moving.
      </p>

      <h2>1. Start With Your Game Count</h2>
      <p>
        Before you can build a schedule you need to know your total number of games. The formula depends on your format:
      </p>
      <ul>
        <li>
          <strong>Round-robin:</strong> Total games = <em>N × (N − 1) ÷ 2</em>, where N is the number of teams.
          6 teams = 15 games. 8 teams = 28 games. 10 teams = 45 games.
        </li>
        <li>
          <strong>Group stage + knockout:</strong> Add up the round-robin games within each group, then count the
          knockout games separately. Four groups of 4 teams = 24 group games + 7 knockout games = 31 total.
        </li>
        <li>
          <strong>Knockout only:</strong> Total games = N − 1, always. 8 teams = 7 games. Clean and fast,
          but every team travels to play one match and may go home after 20 minutes.
        </li>
      </ul>
      <p>
        This number tells you immediately whether your plan is realistic. 45 games on one pitch at 25 minutes
        per slot is nearly 19 hours. That is not a one-day tournament.
      </p>

      <h2>2. Calculate Your Time Slots</h2>
      <p>
        A time slot = match duration + turnaround gap. For grassroots football, standard values are:
      </p>
      <ul>
        <li><strong>Match duration:</strong> 20 minutes per half for one-day events; 45 minutes for full fixtures</li>
        <li><strong>Turnaround gap:</strong> 5–10 minutes for changeover and warmup</li>
        <li><strong>Practical slot length:</strong> 25–30 minutes</li>
      </ul>
      <p>
        Total time slots needed = total games ÷ number of pitches. With 28 games and 2 pitches: 14 slots.
        At 25 minutes each: 14 × 25 = 350 minutes — just under 6 hours. A tight but realistic full-day event.
      </p>
      <p>
        For anything over 4 hours, build in a 30–45 minute lunch break. The most common scheduling mistake is
        forgetting it and losing 20 minutes mid-afternoon to teams who wandered off to find food.
      </p>

      <h2>3. Handle Odd Numbers of Teams</h2>
      <p>
        Round-robin scheduling works cleanly with even numbers. With 7 teams, 9 teams, or any odd count,
        add a phantom team called a <strong>bye</strong>. Any team that faces the bye in a given round
        sits that round out as a rest period.
      </p>
      <p>
        The key rule: rotate the bye position each round so every team gets exactly one rest across the tournament
        and no team rests twice in a row before a late-stage game.
      </p>

      <h2>4. Build the Fixture List With the Circle Method</h2>
      <p>
        The circle method is the standard algorithm for generating round-robin pairings. Here is how it works
        for 6 teams labelled 1–6:
      </p>
      <ol>
        <li>Fix team 1 in place. Arrange teams 2–6 in a row: 2, 3, 4, 5, 6.</li>
        <li>
          Round 1 pairings: pair the top and bottom of the list across — 1 vs 6, 2 vs 5, 3 vs 4.
        </li>
        <li>
          Round 2: rotate teams 2–6 one step to the right (6 moves to the front): 6, 2, 3, 4, 5.
          New pairings: 1 vs 5, 6 vs 4, 2 vs 3.
        </li>
        <li>
          Continue rotating for N−1 total rounds. After 5 rotations with 6 teams, every team has
          played every other team exactly once.
        </li>
      </ol>
      <p>
        This gives you your full fixture list — every matchup. The next step is assigning those matchups
        to pitches and real clock times.
      </p>

      <h2>5. Assign Fixtures to Pitches and Time Slots</h2>
      <p>
        The constraint is simple: a team can only play on one pitch at a time. Within each round,
        spread games across your pitches to run simultaneously:
      </p>
      <ul>
        <li>Round 1 has 3 games (6 teams). With 2 pitches: 2 games run in slot 1, 1 game runs in slot 2.</li>
        <li>Round 2 fills the remaining capacity of slot 2 plus slot 3.</li>
      </ul>
      <p>
        Check for rest violations after slotting: any team appearing in two consecutive slots has no rest.
        For adults this is usually acceptable in 20-minute-match formats. For youth football or hot weather,
        ensure every team has at least one slot off between appearances.
      </p>

      <h2>6. Convert to Real Start Times</h2>
      <p>
        Once the slot order is correct, step forward from your planned kick-off time by the slot length:
      </p>
      <ul>
        <li>09:00 — Slot 1: Pitch A — Team 1 vs 6 · Pitch B — Team 2 vs 5</li>
        <li>09:25 — Slot 2: Pitch A — Team 3 vs 4 · Pitch B — Team 1 vs 5</li>
        <li>09:50 — Slot 3: Pitch A — Team 2 vs 6 · Pitch B — Team 3 vs 1</li>
        <li>…</li>
        <li>12:30 — Lunch break (30 min)</li>
        <li>13:00 — Resume</li>
      </ul>
      <p>
        Print the full timed schedule and post copies at every pitch entrance and the information table.
        Send it to teams at least 48 hours before the event — teams that arrive late because they misread
        the start time are a guaranteed delay.
      </p>

      <h2>7. Or Generate It Automatically</h2>
      <p>
        Everything above is what <Link to="/">Fixturday</Link> does in one click. Enter your team list,
        set the number of pitches, match duration, and start time — the full schedule is generated instantly.
        It applies the circle method, handles byes for odd team counts, respects rest periods, and distributes
        games evenly across pitches.
      </p>
      <p>
        The result is a live public page teams can follow from their phones. Enter a result and standings
        update immediately — no spreadsheet, no whiteboard, no shouting across the car park.{' '}
        <Link to="/admin/register">Try it free →</Link>
      </p>
      <p>
        Not sure which format to use for your tournament?{' '}
        <Link to="/blog/knockout-vs-round-robin">Read: Knockout vs Round Robin — which format is right for you</Link>.
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
