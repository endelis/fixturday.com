import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'multi-pitch-tournament-scheduling',
  title: 'Multi-Pitch Tournament Scheduling: Avoiding Time Conflicts Automatically',
  description: 'Scheduling a tournament across multiple pitches without conflicts is harder than it looks. How automatic conflict detection works and why it matters on match day.',
  date: '2026-06-24',
  readTime: '6 min read',
  tags: ['scheduling', 'organisation', 'pitches'],
  keywords: ['multi-pitch tournament scheduling', 'tournament pitch conflicts', 'tournament scheduling multiple pitches', 'tournament fixture conflicts', 'pitch scheduling software'],
}

const faqs = [
  {
    q: 'How do you schedule a tournament with multiple pitches?',
    a: 'The safest method is to use software that assigns fixtures to pitches automatically. For each time slot, the scheduler checks that: the same team is not playing twice at the same time, each pitch has exactly one match assigned, and there is enough rest time between consecutive games for each team. Doing this manually in a spreadsheet for more than two pitches and two divisions is error-prone and time-consuming.',
  },
  {
    q: 'What is a pitch conflict in a tournament?',
    a: 'A pitch conflict occurs when two matches are scheduled on the same pitch at the same time, or when a team is assigned to two matches in the same time slot across different pitches. Both cause problems on match day — in the first case, two sets of teams and referees arrive at the same pitch expecting to play; in the second, one team cannot be in two places simultaneously.',
  },
  {
    q: 'How many pitches do I need for a tournament?',
    a: 'The number of pitches needed depends on your total match count, available hours, and match duration (including changeover time). A general rule: divide the total number of matches by the number of time slots available per pitch to get the minimum pitch count. Most scheduling tools will calculate this for you if you input match duration, start time, and end time.',
  },
  {
    q: 'Can different age groups share pitches in a tournament?',
    a: 'Yes, and this is where conflict detection becomes essential. If Under-10 and Under-12 groups share the same pitches, the scheduler must ensure no two matches — from either division — are assigned to the same pitch at the same time. Each division\'s fixtures must be treated as part of one shared pitch pool, not scheduled independently.',
  },
  {
    q: 'What happens if a pitch conflict is not caught before match day?',
    a: 'Two teams show up at the same pitch expecting to play, with no resolution plan in place. The organiser has to reschedule one match on the spot, which pushes back subsequent fixtures, delays lunch breaks, and compresses the afternoon schedule. In the worst case, playoff timing is affected and a team advances based on a match that was played late or not at all.',
  },
]

