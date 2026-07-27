import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUsers } from '../api/users'
import { useAuth } from '../context/AuthContext'
import { getAllUsers, getStatus } from '../utils/pendingUsers'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const users = await getUsers()
      const user = users.find((u) => u.email === form.email)
      if (!user || user.password_hash !== form.password) {
        setError('Invalid email or password')
        return
      }

      const status = getStatus(user.email, getAllUsers())
      if (status === 'rejected') {
        setError('This registration was rejected by an administrator.')
        return
      }

      login({ ...user, status })
      navigate(status === 'approved' ? '/' : '/pending')
    } catch {
      setError('Invalid email or password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">AX</div>
        <h1 className="auth-title">AMR-X Dashboard</h1>
        <p className="auth-subtitle">Professional ROS Teleoperation Suite</p>

        <form onSubmit={handleSubmit}>
          <label className="auth-field">
            <span className="auth-label">👤 Email</span>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>
          <label className="auth-field">
            <span className="auth-label">🔒 Password</span>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>
          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            🔒 {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
