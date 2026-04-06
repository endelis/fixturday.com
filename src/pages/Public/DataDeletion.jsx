import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { ShieldOff } from 'lucide-react'

export default function DataDeletion() {
  const { t } = useTranslation()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const [submitted, setSubmitted] = useState(false)

  async function onSubmit(values) {
    const { error } = await supabase.from('contact_messages').insert({
      name: values.email,
      email: values.email,
      message: `[GDPR] ${values.message}`,
    })
    if (error) { toast(t('common.error'), 'error'); return }
    reset()
    setSubmitted(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNav />

      <main style={{ flex: 1, padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <ShieldOff size={32} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
            <h1 style={h1}>Datu dzēšanas pieprasījums</h1>
          </div>
          <p style={intro}>
            Saskaņā ar VDAR (Vispārīgo datu aizsardzības regulu) jums ir tiesības pieprasīt savu
            personas datu dzēšanu no Fixturday platformas. Aizpildiet zemāk esošo veidlapu —
            mēs apstrādāsim jūsu pieprasījumu <strong>30 dienu laikā</strong>.
          </p>

          <div style={infoBox}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--color-text)' }}>Kas tiek dzēsts:</strong> jūsu konta informācija,
              izveidotie turnīri un ar tiem saistītie dati. Publiski pieejami turnīra rezultāti var tikt
              saglabāti anonimizētā veidā vēsturiskos nolūkos.
            </p>
          </div>

          {submitted ? (
            <div style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.35)',
              borderRadius: '8px',
              padding: '1.5rem',
              textAlign: 'center',
              marginTop: '1.5rem',
            }}>
              <p style={{ color: 'var(--color-success)', fontWeight: 600, margin: 0 }}>
                ✓ Pieprasījums nosūtīts
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: 0 }}>
                Mēs sazināsimies ar jums 30 dienu laikā uz norādīto e-pastu.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>E-pasta adrese *</label>
                <input
                  type="email"
                  placeholder="jusu@epasts.lv"
                  {...register('email', { required: t('common.required') })}
                />
                {errors.email && <span className="error-message">{errors.email.message}</span>}
              </div>

              <div className="form-group">
                <label>Pieprasījuma apraksts *</label>
                <textarea
                  rows={5}
                  placeholder="Lūdzu aprakstiet, kādus datus vēlaties dzēst (piemēram: visu konta informāciju, konkrētu turnīru, komandu datus u.c.)"
                  {...register('message', { required: t('common.required') })}
                />
                {errors.message && <span className="error-message">{errors.message.message}</span>}
              </div>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                Nosūtot šo veidlapu, jūs piekrītat, ka jūsu e-pasta adrese tiek apstrādāta
                pieprasījuma izpildei saskaņā ar mūsu{' '}
                <a href="/privatuma-politika" style={link}>Privātuma politiku</a>.
              </p>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{ justifySelf: 'start', marginTop: '0.25rem' }}
              >
                {isSubmitting ? t('common.saving') : 'Nosūtīt pieprasījumu'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
              Vai arī rakstiet tieši:{' '}
              <a href="mailto:mail@endelis.co" style={link}>mail@endelis.co</a>
              {' '}ar tēmu "GDPR datu dzēšana".
              Sūdzības var iesniegt:{' '}
              <a href="https://www.dvi.gov.lv" target="_blank" rel="noopener noreferrer" style={link}>
                Datu valsts inspekcija
              </a>.
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}

const h1 = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: '#ffffff', margin: 0 }
const intro = { color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, margin: '1rem 0 1.25rem' }
const infoBox = { background: 'rgba(240,165,0,0.07)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '0.5rem' }
const link = { color: 'var(--color-accent)', textDecoration: 'underline' }
