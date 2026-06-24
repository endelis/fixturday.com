import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'tournament-public-schedule-page',
  title: 'Why Your Tournament Schedule Needs a Public Page (Not a WhatsApp Message)',
  description: 'A shared link beats a WhatsApp PDF every time. How a public tournament schedule page reduces match-day questions and keeps every participant informed.',
  date: '2026-06-24',
  readTime: '5 min read',
  tags: ['organisation', 'match day', 'participants'],
  keywords: ['tournament schedule online', 'share tournament schedule', 'public tournament page', 'tournament schedule for participants', 'live tournament results'],
}

const faqs = [
  {
    q: 'How do I share a tournament schedule with participants?',
    a: 'The most effective method is a public URL that participants bookmark and check on their phones. Share the link in an email or on a poster — or print a QR code at the venue. Unlike a PDF or screenshot, a live page updates automatically when fixtures or results change.',
  },
  {
    q: 'Why is a WhatsApp schedule not enough for a tournament?',
    a: 'A WhatsApp message with a schedule screenshot creates three problems: the schedule is already out of date if anything changes, not everyone is in the group, and a photo of a table is hard to read on a small screen. A live public page solves all three — it\'s always current, accessible to anyone with the link, and designed to work on mobile.',
  },
  {
    q: 'Do participants need to create an account to view the schedule?',
    a: 'No. A good public tournament page requires no login, no app download, and no account of any kind. Anyone with the link can view the schedule, standings, and results in real time.',
  },
  {
    q: 'What should a tournament schedule page show?',
    a: 'At minimum: kick-off time, home team, away team, pitch or court number, and the result once it\'s entered. For multi-division events, a filter or tab to switch between divisions makes it easy to find the relevant fixtures quickly.',
  },
  {
    q: 'Can the schedule page update in real time during the tournament?',
    a: 'Yes. Fixturday\'s public schedule page uses live updates — when an organiser saves a result on the matchday screen, it appears on the public schedule within seconds. Participants do not need to refresh the page manually.',
  },
]

export default function TournamentPublicSchedulePost() {
  useEffect(() => {
    const id = 'faq-ld-public-schedule'
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
        Before the first match kicks off, participants have already checked the schedule
        three times. Who do we play first? Which pitch? What time? A WhatsApp message with
        a screenshot answers those questions once — and then becomes wrong the moment anything
        changes. A public schedule page answers them indefinitely, for everyone, without any
        extra work from the organiser.
      </p>

      <h2>The WhatsApp Schedule Problem</h2>
      <p>
        The default approach to sharing a tournament schedule is a group chat with a photo
        of the fixture list. It works well enough in the 24 hours before the event.
        By match day it has broken in at least three ways.
      </p>
      <p>
        First, the schedule in the photo is already out of date. A team withdrew, a pitch
        changed, two fixtures swapped times — none of those updates reach everyone in the
        group, and people spend the morning following a schedule that no longer exists.
      </p>
      <p>
        Second, not everyone is in the group. The parent who dropped their child off and
        wants to check the next kick-off time is not in the organiser's contact list.
        The referee who arrived to cover a late withdrawal has no way to see the fixtures.
        The coach from the visiting team is not in the local group chat.
      </p>
      <p>
        Third, a screenshot of a table is illegible on a phone at arm's length in bright
        sunlight. Participants pinch and zoom, lose their place, and ask you anyway.
      </p>

      <h2>What a Public Schedule Page Does Instead</h2>
      <p>
        A public tournament schedule page is a URL — one link that any participant can
        open on any device, at any time, with no account required. It shows the full fixture
        list with kick-off times, pitch assignments, and results as they come in.
      </p>
      <p>
        When a result is entered by the organiser, it appears on the public page within
        seconds. When a fixture time changes, the updated time is visible immediately.
        No resending, no screenshots, no group chat management.
      </p>
      <p>
        The link is shareable in any format — email, registration confirmation, poster,
        or printed QR code at the venue entrance. Once shared, it keeps working for the
        entire duration of the tournament.
      </p>

      <h2>What the Page Should Show</h2>
      <p>
        A useful public schedule page covers:
      </p>
      <ul>
        <li><strong>Kick-off time</strong> — displayed clearly, in local format</li>
        <li><strong>Teams</strong> — home and away, or in beach volleyball, pair names</li>
        <li><strong>Pitch or court</strong> — essential when multiple pitches are in use</li>
        <li><strong>Result</strong> — appears automatically once entered by the organiser</li>
        <li><strong>Division filter</strong> — for multi-division events, a way to view only the relevant age group or category</li>
      </ul>
      <p>
        Anything beyond this is secondary. The core job is letting participants answer
        "when do we play, and where" without calling anyone.
      </p>

      <h2>The Phone Test</h2>
      <p>
        Any schedule page you use should pass the phone test: can a coach standing on a
        touchline in bright sunlight, with one eye on a game and their phone in one hand,
        find their next kick-off time in under ten seconds?
      </p>
      <p>
        A PDF fails this test. A spreadsheet screenshot fails this test. A page with small
        text that requires horizontal scrolling fails it. A mobile-first page with one
        fixture per row, large team names, and a bold time column passes it.
      </p>

      <h2>The Reduction in Match-Day Messages</h2>
      <p>
        Organisers who switch from WhatsApp schedules to a public page consistently report
        the same effect: the volume of "what time do we play?" messages drops immediately.
        Not because people become less curious, but because the question is already answered
        before anyone has to ask it.
      </p>
      <p>
        That reduction matters most during the busiest periods of the day — when groups
        are finishing, tiebreakers are being resolved, and playoff fixtures are being
        confirmed. Those are exactly the moments when you cannot afford to stop and answer
        the same message for the sixth time.
      </p>

      <h2>Setting Up a Public Schedule</h2>
      <p>
        In <Link to="/">Fixturday</Link>, every tournament gets a public schedule page
        automatically. Once you{' '}
        <Link to="/blog/how-to-make-a-football-tournament-schedule">generate the fixture schedule</Link>,
        it appears at a fixed URL that participants can bookmark. Results entered on the
        matchday screen update the public page in real time.
      </p>
      <p>
        You can share the link directly or use the QR code on the tournament overview page —
        print it once and post it at the venue for anyone who arrives without the link.
      </p>
      <p>
        <Link to="/admin/register">Create your free tournament and public schedule →</Link>
      </p>
      <p>
        Related:{' '}
        <Link to="/blog/tournament-info-page">What to Publish on Your Tournament Info Page Before Match Day</Link>
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
