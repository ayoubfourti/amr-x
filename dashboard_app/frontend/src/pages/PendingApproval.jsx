import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function PendingApproval() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true })
    }
  }, [currentUser, navigate])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>AMR-X</h1>
        <h2>Account pending approval</h2>
        <p>
          Your account has been created successfully. An administrator needs to approve
          your access before you can use the dashboard. Please check back later.
        </p>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default PendingApproval
