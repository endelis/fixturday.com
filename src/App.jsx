import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { ToastContainer } from './components/Toast'

// Public pages
import TournamentList from './pages/Public/TournamentList'
import TournamentDetail from './pages/Public/TournamentDetail'
import Standings from './pages/Public/Standings'
import Schedule from './pages/Public/Schedule'
import TeamRoster from './pages/Public/TeamRoster'
import Register from './pages/Public/Register'

// Admin pages
import Login from './pages/Admin/Login'
import Dashboard from './pages/Admin/Dashboard'
import TournamentNew from './pages/Admin/Tournaments/New'
import TournamentEdit from './pages/Admin/Tournaments/Edit'
import AgeGroups from './pages/Admin/AgeGroups'
import Venues from './pages/Admin/Venues'
import Teams from './pages/Admin/Teams'
import Fixtures from './pages/Admin/Fixtures'
import Matchday from './pages/Admin/Matchday'

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="loading">Ielādē...</div>
  if (!session) return <Navigate to="/admin" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<TournamentList />} />
        <Route path="/t/:slug" element={<TournamentDetail />} />
        <Route path="/t/:slug/:ageGroup" element={<Standings />} />
        <Route path="/t/:slug/:ageGroup/fixtures" element={<Schedule />} />
        <Route path="/t/:slug/:ageGroup/teams/:teamId" element={<TeamRoster />} />
        <Route path="/t/:slug/register" element={<Register />} />

        {/* Admin routes */}
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin/tournaments/new" element={<RequireAuth><TournamentNew /></RequireAuth>} />
        <Route path="/admin/tournaments/:id" element={<RequireAuth><TournamentEdit /></RequireAuth>} />
        <Route path="/admin/tournaments/:id/age-groups" element={<RequireAuth><AgeGroups /></RequireAuth>} />
        <Route path="/admin/tournaments/:id/venues" element={<RequireAuth><Venues /></RequireAuth>} />
        <Route path="/admin/age-groups/:ageGroupId/teams" element={<RequireAuth><Teams /></RequireAuth>} />
        <Route path="/admin/age-groups/:ageGroupId/fixtures" element={<RequireAuth><Fixtures /></RequireAuth>} />
        <Route path="/admin/matchday" element={<RequireAuth><Matchday /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}
