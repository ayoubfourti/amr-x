import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAllUsers } from '../utils/pendingUsers'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/robots', label: 'Robots', icon: '◉' },
  { to: '/missions', label: 'Missions' },
  { to: '/map', label: 'Map' },
  { to: '/teleoperation', label: 'Teleoperation' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/modules', label: 'Modules' },
  { to: '/users', label: 'Users' },
  { to: '/settings', label: 'Settings' },
]

function Sidebar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = currentUser?.role === 'admin'
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!isAdmin) return

    function refreshCount() {
      setPendingCount(getAllUsers().filter((u) => u.status === 'pending').length)
    }

    refreshCount()
    const interval = setInterval(refreshCount, 10000)
    return () => clearInterval(interval)
  }, [isAdmin])

  const visibleLinks = links.filter(
    (link) => !(link.to === '/users' && currentUser?.role === 'client'),
  )

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">🤖</span>
        <div>
          <div className="sidebar-title">WareBOT</div>
          <div className="sidebar-subtitle">CTRL-SYS v2.4.1</div>
        </div>
      </div>

      <div className="unit-widget">
        <div className="unit-widget-row">
          <span>UNIT WR-09</span>
          <span className="unit-online">● ONLINE</span>
        </div>
        <div className="unit-bar">
          <div className="unit-bar-fill" style={{ width: '28%' }} />
        </div>
      </div>

      <ul>
        {visibleLinks.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} end={link.to === '/'}>
              {link.icon && <span>{link.icon} </span>}
              {link.label}
              {link.to === '/users' && isAdmin && pendingCount > 0 && (
                <span className="pending-badge"> 🔴 {pendingCount}</span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {currentUser && (
        <div className="sidebar-footer">
          <p className="sidebar-user">
            {currentUser.name} <span className="sidebar-role">({currentUser.role})</span>
          </p>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}

export default Sidebar
