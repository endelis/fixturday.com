import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from './components/Toast'
import RequireAuth from './components/RequireAuth'

// Public pages
import Landing from './pages/Public/Landing'
import TournamentList from './pages/Public/TournamentList'
import TournamentDetail from './pages/Public/TournamentDetail'
import Standings from './pages/Public/Standings'
import Schedule from './pages/Public/Schedule'
import TeamRoster from './pages/Public/TeamRoster'
import Register from './pages/Public/Register'
import About from './pages/Public/About'
import Contact from './pages/Public/Contact'

// Admin pages
import Login from './pages/Admin/Login'
import AdminRegister from './pages/Admin/Register'
import Dashboard from './pages/Admin/Dashboard'
import TournamentNew from './pages/Admin/Tournaments/New'
import TournamentEdit from './pages/Admin/Tournaments/Edit'
import AgeGroups from './pages/Admin/AgeGroups'
import Venues from './pages/Admin/Venues'
import Teams from './pages/Admin/Teams'
import Fixtures from './pages/Admin/Fixtures/index'
import Matchday from './pages/Admin/Matchday'
import Print from './pages/Admin/Print'

// Tournament workspace
import TournamentLayout from './pages/Admin/Tournament/TournamentLayout'
import TournamentOverview from './pages/Admin/Tournament/TournamentOverview'
import TournamentStats from './pages/Admin/Tournament/TournamentStats'
import TournamentStandings from './pages/Admin/Tournament/TournamentStandings'
import TournamentPlayoff from './pages/Admin/Tournament/TournamentPlayoff'

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/turniri" element={<TournamentList />} />
        <Route path="/par-mums" element={<About />} />
        <Route path="/kontakti" element={<Contact />} />
        <Route path="/t/:slug" element={<TournamentDetail />} />
        <Route path="/t/:slug/:ageGroup" element={<Standings />} />
        <Route path="/t/:slug/:ageGroup/fixtures" element={<Schedule />} />
        <Route path="/t/:slug/:ageGroup/teams/:teamId" element={<TeamRoster />} />
        <Route path="/t/:slug/register" element={<Register />} />

        {/* Admin: top-level */}
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin/tournaments/new" element={<RequireAuth><TournamentNew /></RequireAuth>} />
        <Route path="/admin/matchday" element={<RequireAuth><Matchday /></RequireAuth>} />
        <Route path="/admin/tournaments/:id/print" element={<RequireAuth><Print /></RequireAuth>} />

        {/* Age-group-scoped routes (outside tournament layout) */}
        <Route path="/admin/age-groups/:ageGroupId/teams" element={<RequireAuth><Teams /></RequireAuth>} />
        <Route path="/admin/age-groups/:ageGroupId/fixtures" element={<RequireAuth><Fixtures /></RequireAuth>} />

        {/* Tournament workspace — nested routes with sidebar layout */}
        <Route path="/admin/tournaments/:id" element={<TournamentLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<TournamentOverview />} />
          <Route path="age-groups" element={<AgeGroups />} />
          <Route path="venues" element={<Venues />} />
          <Route path="stats" element={<TournamentStats />} />
          <Route path="standings" element={<TournamentStandings />} />
          <Route path="playoff" element={<TournamentPlayoff />} />
          <Route path="settings" element={<TournamentEdit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
