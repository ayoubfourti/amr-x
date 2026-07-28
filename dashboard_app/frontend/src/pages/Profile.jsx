import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTopbar from '../components/ui/PageTopbar'
import Badge from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { initials, avatarColor } from '../utils/avatar'

const ROLE_COLORS = {
  admin: '#dc2626',
  operator: '#2563eb',
  client: '#16a34a',
}

const STATUS_COLORS = {
  approved: '#16a34a',
  pending: '#d97706',
  rejected: '#dc2626',
}

function SettingsRow({ label, subtext, control }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtext}</div>
      </div>
      <div>{control}</div>
    </div>
  )
}

export default function Profile() {
  const { currentUser, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [sessionStart] = useState(() => new Date().toLocaleString())

  useEffect(() => {
    setDisplayName(localStorage.getItem('amrx-display-name') || currentUser?.name || '')
  }, [currentUser])

  function handleSaveName() {
    // Note: this only persists locally. A real implementation would call
    // PATCH /users/me with the new display name.
    localStorage.setItem('amrx-display-name', displayName)
    showToast('Profile updated', 'success')
  }

  function handleSignOut() {
    logout()
    navigate('/login')
  }

  return (
    <div className="users-page">
      <PageTopbar title="Profile" />

      <div className="modal-card" style={{ marginBottom: 20 }}>
        <h3>Profile</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '12px 0' }}>
          <div
            className="avatar-chip"
            style={{
              width: 64,
              height: 64,
              fontSize: 24,
              flexShrink: 0,
              backgroundColor: avatarColor(currentUser?.name),
            }}
          >
            {initials(currentUser?.name)}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="auth-field">
              <span className="auth-label">Name</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </label>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentUser?.email}</div>
            <div>
              <Badge text={currentUser?.role || 'user'} color={ROLE_COLORS[currentUser?.role] || '#6b7280'} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="primary-button" type="button" onClick={handleSaveName}>
            Save changes
          </button>
        </div>
      </div>

      <div className="modal-card" style={{ marginBottom: 20 }}>
        <h3>Security</h3>
        <SettingsRow
          label="Change Password"
          subtext="Contact your admin to reset password"
          control={
            <button className="primary-button" type="button" disabled>
              Request Reset
            </button>
          }
        />
        <SettingsRow
          label="Account Status"
          subtext={currentUser?.status || 'unknown'}
          control={
            <Badge text={currentUser?.status || 'unknown'} color={STATUS_COLORS[currentUser?.status] || '#6b7280'} />
          }
        />
        <SettingsRow
          label="Role"
          subtext="Your access level"
          control={<Badge text={currentUser?.role || 'user'} color={ROLE_COLORS[currentUser?.role] || '#6b7280'} />}
        />
      </div>

      <div className="modal-card">
        <h3>Session</h3>
        <SettingsRow
          label="Current Session"
          subtext={`Logged in as ${currentUser?.email || ''}`}
          control={
            <button className="primary-button" type="button" onClick={handleSignOut}>
              Sign Out
            </button>
          }
        />
        <SettingsRow
          label="Last Login"
          subtext="Session started this browser session"
          control={<span style={{ fontSize: 12, color: 'var(--text)' }}>{sessionStart}</span>}
        />
      </div>
    </div>
  )
}
