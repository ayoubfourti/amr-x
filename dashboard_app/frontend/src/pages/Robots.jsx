import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRobots, createRobot, updateRobotStatus } from '../api/robots'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = {
  online: '#16a34a',
  offline: '#6b7280',
  error: '#dc2626',
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

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const emptyForm = { name: '', ip_address: '', status: 'online', mode: 'idle' }

function RobotModal({ mode, form, onChange, onSubmit, onClose, isSaving, errorMessage }) {
  const isEdit = mode === 'edit'
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{isEdit ? 'Edit Robot Status' : 'Register Robot'}</h3>
            <p className="topbar-subtext">
              {isEdit ? 'Update robot status and mode' : 'Add a new robot to the fleet'}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {!isEdit && (
            <>
              <label className="auth-field">
                <span className="auth-label">Name</span>
                <input name="name" value={form.name} onChange={onChange} required />
              </label>
              <label className="auth-field">
                <span className="auth-label">IP Address</span>
                <input
                  name="ip_address"
                  placeholder="192.168.1.xx"
                  value={form.ip_address}
                  onChange={onChange}
                />
              </label>
            </>
          )}

          {isEdit && (
            <div className="modal-row">
              <label className="auth-field">
                <span className="auth-label">Status</span>
                <select name="status" value={form.status} onChange={onChange}>
                  <option value="online">online</option>
                  <option value="offline">offline</option>
                  <option value="error">error</option>
                </select>
              </label>
              <label className="auth-field">
                <span className="auth-label">Mode</span>
                <select name="mode" value={form.mode} onChange={onChange}>
                  <option value="idle">idle</option>
                  <option value="autonomous">autonomous</option>
                  <option value="manual">manual</option>
                </select>
              </label>
            </div>
          )}

          {errorMessage && <p className="error">{errorMessage}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : '+ Register Robot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Robots() {
  const queryClient = useQueryClient()
  const { currentUser } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const {
    data: robots,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['robots'], queryFn: getRobots, refetchInterval: 4000 })

  const createMutation = useMutation({
    mutationFn: createRobot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['robots'] })
      closeModal()
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, data }) => updateRobotStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['robots'] })
      closeModal()
    },
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function openCreateModal() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  function openEditModal(robot) {
    setForm({ name: robot.name, ip_address: robot.ip_address || '', status: robot.status, mode: robot.mode })
    setEditingId(robot.id)
    setShowForm(true)
  }

  function closeModal() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (editingId) {
      statusMutation.mutate({ id: editingId, data: { status: form.status, mode: form.mode } })
    } else {
      createMutation.mutate({ name: form.name, ip_address: form.ip_address })
    }
  }

  const stats = useMemo(() => {
    const list = robots || []
    return {
      total: list.length,
      online: list.filter((r) => r.status === 'online').length,
      offline: list.filter((r) => r.status === 'offline').length,
      error: list.filter((r) => r.status === 'error').length,
    }
  }, [robots])

  const filteredRobots = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (robots || []).filter((r) => {
      const matchesSearch =
        !term || r.name?.toLowerCase().includes(term) || r.ip_address?.toLowerCase().includes(term)
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [robots, search, statusFilter])

  const activeMutation = editingId ? statusMutation : createMutation

  return (
    <div className="users-page">
      <div className="page-topbar">
        <div>
          <h2>Robots</h2>
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
          <h3>Fleet Management</h3>
          <p className="topbar-subtext">{stats.total} robots · {stats.online} online</p>
        </div>
        <button type="button" className="primary-button" onClick={openCreateModal}>
          + Register Robot
        </button>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span>Total Robots</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Online</span>
          <strong>{stats.online}</strong>
        </div>
        <div className="stat-card">
          <span>Offline</span>
          <strong>{stats.offline}</strong>
        </div>
        <div className="stat-card">
          <span>Error</span>
          <strong>{stats.error}</strong>
        </div>
      </div>

      {showForm && (
        <RobotModal
          mode={editingId ? 'edit' : 'create'}
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
          isSaving={activeMutation.isPending}
          errorMessage={activeMutation.isError ? activeMutation.error.message : ''}
        />
      )}

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="🔍 Search name or IP…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="online">online</option>
          <option value="offline">offline</option>
          <option value="error">error</option>
        </select>
        <span className="results-count">{filteredRobots.length} results</span>
      </div>

      {isLoading && <p>Loading robots…</p>}
      {isError && <p className="error">Failed to load robots: {error.message}</p>}

      {!isLoading && !isError && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>IP address</th>
              <th>Status</th>
              <th>Mode</th>
              <th>Battery</th>
              <th>Speed</th>
              <th>Latency</th>
              <th>Last seen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredRobots.map((robot) => (
              <tr key={robot.id}>
                <td>{robot.name}</td>
                <td>{robot.ip_address || '—'}</td>
                <td>
                  <Badge text={robot.status} color={STATUS_COLORS[robot.status] || '#6b7280'} />
                </td>
                <td>
                  <Badge text={robot.mode} color="#2563eb" />
                </td>
                <td>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${robot.battery ?? 0}%` }} />
                  </div>{' '}
                  {robot.battery ?? '—'}%
                </td>
                <td>{robot.speed ?? '—'} m/s</td>
                <td>{robot.wifi_latency ?? '—'} ms</td>
                <td>{formatDate(robot.last_seen)}</td>
                <td>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => openEditModal(robot)}
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Robots
