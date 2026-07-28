import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

const emptyForm = { name: '', email: '', password: '' }

function Register() {
  const [form, setForm] = useState(emptyForm)
  const [validationError, setValidationError] = useState('')
  const [duplicateEmail, setDuplicateEmail] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'email') setDuplicateEmail(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setValidationError('')
    setDuplicateEmail(false)

    if (!form.name || !form.email || !form.password) {
      setValidationError('All fields are required.')
      return
    }
    if (!form.email.includes('@')) {
      setValidationError('Email must contain @.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await axios.post('/api/auth/register', {
        email: form.email,
        password: form.password,
        name: form.name || form.email.split('@')[0],
        admin_code: isAdmin ? adminCode : undefined,
      })

      if (response.data.auto_approved) {
        // Admin — can login immediately
        setSuccess('✅ Admin account created! You can now login.')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        // Regular user — needs approval
        setSuccess('✅ Account created! Waiting for admin approval.')
        setTimeout(() => navigate('/pending'), 2000)
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setDuplicateEmail(true)
      } else {
        setValidationError(err.response?.data?.detail || 'Registration failed.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>AMR-X</h1>
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className={duplicateEmail ? 'input-error' : ''}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: '12px 0',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}
            onClick={() => {
              setIsAdmin((v) => !v)
              setAdminCode('')
            }}
          >
            <div
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: isAdmin ? '#00d4aa' : 'rgba(255,255,255,0.15)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: isAdmin ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 13,
                color: isAdmin ? '#00d4aa' : 'rgba(255,255,255,0.5)',
              }}
            >
              Register as Administrator
            </span>
          </div>

          {isAdmin && (
            <label className="auth-field">
              <span className="auth-label">🔑 Admin Code</span>
              <input
                type="password"
                placeholder="Enter admin secret code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                required={isAdmin}
              />
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: 4,
                }}
              >
                Contact your system administrator for the admin code
              </span>
            </label>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registering…' : 'Register'}
          </button>
        </form>
        {validationError && <p className="error">{validationError}</p>}
        {duplicateEmail && (
          <p className="error">
            An account with this email already exists. Please use a different email or go
            to login. <Link to="/login">Go to login</Link>
          </p>
        )}
        {success && (
          <p
            style={{
              color: '#00d4aa',
              fontSize: 13,
              textAlign: 'center',
              marginTop: 12,
              padding: '8px 12px',
              background: 'rgba(0,212,170,0.1)',
              borderRadius: 8,
              border: '1px solid rgba(0,212,170,0.2)',
            }}
          >
            {success}
          </p>
        )}
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
