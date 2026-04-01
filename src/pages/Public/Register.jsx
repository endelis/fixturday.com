import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import PublicNav from '../../components/PublicNav'

export default function Register() {
  const { slug } = useParams()
  const [tournament, setTournament] = useState(null)
  const [ageGroups, setAgeGroups] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from('tournaments').select('*').eq('slug', slug).single()
      if (!t) { setLoading(false); return }
      setTournament(t)
      const { data: ag } = await supabase
        .from('age_groups')
        .select('*')
        .eq('tournament_id', t.id)
        .eq('registration_open', true)
      setAgeGroups(ag ?? [])
      setLoading(false)
    }
    load()
  }, [slug])

  async function onSubmit(values) {
    const { error } = await supabase.from('teams').insert({
      age_group_id: values.age_group_id,
      name: values.name,
      club: values.club,
      contact_name: values.contact_name,
      contact_email: values.contact_email,
      contact_phone: values.contact_phone,
      status: 'pending',
    })
    if (!error) setSubmitted(true)
  }

  if (loading) return <div className="loading">Ielādē...</div>
  if (!tournament) return <div className="loading">Turnīrs nav atrasts.</div>
  if (ageGroups.length === 0) return <div className="loading">Reģistrācija pašlaik nav atvērta.</div>

  if (submitted) return (
    <div>
      <PublicNav tournament={tournament} />
      <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--color-accent)' }}>Pieteikums saņemts!</h2>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Mēs sazināsimies ar jums tuvākajā laikā.</p>
      </div>
    </div>
  )

  return (
    <div>
    <PublicNav tournament={tournament} />
    <div className="container" style={{ paddingTop: '2rem', maxWidth: '600px' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '1.5rem' }}>
        Reģistrācija — {tournament.name}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>
        <div className="form-group">
          <label>Vecuma grupa *</label>
          <select {...register('age_group_id', { required: true })}>
            <option value="">Izvēlieties...</option>
            {ageGroups.map(ag => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
          </select>
          {errors.age_group_id && <span className="error-message">Lūdzu izvēlieties vecuma grupu.</span>}
        </div>
        <div className="form-group">
          <label>Komandas nosaukums *</label>
          <input {...register('name', { required: true })} />
          {errors.name && <span className="error-message">Obligāts lauks.</span>}
        </div>
        <div className="form-group">
          <label>Klubs</label>
          <input {...register('club')} />
        </div>
        <div className="form-group">
          <label>Kontaktpersona *</label>
          <input {...register('contact_name', { required: true })} />
          {errors.contact_name && <span className="error-message">Obligāts lauks.</span>}
        </div>
        <div className="form-group">
          <label>E-pasts *</label>
          <input type="email" {...register('contact_email', { required: true })} />
          {errors.contact_email && <span className="error-message">Obligāts lauks.</span>}
        </div>
        <div className="form-group">
          <label>Tālrunis</label>
          <input {...register('contact_phone')} />
        </div>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Sūta...' : 'Reģistrēties'}
        </button>
      </form>
    </div>
    </div>
  )
}
