import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import './App.css'
import { useDockingStatus } from './hooks/useDockingStatus'
import { useModuleDocking } from './hooks/useModuleDocking'
import DockingPanel from './components/DockingPanel'

import { useRos } from './hooks/useRos'
import { useTeleopControl } from './hooks/useTeleopControl'

const queryClient = new QueryClient()

function Placeholder({ title }) {
  return <h2>{title}</h2>
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content">{children}</main>
    </div>
  )
}

function App() {
  const { ros, connected } = useRos('ws://localhost:9090');
  const { sendCommand, emergencyStop } = useTeleopControl(ros);
  const docking = useDockingStatus(ros);
  const { dock, undock, progress, result } = useModuleDocking(ros);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
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
                    <Placeholder title="Map" />
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
                    <Placeholder title="Settings" />
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
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