export default function MultiPitchSchedulingPost() {
  useEffect(() => {
    const id = 'faq-ld-multi-pitch'
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
        A single-pitch tournament schedule is a list of matches with times. A multi-pitch
        tournament schedule is a constraint satisfaction problem with three axes — teams,
        pitches, and time slots — all of which must be consistent simultaneously.
        The difference between the two in terms of scheduling complexity is not linear.
        It is the difference between counting and solving.
      </p>

      <h2>What Makes Multi-Pitch Scheduling Hard</h2>
      <p>
        On a single pitch, the only constraint is that no two matches overlap in time.
        Add a second pitch and the constraints multiply: each team must appear on at most
        one pitch per time slot, each pitch must have at most one match per slot, and
        each team needs enough rest between consecutive matches. Add a third pitch and
        a second division sharing the same venue, and you are now coordinating several
        hundred pairwise constraints simultaneously.
      </p>
      <p>
        When organisers try to build this schedule manually —{' '}
        <Link to="/blog/why-excel-fails-tournament-management">often in a spreadsheet</Link>{' '}
        — they typically check each constraint visually, match by match, slot by slot.
        For a 3-pitch, 3-division tournament with 60 fixtures this means hundreds of
        manual cross-checks. Catching every conflict by eye is possible; catching every
        conflict reliably under time pressure while managing everything else involved in
        running a tournament is not.
      </p>

      <h2>The Three Types of Conflict to Prevent</h2>

      <h2>1. Team Double-Booking</h2>
      <p>
        A team is assigned to two matches in the same time slot — on different pitches,
        or even on the same pitch. This is the most common manual scheduling error.
        It happens most often when the fixture list for one division is built in isolation,
        without reference to the schedule of a division that shares the same team (for
        example, when a team has entered players in two age categories).
      </p>

      <h2>2. Pitch Overbooking</h2>
      <p>
        Two matches are scheduled on the same pitch at the same time. This is easy to
        catch in a single-division schedule, but becomes invisible when fixtures from
        multiple divisions are stored in separate sheets or files and never compared
        against each other. The conflict only surfaces when two sets of teams arrive
        at the same pitch at the same time.
      </p>

      <h2>3. Insufficient Rest Time</h2>
      <p>
        A team's next match is scheduled to start before they have finished their
        previous match plus the minimum rest period. In a fast-paced 5-a-side or
        beach volleyball format, this often happens when the scheduler tries to pack
        as many matches as possible into the morning session. A team that plays
        back-to-back with no break is physically disadvantaged and more likely to
        raise a complaint.
      </p>

      <h2>How Automatic Conflict Detection Works</h2>
      <p>
        Automatic scheduling software generates the complete fixture list first, then
        assigns matches to pitches and time slots while checking all three constraints
        simultaneously for every assignment. If an assignment would create a conflict,
        the scheduler tries the next available slot instead.
      </p>
      <p>
        Crucially, good conflict detection works across divisions — not just within one.
        When Division A already has a match on Pitch 2 at 10:30, the scheduler for
        Division B's fixtures must know this and skip that combination. Systems that
        schedule each division independently and then merge the results typically
        produce cross-division conflicts that neither individual schedule contained.
      </p>

      <h2>Cross-Division Conflict Detection in Practice</h2>
      <p>
        Consider a venue with three pitches running Under-10 and Under-12 divisions
        simultaneously. The Under-10 scheduler generates 18 fixtures and assigns them
        to Pitches 1, 2, and 3 across the morning. The Under-12 scheduler then generates
        its 24 fixtures — but it must start by reading the existing Under-10 assignments
        so it knows which pitch-slot combinations are already occupied.
      </p>
      <p>
        In Fixturday, when you generate a schedule for a division, the scheduler reads
        all existing bookings across every division in the same tournament before assigning
        any new fixture. A banner at the top of the scheduler form shows how many
        existing games were detected on the same pitches and date, so you know the conflict
        check has run. The resulting schedule is guaranteed conflict-free across all divisions.
      </p>

      <h2>What to Check Before Generating the Schedule</h2>
      <p>
        Automatic conflict detection removes the manual checking burden, but the inputs
        still need to be correct. Before running the scheduler:
      </p>
      <ul>
        <li><strong>Pitch count</strong> — confirm the actual number of usable pitches at the venue</li>
        <li><strong>Match duration</strong> — including changeover and warm-up time between fixtures</li>
        <li><strong>Start and end time</strong> — the window within which all fixtures must fit</li>
        <li><strong>Rest time</strong> — minimum gap between consecutive matches for each team</li>
        <li><strong>Team count</strong> — affects the total number of fixtures; verify it matches your confirmed registrations</li>
      </ul>
      <p>
        An accurate{' '}
        <Link to="/blog/how-to-estimate-tournament-duration">estimate of total tournament duration</Link>{' '}
        before scheduling helps you spot whether the combination of pitches and match count
        is realistic before any fixtures are generated.
      </p>

      <h2>Setting Up Multi-Pitch Scheduling in Fixturday</h2>
      <p>
        In <Link to="/">Fixturday</Link>, pitches are named and attached to a venue.
        When you generate a schedule for any division, the scheduler assigns fixtures
        to your named pitches and checks existing bookings across all divisions sharing
        the same venue and date. Per-pitch game numbering keeps the printed schedule
        readable — each pitch has its own game sequence rather than a single tournament-wide count.
      </p>
      <p>
        <Link to="/admin/register">Create your free tournament and generate a conflict-free schedule →</Link>
      </p>
      <p>
        Related:{' '}
        <Link to="/blog/how-to-make-a-football-tournament-schedule">How to Build a Football Tournament Schedule Step by Step</Link>
        {' · '}
        <Link to="/blog/how-to-estimate-tournament-duration">How to Estimate Total Tournament Duration</Link>
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
