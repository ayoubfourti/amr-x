import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getUsers } from '../api/users'
import { getRobots } from '../api/robots'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/robots', label: 'Robots' },
  { to: '/missions', label: 'Missions' },
  { to: '/map', label: 'Map' },
  { to: '/teleoperation', label: 'Teleoperation' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/modules', label: 'Modules' },
  { to: '/users', label: 'Users' },
  { to: '/settings', label: 'Settings' },
]

const NAV_ICONS = {
  '/': '⊞',
  '/robots': '◉',
  '/missions': '⚑',
  '/map': '⊕',
  '/teleoperation': '⊛',
  '/alerts': '⊘',
  '/modules': '⊟',
  '/users': '⊙',
  '/settings': '⚙',
}

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2']

function Sidebar() {
  const { currentUser, logout } = useAuth()
  useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = currentUser?.role === 'admin'
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('warebot-sidebar')
    setCollapsed(stored === 'closed')
  }, [])

  function closeMobile() {
    setMobileOpen(false)
    document.body.removeAttribute('data-sidebar')
  }

  useEffect(() => {
    closeMobile()
  }, [location])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 767) {
        closeMobile()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    function handler() {
      closeMobile()
    }
    window.addEventListener('closeSidebar', handler)
    return () => window.removeEventListener('closeSidebar', handler)
  }, [])

  function toggleMobile() {
    setMobileOpen((o) => {
      const next = !o
      if (next) {
        document.body.setAttribute('data-sidebar', 'open')
      } else {
        document.body.removeAttribute('data-sidebar')
      }
      return next
    })
  }

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: isAdmin,
    refetchInterval: 30000,
    staleTime: 20000,
  })

  const pendingCount = isAdmin ? (usersData || []).filter((u) => u.status === 'pending').length : 0

  const { data: robotsData } = useQuery({
    queryKey: ['robots'],
    queryFn: getRobots,
    refetchInterval: 10000,
    staleTime: 8000,
  })

  const firstRobot = (robotsData || []).find((r) => r.status === 'online') || (robotsData || [])[0] || null

  const visibleLinks = links.filter(
    (link) => !(link.to === '/users' && currentUser?.role === 'client'),
  )

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('warebot-sidebar', next ? 'closed' : 'open')
      return next
    })
  }

  const avatarBg =
    AVATAR_COLORS[(currentUser?.name || '').charCodeAt(0) % AVATAR_COLORS.length] || AVATAR_COLORS[0]

  return (
    <nav
      className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      style={{ width: collapsed ? 68 : 240 }}
    >
      <div className="sidebar-brand">
        <div className="sidebar-logo" onClick={toggleCollapsed} style={{ cursor: 'pointer' }}>
          <span
            style={{
              fontSize: collapsed ? 14 : 12,
              fontWeight: 900,
              color: '#fff',
              letterSpacing: -0.5,
            }}
          >
            AX
          </span>
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <div className="sidebar-title">AMR-X</div>
            <div className="sidebar-subtitle">CTRL-SYS v2.4.1</div>
          </div>
        )}
      </div>

      {!collapsed && firstRobot && (
        <div className="unit-widget">
          <div className="unit-widget-row">
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--sidebar-text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 120,
              }}
            >
              {firstRobot.name.toUpperCase()}
            </span>
            <span
              className={firstRobot.status === 'online' ? 'unit-online' : ''}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color:
                  firstRobot.status === 'online'
                    ? 'var(--online)'
                    : firstRobot.status === 'error'
                      ? 'var(--error)'
                      : 'var(--offline)',
                whiteSpace: 'nowrap',
              }}
            >
              ● {firstRobot.status.toUpperCase()}
            </span>
          </div>
          <div className="unit-bar">
            <div
              className="unit-bar-fill"
              style={{
                width: `${firstRobot.battery ?? 0}%`,
                background:
                  firstRobot.battery < 15 ? 'var(--error)' : firstRobot.battery < 40 ? 'var(--warning)' : 'var(--online)',
              }}
            />
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--sidebar-text)',
              marginTop: 4,
              textAlign: 'right',
            }}
          >
            {firstRobot.battery ?? '—'}% battery
          </div>
        </div>
      )}

      {!collapsed && !firstRobot && (
        <div
          className="unit-widget"
          style={{
            textAlign: 'center',
            color: 'var(--sidebar-text)',
            fontSize: 11,
          }}
        >
          No robots online
        </div>
      )}

      <button type="button" className="sidebar-hamburger" onClick={toggleMobile} aria-label="Toggle navigation">
        ☰
      </button>

      <div className="sidebar-nav-section">
        {!collapsed && <div className="sidebar-section-label">MENU</div>}
        <ul>
          {visibleLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                title={collapsed ? link.label : undefined}
                style={{ position: 'relative' }}
              >
                <span className="nav-icon">{NAV_ICONS[link.to] || '●'}</span>
                {!collapsed && <span className="nav-label">{link.label}</span>}
                {!collapsed && link.to === '/users' && isAdmin && pendingCount > 0 && (
                  <span className="nav-badge">{pendingCount}</span>
                )}
                {collapsed && link.to === '/users' && isAdmin && pendingCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#ef4444',
                    }}
                  />
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <button
        className="sidebar-collapse-btn"
        onClick={toggleCollapsed}
        type="button"
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {currentUser && (
        <div className="sidebar-footer">
          <div className="sidebar-user-row">
            <div className="sidebar-avatar" style={{ background: avatarBg }}>
              {(currentUser.name || '?')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join('')}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{currentUser.name}</div>
                <div className="sidebar-user-role">{currentUser.role}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button type="button" className="sidebar-logout-btn" onClick={handleLogout}>
              ⎋ Logout
            </button>
          )}
          {collapsed && (
            <button
              type="button"
              className="sidebar-logout-btn sidebar-logout-icon"
              onClick={handleLogout}
              title="Logout"
            >
              ⎋
            </button>
          )}
        </div>
      )}
    </nav>
  )
}

export default Sidebar
