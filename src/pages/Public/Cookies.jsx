import { useTranslation } from 'react-i18next'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { useSEO } from '../../hooks/useSEO'

const STORAGE_KEY = 'fixturday_cookie_consent'

function getConsent() {
  return localStorage.getItem(STORAGE_KEY)
}

function setConsent(value) {
  localStorage.setItem(STORAGE_KEY, value)
  window.location.reload()
}

export default function Cookies() {
  const { t } = useTranslation()
  const current = getConsent()

  useSEO({
    title: 'Cookie Policy — Fixturday',
    description: 'Fixturday cookie policy: learn what cookies we set, why we use them, and how to manage or opt out of your preferences at any time.',
    path: '/cookie-policy',
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
            {t('footer.cookies')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#8fa3bc', margin: 0 }}>
            Last updated: 15 July 2026
          </p>
        </div>
      </section>

      <main style={{ flex: 1, padding: '3rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          <Section title="1. What Are Cookies">
            <p style={body}>
              Cookies are small text files stored on your device by your browser when you visit a website.
              They allow the site to remember your preferences and ensure the service works correctly.
            </p>
          </Section>

          <Section title="2. Cookies We Use">
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <Th>Cookie</Th>
                    <Th>Purpose</Th>
                    <Th>Type</Th>
                    <Th>Duration</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td><code style={code}>sb-*</code></Td>
                    <Td>User authentication (login session)</Td>
                    <Td>Functional</Td>
                    <Td>Session</Td>
                  </tr>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <Td><code style={code}>fixturday_cookie_consent</code></Td>
                    <Td>Your cookie consent choice</Td>
                    <Td>Functional</Td>
                    <Td>1 year</Td>
                  </tr>
                  <tr>
                    <Td><code style={code}>fixturday_wizard_*</code></Td>
                    <Td>UI preferences (setup wizard state)</Td>
                    <Td>Functional</Td>
                    <Td>1 year</Td>
                  </tr>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <Td><code style={code}>va_*</code></Td>
                    <Td>Vercel Analytics — anonymous visit data</Td>
                    <Td>Analytical</Td>
                    <Td>1 year</Td>
                  </tr>
                  <tr>
                    <Td><code style={code}>_ga, _gid</code></Td>
                    <Td>Google Analytics (GA4) — anonymous usage analytics</Td>
                    <Td>Analytical</Td>
                    <Td>2 years / 24 h</Td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="3. Functional Cookies">
            <p style={body}>
              Functional cookies are essential for the platform to operate — they manage authentication,
              maintain your session, and remember UI preferences. These cookies cannot be disabled while
              you continue to use Fixturday.
            </p>
          </Section>

          <Section title="4. Analytical Cookies">
            <p style={body}>
              Analytical cookies (Vercel Analytics and Google Analytics GA4) collect anonymous data
              about page visits and navigation to help us improve the service. This data{' '}
              <strong>does not identify</strong> individual users and is not shared with third parties
              for advertising purposes.
            </p>
            <p style={body}>
              You can opt out of analytical cookies below or in your browser settings.
            </p>
          </Section>

          <Section title="5. Your Preferences">
            <p style={body}>
              Current setting:{' '}
              <strong style={{ color: 'var(--color-accent)' }}>
                {current === 'all' ? 'All accepted' : current === 'functional' ? 'Functional only' : 'Not set'}
              </strong>
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <button
                onClick={() => setConsent('functional')}
                style={{
                  border: `1px solid ${current === 'functional' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  color: current === 'functional' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  background: 'none', borderRadius: '6px', padding: '0.5rem 1.1rem',
                  cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                }}
              >
                Functional only
              </button>
              <button
                onClick={() => setConsent('all')}
                style={{
                  background: current === 'all' ? 'var(--color-accent)' : 'none',
                  color: current === 'all' ? '#0d1b2e' : 'var(--color-text-muted)',
                  border: `1px solid ${current === 'all' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  borderRadius: '6px', padding: '0.5rem 1.25rem',
                  cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                }}
              >
                Accept all
              </button>
            </div>
          </Section>

          <Section title="6. Managing Cookies in Your Browser">
            <p style={body}>
              Most browsers allow you to manage or delete cookies in settings.
              Note that deleting functional cookies may disrupt login and other core platform features.
            </p>
            <ul style={list}>
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
            </ul>
          </Section>

          <Section title="7. Contact">
            <p style={body}>
              Questions about our cookie use:{' '}
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

function Th({ children }) {
  return (
    <th style={{
      padding: '0.6rem 0.9rem', textAlign: 'left',
      background: 'var(--color-surface-2)',
      color: 'var(--color-text-muted)',
      fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
      borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap',
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

const h2 = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(240,165,0,0.2)' }
const body = { color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '0.75rem' }
const list = { color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, paddingLeft: '1.5rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem' }
const link = { color: 'var(--color-accent)', textDecoration: 'underline' }
const code = { fontFamily: 'monospace', fontSize: '0.82rem', background: 'rgba(255,255,255,0.07)', padding: '0.1rem 0.35rem', borderRadius: '3px' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }
