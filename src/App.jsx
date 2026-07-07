import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from './components/Toast'
import RequireAuth from './components/RequireAuth'
import CookieBanner from './components/CookieBanner'

// ── Public pages ──────────────────────────────────────────────────
const Landing         = lazy(() => import('./pages/Public/Landing'))
const TournamentList  = lazy(() => import('./pages/Public/TournamentList'))
const TournamentDetail = lazy(() => import('./pages/Public/TournamentDetail'))
const Standings       = lazy(() => import('./pages/Public/Standings'))
const Schedule        = lazy(() => import('./pages/Public/Schedule'))
const TeamRoster      = lazy(() => import('./pages/Public/TeamRoster'))
const Register        = lazy(() => import('./pages/Public/Register'))
const TournamentOverviewPublic = lazy(() => import('./pages/Public/Overview'))
const About           = lazy(() => import('./pages/Public/About'))
const Contact         = lazy(() => import('./pages/Public/Contact'))
const Privacy         = lazy(() => import('./pages/Public/Privacy'))
const Terms           = lazy(() => import('./pages/Public/Terms'))
const CookiesPage     = lazy(() => import('./pages/Public/Cookies'))
const DataDeletion    = lazy(() => import('./pages/Public/DataDeletion'))
const Guide           = lazy(() => import('./pages/Public/Guide'))
const Blog            = lazy(() => import('./pages/Public/Blog'))
const BlogPost        = lazy(() => import('./pages/Public/BlogPost'))
const Changelog       = lazy(() => import('./pages/Public/Changelog'))
const Match           = lazy(() => import('./pages/Public/Match'))

// ── Service / landing pages ───────────────────────────────────────
const FootballTournament        = lazy(() => import('./pages/Public/services/FootballTournament'))
const TournamentBracketGenerator = lazy(() => import('./pages/Public/services/TournamentBracketGenerator'))
const FreeTournamentSoftware    = lazy(() => import('./pages/Public/services/FreeTournamentSoftware'))
const BeachVolleyballTournament = lazy(() => import('./pages/Public/services/BeachVolleyballTournament'))
const Team            = lazy(() => import('./pages/Public/Team'))
const PublicInfo      = lazy(() => import('./pages/Public/Info'))
const Registration    = lazy(() => import('./pages/Public/Registration'))
const NotFound        = lazy(() => import('./pages/Public/NotFound'))
const AuthConfirm     = lazy(() => import('./pages/Public/AuthConfirm'))

// ── Admin pages ───────────────────────────────────────────────────
const Login          = lazy(() => import('./pages/Admin/Login'))
const AdminRegister  = lazy(() => import('./pages/Admin/Register'))
const Dashboard      = lazy(() => import('./pages/Admin/Dashboard'))
const TournamentNew  = lazy(() => import('./pages/Admin/Tournaments/New'))
const TournamentEdit = lazy(() => import('./pages/Admin/Tournaments/Edit'))
const AgeGroups      = lazy(() => import('./pages/Admin/AgeGroups'))
const Venues         = lazy(() => import('./pages/Admin/Venues'))
const Teams          = lazy(() => import('./pages/Admin/Teams'))
const Fixtures       = lazy(() => import('./pages/Admin/Fixtures/index'))
const Matchday       = lazy(() => import('./pages/Admin/Matchday'))
const Print          = lazy(() => import('./pages/Admin/Print'))

