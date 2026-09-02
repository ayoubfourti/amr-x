import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute() {
  const { isAuthenticated, currentUser } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (currentUser.status !== 'approved') {
    return <Navigate to="/pending-approval" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
