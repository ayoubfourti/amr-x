import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRobots } from '../api/robots'
import { getMissions } from '../api/missions'
import { getAlerts } from '../api/alerts'
import { useAuth } from '../hooks/useAuth'
import { useDemo } from '../hooks/useDemo'
import { useTheme } from '../hooks/useTheme'
import { useRosConnection } from '../hooks/useRosConnection'
import WarehouseMapSVG from '../components/ui/WarehouseMapSVG'
import WarehouseWorld3D from '../components/ui/WarehouseWorld3D'
import Icon from '../components/ui/Icon'
import LiveCameraFeed from '../components/ui/LiveCameraFeed'
import MissionComposer from '../components/MissionComposer'
import SelectField from '../components/ui/SelectField'
import Teleoperation from './Teleoperation'
import { useMapAnnotations } from '../hooks/useMapAnnotations'
import robotRender from '../../../../docs/assets/images/amr-x-base-render.png'
import sdfManifest from '../generated/sdf-worlds.json'
import './Dashboard.css'

const timeline = [
  { label: 'Mission assigned', meta: '09:41', state: 'done' },
  { label: 'Payload collected', meta: 'Dock 02 · 09:44', state: 'done' },
  { label: 'Navigating to Zone B', meta: 'In progress', state: 'active' },
  { label: 'Deliver payload', meta: 'ETA 6 min', state: 'next' },
]

function initials(name = '?') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

function relativeTime(value) {
  const elapsed = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(elapsed) || elapsed < 0) return 'Just now'
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

