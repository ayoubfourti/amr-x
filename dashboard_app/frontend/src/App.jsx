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

function AppLayout() {
  const location = useLocation()

  return (
    <div className="app-layout">
      <Sidebar />
      <button
        type="button"
        className="sidebar-overlay"
        aria-label="Close navigation"
        onClick={() => {
          document.body.removeAttribute('data-sidebar')
          window.dispatchEvent(new CustomEvent('closeSidebar'))
        }}
      />
      <main className="app-content">
        <ErrorBoundary
          key={location.pathname}
          fallback={
            <div
              style={{
                padding: '48px 32px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
              <div
                style={{
                  color: '#e2e8f0',
                  fontWeight: 600,
                  marginBottom: 8,
                  fontSize: 16,
                }}
              >
                This page encountered an error
              </div>
              <div style={{ marginBottom: 20 }}>
                Use the sidebar to navigate to another page, or reload the app.
              </div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  background: '#38bdf8',
                  color: '#0a0a0f',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Reload
              </button>
            </div>
          }
        >
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  )
}

function RouteLoader() {
  return (
    <div className="route-loader" role="status">
      <span className="loading-orbit" />
      <p>Loading command surface…</p>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: '#07080f',
            color: '#e8eaf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 16,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div style={{ fontSize: 48 }}>⚠</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>AMR-X Dashboard crashed</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>An unexpected error occurred.</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#00d4aa',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14,
              marginTop: 8,
            }}
          >
            Reload App
          </button>
        </div>
      }
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <TitleUpdater />
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/pending" element={<PendingApproval />} />
                <Route element={<ProtectedLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="/robots" element={<Robots />} />
                  <Route path="/missions" element={<Missions />} />
                  <Route path="/map" element={<Map />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/modules" element={<Modules />} />
                  <Route path="/teleoperation" element={<Teleoperation />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
