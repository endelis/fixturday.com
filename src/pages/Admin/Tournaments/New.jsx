import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[āàáâä]/g, 'a')
    .replace(/[čç]/g, 'c')
    .replace(/[ēèéê]/g, 'e')
    .replace(/[ģ]/g, 'g')
    .replace(/[ī]/g, 'i')
    .replace(/[ķ]/g, 'k')
    .replace(/[ļ]/g, 'l')
    .replace(/[ņ]/g, 'n')
    .replace(/[š]/g, 's')
    .replace(/[ū]/g, 'u')
    .replace(/[ž]/g, 'z')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-')
}

export default function TournamentNew() {
  const navigate = useNavigate()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { sport: 'football', is_active: true }
  })

  const nameField = register('name', { required: 'Obligāts lauks.' })

  async function onSubmit(values) {
    const { data, error } = await supabase.from('tournaments').insert(values).select().single()
    if (error) {
      toast(`Kļūda: ${error.message}`, 'error')
      return
    }
    toast('Turnīrs izveidots!')
    navigate(`/admin/tournaments/${data.id}`)
  }

  return (
    <div>
      <nav className="admin-nav">
        <Link to="/admin/dashboard" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
          ← Fixturday Admin
        </Link>
      </nav>

      <div className="container" style={{ paddingTop: '2rem', maxWidth: '700px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '1.5rem' }}>Jauns turnīrs</h1>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>
          <div className="form-group">
            <label>Nosaukums *</label>
            <input
              {...nameField}
              onChange={e => {
                nameField.onChange(e)
                setValue('slug', slugify(e.target.value))
              }}
            />
            {errors.name && <span className="error-message">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label>URL adrese (slug) *</label>
            <input {...register('slug', { required: 'Obligāts lauks.' })} />
            {errors.slug && <span className="error-message">{errors.slug.message}</span>}
          </div>

          <div className="form-group">
            <label>Sports</label>
            <select {...register('sport')}>
              <option value="football">Futbols</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Sākuma datums</label>
              <input type="date" {...register('start_date')} />
            </div>
            <div className="form-group">
              <label>Beigu datums</label>
              <input type="date" {...register('end_date')} />
            </div>
          </div>

          <div className="form-group">
            <label>Apraksts</label>
            <textarea {...register('description')} rows={3} />
          </div>

          <div className="form-group">
            <label>Logo URL</label>
            <input type="url" {...register('logo_url')} placeholder="https://..." />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input type="checkbox" id="is_active" {...register('is_active')} />
            <label htmlFor="is_active">Aktīvs (redzams publiski)</label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saglabā...' : 'Izveidot turnīru'}
            </button>
            <Link to="/admin/dashboard" className="btn-secondary">Atcelt</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
