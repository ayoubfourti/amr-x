import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useSidebarPreference } from '../hooks/useSidebarPreference'
import { getUsers } from '../api/users'
import Icon from './ui/Icon'

const groups = [
  {
    label: 'Operations',
    links: [
      { to: '/', label: 'Overview', icon: 'overview' },
      { to: '/missions', label: 'Missions', icon: 'mission' },
      { to: '/map', label: 'Live map', icon: 'map' },
    ],
  },
  {
    label: 'Control',
    links: [
      { to: '/teleoperation', label: 'Teleoperation', icon: 'teleop' },
      { to: '/robots', label: 'Fleet', icon: 'robot' },
      { to: '/modules', label: 'Modules', icon: 'module' },
    ],
  },
  {
    label: 'System',
    links: [
      { to: '/alerts', label: 'Alerts', icon: 'alert' },
      { to: '/users', label: 'Team', icon: 'users', adminOnly: true },
      { to: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
]

function initials(name = '?') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

function Sidebar() {
  const { currentUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { collapsed, togglePreference } = useSidebarPreference()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = currentUser?.role === 'admin'
  const showExpandedContent = !collapsed || mobileOpen

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: isAdmin,
    staleTime: 20000,
  })
  const pendingCount = users.filter((user) => user.status === 'pending').length

  useEffect(() => {
    setMobileOpen(false)
    document.body.removeAttribute('data-sidebar')
  }, [location])

  useEffect(() => {
    const close = () => {
      setMobileOpen(false)
      document.body.removeAttribute('data-sidebar')
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close()
    }
    const handleResize = () => {
      if (window.innerWidth > 1023) close()
    }
    window.addEventListener('closeSidebar', close)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('closeSidebar', close)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
      document.body.removeAttribute('data-sidebar')
    }
  }, [])

  function toggleCollapsed() {
    togglePreference()
  }

  function toggleMobile() {
    setMobileOpen((value) => {
      const next = !value
      if (next) {
        document.body.setAttribute('data-sidebar', 'open')
      } else {
        document.body.removeAttribute('data-sidebar')
      }
      return next
    })
  }

  return (
    <>
      <button
        className="mobile-nav-trigger"
        type="button"
        onClick={toggleMobile}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
        aria-controls="primary-navigation"
      >
        <span />
        <span />
        <span />
      </button>
      <nav
        id="primary-navigation"
        className={`sidebar neo-sidebar ${collapsed && !mobileOpen ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar-brand">
          <button
            className="sidebar-logo"
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="brand-mark-ring">X</span>
          </button>
          {showExpandedContent && (
            <div className="sidebar-brand-text">
              <div className="sidebar-title">AMR-X</div>
              <div className="sidebar-subtitle">Operations cloud</div>
            </div>
          )}
          {mobileOpen && (
            <button type="button" className="sidebar-close-mobile" onClick={toggleMobile} aria-label="Close navigation">
              <Icon name="close" size={18} />
            </button>
          )}
        </div>

        {showExpandedContent && (
          <div className="workspace-switcher">
            <span className="workspace-glyph"><Icon name="command" size={17} /></span>
            <span><small>Workspace</small><strong>Tunis Lab 01</strong></span>
            <Icon name="chevron" size={14} />
          </div>
        )}

        <div className="sidebar-nav-section">
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              {showExpandedContent && <div className="sidebar-section-label">{group.label}</div>}
              <ul>
                {group.links.filter((link) => !link.adminOnly || isAdmin).map((link) => (
                  <li key={link.to}>
                    <NavLink to={link.to} end={link.to === '/'} title={!showExpandedContent ? link.label : undefined}>
                      <span className="nav-icon"><Icon name={link.icon} size={19} /></span>
                      {showExpandedContent && <span className="nav-label">{link.label}</span>}
                      {link.to === '/users' && pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="sidebar-system-state">
          <span className="system-orbit"><i /></span>
          {showExpandedContent && <span><strong>All systems nominal</strong><small>Last sync · just now</small></span>}
        </div>

        <button
          className="sidebar-collapse-btn"
          onClick={toggleCollapsed}
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name={collapsed ? 'chevron' : 'collapse'} size={17} />
        </button>

        {currentUser && (
          <div className="sidebar-footer">
            <button className="sidebar-user-row" type="button" onClick={() => navigate('/profile')}>
              <div className="sidebar-avatar">{initials(currentUser.name)}</div>
              {showExpandedContent && (
                <span className="sidebar-user-info">
                  <strong className="sidebar-user-name">{currentUser.name}</strong>
                  <small className="sidebar-user-role">{currentUser.role || 'Operator'}</small>
                </span>
              )}
            </button>
            <button
              className="sidebar-theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="sidebar-theme-icon">
                <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={15} />
              </span>
            </button>
          </div>
        )}
      </nav>
    </>
  )
}

export default Sidebar
