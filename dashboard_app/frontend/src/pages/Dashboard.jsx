import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRobots } from '../api/robots'
import { getMissions } from '../api/missions'
import { getAlerts } from '../api/alerts'
import { getModules } from '../api/modules'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = {
  online: '#16a34a',
  offline: '#6b7280',
  error: '#dc2626',
}

const MODULE_STATUS_COLORS = {
  connected: '#16a34a',
  disconnected: '#6b7280',
  error: '#dc2626',
  standby: '#d97706',
}

const PRIORITY_COLORS = {
  low: '#6b7280',
  normal: '#2563eb',
  high: '#d97706',
  critical: '#dc2626',
}

const MISSION_STATUS_COLORS = {
  pending: '#6b7280',
  running: '#2563eb',
  completed: '#16a34a',
  failed: '#dc2626',
}

const ALERT_COLORS = {
  critical: '#dc2626',
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
}

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2']

function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function avatarColor(name) {
  const index = (name || '').charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index] || AVATAR_COLORS[0]
}

function Badge({ text, color }) {
  return (
    <span
      style={{
        backgroundColor: color,
        color: '#fff',
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        boxShadow: `0 2px 6px ${color}55`,
      }}
    >
      {text}
    </span>
  )
}

function tempColor(temperature) {
  if (temperature == null) return '#6b7280'
  if (temperature < 50) return '#16a34a'
  if (temperature <= 70) return '#d97706'
  return '#dc2626'
}

function batteryColor(battery) {
  if (battery == null) return '#6b7280'
  if (battery < 30) return '#d97706'
  if (battery < 15) return '#dc2626'
  return '#16a34a'
}

function formatRelativeTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay} d ago`
}

function Dashboard() {
  const { currentUser } = useAuth()

  const { data: robots, isLoading: robotsLoading } = useQuery({
    queryKey: ['robots'],
    queryFn: getRobots,
    refetchInterval: 4000,
  })

  const { data: missions, isLoading: missionsLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: getMissions,
    refetchInterval: 4000,
  })

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 4000,
  })

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules,
    refetchInterval: 4000,
  })

  const robot = (robots || [])[0]
  const missionList = missions || []
  const alertList = alerts || []
  const moduleList = modules || []

  const currentMission = robot
    ? missionList.find((m) => m.robot_id === robot.id && m.status === 'running')
    : null

  const robotModules = robot ? moduleList.filter((m) => m.robot_id === robot.id) : []

  const recentAlerts = alertList
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4)

  return (
    <div className="users-page">
      <div className="page-topbar">
        <div>
          <h2>Dashboard</h2>
          <p className="topbar-subtext">{new Date().toLocaleString()}</p>
        </div>
        <div className="topbar-right">
          <span className="connection-pill">📶 Connected · 12ms</span>
          {currentUser && (
            <span
              className="avatar-chip"
              style={{ backgroundColor: avatarColor(currentUser.name) }}
            >
              {initials(currentUser.name)}
            </span>
          )}
        </div>
      </div>

      {robotsLoading && <p>Loading robots…</p>}
      {!robotsLoading && !robot && <p className="topbar-subtext">No robots registered</p>}

      {robot && (
        <>
          <div className="page-heading-row">
            <div>
              <h3>{robot.name}</h3>
              <p className="topbar-subtext">
                <Badge text={robot.status} color={STATUS_COLORS[robot.status] || '#6b7280'} />
              </p>
            </div>
          </div>

          <div className="stat-cards">
            <div className="stat-card">
              <span>🔋 Battery</span>
              <strong style={{ color: batteryColor(robot.battery) }}>
                {robot.battery ?? '—'}%
              </strong>
            </div>
            <div className="stat-card">
              <span>📶 Latency</span>
              <strong>{robot.wifi_latency ?? '—'} ms</strong>
            </div>
            <div className="stat-card">
              <span>📈 Speed</span>
              <strong>{robot.speed ?? '—'} m/s</strong>
            </div>
            <div className="stat-card">
              <span>⚙ Mode</span>
              <strong>{robot.mode}</strong>
            </div>
          </div>

          <div className="card-grid">
            <div className="modal-card">
              <h3>Current Mission</h3>
              {missionsLoading && <p>Loading missions…</p>}
              {!missionsLoading && !currentMission && (
                <p className="topbar-subtext">No active mission</p>
              )}
              {currentMission && (
                <div className="col">
                  <div className="row-between">
                    <strong>{currentMission.name}</strong>
                    <Badge
                      text={currentMission.status}
                      color={MISSION_STATUS_COLORS[currentMission.status] || '#6b7280'}
                    />
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${currentMission.progress ?? 0}%` }}
                    />
                  </div>
                  <span>{currentMission.progress ?? 0}%</span>
                  <span>Destination: {currentMission.destination}</span>
                  <Badge
                    text={currentMission.priority}
                    color={PRIORITY_COLORS[currentMission.priority] || '#6b7280'}
                  />
                </div>
              )}
            </div>

            <div className="modal-card">
              <h3>Sensors</h3>
              {modulesLoading && <p>Loading modules…</p>}
              {!modulesLoading && robotModules.length === 0 && (
                <p className="topbar-subtext">No modules</p>
              )}
              {robotModules.length > 0 && (
                <div className="col">
                  {robotModules.map((mod) => (
                    <div className="row-between" key={mod.id}>
                      <span>{mod.name}</span>
                      <Badge
                        text={mod.status}
                        color={MODULE_STATUS_COLORS[mod.status] || '#6b7280'}
                      />
                      <Badge
                        text={mod.temperature == null ? '—' : `${mod.temperature}°C`}
                        color={tempColor(mod.temperature)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="modal-card mt-6">
        <div className="row-between">
          <h3>Recent Alerts</h3>
          <Link to="/alerts">View all alerts →</Link>
        </div>
        {alertsLoading && <p>Loading alerts…</p>}
        {!alertsLoading && recentAlerts.length === 0 && (
          <p className="topbar-subtext">No alerts</p>
        )}
        {recentAlerts.length > 0 && (
          <div className="col mt-4">
            {recentAlerts.map((alert) => (
              <div className="row-between" key={alert.id}>
                <span>{alert.message}</span>
                <Badge text={alert.type} color={ALERT_COLORS[alert.type] || '#6b7280'} />
                <span className="topbar-subtext">{formatRelativeTime(alert.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
