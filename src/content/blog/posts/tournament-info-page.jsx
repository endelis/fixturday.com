import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'tournament-info-page',
  title: 'What to Publish on Your Tournament Info Page Before Match Day',
  description: 'A tournament info page gives participants rules, venue details, and the schedule in one place. What to include and why it cuts your match-day message volume.',
  date: '2026-06-24',
  readTime: '4 min read',
  tags: ['organisation', 'match day', 'participants'],
  keywords: ['tournament information page', 'tournament rules for participants', 'tournament day information', 'share tournament rules', 'tournament public page'],
}

const faqs = [
  {
    q: 'What should a tournament info page include?',
    a: 'At minimum: venue name and address, start time and schedule format, rules (or a link to the rulebook PDF), the number of divisions, how many teams advance to playoffs, tiebreaker rules, and organiser contact details. If registration is still open, a registration link belongs there too.',
  },
  {
    q: 'How do I share tournament information without a group chat?',
    a: 'A public tournament page with a fixed URL is the most reliable method. Share the link once — in an email, on a poster, or via QR code at the venue — and participants can check it from their phones at any time. Unlike a group chat, the page always shows the current information.',
  },
  {
    q: 'Can participants access the tournament page without an account?',
    a: 'Yes. Fixturday public pages require no login, no app download, and no account. Anyone with the link (or who scans the QR code) can view the schedule, standings, results, team list, and rules.',
  },
  {
    q: 'How does a QR code help on match day?',
    a: 'A printed QR code at the venue entrance or scoreboard eliminates the need to verbally share a URL. Participants scan it with their phone camera, go directly to the live standings and schedule, and stop asking the organiser for updates.',
  },
  {
    q: 'When should I publish tournament information?',
    a: 'Publish the basics (venue, date, format, rules) at least a week before the tournament. Update with the final fixture schedule as soon as it\'s generated. Participants use the info page to plan travel and preparation — the earlier the better.',
  },
]

export default function TournamentInfoPagePost() {
  useEffect(() => {
    const id = 'faq-ld-info-page'
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
        Every organiser answers the same questions on match day. What time does it start?
        Where exactly is the venue? How many teams go through? What are the rules for a
        disputed goal? A tournament info page answers all of them before anyone has to ask —
        and it keeps answering them while you're busy running the event.
      </p>

      <h2>Why Participants Need Their Own Page</h2>
      <p>
        The organiser's view of a tournament — the admin dashboard, the schedule builder,
        the registration list — is not designed for the people competing. Coaches, players,
        and parents need a simple, mobile-friendly page they can bookmark and check from the
        car park: when do we play, on which pitch, and who are we up against.
      </p>
      <p>
        Most organisers solve this with a mix of WhatsApp messages, PDF attachments, and
        verbal instructions at the venue. These all fail in the same way: they're out of date
        almost immediately, they reach different people at different times, and they create
        a flood of "just to confirm..." messages that land during the busiest parts of your day.
      </p>
      <p>
        A single public URL that participants bookmark solves the distribution problem permanently.
        Every update you make is visible to everyone, instantly, without resending anything.
      </p>

      <h2>What to Put on the Info Page</h2>
      <p>
        The goal is to answer every question a participant might have before they arrive at the venue.
        In practice, that means six categories of information:
      </p>

      <h2>1. Venue and Logistics</h2>
      <p>
        Name, address, and a map link. If the venue has multiple pitches or entrances, be
        specific about which one to use for registration and warm-up. Parking information
        is worth adding if it's non-obvious — a coach arriving late to find no parking spaces
        is a predictable problem with a simple fix.
      </p>

      <h2>2. Schedule Format</h2>
      <p>
        How many games does each team play in the group stage? How many teams advance to
        playoffs? What is the tiebreaker order if teams finish level on points? These are
        the questions that cause arguments at a tournament — not because people are difficult,
        but because the answers weren't clearly communicated in advance.
      </p>
      <p>
        Publishing this on the info page removes the ambiguity. When a tiebreaker situation
        arises, you can point to the page rather than making a ruling on the spot.
      </p>

      <h2>3. Rules</h2>
      <p>
        Publish the core rules as text and, if you have an official rulebook, upload it as
        a PDF. Text rules should cover the essentials: match duration, ball size, number of
        players per side, substitution rules, and disciplinary procedures for yellow and red
        cards. A PDF attachment is useful for referees and for situations where the text
        summary doesn't cover an edge case.
      </p>
      <p>
        Having rules in writing — on a page with a timestamp — means disputes are resolved
        by reference, not by memory.
      </p>

      <h2>4. Live Schedule and Results</h2>
      <p>
        The{' '}
        <Link to="/blog/how-to-make-a-football-tournament-schedule">fixture schedule</Link>{' '}
        should be accessible from the info page as soon as it's generated. Participants want
        to know their kick-off times before arriving, and they want to track results in real
        time once the day starts. A static PDF schedule becomes outdated the moment a fixture
        moves; a live schedule updates automatically.
      </p>

      <h2>5. Organiser Contact</h2>
      <p>
        Even with a complete info page, something will come up that isn't covered. A visible
        phone number and email address — clickable on mobile — means participants can reach
        you quickly when they need to. It also signals that someone is accountable for the event.
      </p>

      <h2>6. Registration Status</h2>
      <p>
        If registration is still open, the info page is the right place to link to the
        registration form. Once the tournament is underway and results are being entered,
        the register button disappears automatically so latecomers don't waste time filling
        in a form that will never be processed.
      </p>

      <h2>The QR Code Shortcut</h2>
      <p>
        Once the info page is set up, generate a QR code that links to it. Print one A4 sheet
        and stick it at the venue entrance, the scoreboard, or the organiser's table.
        Participants scan it with their phone camera — no URL to type, no group to join,
        no message to search for — and go straight to live results and the schedule.
      </p>
      <p>
        The QR code works especially well for parents who weren't in the pre-tournament
        communication but show up on the day wanting to follow the results.
      </p>

      <h2>Publish Early, Update Often</h2>
      <p>
        The earlier you publish the info page, the more useful it is. Venue and format can
        go up weeks before the tournament. Rules should be published as soon as they're
        finalised. The fixture schedule goes up once teams are confirmed and the{' '}
        <Link to="/blog/how-to-organize-a-sports-tournament">schedule is generated</Link>.
      </p>
      <p>
        On match day, you update results. The page handles everything else.
      </p>

      <h2>Setting Up a Tournament Info Page</h2>
      <p>
        In <Link to="/">Fixturday</Link>, the info page is created automatically for every
        tournament. Add your rules text and upload a PDF from the tournament settings.
        The QR code appears on the admin overview page — ready to print at any size without
        losing quality. The schedule and standings update in real time as results come in.
      </p>
      <p>
        <Link to="/admin/register">Create your free tournament →</Link>
      </p>
      <p>
        Related:{' '}
        <Link to="/blog/how-to-organize-a-sports-tournament">How to Organise a Sports Tournament: The Complete Guide</Link>
        {' · '}
        <Link to="/blog/free-tournament-management-software-guide">Free Tournament Management Software — What to Look For</Link>
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
