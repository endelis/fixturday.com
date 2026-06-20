import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'how-to-estimate-tournament-duration',
  title: 'How to Estimate Total Tournament Duration Before Match Day',
  description: 'Calculate how long a football tournament will take using game count, pitch count, game duration, gap between games, and lunch break. Includes the formula and a live calculator.',
  date: '2026-06-17',
  readTime: '5 min read',
  tags: ['scheduling', 'tournament planning', 'match day'],
  keywords: ['how long does a football tournament take', 'tournament duration calculator', 'football tournament schedule time', 'estimate tournament length'],
}

const faqs = [
  {
    q: 'How long does a football tournament take?',
    a: 'A typical one-day youth football tournament with 8 teams, 2 pitches, 20-minute games, and 5-minute gaps between games takes approximately 4–5 hours of active play. Adding a lunch break of 45 minutes and a playoff stage brings the full day to 6–7 hours.',
  },
  {
    q: 'How many games fit on one pitch in a day?',
    a: 'With 20-minute games and 5-minute gaps, each pitch hosts one game every 25 minutes. Over an 8-hour window (9:00–17:00), that\'s a maximum of about 19 games per pitch. In practice, aim for 14–16 to allow for delays.',
  },
  {
    q: 'Does the tournament duration include playoff games?',
    a: 'Yes. The Fixturday duration estimator counts all fixtures — group stage and knockout — in the total. Adding a Quarter-Final round to a Semi-Final tournament adds approximately 2–4 additional time slots depending on pitch count.',
  },
]

export default function TournamentDurationPost() {
  useEffect(() => {
    const id = 'faq-ld-duration'
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
        "How long will the tournament take?" is usually answered by guessing, then running 30 minutes
        over. The answer is actually a calculation. Here's the formula, the variables that matter,
        and how to run it before you commit to a venue booking.
      </p>

      <h2>The Formula</h2>
      <p>
        Total duration = <strong>(slots × game duration) + ((slots − 1) × gap) + lunch break</strong>
      </p>
      <p>
        Where <strong>slots = ⌈total fixtures ÷ pitches⌉</strong> (ceiling division — round up).
      </p>
      <p>
        Each "slot" is a moment in time when one or more pitches are running games. With two pitches,
        two games happen simultaneously in each slot. The gap is the time between one slot ending and
        the next starting — used for teams to change ends, pitches to be marked, referees to record
        results. The last slot has no gap after it, hence (slots − 1) gaps.
      </p>

      <h2>Working Through an Example</h2>
      <p>
        8 teams, group + Semi-Final format: 2 groups of 4, top 2 advance.
      </p>
      <ul>
        <li>Group stage: 6 games per group × 2 groups = 12 group games</li>
        <li>Knockout: 2 semi-finals + 1 final + 1 third-place match = 4 knockout games</li>
        <li>Total fixtures: 16</li>
        <li>Pitches: 2</li>
        <li>Slots: ⌈16 ÷ 2⌉ = 8</li>
        <li>Game duration: 20 min, Gap: 5 min</li>
      </ul>
      <p>
        Duration = (8 × 20) + (7 × 5) = 160 + 35 = <strong>195 minutes = 3h 15min</strong>.
        Add a 45-minute lunch break: <strong>4h 0min</strong>.
      </p>
      <p>
        That's the pure game time. Add 30 minutes for opening ceremony and final presentation,
        and you have a ~4.5 hour event. Book the venue for 5 hours to allow for delays.
      </p>

      <h2>The Levers You Control</h2>
      <p>
        <strong>Pitches.</strong> Doubling pitches roughly halves the duration. Going from 1 to 2 pitches
        on a 16-game tournament cuts the time from 6h 15min to 3h 15min. This is the single most
        impactful variable.
      </p>
      <p>
        <strong>Game duration.</strong> Youth tournaments commonly use 15–25 minute games. Dropping
        from 20 to 15 minutes saves 5 minutes per slot — on 8 slots that's 40 minutes, not nothing
        but less dramatic than adding a pitch.
      </p>
      <p>
        <strong>Playoff depth.</strong> Every additional knockout round adds more fixtures. Going from
        Semi-Finals to Quarter-Finals adds 4 more games. On 2 pitches, that's 2 more slots — 50 more
        minutes. See{' '}
        <Link to="/blog/how-to-choose-tournament-playoff-depth" style={{ color: 'var(--color-accent)' }}>
          Choosing Your Playoff Depth
        </Link>{' '}
        for the trade-off in detail.
      </p>
      <p>
        <strong>Team count.</strong> More teams means more group games. An 8-team group-stage tournament
        generates 12 group games; a 12-team tournament generates 18. This is the variable most
        organisers can't easily control once registration opens, which is why{' '}
        <Link to="/blog/how-to-limit-tournament-registration" style={{ color: 'var(--color-accent)' }}>
          registration limits
        </Link>{' '}
        matter — you lock in the team count before it affects the schedule.
      </p>

      <h2>The Live Estimator in Fixturday</h2>
      <p>
        When you open the Schedule modal in the Fixtures section, Fixturday shows an estimated duration
        bar that updates in real time as you adjust the inputs: game duration, gap between games, pitch
        count, and lunch break window. The estimate covers all fixtures — group stage and knockout — so
        you see the full match day length before committing to a schedule.
      </p>
      <p>
        The formula used is the one above. If the estimate is too long, you can reduce game duration,
        add more pitches, or go back to the Divisions settings and reduce playoff depth or team count.
        The estimate changes the moment you adjust the input — no need to generate the schedule first
        to find out it won't fit.
      </p>

      <h2>Lunch Break Calculation</h2>
      <p>
        If you set a lunch break window (e.g., 12:00–12:45), the scheduler skips that time slot.
        The duration estimator adds the lunch window to the total. A 45-minute lunch on an otherwise
        3h 15min card gives you 4 hours — and the schedule engine will automatically skip any game
        that would start during the lunch window and resume after it.
      </p>

      <h2>Planning Backwards from a Finish Time</h2>
      <p>
        If you need to finish by 17:00 and your estimate shows 5h 30min with a 09:00 start,
        something needs to change. Work the levers in order: first add a pitch if the venue allows,
        then reduce game duration, then consider a shallower playoff. Changing group count or team
        limit is also an option if registration is still open.
      </p>
      <p>
        The guide at{' '}
        <Link to="/guide" style={{ color: 'var(--color-accent)' }}>
          fixturday.com/guide
        </Link>{' '}
        walks through the full tournament setup workflow, including where to find the scheduler and
        duration estimator in the admin panel.
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
