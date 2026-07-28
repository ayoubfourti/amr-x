import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAlerts, resolveAlert } from '../api/alerts'
import { getRobots } from '../api/robots'
import Badge from '../components/ui/Badge'
import PageTopbar from '../components/ui/PageTopbar'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'
import ConfirmModal from '../components/ui/ConfirmModal'
import { formatDate } from '../utils/format'

const TYPE_COLORS = {
  critical: '#dc2626',
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
}

const TYPES = ['critical', 'error', 'warning', 'info']

function Alerts() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [unresolvedOnly, setUnresolvedOnly] = useState(false)
  const [resolvedIds, setResolvedIds] = useState(new Set())
  const [confirmResolve, setConfirmResolve] = useState(null)

  const {
    data: alerts,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['alerts'], queryFn: getAlerts, refetchInterval: 5000 })

  const { data: robots } = useQuery({
    queryKey: ['robots'],
    queryFn: getRobots,
    refetchInterval: 4000,
  })

  const resolveMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: (_data, id) => {
      setResolvedIds((prev) => new Set(prev).add(id))
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      showToast('Alert resolved', 'success')
    },
    onError: () => {
      showToast('Failed to resolve alert', 'error')
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

  const latency = (robots || []).find((r) => r.status === 'online')?.wifi_latency ?? null

  return (
    <div className="users-page">
      <PageTopbar title="Alerts" latency={latency} />

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

      {!isLoading && !isError && alertList.length === 0 && (
        <EmptyState icon="✅" title="All clear" subtitle="No alerts have been triggered" />
      )}

      {!isLoading && !isError && alertList.length > 0 && visibleAlerts.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No alerts match this filter"
          subtitle="Try a different alert type"
        />
      )}

      {!isLoading && !isError && visibleAlerts.length > 0 && (
        <div className="data-table-wrapper">
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
                        onClick={() => setConfirmResolve(alert)}
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
        </div>
      )}

      <ConfirmModal
        open={!!confirmResolve}
        title="Resolve Alert"
        message="Mark this alert as resolved?"
        confirmLabel="Resolve"
        confirmColor="#10b981"
        loading={resolveMutation.isPending}
        onConfirm={() => {
          resolveMutation.mutate(confirmResolve.id, {
            onSuccess: () => setConfirmResolve(null),
          })
        }}
        onCancel={() => setConfirmResolve(null)}
      />
    </div>
  )
}

export default Alerts
