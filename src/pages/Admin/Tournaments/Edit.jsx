import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../../../lib/supabase'
import { toast } from '../../../components/Toast'

export default function TournamentEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm()

  useEffect(() => {
    supabase.from('tournaments').select('*').eq('id', id).single().then(({ data }) => {
      if (data) reset(data)
      setLoading(false)
    })
  }, [id, reset])

  async function onSubmit(values) {
    const { error } = await supabase.from('tournaments').update(values).eq('id', id)
    if (error) { toast(`Kļūda: ${error.message}`, 'error'); return }
    toast('Turnīrs saglabāts!')
    navigate('/admin/dashboard')
  }

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (error) { toast(`Kļūda: ${error.message}`, 'error'); return }
    navigate('/admin/dashboard')
  }

  if (loading) return <div className="loading">Ielādē...</div>

  return (
    <div>
      <nav className="admin-nav">
        <Link to="/admin/dashboard" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
          ← Fixturday Admin
        </Link>
      </nav>

      <div className="container" style={{ paddingTop: '2rem', maxWidth: '700px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>Rediģēt turnīru</h1>
          <button
            className={deleteConfirm ? 'btn-danger btn-sm' : 'btn-secondary btn-sm'}
            onClick={handleDelete}
          >
            {deleteConfirm ? 'Apstiprināt dzēšanu' : 'Dzēst turnīru'}
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>
          <div className="form-group">
            <label>Nosaukums *</label>
            <input {...register('name', { required: 'Obligāts lauks.' })} />
            {errors.name && <span className="error-message">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label>URL adrese (slug)</label>
            <input {...register('slug')} />
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
            <button type="submit" className="btn-primary" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Saglabā...' : 'Saglabāt izmaiņas'}
            </button>
            <Link to="/admin/dashboard" className="btn-secondary">Atcelt</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
