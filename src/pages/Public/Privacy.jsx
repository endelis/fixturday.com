import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { useSEO } from '../../hooks/useSEO'

export default function Privacy() {
  const { t } = useTranslation()

  useSEO({
    title: 'Privacy Policy — Fixturday',
    description: 'Learn how Fixturday collects, uses, and protects your personal data. Covers GDPR rights, data retention, third-party tools, and how to contact us.',
    path: '/privacy-policy',
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
            {t('footer.privacy')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#8fa3bc', margin: 0 }}>
            Last updated: 15 July 2026
          </p>
        </div>
      </section>

      <main style={{ flex: 1, padding: '3rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          <Section title="1. Data Controller">
            <p style={body}>
              The data controller is <strong>Silvestrs Endelis</strong>,{' '}
              <a href="mailto:mail@endelis.co" style={link}>mail@endelis.co</a>.
              The platform operates in accordance with the laws of the Republic of Latvia and
              the European Union, including the General Data Protection Regulation (GDPR).
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <ul style={list}>
              <li><strong>Account data:</strong> email address, hashed password, first name, and optionally last name and phone number — provided at registration.</li>
              <li><strong>Tournament data:</strong> tournament name, dates, description, rules, and logo.</li>
              <li><strong>Team and contact data:</strong> team name, contact person name, email, and phone number.</li>
              <li><strong>Player data:</strong> player first name, last name, year of birth, and shirt number.</li>
              <li><strong>Technical data:</strong> IP address and browser type, processed automatically by Vercel servers.</li>
              <li><strong>Analytics data:</strong> page visits and navigation events collected anonymously via Vercel Analytics and Google Analytics (GA4).</li>
              <li><strong>Newsletter preference:</strong> email address and name forwarded to EmailOctopus only if you explicitly opt in during registration.</li>
            </ul>
          </Section>

          <Section title="3. Purpose and Legal Basis">
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <Th>Purpose</Th>
                    <Th>Legal basis</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td>Providing the service (account, tournaments, fixtures, results)</Td>
                    <Td>GDPR Art. 6(1)(b) — performance of a contract</Td>
                  </tr>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <Td>Security and fraud prevention (Cloudflare Turnstile)</Td>
                    <Td>GDPR Art. 6(1)(f) — legitimate interests</Td>
                  </tr>
                  <tr>
                    <Td>Analytics to improve the platform</Td>
                    <Td>GDPR Art. 6(1)(a) — your consent</Td>
                  </tr>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <Td>Sending transactional emails (account confirmation, password reset)</Td>
                    <Td>GDPR Art. 6(1)(b) — performance of a contract</Td>
                  </tr>
                  <tr>
                    <Td>Newsletter (product updates, tournament tips)</Td>
                    <Td>GDPR Art. 6(1)(a) — your explicit consent at registration</Td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="4. Third-Party Processors">
            <ul style={list}>
              <li>
                <strong>Supabase</strong> (EU region) — database and authentication. Stores accounts,
                tournaments, teams, players, and match results. GDPR-compliant; data centre in the EU/EEA.
              </li>
              <li>
                <strong>Vercel</strong> (US, EU–US Data Privacy Framework) — application hosting,
                static file delivery, and anonymised analytics.
              </li>
              <li>
                <strong>Resend</strong> (EU region, smtp.resend.com) — transactional email delivery
                for account confirmation and password reset emails sent from noreply@fixturday.com.
              </li>
              <li>
                <strong>EmailOctopus</strong> — newsletter subscription management. Only receives your
                name and email if you opt in during registration. You can unsubscribe at any time via
                the link in any newsletter.
              </li>
              <li>
                <strong>Cloudflare Turnstile</strong> — bot and fraud prevention check on the
                registration form. No personal data is stored by Cloudflare beyond the CAPTCHA
                verification result.
              </li>
              <li>
                <strong>Google Analytics (GA4)</strong> — anonymised usage analytics. Data is
                processed only with your consent (analytics cookie preference).
              </li>
            </ul>
          </Section>

          <Section title="5. Data Retention">
            <ul style={list}>
              <li><strong>Account data:</strong> retained until the account is deleted.</li>
              <li><strong>Tournament and team data:</strong> 2 years after the tournament end date.</li>
              <li><strong>Technical server logs:</strong> up to 30 days.</li>
              <li><strong>Analytics:</strong> anonymised; no personally identifiable data is stored.</li>
              <li><strong>Newsletter:</strong> until you unsubscribe or request deletion.</li>
            </ul>
          </Section>

          <Section title="6. Your Rights (GDPR)">
            <p style={body}>Under the General Data Protection Regulation you have the right to:</p>
            <ul style={list}>
              <li><strong>Access</strong> — request confirmation of whether your data is processed and receive a copy.</li>
              <li><strong>Rectification</strong> — request correction of inaccurate data.</li>
              <li><strong>Erasure</strong> — request deletion of your data ("right to be forgotten"). See our <Link to="/data-deletion" style={link}>Data Deletion</Link> page.</li>
              <li><strong>Restriction</strong> — request that processing be restricted in certain circumstances.</li>
              <li><strong>Portability</strong> — receive your data in a structured, machine-readable format.</li>
              <li><strong>Objection</strong> — object to processing based on legitimate interests.</li>
              <li><strong>Withdraw consent</strong> — for analytics or newsletter at any time, without affecting prior processing.</li>
            </ul>
            <p style={body}>
              To exercise your rights, email{' '}
              <a href="mailto:mail@endelis.co" style={link}>mail@endelis.co</a>.
              We will respond within 30 days.
            </p>
          </Section>

          <Section title="7. Cookies">
            <p style={body}>
              Fixturday uses functional and analytical cookies. For full details see our{' '}
              <Link to="/cookie-policy" style={link}>{t('footer.cookies')}</Link>.
            </p>
          </Section>

          <Section title="8. Complaints">
            <p style={body}>
              If you believe your data is being processed unlawfully, you have the right to lodge a
              complaint with the Latvian supervisory authority:{' '}
              <a href="https://www.dvi.gov.lv" target="_blank" rel="noopener noreferrer" style={link}>
                Data State Inspectorate (dvi.gov.lv)
              </a>.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p style={body}>
              Material changes will be notified by publishing a new version of this page with an
              updated effective date. We encourage you to review this policy periodically.
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

function Th({ children }) {
  return (
    <th style={{
      padding: '0.6rem 0.9rem', textAlign: 'left',
      background: 'var(--color-surface-2)',
      color: 'var(--color-text-muted)',
      fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
      borderBottom: '1px solid var(--color-border)',
    }}>
      {children}
    </th>
  )
}

function Td({ children }) {
  return (
    <td style={{
      padding: '0.6rem 0.9rem', fontSize: '0.875rem',
      borderBottom: '1px solid var(--color-border)',
      color: 'var(--color-text)',
    }}>
      {children}
    </td>
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
const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  overflow: 'hidden',
  fontSize: '0.875rem',
}
