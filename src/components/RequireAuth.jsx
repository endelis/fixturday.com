import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
  if (loading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />
  return children
}
