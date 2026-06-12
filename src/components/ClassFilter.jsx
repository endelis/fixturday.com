import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

const pillStyle = (active) => ({
  display: 'inline-block',
  padding: '0.35rem 0.9rem',
  borderRadius: '999px',
  border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
  marginRight: '0.4rem',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontFamily: 'var(--font-body)',
  fontWeight: active ? 600 : 400,
  background: active ? 'var(--color-accent)' : 'transparent',
  color: active ? '#0a0f1e' : 'var(--color-text-muted)',
  transition: 'background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
  whiteSpace: 'nowrap',
})

export default function ClassFilter({ tournamentId, value, onChange }) {
  const { t } = useTranslation()
  const [ageGroups, setAgeGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId) return
    async function load() {
      const { data, error } = await supabase
        .from('age_groups')
        .select('id, name')
        .eq('tournament_id', tournamentId)
        .order('name', { ascending: true })
      if (!error) setAgeGroups(data ?? [])
      setLoading(false)
    }
    load()
  }, [tournamentId])

  if (loading || ageGroups.length <= 1) return null

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap' }}
        aria-label={t('classFilter.label')}
        role="toolbar"
      >
        <button style={pillStyle(value === null)} onClick={() => onChange(null)}>
          {t('classFilter.all')}
        </button>
        {ageGroups.map(ag => (
          <button key={ag.id} style={pillStyle(value === ag.id)} onClick={() => onChange(ag.id)}>
            {ag.name}
          </button>
        ))}
      </div>
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '2.5rem',
        background: 'linear-gradient(to right, transparent, var(--color-bg))',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
