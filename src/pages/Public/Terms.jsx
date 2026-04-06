import { useTranslation } from 'react-i18next'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'

export default function Terms() {
  const { t } = useTranslation()
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
            {t('footer.terms')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#8fa3bc', margin: 0 }}>
            {t('legal.updated')}
          </p>
        </div>
      </section>

      <main style={{ flex: 1, padding: '3rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          <Section title="1. Pakalpojuma apraksts">
            <p style={body}>
              Fixturday ir sporta turnīru pārvaldības platforma, kas ļauj organizēt turnīrus, reģistrēt
              komandas, veidot spēļu grafiku un sekot līdzi rezultātiem. Platforma pieejama fiziskām un
              juridiskām personām bez maksas.
            </p>
            <p style={body}>
              Pakalpojuma sniedzējs: <strong>Silvestrs Endelis</strong>,{' '}
              <a href="mailto:mail@endelis.co" style={link}>mail@endelis.co</a>.
            </p>
          </Section>

          <Section title="2. Reģistrācija un konts">
            <p style={body}>
              Lai izmantotu administrācijas funkcijas, nepieciešams izveidot kontu ar derīgu e-pasta adresi.
              Jūs esat atbildīgi par:
            </p>
            <ul style={list}>
              <li>Sava konta drošību un piekļuves datiem;</li>
              <li>Visām darbībām, kas veiktas, izmantojot jūsu kontu;</li>
              <li>Savlaicīgu paziņošanu par neatļautu piekļuvi (<a href="mailto:mail@endelis.co" style={link}>mail@endelis.co</a>).</li>
            </ul>
          </Section>

          <Section title="3. Pieļaujamā izmantošana">
            <p style={body}>Lietojot Fixturday, jūs apņematies:</p>
            <ul style={list}>
              <li>Sniegt patiesu un precīzu informāciju reģistrējoties un veidojot turnīrus;</li>
              <li>Neizmantot platformu pretlikumīgiem vai krāpnieciskiem mērķiem;</li>
              <li>Netraucēt citu lietotāju darbību vai platformas tehnisko infrastruktūru;</li>
              <li>Neaugšupielādēt saturu, kas pārkāpj trešo pušu intelektuālā īpašuma tiesības.</li>
            </ul>
            <p style={body}>
              Pārzinis patur tiesības apturēt vai dzēst kontus, kas pārkāpj šos noteikumus, bez iepriekšēja
              brīdinājuma.
            </p>
          </Section>

          <Section title="4. Intelektuālais īpašums">
            <p style={body}>
              Fixturday platformas dizains, kods un saturs (izņemot lietotāju augšupielādēto saturu) ir
              Silvestrs Endelis intelektuālais īpašums. Bez rakstiskas atļaujas ir aizliegts kopēt,
              izplatīt vai izmantot platformas elementus.
            </p>
            <p style={body}>
              Jūsu augšupielādētais saturs (turnīru logotipi, pielikumi u.c.) paliek jūsu īpašums.
              Augšupielādējot saturu, jūs piešķirat Fixturday tiesības to attēlot un uzglabāt pakalpojuma
              sniegšanas nolūkos.
            </p>
          </Section>

          <Section title="5. Pakalpojuma pieejamība">
            <p style={body}>
              Fixturday tiek sniegts "kā tas ir" bez garantijām par nepārtrauktu pieejamību.
              Plānota un neplānota tehniskā apkope var īslaicīgi ierobežot piekļuvi.
              Par plānotiem darbiem centīsimies informēt laikus.
            </p>
          </Section>

          <Section title="6. Atbildības ierobežojums">
            <p style={body}>
              Silvestrs Endelis neatbild par:
            </p>
            <ul style={list}>
              <li>Datu zaudēšanu vai bojājumiem tehniskas kļūmes, kiberuzbrukuma vai nepārvaramas varas rezultātā;</li>
              <li>Turnīra organizācijas sekām, tai skaitā strīdiem starp dalībniekiem;</li>
              <li>Trešo pušu (Supabase, Vercel u.c.) pakalpojumu pieejamību vai darbību;</li>
              <li>Zaudējumiem, kas rodas no neatļautas piekļuves jūsu kontam.</li>
            </ul>
            <p style={body}>
              Atbildība visos gadījumos ir ierobežota līdz faktiskajiem tiešajiem zaudējumiem.
            </p>
          </Section>

          <Section title="7. Izmaiņas noteikumos">
            <p style={body}>
              Par būtiskām izmaiņām lietošanas noteikumos paziņosim reģistrētajiem lietotājiem e-pastā
              vismaz <strong>30 dienas</strong> pirms izmaiņu stāšanās spēkā. Turpinot lietot pakalpojumu
              pēc paziņojuma, jūs piekrītat jaunajiem noteikumiem.
            </p>
          </Section>

          <Section title="8. Piemērojamais likums un strīdu risināšana">
            <p style={body}>
              Šie noteikumi ir sastādīti saskaņā ar <strong>Latvijas Republikas</strong> spēkā esošajiem
              tiesību aktiem. Strīdi, kas rodas saistībā ar šo noteikumu interpretāciju vai izpildi,
              risināmi Latvijas Republikas tiesās saskaņā ar Latvijas tiesību normām.
            </p>
          </Section>

          <Section title="9. Kontaktinformācija">
            <p style={body}>
              Jautājumu vai iebildumu gadījumā sazinieties:{' '}
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
