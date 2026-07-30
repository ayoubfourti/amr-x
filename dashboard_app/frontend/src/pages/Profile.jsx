import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTopbar from '../components/ui/PageTopbar'
import Icon from '../components/ui/Icon'
import { StatusPill } from '../components/ui/CommandUI'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { initials, avatarColor } from '../utils/avatar'
import './SettingsProfile.css'

const STATUS_TONES = {
  approved: 'green',
  pending: 'amber',
  rejected: 'red',
}

function ProfileSection({ icon, eyebrow, title, description, children, className = '' }) {
  return (
    <section className={`command-surface settings-section profile-section ${className}`}>
      <header className="settings-section-header">
        <span className="settings-section-icon"><Icon name={icon} size={18} /></span>
        <span>
          <small>{eyebrow}</small>
          <strong>{title}</strong>
          {description && <p>{description}</p>}
        </span>
      </header>
      <div className="settings-section-body">{children}</div>
    </section>
  )
}

function ProfileFact({ icon, label, value, children }) {
  return (
    <div className="profile-fact">
      <span><Icon name={icon} size={16} /></span>
      <div><small>{label}</small>{children || <strong>{value}</strong>}</div>
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
    localStorage.setItem('amrx-display-name', displayName)
    showToast('Profile updated', 'success')
  }

  function handleSignOut() {
    logout()
    navigate('/login')
  }

  const status = currentUser?.status || 'unknown'
  const role = currentUser?.role || 'operator'

  return (
    <div className="users-page profile-command-page">
      <PageTopbar
        title="Profile"
        subtitle="Operator identity, access level, and active session"
      />

      <div className="profile-layout">
        <aside className="command-surface identity-card">
          <div className="identity-accent" />
          <div
            className="identity-avatar"
            style={{ backgroundColor: avatarColor(currentUser?.name) }}
          >
            {initials(currentUser?.name)}
            <i />
          </div>
          <div className="identity-copy">
            <small>Authenticated operator</small>
            <h2>{displayName || currentUser?.name || 'Operator'}</h2>
            <p>{currentUser?.email}</p>
          </div>
          <div className="identity-status">
            <StatusPill tone={STATUS_TONES[status] || 'neutral'}>{status}</StatusPill>
            <StatusPill tone="blue">{role}</StatusPill>
          </div>
          <div className="identity-meta">
            <span><small>Workspace</small><strong>Tunis Lab 01</strong></span>
            <span><small>Access</small><strong>{role === 'admin' ? 'Full control' : 'Operational'}</strong></span>
          </div>
        </aside>

        <div className="profile-main-column">
          <ProfileSection
            icon="users"
            eyebrow="Identity"
            title="Operator details"
            description="Information displayed across the command workspace."
          >
            <label className="profile-field">
              <span>Display name</span>
              <div>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                <button type="button" className="primary-action" onClick={handleSaveName}>
                  Save changes
                </button>
              </div>
              <small>This preference is stored for the current browser.</small>
            </label>
          </ProfileSection>

          <div className="profile-detail-grid">
            <ProfileSection
              icon="shield"
              eyebrow="Authorization"
              title="Access and security"
              description="Account controls managed by your organization."
            >
              <div className="profile-facts">
                <ProfileFact icon="shield" label="Account status">
                  <StatusPill tone={STATUS_TONES[status] || 'neutral'}>{status}</StatusPill>
                </ProfileFact>
                <ProfileFact icon="users" label="Assigned role">
                  <StatusPill tone="blue">{role}</StatusPill>
                </ProfileFact>
                <ProfileFact icon="settings" label="Password">
                  <button type="button" className="command-icon-action" disabled>Admin managed</button>
                </ProfileFact>
              </div>
            </ProfileSection>

            <ProfileSection
              icon="clock"
              eyebrow="Session"
              title="Current sign-in"
              description="Browser session and authentication context."
            >
              <div className="profile-facts">
                <ProfileFact icon="wifi" label="Session state">
                  <StatusPill tone="green">Active</StatusPill>
                </ProfileFact>
                <ProfileFact icon="clock" label="Started" value={sessionStart} />
                <ProfileFact icon="command" label="Identity" value={currentUser?.email || '—'} />
              </div>
              <button type="button" className="profile-signout" onClick={handleSignOut}>
                <Icon name="logout" size={15} /> Sign out of this session
              </button>
            </ProfileSection>
          </div>
        </div>
      </div>
    </div>
  )
}
