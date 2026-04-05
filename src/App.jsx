import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from './components/Toast'
import RequireAuth from './components/RequireAuth'

// Landing is eager — it's the first thing every visitor sees
import Landing from './pages/Public/Landing'

// ── Public pages (lazy) ───────────────────────────────────────────
const TournamentList   = lazy(() => import('./pages/Public/TournamentList'))
const TournamentDetail = lazy(() => import('./pages/Public/TournamentDetail'))
const Standings        = lazy(() => import('./pages/Public/Standings'))
const Schedule         = lazy(() => import('./pages/Public/Schedule'))
const TeamRoster       = lazy(() => import('./pages/Public/TeamRoster'))
const Register         = lazy(() => import('./pages/Public/Register'))
const About            = lazy(() => import('./pages/Public/About'))
const Contact          = lazy(() => import('./pages/Public/Contact'))

// ── Admin pages (lazy) ───────────────────────────────────────────
const Login           = lazy(() => import('./pages/Admin/Login'))
const AdminRegister   = lazy(() => import('./pages/Admin/Register'))
const Dashboard       = lazy(() => import('./pages/Admin/Dashboard'))
const TournamentNew   = lazy(() => import('./pages/Admin/Tournaments/New'))
const TournamentEdit  = lazy(() => import('./pages/Admin/Tournaments/Edit'))
const AgeGroups       = lazy(() => import('./pages/Admin/AgeGroups'))
const Venues          = lazy(() => import('./pages/Admin/Venues'))
const Teams           = lazy(() => import('./pages/Admin/Teams'))
const Fixtures        = lazy(() => import('./pages/Admin/Fixtures/index'))
const Matchday        = lazy(() => import('./pages/Admin/Matchday'))
const Print           = lazy(() => import('./pages/Admin/Print'))

// ── Tournament workspace (lazy) ───────────────────────────────────
const TournamentLayout    = lazy(() => import('./pages/Admin/Tournament/TournamentLayout'))
const TournamentOverview  = lazy(() => import('./pages/Admin/Tournament/TournamentOverview'))
const TournamentStats     = lazy(() => import('./pages/Admin/Tournament/TournamentStats'))
const TournamentStandings = lazy(() => import('./pages/Admin/Tournament/TournamentStandings'))
const TournamentPlayoff   = lazy(() => import('./pages/Admin/Tournament/TournamentPlayoff'))

function PageLoader() {
  return <div className="loading">Ielādē...</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/"                                    element={<Landing />} />
          <Route path="/turniri"                             element={<TournamentList />} />
          <Route path="/par-mums"                            element={<About />} />
          <Route path="/kontakti"                            element={<Contact />} />
          <Route path="/t/:slug"                             element={<TournamentDetail />} />
          <Route path="/t/:slug/:ageGroup"                   element={<Standings />} />
          <Route path="/t/:slug/:ageGroup/fixtures"          element={<Schedule />} />
          <Route path="/t/:slug/:ageGroup/teams/:teamId"     element={<TeamRoster />} />
          <Route path="/t/:slug/register"                    element={<Register />} />

          {/* Admin: top-level */}
          <Route path="/admin"          element={<Login />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/admin/dashboard"
            element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/admin/tournaments/new"
            element={<RequireAuth><TournamentNew /></RequireAuth>} />
          <Route path="/admin/matchday"
            element={<RequireAuth><Matchday /></RequireAuth>} />
          <Route path="/admin/tournaments/:id/print"
            element={<RequireAuth><Print /></RequireAuth>} />

          {/* Age-group-scoped routes */}
          <Route path="/admin/age-groups/:ageGroupId/teams"
            element={<RequireAuth><Teams /></RequireAuth>} />
          <Route path="/admin/age-groups/:ageGroupId/fixtures"
            element={<RequireAuth><Fixtures /></RequireAuth>} />

          {/* Tournament workspace — nested routes with sidebar layout */}
          <Route path="/admin/tournaments/:id" element={<TournamentLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview"   element={<TournamentOverview />} />
            <Route path="age-groups" element={<AgeGroups />} />
            <Route path="venues"     element={<Venues />} />
            <Route path="stats"      element={<TournamentStats />} />
            <Route path="standings"  element={<TournamentStandings />} />
            <Route path="playoff"    element={<TournamentPlayoff />} />
            <Route path="settings"   element={<TournamentEdit />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
