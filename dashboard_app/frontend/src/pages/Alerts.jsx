import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAlerts, resolveAlert } from '../api/alerts'
import { useAuth } from '../context/AuthContext'

const TYPE_COLORS = {
  critical: '#dc2626',
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
}

const TYPES = ['critical', 'error', 'warning', 'info']
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

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function Alerts() {
  const queryClient = useQueryClient()
  const { currentUser } = useAuth()
  const [unresolvedOnly, setUnresolvedOnly] = useState(false)
  const [resolvedIds, setResolvedIds] = useState(new Set())

  const {
    data: alerts,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['alerts'], queryFn: getAlerts, refetchInterval: 5000 })

  const resolveMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: (_data, id) => {
      setResolvedIds((prev) => new Set(prev).add(id))
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const alertList = alerts || []
  const unresolved = alertList.filter((a) => !a.is_resolved)

  const stats = TYPES.reduce((acc, type) => {
    acc[type] = unresolved.filter((a) => a.type === type).length
    return acc
  }, {})

  const visibleAlerts = (unresolvedOnly ? unresolved : alertList)
    .slice()
    .sort((a, b) => {
      if (a.is_resolved !== b.is_resolved) return a.is_resolved ? 1 : -1
      return new Date(b.created_at) - new Date(a.created_at)
    })

  return (
    <div className="users-page">
      <div className="page-topbar">
        <div>
          <h2>Alerts</h2>
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

      <div className="page-heading-row">
        <div>
          <h3>Fleet Alerts</h3>
          <p className="topbar-subtext">{unresolved.length} unresolved</p>
        </div>
        <button
          type="button"
          className={`filter-btn ${unresolvedOnly ? 'active' : ''}`}
          onClick={() => setUnresolvedOnly((v) => !v)}
        >
          Clear resolved
        </button>
      </div>

      <div className="stat-cards">
        {TYPES.map((type) => (
          <div className="stat-card" key={type}>
            <span>{type}</span>
            <strong>{stats[type]}</strong>
          </div>
        ))}
      </div>

      {isLoading && <p>Loading alerts…</p>}
      {isError && <p className="error">Failed to load alerts: {error.message}</p>}

      {!isLoading && !isError && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Message</th>
              <th>Robot</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleAlerts.map((alert) => {
              const justResolved = resolvedIds.has(alert.id)
              const isResolved = alert.is_resolved || justResolved
              return (
                <tr key={alert.id}>
                  <td>
                    <Badge text={alert.type} color={TYPE_COLORS[alert.type] || '#6b7280'} />
                  </td>
                  <td>{alert.message}</td>
                  <td>{alert.robot_id}</td>
                  <td>{formatDate(alert.created_at)}</td>
                  <td>
                    {isResolved ? (
                      <Badge text="✓ Resolved" color="#16a34a" />
                    ) : (
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => resolveMutation.mutate(alert.id)}
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Alerts
