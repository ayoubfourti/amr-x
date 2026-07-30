import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute({ children }) {
  const { isAuthenticated, currentUser } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (currentUser.status !== 'approved') {
    return <Navigate to="/pending" replace />
  }

  return children
}

export default ProtectedRoute
