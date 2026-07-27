import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMissions, createMission, deleteMission } from '../api/missions'
import { useAuth } from '../context/AuthContext'

const PRIORITY_COLORS = {
  low: '#6b7280',
  normal: '#2563eb',
  high: '#d97706',
  critical: '#dc2626',
}

const STATUS_COLORS = {
  pending: '#6b7280',
  running: '#2563eb',
  completed: '#16a34a',
  failed: '#dc2626',
}

const FILTERS = ['all', 'pending', 'running', 'completed']
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

const emptyForm = {
  robot_id: '',
  name: '',
  type: 'delivery',
  destination: '',
  priority: 'normal',
  module_required: 'none',
}

function MissionModal({ form, onChange, onSubmit, onClose, isSaving, errorMessage }) {
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
            <span className="auth-label">Robot ID</span>
            <input name="robot_id" type="number" value={form.robot_id} onChange={onChange} required />
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
  const { currentUser } = useAuth()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detailOpenId, setDetailOpenId] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const {
    data: missions,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['missions'], queryFn: getMissions, refetchInterval: 5000 })

  const createMutation = useMutation({
    mutationFn: createMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      setShowForm(false)
      setForm(emptyForm)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      setConfirmingId(null)
    },
  })

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    createMutation.mutate({ ...form, robot_id: Number(form.robot_id) })
  }

  function toggleDetail(id) {
    setDetailOpenId((prev) => (prev === id ? null : id))
  }

  function handleDeleteClick(id) {
    if (confirmingId === id) {
      deleteMutation.mutate(id)
      return
    }
    setConfirmingId(id)
    setTimeout(() => {
      setConfirmingId((current) => (current === id ? null : current))
    }, 2000)
  }

  const missionList = missions || []

  const stats = useMemo(() => {
    const list = missions || []
    return {
      total: list.length,
      pending: list.filter((m) => m.status === 'pending').length,
      running: list.filter((m) => m.status === 'running').length,
      completed: list.filter((m) => m.status === 'completed').length,
    }
  }, [missions])

  const filteredMissions = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (missions || []).filter((m) => {
      const matchesFilter = filter === 'all' || m.status === filter
      const matchesSearch =
        !term || m.name?.toLowerCase().includes(term) || m.destination?.toLowerCase().includes(term)
      return matchesFilter && matchesSearch
    })
  }, [missions, filter, search])

  const detailMission = missionList.find((m) => m.id === detailOpenId)

  return (
    <div className="users-page">
      <div className="page-topbar">
        <div>
          <h2>Missions</h2>
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

      {!isLoading && !isError && (
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
                    onClick={() => handleDeleteClick(mission.id)}
                  >
                    {confirmingId === mission.id ? 'Confirm?' : '🗑️'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {detailMission && (
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
      )}
    </div>
  )
}

export default Missions
