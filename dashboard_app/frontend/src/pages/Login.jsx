import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Icon from '../components/ui/Icon'
import './Login.css'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const response = await axios.post('/api/auth/login', {
        email: form.email,
        password: form.password,
      })
      login(response.data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-command-preview" aria-labelledby="login-brand-heading">
        <header className="login-brand">
          <span className="login-brand-mark" aria-hidden="true">
            <span />
            AX
          </span>
          <span className="login-brand-copy">
            <strong id="login-brand-heading">AMR-X</strong>
            <small>Autonomous mission control</small>
          </span>
        </header>

        <div className="login-hero">
          <span className="login-eyebrow">
            <span className="login-live-dot" />
            Operations platform
          </span>
          <h1>
            Control every mission.
            <span>See every movement.</span>
          </h1>
          <p>
            One secure workspace for fleet supervision, mission execution,
            teleoperation, and the live digital twin.
          </p>
        </div>

        <div className="login-world" aria-hidden="true">
          <svg className="login-world-grid" viewBox="0 0 720 320" preserveAspectRatio="none">
            <defs>
              <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(77, 187, 218, 0.09)" />
              </pattern>
              <linearGradient id="login-route" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#16f0d0" stopOpacity="0.15" />
                <stop offset="0.45" stopColor="#16f0d0" />
                <stop offset="1" stopColor="#4cc9ff" />
              </linearGradient>
            </defs>
            <rect width="720" height="320" fill="url(#login-grid)" stroke="none" />
            <path className="login-route-glow" d="M35 246 C160 246 138 98 278 112 S430 250 500 174 S598 72 690 72" />
            <path className="login-route-line" d="M35 246 C160 246 138 98 278 112 S430 250 500 174 S598 72 690 72" />
            <circle className="login-route-origin" cx="35" cy="246" r="7" />
            <circle className="login-route-target" cx="690" cy="72" r="9" />
          </svg>

          <div className="login-robot-marker">
            <span className="login-robot-pulse" />
            <span className="login-robot-icon">
              <Icon name="robot" size={19} />
            </span>
            <span className="login-robot-label">
              <strong>AMR-07</strong>
              <small>Mission active</small>
            </span>
          </div>

          <div className="login-world-card login-world-card-fleet">
            <span>Fleet online</span>
            <strong>12 <small>/ 14 units</small></strong>
            <div><i style={{ '--bar-width': '86%' }} /></div>
          </div>

          <div className="login-world-card login-world-card-mission">
            <Icon name="route" size={17} />
            <span>
              <small>Active mission</small>
              <strong>Dock delivery · 68%</strong>
            </span>
          </div>
        </div>

        <footer className="login-system-status">
          <span><i /> Fleet network operational</span>
          <span>ROS 2 connected</span>
          <span>Digital twin synchronized</span>
        </footer>
      </section>

      <section className="login-access-panel" aria-labelledby="login-heading">
        <div className="login-access-card">
          <div className="login-mobile-brand" aria-hidden="true">
            <span className="login-brand-mark"><span />AX</span>
            <span className="login-brand-copy">
              <strong>AMR-X</strong>
              <small>Autonomous mission control</small>
            </span>
          </div>

          <div className="login-access-heading">
            <span className="login-access-kicker">
              <Icon name="shield" size={15} />
              Secure operator access
            </span>
            <h2 id="login-heading">Welcome back</h2>
            <p>Sign in to open the AMR-X command center.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <span>Email address</span>
              <span className="login-input-shell">
                <Icon name="mail" size={18} />
                <input
                  name="email"
                  type="email"
                  placeholder="operator@amr-x.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  autoFocus
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                  required
                />
              </span>
            </label>

            <label className="login-field">
              <span>Password</span>
              <span className="login-input-shell">
                <Icon name="lock" size={18} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                  required
                />
                <button
                  className="login-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </span>
            </label>

            {error && (
              <div id="login-error" className="login-error" role="alert">
                <Icon name="alert" size={17} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="login-submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Opening command center…' : 'Enter command center'}</span>
              <Icon name="arrow" size={18} />
            </button>
          </form>

          <p className="login-register">
            New to AMR-X? <Link to="/register">Create an operator account</Link>
          </p>

          <div className="login-security-note">
            <Icon name="shield" size={17} />
            <span>
              <strong>Protected control environment</strong>
              Your session is authenticated before robot controls are enabled.
            </span>
          </div>
        </div>

        <footer className="login-access-footer">
          <span>AMR-X control system</span>
          <span>Authorized personnel only</span>
        </footer>
      </section>
    </main>
  )
}

export default Login