function NotificationDetailModal({ notification, onClose, onViewAll }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const severity = notification.type || 'info'
  const isCritical = severity === 'critical' || severity === 'error'
  const action = isCritical
    ? 'Inspect the affected unit immediately and confirm that it is in a safe state.'
    : severity === 'warning'
      ? 'Review the unit telemetry and monitor this condition before the next mission.'
      : 'No immediate action is required. Review the event for operational context.'
  const icon = isCritical ? 'alert' : severity === 'warning' ? 'clock' : 'shield'

  return createPortal(
    <div className="notification-detail-backdrop" onMouseDown={onClose}>
      <section
        className={`notification-detail-modal type-${severity}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="notification-detail-glow" />
        <header>
          <span className="notification-detail-icon"><Icon name={icon} size={24} /></span>
          <div>
            <small>Fleet notification</small>
            <strong id="notification-detail-title">{severity} event</strong>
          </div>
          <button type="button" onClick={onClose} aria-label="Close notification" autoFocus>
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="notification-detail-body">
          <span className={`notification-detail-status ${notification.is_resolved ? 'resolved' : 'unresolved'}`}>
            <i /> {notification.is_resolved ? 'Resolved' : 'Requires review'}
          </span>
          <h2>{notification.message}</h2>
          <div className="notification-detail-meta">
            <span><small>Detected</small><strong>{new Date(notification.created_at).toLocaleString()}</strong></span>
            <span><small>Robot unit</small><strong>{notification.robot_id ? `Unit ${notification.robot_id}` : 'Fleet system'}</strong></span>
            <span><small>Event ID</small><strong>EVT-{notification.id}</strong></span>
            <span><small>Severity</small><strong>{severity}</strong></span>
          </div>
          <div className="notification-recommendation">
            <span><Icon name="command" size={17} /></span>
            <div><small>Recommended action</small><p>{action}</p></div>
          </div>
        </div>

        <footer>
          <button type="button" className="secondary-action" onClick={onClose}>Close</button>
          <button type="button" className="primary-action" onClick={onViewAll}>
            Open alert center
            <Icon name="arrow" size={15} />
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}

function Panel({ className = '', children }) {
  return <section className={`neo-panel ${className}`}>{children}</section>
}

function PanelHeader({ eyebrow, title, icon, action }) {
  return (
    <header className="panel-header">
      <div className="panel-heading">
        {icon && <span className="panel-icon"><Icon name={icon} size={17} /></span>}
        <span><small>{eyebrow}</small><strong>{title}</strong></span>
      </div>
      {action}
    </header>
  )
}

function Ring({ value, label, tone = 'cyan', size = 'regular' }) {
  const degrees = Math.max(0, Math.min(100, value)) * 3.6
  return (
    <div className={`metric-ring metric-ring-${size} tone-${tone}`} style={{ '--ring-value': `${degrees}deg` }}>
      <div><strong>{value}%</strong><span>{label}</span></div>
    </div>
  )
}

function Header({ currentUser, notifications, robots, missions, navigate, onNewMission }) {
  const { theme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const searchRef = useRef(null)
  const searchInputRef = useRef(null)
  const notificationRef = useRef(null)
  const latestNotifications = [...notifications]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
  const unreadCount = notifications.filter((alert) => !alert.is_resolved).length

  const searchItems = useMemo(() => {
    const pages = [
      { id: 'page-map', label: 'Live map', meta: 'Worlds, labels and fleet positions', path: '/map', icon: 'map', kind: 'Page' },
      { id: 'page-missions', label: 'Missions', meta: 'Plan and monitor robot missions', path: '/missions', icon: 'mission', kind: 'Page' },
      { id: 'page-robots', label: 'Fleet', meta: 'Robot status and telemetry', path: '/robots', icon: 'robot', kind: 'Page' },
      { id: 'page-teleop', label: 'Teleoperation', meta: 'Remote robot control', path: '/teleoperation', icon: 'teleop', kind: 'Page' },
      { id: 'page-alerts', label: 'Alerts', meta: 'Operations notifications', path: '/alerts', icon: 'alert', kind: 'Page' },
      { id: 'page-modules', label: 'Modules', meta: 'Robot payload modules', path: '/modules', icon: 'module', kind: 'Page' },
      { id: 'page-users', label: 'Team', meta: 'Operators and access', path: '/users', icon: 'users', kind: 'Page' },
      { id: 'page-settings', label: 'Settings', meta: 'Command center preferences', path: '/settings', icon: 'settings', kind: 'Page' },
    ]
    const settings = [
      {
        id: 'setting-dark-mode',
        label: 'Dark mode',
        meta: theme === 'dark' ? 'Currently active' : 'Switch the interface to the dark theme',
        icon: 'moon',
        kind: 'Setting',
        action: 'dark-mode',
        path: '/settings?section=appearance&theme=dark',
        keywords: 'darkmode night mode appearance theme black',
      },
      {
        id: 'setting-light-mode',
        label: 'Light mode',
        meta: theme === 'light' ? 'Currently active' : 'Switch the interface to the light theme',
        icon: 'sun',
        kind: 'Setting',
        action: 'light-mode',
        path: '/settings?section=appearance&theme=light',
        keywords: 'lightmode day mode appearance theme bright',
      },
    ]
    const robotItems = robots.map((robot) => ({
      id: `robot-${robot.id}`,
      label: robot.name,
      meta: `${robot.status || 'unknown'} · ${robot.battery ?? '—'}% battery · ${robot.mode || 'standby'}`,
      path: `/teleoperation?robot=${robot.id}`,
      icon: 'robot',
      kind: 'Robot',
    }))
    const missionItems = missions.map((mission) => ({
      id: `mission-${mission.id}`,
      label: mission.name || `Mission MX-${mission.id}`,
      meta: `${mission.status || 'unknown'} · ${mission.destination || 'No destination'}`,
      path: '/missions',
      icon: 'mission',
      kind: 'Mission',
    }))
    const alertItems = notifications.map((alert) => ({
      id: `alert-${alert.id}`,
      label: alert.message,
      meta: `${alert.type || 'info'} · ${relativeTime(alert.created_at)}`,
      path: '/alerts',
      icon: 'alert',
      kind: 'Alert',
    }))
    const worldItems = sdfManifest.worlds.map((world) => ({
      id: `world-${world.id}`,
      label: world.label,
      meta: `${world.entities.length} entities · ${world.bounds.width} × ${world.bounds.height} m`,
      path: '/map',
      icon: 'map',
      kind: 'World',
      worldId: world.id,
    }))
    return [...pages, ...settings, ...robotItems, ...missionItems, ...worldItems, ...alertItems]
  }, [missions, notifications, robots, theme])

  const filteredSearchItems = useMemo(() => {
    const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '')
    const term = normalize(searchQuery.trim())
    if (!term) return searchItems.slice(0, 8)
    return searchItems
      .filter((item) => normalize(`${item.label} ${item.meta} ${item.kind} ${item.keywords || ''}`).includes(term))
      .slice(0, 10)
  }, [searchItems, searchQuery])

  useEffect(() => {
    if (!searchOpen) return undefined
    searchInputRef.current?.focus()
    const closeSearch = (event) => {
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    const closeOnOutsideClick = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', closeSearch)
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => {
      window.removeEventListener('keydown', closeSearch)
      document.removeEventListener('pointerdown', closeOnOutsideClick)
    }
  }, [searchOpen])

  useEffect(() => {
    if (!notificationsOpen) return undefined
    const closeOnOutsideClick = (event) => {
      if (!notificationRef.current?.contains(event.target)) setNotificationsOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setNotificationsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [notificationsOpen])

  const openAllNotifications = () => {
    setNotificationsOpen(false)
    setSelectedNotification(null)
    navigate('/alerts')
  }

  const openNotification = (notification) => {
    setNotificationsOpen(false)
    setSelectedNotification(notification)
  }

  const openSearchResult = (item) => {
    if (item.action === 'dark-mode' || item.action === 'light-mode') {
      setSearchOpen(false)
      setSearchQuery('')
      navigate(item.path)
      return
    }
    if (item.worldId) {
      localStorage.setItem('amrx-map-world', item.worldId)
      localStorage.setItem('amrx-world', item.worldId)
    }
    setSearchOpen(false)
    setSearchQuery('')
    navigate(item.path)
  }

  return (
    <header className="command-header">
      <div className="command-title">
        <span className="command-kicker"><i /> Operations online</span>
        <h1>Command center</h1>
        <p>Fleet overview · Tunis Lab 01</p>
      </div>
      <div className="command-actions">
        <div className="command-search-menu" ref={searchRef}>
          <button
            type="button"
            className={`command-search ${searchOpen ? 'is-open' : ''}`}
            onClick={() => setSearchOpen((open) => !open)}
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
          >
            <Icon name="search" size={18} />
            <span>Search</span>
          </button>
          {searchOpen && (
            <section className="global-search-popover" role="dialog" aria-label="Search command center">
              <header>
                <Icon name="search" size={18} />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && filteredSearchItems[0]) {
                      openSearchResult(filteredSearchItems[0])
                    }
                  }}
                  placeholder="Search robots, missions, worlds…"
                  aria-label="Search robots, missions, worlds and pages"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search">
                    <Icon name="close" size={15} />
                  </button>
                )}
              </header>
              <div className="global-search-heading">
                <span>{searchQuery ? 'Search results' : 'Quick access'}</span>
                <small>{filteredSearchItems.length} {filteredSearchItems.length === 1 ? 'item' : 'items'}</small>
              </div>
              <div className="global-search-results">
                {filteredSearchItems.length ? filteredSearchItems.map((item) => (
                  <button type="button" onClick={() => openSearchResult(item)} key={item.id}>
                    <span><Icon name={item.icon} size={17} /></span>
                    <i><strong>{item.label}</strong><small>{item.meta}</small></i>
                    <b>{item.kind}</b>
                    <Icon name="chevron" size={14} />
                  </button>
                )) : (
                  <div className="global-search-empty">
                    <Icon name="search" size={24} />
                    <strong>No matching results</strong>
                    <small>Try a robot, mission, world, alert, or page name.</small>
                  </div>
                )}
              </div>
              <footer><span>Press Enter to open the first result</span><span>Esc to close</span></footer>
            </section>
          )}
        </div>
        <div className="header-divider" />
        <span className="network-state"><Icon name="wifi" size={17} /><span>14 ms</span></span>
        <div className="notification-menu" ref={notificationRef}>
          <button
            type="button"
            className={`icon-button notification-button ${notificationsOpen ? 'is-open' : ''}`}
            onClick={() => setNotificationsOpen((open) => !open)}
            title="Notifications"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unresolved` : ''}`}
            aria-haspopup="true"
            aria-expanded={notificationsOpen}
          >
            <Icon name="alert" size={18} />
            {unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>
          {notificationsOpen && (
            <section className="notification-dropdown" aria-label="Latest notifications">
              <header>
                <div>
                  <small>Operations feed</small>
                  <strong>Notifications</strong>
                </div>
                <span>{unreadCount} unresolved</span>
              </header>
              <div className="notification-list">
                {latestNotifications.length ? latestNotifications.map((alert) => (
                  <button
                    type="button"
                    className={`notification-item type-${alert.type || 'info'} ${alert.is_resolved ? 'is-resolved' : 'is-unread'}`}
                    onClick={() => openNotification(alert)}
                    key={alert.id}
                  >
                    <span className="notification-type-icon">
                      <Icon
                        name={alert.type === 'critical' || alert.type === 'error' ? 'alert' : alert.type === 'warning' ? 'clock' : 'shield'}
                        size={16}
                      />
                    </span>
                    <span className="notification-copy">
                      <strong>{alert.message}</strong>
                      <small>
                        <span>{alert.type || 'info'}</span>
                        <i />
                        {relativeTime(alert.created_at)}
                      </small>
                    </span>
                    {!alert.is_resolved && <i className="notification-unread-dot" />}
                  </button>
                )) : (
                  <div className="notification-empty">
                    <Icon name="shield" size={24} />
                    <strong>All clear</strong>
                    <small>No notifications to review</small>
                  </div>
                )}
              </div>
              <footer>
                <button type="button" onClick={openAllNotifications}>
                  View all notifications
                  <Icon name="arrow" size={15} />
                </button>
              </footer>
            </section>
          )}
        </div>
        {selectedNotification && (
          <NotificationDetailModal
            notification={selectedNotification}
            onClose={() => setSelectedNotification(null)}
            onViewAll={openAllNotifications}
          />
        )}
        <button type="button" className="operator-chip" onClick={() => window.location.assign('/profile')}>
          <span>{initials(currentUser?.name)}</span>
          <i><strong>{currentUser?.name?.split(' ')[0] || 'Operator'}</strong><small>Control lead</small></i>
        </button>
        <button type="button" className="primary-action header-new-mission" onClick={onNewMission}>
          <Icon name="bolt" size={16} />
          New mission
        </button>
      </div>
    </header>
  )
}

function KpiStrip({ robots, missions, alerts }) {
  const online = robots.filter((robot) => robot.status === 'online').length
  const active = missions.filter((mission) => mission.status === 'running').length
  const avgBattery = robots.length
    ? Math.round(robots.reduce((sum, robot) => sum + Number(robot.battery || 0), 0) / robots.length)
    : 0
  const cards = [
    { icon: 'robot', value: `${online}/${robots.length}`, label: 'Fleet online', detail: 'All units responsive', tone: 'cyan' },
    { icon: 'mission', value: active, label: 'Active missions', detail: `${Math.max(0, missions.length - active)} queued`, tone: 'blue' },
    { icon: 'battery', value: `${avgBattery}%`, label: 'Avg. battery', detail: '+4.2% today', tone: 'green' },
    { icon: 'shield', value: alerts, label: 'Needs attention', detail: alerts ? 'Review alerts' : 'Safety clear', tone: alerts ? 'amber' : 'green' },
  ]
  return (
    <section className="kpi-strip">
      {cards.map((card) => (
        <article className={`kpi-card kpi-${card.tone}`} key={card.label}>
          <span className="kpi-icon"><Icon name={card.icon} size={19} /></span>
          <div><small>{card.label}</small><strong>{card.value}</strong></div>
          <span className="kpi-detail"><i />{card.detail}</span>
        </article>
      ))}
    </section>
  )
}

function MapPanel({ robots, robot, mission, navigate }) {
  const mapRef = useRef(null)
  const [viewMode, setViewMode] = useState('world')
  const [missionCardOpen, setMissionCardOpen] = useState(false)
  const [worldId, setWorldId] = useState(() => localStorage.getItem('amrx-world') || 'warehouse')
  const worlds = sdfManifest.worlds
  const selectedWorld = worlds.find((world) => world.id === worldId) || worlds[0]
  const { annotations } = useMapAnnotations(selectedWorld.id)
  const progress = mission?.progress ?? 65
  return (
    <Panel className="map-panel">
      <header className="map-toolbar">
        <div className="map-toolbar-title">
          <span className="live-pill"><i /> Live digital twin</span>
          <h2>{selectedWorld.label}</h2>
          <p>{viewMode === 'world' ? selectedWorld.source : 'Level 01 · Navigation mesh'}</p>
        </div>
        <div className="map-layer-switcher" role="group" aria-label="Digital twin view">
          <button
            type="button"
            className={missionCardOpen ? 'active mission-active' : ''}
            onClick={() => setMissionCardOpen((open) => !open)}
            aria-pressed={missionCardOpen}
          >
            Mission
          </button>
          <button
            type="button"
            className={viewMode === 'map' ? 'active' : ''}
            onClick={() => setViewMode('map')}
            aria-pressed={viewMode === 'map'}
          >
            2D Map
          </button>
          <button
            type="button"
            className={viewMode === 'world' ? 'active' : ''}
            onClick={() => setViewMode('world')}
            aria-pressed={viewMode === 'world'}
          >
            3D World
          </button>
        </div>
        <div className="world-picker">
          <span>Digital twin</span>
          <SelectField
            name="overview-world"
            value={selectedWorld.id}
            options={worlds.map((world) => ({ value: world.id, label: world.label }))}
            onChange={(event) => {
              setWorldId(event.target.value)
              localStorage.setItem('amrx-world', event.target.value)
            }}
            ariaLabel="Select simulation world"
          />
        </div>
      </header>
      <div className="map-visualization">
        {viewMode === 'map' ? (
          <div className="map-underlay">
            <WarehouseMapSVG
              ref={mapRef}
              robots={robots}
              world={selectedWorld}
              annotations={annotations}
              height="100%"
              compact
            />
          </div>
        ) : <WarehouseWorld3D robots={robots} world={selectedWorld} annotations={annotations} />}
        {viewMode === 'map' && <div className="map-controls">
          <button type="button" onClick={() => mapRef.current?.zoomIn()}>+</button>
          <button type="button" onClick={() => mapRef.current?.zoomOut()}>−</button>
          <button type="button" onClick={() => mapRef.current?.reset()}><Icon name="route" size={16} /></button>
        </div>}
        <div className="map-scale"><span /><small>10 m</small></div>
        {missionCardOpen && <article className="map-mission-card">
          <header>
            <span className="mission-code">MX-{mission?.id || '1048'}</span>
            <span className="mission-live"><i /> In progress</span>
            <button type="button" className="mission-card-close" onClick={() => setMissionCardOpen(false)} aria-label="Close mission overlay">
              <Icon name="close" size={17} />
            </button>
          </header>
          <h3>{mission?.name || 'Inbound material transfer'}</h3>
          <div className="mission-route">
            <span><i className="route-start" /><small>From</small><strong>{mission?.start_point || 'Dock 02'}</strong></span>
            <Icon name="arrow" size={18} />
            <span><i className="route-end" /><small>Destination</small><strong>{mission?.destination || 'Zone B · Shelf 03'}</strong></span>
          </div>
          <div className="mission-progress">
            <span><strong>{progress}% complete</strong><small>ETA 6 min</small></span>
            <div><i style={{ width: `${progress}%` }} /></div>
          </div>
          <button type="button" onClick={() => navigate('/missions')}>Open mission <Icon name="arrow" size={15} /></button>
        </article>}
        <div className="map-selected-robot">
          <span className="robot-pulse-dot"><i /></span>
          <div><strong>{robot?.name || 'AMR-X 01'}</strong><small>Autonomous · 1.2 m/s</small></div>
        </div>
      </div>
    </Panel>
  )
}

function MissionPanel({ mission, navigate }) {
  const progress = mission?.progress ?? 65
  return (
    <Panel className="mission-panel">
      <PanelHeader
        eyebrow="Mission control"
        title="Active execution"
        icon="mission"
        action={<button className="more-button" type="button"><Icon name="more" size={18} /></button>}
      />
      <div className="mission-summary">
        <span className="mission-code">MX-{mission?.id || '1048'}</span>
        <h3>{mission?.name || 'Inbound material transfer'}</h3>
        <p>{mission?.destination || 'Zone B · Shelf 03'}</p>
        <div className="mission-stats">
          <span><Icon name="clock" size={15} /><i><small>Elapsed</small><strong>12:48</strong></i></span>
          <span><Icon name="route" size={15} /><i><small>Distance</small><strong>142 m</strong></i></span>
          <span><Icon name="battery" size={15} /><i><small>Energy</small><strong>8%</strong></i></span>
        </div>
        <div className="mission-big-progress"><i style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="mission-timeline">
        {timeline.map((step) => (
          <div className={`timeline-row ${step.state}`} key={step.label}>
            <span className="timeline-node">{step.state === 'done' ? '✓' : ''}</span>
            <div><strong>{step.label}</strong><small>{step.meta}</small></div>
          </div>
        ))}
      </div>
      <footer className="mission-controls">
        <button type="button" className="secondary-action"><Icon name="pause" size={15} /> Pause</button>
        <button type="button" className="primary-action" onClick={() => navigate('/teleoperation')}>Take control</button>
      </footer>
    </Panel>
  )
}

function RobotPanel({ robot, navigate }) {
  const battery = robot?.battery ?? 78
  return (
    <Panel className="robot-panel">
      <PanelHeader
        eyebrow="Selected unit"
        title={robot?.name || 'AMR-X 01'}
        icon="robot"
        action={<span className="online-chip"><i /> Online</span>}
      />
      <div className="robot-visual">
        <div className="robot-hud-orbit orbit-one" />
        <div className="robot-hud-orbit orbit-two" />
        <img src={robotRender} alt="AMR-X mobile robot render" />
        <span className="robot-callout callout-lidar">LiDAR <i /></span>
        <span className="robot-callout callout-module">Payload module <i /></span>
        <span className="robot-callout callout-drive">Drive system <i /></span>
      </div>
      <div className="robot-metrics">
        <Ring value={battery} label="Battery" />
        <div className="robot-bars">
          <span><small>Signal quality</small><strong>96%</strong><i><b style={{ width: '96%' }} /></i></span>
          <span><small>Payload</small><strong>18 kg</strong><i><b style={{ width: '52%' }} /></i></span>
          <span><small>CPU temperature</small><strong>48°C</strong><i><b style={{ width: '64%' }} /></i></span>
        </div>
      </div>
      <button type="button" className="panel-link" onClick={() => navigate('/robots')}>
        Inspect robot <Icon name="arrow" size={15} />
      </button>
    </Panel>
  )
}

function FleetPanel({ robots, selectedId, onSelect, navigate }) {
  return (
    <Panel className="fleet-panel">
      <PanelHeader
        eyebrow="Fleet"
        title="Robot status"
        icon="robot"
        action={<button className="text-action" type="button" onClick={() => navigate('/robots')}>View all</button>}
      />
      <div className="fleet-list">
        {robots.slice(0, 4).map((robot, index) => (
          <button
            type="button"
            className={`fleet-row ${robot.id === selectedId ? 'selected' : ''}`}
            onClick={() => onSelect(robot.id)}
            key={robot.id}
          >
            <span className="fleet-unit"><i>0{index + 1}</i><Icon name="robot" size={20} /></span>
            <span><strong>{robot.name}</strong><small>{robot.mode || 'Autonomous'} · Zone {String.fromCharCode(65 + index)}</small></span>
            <span className={`fleet-status ${robot.status}`}><i />{robot.status}</span>
            <span className="fleet-battery"><Icon name="battery" size={15} />{robot.battery ?? 0}%</span>
            <Icon name="chevron" size={15} />
          </button>
        ))}
      </div>
    </Panel>
  )
}

function AlertsPanel({ alerts, navigate }) {
  const items = alerts.filter((alert) => !alert.is_resolved).slice(0, 3)
  return (
    <Panel className="alerts-panel">
      <PanelHeader
        eyebrow="System feed"
        title="Recent activity"
        icon="alert"
        action={<button className="text-action" type="button" onClick={() => navigate('/alerts')}>Open log</button>}
      />
      <div className="activity-list">
        {(items.length ? items : [
          { id: 'safe', type: 'info', message: 'Safety scan completed · no obstruction', created_at: new Date().toISOString() },
          { id: 'dock', type: 'info', message: 'AMR-X 03 returned to charging dock', created_at: new Date().toISOString() },
        ]).map((alert, index) => (
          <article className={`activity-item ${alert.type}`} key={alert.id}>
            <span><Icon name={alert.type === 'critical' ? 'alert' : index ? 'battery' : 'shield'} size={16} /></span>
            <div><strong>{alert.message}</strong><small>{index ? '18 min ago' : '4 min ago'}</small></div>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function CameraPanel({ ros, connected, robot, demo, onOpenControl }) {
  return (
    <Panel className="camera-panel">
      <LiveCameraFeed
        ros={ros}
        connected={connected}
        robotName={robot?.name || 'AMR-X 01'}
        demo={demo}
        onOpenControl={onOpenControl}
      />
    </Panel>
  )
}

function TeleoperationModal({ robotId, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.classList.add('teleop-modal-active')
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('teleop-modal-active')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return createPortal(
    <div className="teleop-modal" role="dialog" aria-modal="true" aria-label="Robot teleoperation controls">
      <div className="teleop-modal-content">
        <Teleoperation initialRobotId={robotId} onClose={onClose} />
      </div>
    </div>,
    document.body,
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { demo, DEMO_ROBOTS, DEMO_MISSIONS, DEMO_ALERTS } = useDemo()
  const [selectedRobotId, setSelectedRobotId] = useState(null)
  const [teleoperationOpen, setTeleoperationOpen] = useState(false)
  const [missionComposerOpen, setMissionComposerOpen] = useState(false)
  const { ros, connected } = useRosConnection()

  const robotQuery = useQuery({ queryKey: ['robots'], queryFn: getRobots, refetchInterval: 5000 })
  const missionQuery = useQuery({ queryKey: ['missions'], queryFn: getMissions, refetchInterval: 5000 })
  const alertQuery = useQuery({ queryKey: ['alerts'], queryFn: getAlerts, refetchInterval: 5000 })

  const previewMode = demo || robotQuery.isError
  const robots = useMemo(
    () => previewMode ? DEMO_ROBOTS : (robotQuery.data || []),
    [previewMode, DEMO_ROBOTS, robotQuery.data],
  )
  const missions = previewMode ? DEMO_MISSIONS : (missionQuery.data || [])
  const alerts = previewMode ? DEMO_ALERTS : (alertQuery.data || [])
  const selectedRobot = robots.find((robot) => robot.id === selectedRobotId) || robots[0]
  const activeMission = missions.find((mission) => mission.robot_id === selectedRobot?.id && mission.status === 'running')
    || missions.find((mission) => mission.status === 'running')
    || missions[0]
  const unresolvedAlerts = alerts.filter((alert) => !alert.is_resolved).length

  if (robotQuery.isLoading && !demo) {
    return <div className="dashboard-loader"><span className="loading-orbit" /><p>Connecting to fleet…</p></div>
  }

  return (
    <div className="control-center">
      <Header
        currentUser={currentUser}
        notifications={alerts}
        robots={robots}
        missions={missions}
        navigate={navigate}
        onNewMission={() => setMissionComposerOpen(true)}
      />
      {previewMode && <div className="preview-banner"><i /> Simulation preview · Backend unavailable, using representative fleet data</div>}
      <KpiStrip robots={robots} missions={missions} alerts={unresolvedAlerts} />
      <main className="dashboard-grid">
        <MapPanel robots={robots} robot={selectedRobot} mission={activeMission} navigate={navigate} />
        <MissionPanel mission={activeMission} navigate={navigate} />
        <RobotPanel robot={selectedRobot} navigate={navigate} />
        <CameraPanel
          ros={ros}
          connected={connected}
          robot={selectedRobot}
          demo={previewMode}
          onOpenControl={() => setTeleoperationOpen(true)}
        />
        <FleetPanel robots={robots} selectedId={selectedRobot?.id} onSelect={setSelectedRobotId} navigate={navigate} />
        <AlertsPanel alerts={alerts} navigate={navigate} />
      </main>
      {teleoperationOpen && (
        <TeleoperationModal
          robotId={selectedRobot?.id}
          onClose={() => setTeleoperationOpen(false)}
        />
      )}
      <MissionComposer
        open={missionComposerOpen}
        onClose={() => setMissionComposerOpen(false)}
        robots={robots}
        demo={previewMode}
      />
    </div>
  )
}

export default Dashboard
