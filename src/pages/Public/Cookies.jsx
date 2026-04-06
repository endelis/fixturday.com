import { useTranslation } from 'react-i18next'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a1628' }}>
      <PublicNav />

      {/* ── Hero ──────────────────────────────────────────────── */}
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
            {t('legal.updated')}
          </p>
        </div>
      </section>

      <main style={{ flex: 1, padding: '3rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          <Section title="1. Kas ir sīkdatnes">
            <p style={body}>
              Sīkdatnes (cookies) ir nelielas teksta datnes, ko jūsu pārlūkprogramma saglabā jūsu ierīcē,
              kad apmeklējat tīmekļa vietni. Tās ļauj vietnei atcerēties jūsu preferences un nodrošināt
              netraucētu pakalpojuma darbību.
            </p>
          </Section>

          <Section title="2. Mūsu izmantotās sīkdatnes">
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <Th>Sīkdatne</Th>
                    <Th>Mērķis</Th>
                    <Th>Veids</Th>
                    <Th>Termiņš</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td><code style={code}>sb-auth-token</code></Td>
                    <Td>Lietotāja autentifikācija (pieteikšanās sesija)</Td>
                    <Td>Funkcionālā</Td>
                    <Td>Sesija</Td>
                  </tr>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <Td><code style={code}>fixturday_wizard_*</code></Td>
                    <Td>Lietotāja saskarnes preferences (iestatīšanas vednis)</Td>
                    <Td>Funkcionālā</Td>
                    <Td>1 gads</Td>
                  </tr>
                  <tr>
                    <Td><code style={code}>fixturday_cookie_consent</code></Td>
                    <Td>Jūsu sīkdatņu piekrišanas izvēle</Td>
                    <Td>Funkcionālā</Td>
                    <Td>1 gads</Td>
                  </tr>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <Td><code style={code}>va_*</code></Td>
                    <Td>Vercel Analytics — anonīmi apmeklējumu dati</Td>
                    <Td>Analītiskā</Td>
                    <Td>1 gads</Td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="3. Funkcionālās sīkdatnes">
            <p style={body}>
              Funkcionālās sīkdatnes ir nepieciešamas platformas pamatdarbībai — autentifikācijai,
              sesijas uzturēšanai un UI preferences saglabāšanai. Bez tām pakalpojums nevar darboties
              korekti. No šīm sīkdatnēm nav iespējams atteikties, turpinot lietot Fixturday.
            </p>
          </Section>

          <Section title="4. Analītiskās sīkdatnes">
            <p style={body}>
              Vercel Analytics apkopo anonīmus datus par lapas apmeklējumiem un navigāciju, lai mēs
              varētu uzlabot pakalpojumu. Šie dati <strong>neidentificē</strong> konkrētu personu un
              netiek kopīgoti ar trešajām pusēm reklāmas nolūkos.
            </p>
            <p style={body}>
              No analītiskajām sīkdatnēm varat atteikties zemāk vai pārlūkprogrammas iestatījumos.
            </p>
          </Section>

          <Section title="5. Jūsu preferences">
            <p style={body}>
              Pašreizējā izvēle:{' '}
              <strong style={{ color: 'var(--color-accent)' }}>
                {current === 'all' ? 'Pieņemtas visas' : current === 'functional' ? 'Tikai funkcionālās' : 'Nav izvēlēts'}
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
                Tikai funkcionālās
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
                Pieņemt visas
              </button>
            </div>
          </Section>

          <Section title="6. Kā pārvaldīt sīkdatnes pārlūkā">
            <p style={body}>
              Lielākā daļa pārlūkprogrammu ļauj pārvaldīt vai dzēst sīkdatnes iestatījumos.
              Ņemiet vērā — funkcionālo sīkdatņu dzēšana var traucēt pieteikšanos un citas
              platformas pamatfunkcijas.
            </p>
            <ul style={list}>
              <li><strong>Chrome:</strong> Iestatījumi → Konfidencialitāte un drošība → Sīkfaili</li>
              <li><strong>Firefox:</strong> Iestatījumi → Privātums un drošība → Sīkdatnes</li>
              <li><strong>Safari:</strong> Preferences → Konfidencialitāte → Pārvaldīt datus</li>
              <li><strong>Edge:</strong> Iestatījumi → Sīkfaili un vietnes atļaujas</li>
            </ul>
          </Section>

          <Section title="7. Kontakts">
            <p style={body}>
              Jautājumu gadījumā:{' '}
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

const h1 = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem' }
const h2 = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(240,165,0,0.2)' }
const meta = { color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '2.5rem' }
const body = { color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '0.75rem' }
const list = { color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, paddingLeft: '1.5rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem' }
const link = { color: 'var(--color-accent)', textDecoration: 'underline' }
const code = { fontFamily: 'monospace', fontSize: '0.82rem', background: 'rgba(255,255,255,0.07)', padding: '0.1rem 0.35rem', borderRadius: '3px' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }
