import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMissions,
  createMission,
  deleteMission,
  startMission,
  pauseMission,
  resumeMission,
  stopMission,
} from '../api/missions'
import { getRobots } from '../api/robots'
import Badge from '../components/ui/Badge'
import PageTopbar from '../components/ui/PageTopbar'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'
import MissionTimeline from '../components/ui/MissionTimeline'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useDemo } from '../context/DemoContext'
import { formatDate } from '../utils/format'

const PRIORITY_COLORS = {
  low: '#6b7280',
  normal: '#2563eb',
  high: '#d97706',
  critical: '#dc2626',
}

const STATUS_COLORS = {
  pending: '#6b7280',
  running: '#2563eb',
  paused: '#f59e0b',
  completed: '#16a34a',
  failed: '#dc2626',
}

function MissionActionButton({ color, disabled, onClick, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        border: `1px solid ${color}44`,
        fontSize: 11,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        marginRight: 4,
        background: hover ? `${color}33` : `${color}22`,
        color,
        transition: 'background 0.15s',
      }}
    >
      {children}
    </button>
  )
}

const FILTERS = ['all', 'pending', 'running', 'completed']

const emptyForm = {
  robot_id: '',
  name: '',
  type: 'delivery',
  destination: '',
  priority: 'normal',
  module_required: 'none',
}

function MissionModal({ form, onChange, onSubmit, onClose, isSaving, errorMessage, robots }) {
  const onlineRobots = (robots || []).filter((r) => r.status === 'online')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>New Mission</h3>
            <p className="topbar-subtext">Assign a new mission to a robot</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <label className="auth-field">
            <span className="auth-label">Robot</span>
            {onlineRobots.length > 0 ? (
              <select name="robot_id" value={form.robot_id} onChange={onChange} required>
                <option value="">— Select a robot —</option>
                {onlineRobots.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.battery ?? '?'}% battery
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>
                No online robots available
              </p>
            )}
          </label>
          <label className="auth-field">
            <span className="auth-label">Name</span>
            <input name="name" value={form.name} onChange={onChange} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">Destination</span>
            <input name="destination" value={form.destination} onChange={onChange} required />
          </label>

          <div className="modal-row">
            <label className="auth-field">
              <span className="auth-label">Type</span>
              <select name="type" value={form.type} onChange={onChange}>
                <option value="delivery">delivery</option>
                <option value="patrol">patrol</option>
                <option value="inspection">inspection</option>
                <option value="pickup">pickup</option>
              </select>
            </label>
            <label className="auth-field">
              <span className="auth-label">Priority</span>
              <select name="priority" value={form.priority} onChange={onChange}>
                <option value="low">low</option>
                <option value="normal">normal</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </label>
          </div>

          <label className="auth-field">
            <span className="auth-label">Module Required</span>
            <select name="module_required" value={form.module_required} onChange={onChange}>
              <option value="none">none</option>
              <option value="delivery_box">delivery_box</option>
              <option value="arm">arm</option>
              <option value="camera">camera</option>
              <option value="thermal">thermal</option>
            </select>
          </label>

          {errorMessage && <p className="error">{errorMessage}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Creating…' : '+ Create Mission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Missions() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { demo, DEMO_MISSIONS } = useDemo()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detailOpenId, setDetailOpenId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const {
    data: missions,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['missions'], queryFn: getMissions, refetchInterval: 5000 })

  const { data: robots } = useQuery({
    queryKey: ['robots'],
    queryFn: getRobots,
    refetchInterval: 4000,
  })

  const createMutation = useMutation({
    mutationFn: createMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      setShowForm(false)
      setForm(emptyForm)
      showToast('Mission created', 'success')
    },
    onError: () => {
      showToast('Failed to create mission', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      showToast('Mission deleted', 'warning')
    },
    onError: () => {
      showToast('Failed to delete mission', 'error')
    },
  })

  const startMut = useMutation({
    mutationFn: startMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      showToast('Mission started', 'success')
    },
    onError: () => showToast('Failed to start mission', 'error'),
  })

  const pauseMut = useMutation({
    mutationFn: pauseMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      showToast('Mission paused', 'warning')
    },
    onError: () => showToast('Failed to pause mission', 'error'),
  })

  const resumeMut = useMutation({
    mutationFn: resumeMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      showToast('Mission resumed', 'success')
    },
    onError: () => showToast('Failed to resume mission', 'error'),
  })

  const stopMut = useMutation({
    mutationFn: stopMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      showToast('Mission stopped', 'warning')
    },
    onError: () => showToast('Failed to stop mission', 'error'),
  })

  function guardDemo(action) {
    if (demo) {
      showToast('Demo mode — disable to manage real missions', 'warning')
      return
    }
    action()
  }

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    guardDemo(() => createMutation.mutate({ ...form, robot_id: Number(form.robot_id) }))
  }

  function toggleDetail(id) {
    setDetailOpenId((prev) => (prev === id ? null : id))
  }

  const displayMissions = useMemo(() => (demo ? DEMO_MISSIONS : missions || []), [demo, DEMO_MISSIONS, missions])
  const missionList = displayMissions

  const stats = useMemo(() => {
    const list = displayMissions
    return {
      total: list.length,
      pending: list.filter((m) => m.status === 'pending').length,
      running: list.filter((m) => m.status === 'running').length,
      completed: list.filter((m) => m.status === 'completed').length,
    }
  }, [displayMissions])

  const filteredMissions = useMemo(() => {
    const term = search.trim().toLowerCase()
    return displayMissions.filter((m) => {
      const matchesFilter = filter === 'all' || m.status === filter
      const matchesSearch =
        !term || m.name?.toLowerCase().includes(term) || m.destination?.toLowerCase().includes(term)
      return matchesFilter && matchesSearch
    })
  }, [displayMissions, filter, search])

  const detailMission = missionList.find((m) => m.id === detailOpenId)

  const latency = (robots || []).find((r) => r.status === 'online')?.wifi_latency ?? null

  return (
    <div className="users-page">
      <PageTopbar title="Missions" latency={latency} />

      <div className="page-heading-row">
        <div>
          <h3>Mission Control</h3>
          <p className="topbar-subtext">{stats.total} missions · {stats.running} running</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
          + New Mission
        </button>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span>Total</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className="stat-card">
          <span>Running</span>
          <strong>{stats.running}</strong>
        </div>
        <div className="stat-card">
          <span>Completed</span>
          <strong>{stats.completed}</strong>
        </div>
      </div>

      {showForm && (
        <MissionModal
          form={form}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          isSaving={createMutation.isPending}
          errorMessage={createMutation.isError ? createMutation.error.message : ''}
          robots={robots || []}
        />
      )}

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="🔍 Search name or destination…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="results-count">{filteredMissions.length} results</span>
      </div>

      {isLoading && <p>Loading missions…</p>}
      {isError && <p className="error">Failed to load missions: {error.message}</p>}

      {!isLoading && !isError && missionList.length === 0 && (
        <EmptyState
          icon="🎯"
          title="No missions yet"
          subtitle="Create your first mission to get started"
          action={
            <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
              + New Mission
            </button>
          }
        />
      )}

      {!isLoading && !isError && missionList.length > 0 && filteredMissions.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No missions match your search"
          subtitle="Try a different name, destination, or status filter"
        />
      )}

      {!isLoading && !isError && filteredMissions.length > 0 && (
        <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Robot</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Priority</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredMissions.map((mission) => (
              <tr key={mission.id}>
                <td>{mission.name}</td>
                <td>{mission.robot_id}</td>
                <td>{mission.destination}</td>
                <td>
                  <Badge text={mission.status} color={STATUS_COLORS[mission.status] || '#6b7280'} />
                </td>
                <td>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${mission.progress ?? 0}%` }}
                    />
                  </div>{' '}
                  {mission.progress ?? 0}%
                </td>
                <td>
                  <Badge
                    text={mission.priority}
                    color={PRIORITY_COLORS[mission.priority] || '#6b7280'}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {mission.status === 'pending' && (
                      <MissionActionButton
                        color="#10b981"
                        disabled={startMut.isPending}
                        onClick={() => guardDemo(() => startMut.mutate(mission.id))}
                      >
                        {startMut.isPending ? '…' : '▶ Start'}
                      </MissionActionButton>
                    )}
                    {mission.status === 'running' && (
                      <>
                        <MissionActionButton
                          color="#f59e0b"
                          disabled={pauseMut.isPending}
                          onClick={() => guardDemo(() => pauseMut.mutate(mission.id))}
                        >
                          {pauseMut.isPending ? '…' : '⏸ Pause'}
                        </MissionActionButton>
                        <MissionActionButton
                          color="#ef4444"
                          disabled={stopMut.isPending}
                          onClick={() => guardDemo(() => stopMut.mutate(mission.id))}
                        >
                          {stopMut.isPending ? '…' : '⏹ Stop'}
                        </MissionActionButton>
                      </>
                    )}
                    {mission.status === 'paused' && (
                      <>
                        <MissionActionButton
                          color="#10b981"
                          disabled={resumeMut.isPending}
                          onClick={() => guardDemo(() => resumeMut.mutate(mission.id))}
                        >
                          {resumeMut.isPending ? '…' : '▶ Resume'}
                        </MissionActionButton>
                        <MissionActionButton
                          color="#ef4444"
                          disabled={stopMut.isPending}
                          onClick={() => guardDemo(() => stopMut.mutate(mission.id))}
                        >
                          {stopMut.isPending ? '…' : '⏹ Stop'}
                        </MissionActionButton>
                      </>
                    )}
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => toggleDetail(mission.id)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => guardDemo(() => setConfirmDelete(mission))}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {detailMission && (
        <>
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>{detailMission.name}</h3>
                <p className="topbar-subtext">Mission details</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setDetailOpenId(null)}>
                ✕
              </button>
            </div>
            <div className="detail-grid">
              <div>
                <span className="form-label">Robot ID</span>
                <div>{detailMission.robot_id}</div>
              </div>
              <div>
                <span className="form-label">Type</span>
                <div>{detailMission.type}</div>
              </div>
              <div>
                <span className="form-label">Status</span>
                <div>{detailMission.status}</div>
              </div>
              <div>
                <span className="form-label">Start point</span>
                <div>{detailMission.start_point ?? '—'}</div>
              </div>
              <div>
                <span className="form-label">Destination</span>
                <div>{detailMission.destination}</div>
              </div>
              <div>
                <span className="form-label">Module required</span>
                <div>{detailMission.module_required}</div>
              </div>
              <div>
                <span className="form-label">Priority</span>
                <div>{detailMission.priority}</div>
              </div>
              <div>
                <span className="form-label">Progress</span>
                <div>{detailMission.progress ?? 0}%</div>
              </div>
              <div>
                <span className="form-label">Recurring</span>
                <div>{detailMission.is_recurring ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <span className="form-label">Created at</span>
                <div>{formatDate(detailMission.created_at)}</div>
              </div>
            </div>
          </div>

          <MissionTimeline mission={detailMission} onClose={() => setDetailOpenId(null)} />
        </>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Mission"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete Mission"
        confirmColor="#ef4444"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(confirmDelete.id, {
            onSuccess: () => setConfirmDelete(null),
          })
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default Missions