// ── Tournament workspace ──────────────────────────────────────────
const TournamentLayout    = lazy(() => import('./pages/Admin/Tournament/TournamentLayout'))
const TournamentOverview  = lazy(() => import('./pages/Admin/Tournament/TournamentOverview'))
const TournamentStats     = lazy(() => import('./pages/Admin/Tournament/TournamentStats'))
const TournamentStandings = lazy(() => import('./pages/Admin/Tournament/TournamentStandings'))
const TournamentPlayoff   = lazy(() => import('./pages/Admin/Tournament/TournamentPlayoff'))
const TournamentInfo      = lazy(() => import('./pages/Admin/Tournament/TournamentInfo'))
const AdminRegistrations  = lazy(() => import('./pages/Admin/Registrations'))

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <CookieBanner />
        <Suspense fallback={<div />}>
        <Routes>
          {/* Public routes */}
          <Route path="/"                                    element={<Landing />} />
          <Route path="/tournaments"                         element={<TournamentList />} />
          <Route path="/about"                               element={<About />} />
          <Route path="/contact"                             element={<Contact />} />
          <Route path="/guide"                               element={<Guide />} />
          <Route path="/blog"                                element={<Blog />} />
          <Route path="/blog/:slug"                          element={<BlogPost />} />
          <Route path="/changelog"                           element={<Changelog />} />

          {/* Service / landing pages */}
          <Route path="/football-tournament-software"        element={<FootballTournament />} />
<Route path="/tournament-bracket-generator"        element={<TournamentBracketGenerator />} />
          <Route path="/free-tournament-software"            element={<FreeTournamentSoftware />} />
          <Route path="/beach-volleyball-tournament-software" element={<BeachVolleyballTournament />} />
          <Route path="/privacy-policy"                      element={<Privacy />} />
          <Route path="/terms-of-use"                        element={<Terms />} />
          <Route path="/cookie-policy"                       element={<CookiesPage />} />
          <Route path="/data-deletion"                       element={<DataDeletion />} />

          {/* Latvian slug redirects — keep old URLs working */}
          <Route path="/turniri"              element={<Navigate to="/tournaments" replace />} />
          <Route path="/par-mums"             element={<Navigate to="/about" replace />} />
          <Route path="/kontakti"             element={<Navigate to="/contact" replace />} />
          <Route path="/pamaciba"             element={<Navigate to="/guide" replace />} />
          <Route path="/privatuma-politika"   element={<Navigate to="/privacy-policy" replace />} />
          <Route path="/lietosanas-noteikumi" element={<Navigate to="/terms-of-use" replace />} />
          <Route path="/sikdatnu-politika"    element={<Navigate to="/cookie-policy" replace />} />
          <Route path="/datu-dzesana"         element={<Navigate to="/data-deletion" replace />} />

          <Route path="/t/:slug"                             element={<TournamentDetail />} />
          <Route path="/t/:slug/:ageGroup"                   element={<Standings />} />
          <Route path="/t/:slug/:ageGroup/overview"          element={<TournamentOverviewPublic />} />
          <Route path="/t/:slug/:ageGroup/fixtures"          element={<Schedule />} />
          <Route path="/t/:slug/:ageGroup/teams/:teamId"     element={<TeamRoster />} />
          <Route path="/t/:slug/register"                    element={<Register />} />
          <Route path="/:slug/matches/:matchId"              element={<Match />} />
          <Route path="/:slug/teams/:teamId"                 element={<Team />} />
          <Route path="/:slug/info"                          element={<PublicInfo />} />
          <Route path="/:slug/registration"                  element={<Registration />} />

          {/* Admin: top-level */}
          <Route path="/auth/confirm"   element={<AuthConfirm />} />
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

          {/* Tournament workspace — nested routes with sidebar layout */}
          <Route path="/admin/tournaments/:id" element={<TournamentLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview"   element={<TournamentOverview />} />
            <Route path="age-groups" element={<AgeGroups />} />
            <Route path="age-groups/:ageGroupId/teams"    element={<Teams />} />
            <Route path="age-groups/:ageGroupId/fixtures" element={<Fixtures />} />
            <Route path="venues"     element={<Venues />} />
            <Route path="stats"      element={<TournamentStats />} />
            <Route path="standings"  element={<TournamentStandings />} />
            <Route path="playoff"    element={<TournamentPlayoff />} />
            <Route path="settings"   element={<TournamentEdit />} />
            <Route path="info"          element={<TournamentInfo />} />
            <Route path="registrations" element={<AdminRegistrations />} />
            <Route path="matchday"      element={<Matchday />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
    </BrowserRouter>
  )
}
