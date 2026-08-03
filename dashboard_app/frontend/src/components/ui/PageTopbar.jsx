import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import AvatarChip from './AvatarChip'
import Icon from './Icon'
import { PageHeader, StatusPill } from './CommandUI'

const PAGE_ICONS = {
  Robots: 'robot',
  Missions: 'mission',
  Alerts: 'alert',
  Modules: 'module',
  Users: 'users',
  Settings: 'settings',
  Profile: 'users',
}

export default function PageTopbar({
  title,
  latency = null,
  subtitle,
  eyebrow = 'AMR-X operations',
  icon,
  action,
}) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleLogout() {
    logout()
    navigate('/login')
    setOpen(false)
  }

  const actions = (
    <>
        <StatusPill tone={latency ? 'green' : 'neutral'}>
          {latency ? `Fleet link · ${latency} ms` : 'Fleet link · standby'}
        </StatusPill>
        {action}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <AvatarChip
            name={currentUser?.name}
            onClick={() => setOpen((o) => !o)}
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform 0.1s, box-shadow 0.1s',
              transform: open ? 'scale(0.95)' : 'scale(1)',
              boxShadow: open ? '0 0 0 3px rgba(0,212,170,0.3)' : undefined,
            }}
          />

          {open && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <AvatarChip name={currentUser?.name} style={{ width: 44, height: 44, fontSize: 16, flexShrink: 0 }} />
                <div>
                  <div className="profile-name">{currentUser?.name || 'User'}</div>
                  <div className="profile-role">{currentUser?.email || currentUser?.role || 'Administrator'}</div>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              <div className="profile-dropdown-menu">
                <button
                  className="profile-menu-item"
                  type="button"
                  onClick={() => {
                    navigate('/settings')
                    setOpen(false)
                  }}
                >
                  <span className="profile-menu-icon"><Icon name="settings" size={16} /></span>
                  <span>Settings</span>
                </button>

                <button
                  className="profile-menu-item"
                  type="button"
                  onClick={() => {
                    navigate('/profile')
                    setOpen(false)
                  }}
                >
                  <span className="profile-menu-icon"><Icon name="users" size={16} /></span>
                  <span>Profile</span>
                </button>

              </div>

              <div className="profile-dropdown-divider" />

              <div className="profile-dropdown-footer">
                <div className="profile-version">AMR-X · CTRL-SYS v2.4.1</div>
                <button className="profile-logout-btn" type="button" onClick={handleLogout}>
                  ⎋ Sign out
                </button>
              </div>
            </div>
          )}
        </div>
    </>
  )

  return (
    <PageHeader
      eyebrow={eyebrow}
      title={title}
      description={subtitle ?? 'Live operational workspace'}
      icon={icon || PAGE_ICONS[title] || 'overview'}
      actions={actions}
    />
  )
}
