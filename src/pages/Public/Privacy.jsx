import { useTranslation } from 'react-i18next'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'

export default function Privacy() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNav />

      <main style={{ flex: 1, padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          <h1 style={h1}>{t('footer.privacy')}</h1>
          <p style={meta}>Spēkā no: 2026. gada 1. aprīļa &nbsp;·&nbsp; Fixturday.com</p>

          <Section title="1. Pārzinis">
            <p style={body}>
              Personas datu apstrādes pārzinis ir <strong>Silvestrs Endelis</strong> (turpmāk — Pārzinis),
              kontaktinformācija: <a href="mailto:mail@endelis.co" style={link}>mail@endelis.co</a>.
              Platforma darbojas saskaņā ar Latvijas Republikas un Eiropas Savienības tiesību aktiem.
            </p>
          </Section>

          <Section title="2. Kādi personas dati tiek vākti">
            <p style={body}>Fixturday vāc šādas personas datu kategorijas:</p>
            <ul style={list}>
              <li><strong>Konta dati:</strong> e-pasta adrese un šifrēta parole, ko norādāt reģistrējoties.</li>
              <li><strong>Turnīra dati:</strong> turnīra nosaukums, datumi, apraksts, noteikumi un logotips.</li>
              <li><strong>Komandu un kontaktpersonu dati:</strong> komandas nosaukums, kontaktpersonas vārds, e-pasts un tālruņa numurs.</li>
              <li><strong>Spēlētāju dati:</strong> spēlētāja vārds, uzvārds, dzimšanas gads un krekla numurs.</li>
              <li><strong>Tehniskie dati:</strong> IP adrese un pārlūkprogrammas tips, ko automātiski apstrādā Vercel serveri.</li>
              <li><strong>Analītikas dati:</strong> lapas apmeklējumi un navigācijas dati (Vercel Analytics, ja iespējots), kuri ir anonimizēti.</li>
            </ul>
          </Section>

          <Section title="3. Datu apstrādes mērķis un juridiskais pamats">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>Mērķis</Th>
                  <Th>Juridiskais pamats</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>Pakalpojuma nodrošināšana (konts, turnīri, grafiks)</Td>
                  <Td>VDAR 6(1)(b) — līguma izpilde</Td>
                </tr>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <Td>Drošība un krāpšanas novēršana</Td>
                  <Td>VDAR 6(1)(f) — leģitīmās intereses</Td>
                </tr>
                <tr>
                  <Td>Analītika pakalpojuma uzlabošanai</Td>
                  <Td>VDAR 6(1)(a) — jūsu piekrišana</Td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section title="4. Kur dati tiek glabāti">
            <ul style={list}>
              <li>
                <strong>Supabase</strong> (ES reģions) — lietotāju konti, turnīri, komandas, spēlētāji un rezultāti.
                Supabase atbilst VDAR prasībām; datu centra atrašanās vieta: ES/EEZ.
              </li>
              <li>
                <strong>Vercel</strong> (ASV, uz ES–ASV Datu aizsardzības vienošanās pamata) —
                lietotnes hostings, statisko failu piegāde un analītika.
              </li>
            </ul>
          </Section>

          <Section title="5. Datu glabāšanas termiņi">
            <ul style={list}>
              <li><strong>Konta dati:</strong> līdz konta dzēšanai.</li>
              <li><strong>Turnīra un komandu dati:</strong> 2 gadi pēc turnīra noslēguma datuma.</li>
              <li><strong>Tehniskie servera žurnāli:</strong> līdz 30 dienām.</li>
              <li><strong>Analītika:</strong> anonimizēti dati; identifikācijai derīgi dati netiek glabāti.</li>
            </ul>
          </Section>

          <Section title="6. Jūsu tiesības (VDAR)">
            <p style={body}>Saskaņā ar Vispārīgo datu aizsardzības regulu jums ir šādas tiesības:</p>
            <ul style={list}>
              <li><strong>Piekļuves tiesības</strong> — pieprasīt apstiprinājumu, vai jūsu dati tiek apstrādāti, un saņemt to kopiju.</li>
              <li><strong>Labošanas tiesības</strong> — pieprasīt neprecīzu datu labošanu.</li>
              <li><strong>Dzēšanas tiesības</strong> — pieprasīt savu datu dzēšanu ("tiesības tikt aizmirstam").</li>
              <li><strong>Apstrādes ierobežošanas tiesības</strong> — noteiktos gadījumos pieprasīt apstrādes ierobežošanu.</li>
              <li><strong>Datu pārnesamības tiesības</strong> — saņemt savus datus strukturētā, mašīnlasāmā formātā.</li>
              <li><strong>Iebilduma tiesības</strong> — iebilst pret datu apstrādi leģitīmo interešu pamatos.</li>
            </ul>
            <p style={body}>
              Lai izmantotu savas tiesības, rakstiet uz:{' '}
              <a href="mailto:mail@endelis.co" style={link}>mail@endelis.co</a>.
              Mēs atbildēsim 30 dienu laikā.
            </p>
          </Section>

          <Section title="7. Sīkdatnes">
            <p style={body}>
              Fixturday izmanto funkcionālās un analītiskās sīkdatnes. Sīkāku informāciju skatiet mūsu{' '}
              <a href="/sikdatnu-politika" style={link}>Sīkdatņu politikā</a>.
            </p>
          </Section>

          <Section title="8. Sūdzības">
            <p style={body}>
              Ja uzskatāt, ka jūsu datu apstrāde pārkāpj VDAR, varat iesniegt sūdzību Latvijas uzraudzības iestādē:{' '}
              <a href="https://www.dvi.gov.lv" target="_blank" rel="noopener noreferrer" style={link}>
                Datu valsts inspekcija (dvi.gov.lv)
              </a>.
            </p>
          </Section>

          <Section title="9. Izmaiņas šajā politikā">
            <p style={body}>
              Par būtiskām izmaiņām paziņosim, publicējot jaunu versiju šajā lapā ar atjaunotu spēkā stāšanās datumu.
              Aicinām regulāri iepazīties ar šo dokumentu.
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

const h1 = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  fontWeight: 700,
  color: '#ffffff',
  marginBottom: '0.35rem',
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
const meta = {
  color: 'var(--color-text-muted)',
  fontSize: '0.8rem',
  marginBottom: '2.5rem',
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
