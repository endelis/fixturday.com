import { useTranslation } from 'react-i18next'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { useSEO } from '../../hooks/useSEO'

export default function Terms() {
  const { t } = useTranslation()

  useSEO({
    title: 'Terms of Use — Fixturday',
    description: 'Read the Terms of Use for Fixturday, the free sports tournament management platform. Covers acceptable use, intellectual property, and liability.',
    path: '/terms-of-use',
    noSuffix: true,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a1628' }}>
      <PublicNav />

      <section style={{
        padding: '4.5rem 1.5rem 3rem',
        textAlign: 'center',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(240,165,0,0.07) 0%, transparent 70%), #0a1628',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            border: '1px solid rgba(240,165,0,0.35)',
            borderRadius: '999px',
            padding: '0.3rem 1rem',
            fontSize: '0.75rem',
            color: '#f0a500',
            letterSpacing: '0.1em',
            fontWeight: 600,
            marginBottom: '1.25rem',
          }}>
            {t('legal.pill')}
          </div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '0.75rem',
          }}>
            {t('footer.terms')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#8fa3bc', margin: 0 }}>
            Last updated: 15 July 2026
          </p>
        </div>
      </section>

      <main style={{ flex: 1, padding: '3rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          <Section title="1. Service Description">
            <p style={body}>
              Fixturday is a web-based sports tournament management platform that allows you to create
              tournaments, register teams, generate fixtures, and track results in real time. The platform
              is available free of charge to individuals and organisations.
            </p>
            <p style={body}>
              Service provider: <strong>Silvestrs Endelis</strong>,{' '}
              <a href="mailto:mail@endelis.co" style={link}>mail@endelis.co</a>.
            </p>
          </Section>

          <Section title="2. Account Registration">
            <p style={body}>
              To access admin features you must register an account using a valid email address and password.
              By registering you confirm that you have read and accepted these Terms of Use. You are responsible for:
            </p>
            <ul style={list}>
              <li>Keeping your login credentials secure and confidential;</li>
              <li>All activity carried out under your account;</li>
              <li>Notifying us promptly of any unauthorised access at <a href="mailto:mail@endelis.co" style={link}>mail@endelis.co</a>.</li>
            </ul>
          </Section>

          <Section title="3. Acceptable Use">
            <p style={body}>By using Fixturday you agree to:</p>
            <ul style={list}>
              <li>Provide accurate and truthful information when registering and creating tournaments;</li>
              <li>Not use the platform for unlawful, fraudulent, or harmful purposes;</li>
              <li>Not disrupt other users or the platform's technical infrastructure;</li>
              <li>Not upload content that infringes third-party intellectual property rights.</li>
            </ul>
            <p style={body}>
              We reserve the right to suspend or delete accounts that violate these terms without prior notice.
            </p>
          </Section>

          <Section title="4. Newsletter">
            <p style={body}>
              During registration you may opt in to the Fixturday newsletter. Subscription is entirely
              optional and you can unsubscribe at any time by clicking the unsubscribe link in any
              newsletter email. We use EmailOctopus to manage newsletter subscriptions. We will never
              share your email address with third parties for marketing purposes.
            </p>
          </Section>

          <Section title="5. Intellectual Property">
            <p style={body}>
              The Fixturday platform design, source code, and content (excluding user-uploaded content)
              are the intellectual property of Silvestrs Endelis. Copying, distributing, or using
              platform elements without written permission is prohibited.
            </p>
            <p style={body}>
              Content you upload (tournament logos, team names, player data, etc.) remains your property.
              By uploading it you grant Fixturday a limited licence to display and store it for the
              purpose of providing the service.
            </p>
          </Section>

          <Section title="6. Service Availability">
            <p style={body}>
              Fixturday is provided "as is" with no guarantees of uninterrupted availability.
              Planned and unplanned maintenance may temporarily limit access. We will endeavour to
              notify users of planned downtime in advance.
            </p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p style={body}>Silvestrs Endelis is not liable for:</p>
            <ul style={list}>
              <li>Data loss or damage caused by technical failure, cyber attack, or force majeure;</li>
              <li>Disputes between tournament participants or organisational outcomes;</li>
              <li>Availability or performance of third-party services (Supabase, Vercel, Resend, etc.);</li>
              <li>Loss arising from unauthorised access to your account.</li>
            </ul>
            <p style={body}>
              Liability is in all cases limited to actual direct damages.
            </p>
          </Section>

          <Section title="8. Changes to These Terms">
            <p style={body}>
              We will notify registered users of material changes to these Terms by email at least{' '}
              <strong>30 days</strong> before they take effect. Continued use of the service after
              the notice period constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="9. Governing Law">
            <p style={body}>
              These Terms are governed by the laws of the <strong>Republic of Latvia</strong>.
              Any disputes arising from these Terms shall be resolved in Latvian courts in accordance
              with Latvian law.
            </p>
          </Section>

          <Section title="10. Contact">
            <p style={body}>
              Questions or concerns:{' '}
              <a href="mailto:mail@endelis.co" style={link}>mail@endelis.co</a>
            </p>
          </Section>

        </div>
      </main>

      <Footer />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={h2}>{title}</h2>
      {children}
    </section>
  )
}

const h2 = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: '1.35rem',
  fontWeight: 700,
  color: 'var(--color-accent)',
  marginBottom: '0.75rem',
  paddingBottom: '0.4rem',
  borderBottom: '1px solid rgba(240,165,0,0.2)',
}
const body = {
  color: 'var(--color-text-muted)',
  fontSize: '0.9375rem',
  lineHeight: 1.7,
  marginBottom: '0.75rem',
}
const list = {
  color: 'var(--color-text-muted)',
  fontSize: '0.9375rem',
  lineHeight: 1.7,
  paddingLeft: '1.5rem',
  margin: '0.5rem 0',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
}
const link = { color: 'var(--color-accent)', textDecoration: 'underline' }
