import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'tournament-registration-auto-close',
  title: 'When Tournament Registration Should Close Automatically',
  description: 'Tournament registration should close itself — when the team cap is hit, kickoff is near, or results are in. How automatic cutoffs protect the bracket.',
  date: '2026-06-24',
  readTime: '4 min read',
  tags: ['registration', 'organisation', 'admin'],
  keywords: ['tournament registration deadline', 'close tournament registration', 'tournament registration cutoff', 'auto close tournament registration', 'tournament team cap'],
}

const faqs = [
  {
    q: 'When should tournament registration close?',
    a: 'Registration should close no later than when the first match kicks off — ideally earlier, to give the organiser time to finalise the team list, generate the schedule, and communicate fixtures. Many organisers set a cutoff 24–48 hours before the tournament start. Automatic closing when the team cap is reached removes the need to monitor registration volume manually.',
  },
  {
    q: 'What happens if a team registers after the bracket is set?',
    a: 'A late registration after the fixture list is generated creates a problem with no clean solution. Adding the team means regenerating all fixtures, which disrupts teams that have already seen the schedule and planned their day. Refusing the registration after accepting the form is awkward. The cleanest approach is to prevent late registrations from being submitted in the first place by closing the form at the right time.',
  },
  {
    q: 'How does a team cap protect the tournament bracket?',
    a: 'Tournament formats work with specific team counts. A round-robin bracket for 8 teams generates 28 matches; adding a 9th team mid-process breaks the schedule entirely. A team cap closes registration automatically when the limit is reached, so the bracket is never put at risk by an extra late submission.',
  },
  {
    q: 'Should registration close when results start coming in?',
    a: 'Yes. Once results are being entered, the standings are being calculated and the tournament is effectively underway. A new registration at this point cannot be given a fair fixture list — they would either miss early rounds or disrupt the schedule for teams that have already played. Closing registration when results begin is the correct default.',
  },
  {
    q: 'Can registration be reopened after it closes automatically?',
    a: 'Yes. Automatic closing is a safeguard, not a permanent lock. Organisers can reopen registration manually from the admin panel if they need to add a late entry — for example, a team that withdrew and is being replaced. The auto-close simply ensures the form does not stay open indefinitely without any intervention.',
  },
]

export default function RegistrationAutoClosePost() {
  useEffect(() => {
    const id = 'faq-ld-reg-autoclose'
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
        A registration form that stays open too long creates problems that are harder to
        resolve than the problem it was trying to solve. A team submits on the morning of
        the tournament. The bracket is already set. The schedule is printed. You now have
        to choose between regenerating everything or telling a team that registered through
        the official form that they cannot play. Neither option is good. Automatic cutoffs
        exist to take this decision off the organiser's plate entirely.
      </p>

      <h2>The Three Moments Registration Should Close</h2>
      <p>
        Not all registration deadlines are the same. A well-designed registration system
        closes at the right moment for the right reason — and there are three distinct
        triggers that each protect the tournament in a different way.
      </p>

      <h2>1. When the Team Cap Is Reached</h2>
      <p>
        Every tournament format works with a specific number of teams. A group stage for
        16 teams generates a precise fixture count and playoff bracket. Adding a 17th team
        after the fact does not just mean one extra match — it means rebuilding the entire
        structure, potentially changing which teams are in which group, and redistributing
        advantages that were already in place.
      </p>
      <p>
        A team cap that closes registration automatically when the limit is hit prevents
        this entirely. The 17th team cannot submit a registration because the form is gone.
        There is no awkward conversation, no manual monitoring of the registration list,
        no risk of oversigning.
      </p>
      <p>
        This is different from a soft limit that requires the organiser to manually reject
        excess registrations. A soft limit means the form stays open, teams continue to
        submit, and the organiser has to notify late entrants that their application was
        refused — usually after they have already planned their day around participating.
        A hard cap is a better experience for everyone.
      </p>

      <h2>2. Within 24 Hours of the First Kickoff</h2>
      <p>
        Even if the cap has not been reached, registration should close before the
        tournament starts. The cutoff point is the moment when fixture generation and
        communication begins — typically 24 to 48 hours before the first match.
      </p>
      <p>
        A team that registers the night before the tournament cannot be given a schedule
        that is fair and consistent with the rest of the bracket. If the fixtures were
        generated with 12 teams, there is no slot for a 13th. If the schedule was already
        shared with participants, changing it affects every other team's planning.
      </p>
      <p>
        Closing registration automatically within 24 hours of the first kickoff removes
        the last window for late submissions without manual intervention. Organisers do
        not need to remember to turn registration off — it happens at the correct moment
        regardless.
      </p>

      <h2>3. Once Results Are Being Entered</h2>
      <p>
        A registration submitted after the first result is recorded is not just a
        scheduling problem — it is a fairness problem. Some teams have already played
        matches. Standings are already being calculated. There is no position in the
        bracket for a new arrival that does not disadvantage someone who entered on time.
      </p>
      <p>
        Closing registration when results begin is the cleanest cutoff: the tournament is
        now underway, and the team list is final. Any new participant should be directed
        to future events rather than the current one.
      </p>

      <h2>What Participants See When Registration Closes</h2>
      <p>
        The registration form should not simply disappear. Participants who arrive at the
        link after closing need to understand that registration has ended and, ideally,
        who to contact if they believe there has been a mistake.
      </p>
      <p>
        A clear "registration is closed" state — rather than a 404 or a blank page —
        reduces confusion and the volume of messages to the organiser. Showing the
        organiser's contact details on the closed page handles the edge cases where a
        participant needs to follow up directly.
      </p>

      <h2>Reopening When Needed</h2>
      <p>
        Automatic closing does not mean permanent locking. If a confirmed team withdraws
        and needs to be replaced, the organiser can reopen registration from the admin
        panel, accept the replacement entry, and close it again manually. Auto-close is
        a safeguard against the common case of accidental late submissions, not a
        restriction on the organiser's control.
      </p>

      <h2>How Fixturday Handles Registration Cutoffs</h2>
      <p>
        In Fixturday, registration closes automatically in all three situations described
        above: when the division hits its{' '}
        <Link to="/blog/how-to-limit-tournament-registration">team cap</Link>,
        within 24 hours of the first scheduled kickoff, and once match results start
        coming in. The Register button disappears from the public page and participants
        see a clear closed state with the organiser's contact details.
      </p>
      <p>
        Organisers can reopen registration at any time from the division settings.
        No configuration is required — the cutoffs are active by default on every division.
      </p>
      <p>
        <Link to="/admin/register">Create your free tournament →</Link>
      </p>
      <p>
        Related:{' '}
        <Link to="/blog/how-to-limit-tournament-registration">How to Limit Team Registrations for a Tournament</Link>
        {' · '}
        <Link to="/blog/how-to-organize-a-sports-tournament">How to Organise a Sports Tournament: The Complete Guide</Link>
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
