import { lazy, Suspense, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import ErrorBoundary from './components/ui/ErrorBoundary'
import './App.css'

const queryClient = new QueryClient()

const Alerts = lazy(() => import('./pages/Alerts'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Inspection = lazy(() => import('./pages/Inspection'))
const InspectionHistory = lazy(() => import("./pages/InspectionHistory"))
const Login = lazy(() => import('./pages/Login'))
const Map = lazy(() => import('./pages/Map'))
const Missions = lazy(() => import('./pages/Missions'))
const Modules = lazy(() => import('./pages/Modules'))
const NotFound = lazy(() => import('./pages/NotFound'))
const PendingApproval = lazy(() => import('./pages/PendingApproval'))
const Profile = lazy(() => import('./pages/Profile'))
const Register = lazy(() => import('./pages/Register'))
const Robots = lazy(() => import('./pages/Robots'))
const Settings = lazy(() => import('./pages/Settings'))
const Teleoperation = lazy(() => import('./pages/Teleoperation'))
const Users = lazy(() => import('./pages/Users'))

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/robots': 'Robots',
  '/missions': 'Missions',
  '/map': 'Live Map',
  '/teleoperation': 'Teleoperation',
  '/alerts': 'Alerts',
  '/inspection': 'Inspection Results',
  '/inspection-history': 'Inspection History',
  '/modules': 'Modules',
  '/users': 'Users',
  '/settings': 'Settings',
  '/profile': 'Profile',
}

function usePageTitle() {
  const location = useLocation()
  useEffect(() => {
    const page = PAGE_TITLES[location.pathname]
    document.title = page ? `${page} — AMR-X` : 'AMR-X — Control System'
  }, [location.pathname])
}

function TitleUpdater() {
  usePageTitle()
  return null
}

function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content">
        <TitleUpdater />
        <Suspense fallback={<div>Loading...</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/robots" element={<Robots />} />
                  <Route path="/missions" element={<Missions />} />
                  <Route path="/map" element={<Map />} />
                  <Route path="/teleoperation" element={<Teleoperation />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/inspection" element={<Inspection />} />
                  <Route path="/inspection-history" element={<InspectionHistory />} />
                  <Route path="/modules" element={<Modules />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
