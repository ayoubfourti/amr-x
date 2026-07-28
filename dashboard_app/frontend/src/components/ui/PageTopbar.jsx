import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import AvatarChip from './AvatarChip'

export default function PageTopbar({ title, latency = null, subtitle }) {
  const { currentUser, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
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

  return (
    <div className="page-topbar">
      <div>
        <h2>{title}</h2>
        <p className="topbar-subtext">{subtitle ?? new Date().toLocaleString()}</p>
      </div>
      <div className="topbar-right">
        <span className="connection-pill">📶 Connected · {latency ? `${latency}ms` : 'N/A'}</span>

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
                  <span className="profile-menu-icon">⚙</span>
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
                  <span className="profile-menu-icon">👤</span>
                  <span>Profile</span>
                </button>

                <button className="profile-menu-item" type="button" onClick={toggleTheme}>
                  <span className="profile-menu-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                  <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                  <span className="profile-menu-badge">{theme === 'dark' ? 'DARK' : 'LIGHT'}</span>
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
      </div>
    </div>
  )
}
