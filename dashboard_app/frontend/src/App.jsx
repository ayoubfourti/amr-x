import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import PendingApproval from './pages/PendingApproval'
import Users from './pages/Users'
import Dashboard from './pages/Dashboard'
import Robots from './pages/Robots'
import Missions from './pages/Missions'
import Alerts from './pages/Alerts'
import Modules from './pages/Modules'
import Teleoperation from './pages/Teleoperation'
import Map from './pages/Map'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import ErrorBoundary from './components/ui/ErrorBoundary'
import './App.css'
import { useDockingStatus } from './hooks/useDockingStatus'
import { useModuleDocking } from './hooks/useModuleDocking'
import DockingPanel from './components/DockingPanel'

import { useRos } from './hooks/useRos'
import { useTeleopControl } from './hooks/useTeleopControl'

const queryClient = new QueryClient()

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

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div
        className="sidebar-overlay"
        onClick={() => {
          document.body.removeAttribute('data-sidebar')
          window.dispatchEvent(new CustomEvent('closeSidebar'))
        }}
      />
      <main className="app-content">
        <ErrorBoundary
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
          {children}
        </ErrorBoundary>
      </main>
    </div>
  )
}

function App() {
  const { ros, connected } = useRos('ws://localhost:9090');
  const { sendCommand, emergencyStop } = useTeleopControl(ros);
  const docking = useDockingStatus(ros);
  const { dock, undock, progress, result } = useModuleDocking(ros);
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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pending" element={<PendingApproval />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/robots"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Robots />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/missions"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Missions />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Map />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Alerts />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/modules"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Modules />
                    <DockingPanel
                      docking={docking}
                      progress={progress}
                      result={result}
                      onDock={() => dock()}
                      onUndock={undock}
                    />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teleoperation"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Teleoperation
                      unitOnline={connected}
                      onSendCommand={sendCommand}
                      onEmergencyStop={emergencyStop}
                    />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Users />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
