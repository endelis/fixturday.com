import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export const meta = {
  slug: 'how-to-limit-tournament-registration',
  title: 'How to Limit Team Registrations for a Tournament',
  description: 'A registration cap prevents oversigning and closes the form automatically when the limit is hit. How max-team limits work and why they matter.',
  date: '2026-06-17',
  readTime: '4 min read',
  tags: ['registration', 'tournament management', 'admin'],
  keywords: ['limit tournament team registration', 'tournament registration cap', 'max teams tournament', 'close tournament registration automatically'],
}

const faqs = [
  {
    q: 'What happens when a tournament reaches its team limit?',
    a: 'The division disappears from the public registration form automatically. New visitors cannot see or submit a registration for that category. Teams that have already registered and are pending approval are unaffected.',
  },
  {
    q: 'Can I approve a registration that would exceed the team limit?',
    a: 'No. Fixturday checks the confirmed team count at the moment of approval, not at registration time. If another admin approved a team between the registration and your approval click, the system will block your action and show an error.',
  },
  {
    q: 'Does the registration limit count pending teams or only confirmed teams?',
    a: 'Both pending and confirmed teams count toward the limit on the public registration form. This prevents a rush of simultaneous submissions from all going through. At the approval step, only confirmed teams count — so pending applications can still be reviewed.',
  },
]

export default function LimitRegistrationPost() {
  useEffect(() => {
    const id = 'faq-ld-limit-reg'
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
        A 14-team bracket that ends up with 15 teams is a broken bracket. It sounds like an edge case
        until it happens to you — someone submits just as you approve the last legitimate team, and now
        your schedule is wrong. Here's how to prevent it entirely.
      </p>

      <h2>The Problem with Unguarded Registration</h2>
      <p>
        Most tournament registration flows work like this: a form is open, teams submit, an admin
        manually reviews and approves. What's missing is enforcement. If the admin set a mental note
        to stop at 14 teams, that note doesn't prevent a 15th team from registering at 11pm when
        no one is watching. The next morning, the bracket is broken.
      </p>
      <p>
        The problem compounds with multiple admins. Each admin sees "13 confirmed teams" and approves
        one more. Two admins do this simultaneously and you get 15.
      </p>

      <h2>Two-Layer Enforcement</h2>
      <p>
        Fixturday enforces the registration limit at two points, and both layers need to be present
        because neither alone is sufficient.
      </p>
      <p>
        <strong>Layer 1 — The public registration form.</strong> When a visitor opens the registration
        page, the system fetches the current count of confirmed and pending teams for each division.
        If a division has reached its max, it doesn't appear in the list. A late-arriving team simply
        has no form to fill in. This handles the common case: the bracket is full, registration should
        be closed.
      </p>
      <p>
        The form also does a real-time check at submission time. Between the page loading and the form
        being submitted, the limit might have been reached by someone else. The submission-time check
        catches this race condition and returns a clear "group is full" message instead of creating a
        registration that can never be approved.
      </p>
      <p>
        <strong>Layer 2 — Admin approval.</strong> The approval action fetches the current confirmed
        team count immediately before updating the registration status. If approving would exceed the
        limit — even if both pending registrations looked fine five minutes ago — the action is blocked.
        The admin sees an error rather than silently creating an over-cap confirmation.
      </p>

      <h2>How to Set a Team Limit</h2>
      <ol>
        <li>In the admin panel, go to <strong>Divisions</strong> and click Edit on the relevant division.</li>
        <li>Enter a number in the <strong>Max teams</strong> field.</li>
        <li>Save. The limit takes effect immediately — no need to regenerate fixtures.</li>
      </ol>
      <p>
        The limit applies per division, not per tournament. If your tournament has U10, U12, and
        Open categories, each can have its own cap. A division with no max teams set has
        unlimited registration.
      </p>

      <h2>What Teams See When Registration Closes</h2>
      <p>
        Teams visiting the registration page after the cap is reached do not see a confusing error.
        The full division is simply absent from the dropdown — if it was the only available category,
        the page shows a "registration is closed" message. No frustration, no ambiguity.
      </p>
      <p>
        Registration can still be reopened manually at any time. If a confirmed team withdraws, the
        admin can reduce the confirmed count, and the next visitor to the registration page will see
        the division available again — up to the cap.
      </p>

      <h2>Auto-Approve and the Cap</h2>
      <p>
        Age groups can be set to auto-approve registrations (useful for open community tournaments where
        manual review isn't needed). Auto-approve respects the max-teams limit: the approval step still
        runs the cap check. If auto-approve would push the confirmed count over the limit, it fails
        gracefully rather than over-committing the bracket.
      </p>

      <h2>Planning Your Bracket Size</h2>
      <p>
        The right team limit depends on your chosen format. Read{' '}
        <Link to="/blog/how-to-configure-group-stage-brackets" style={{ color: 'var(--color-accent)' }}>
          How to Configure Group Stage Brackets
        </Link>{' '}
        to understand which team counts work cleanly with your group and playoff configuration, and set
        your max accordingly. Oversigning by even one team can break the advancing-per-group maths.
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
