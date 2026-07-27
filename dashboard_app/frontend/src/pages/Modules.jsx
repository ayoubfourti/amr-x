import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getModules, toggleModule, createModule } from '../api/modules'
import { useAuth } from '../context/AuthContext'

const FILTERS = ['all', 'active', 'inactive', 'error']
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

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const emptyForm = { robot_id: '', name: '', type: '', status: 'disconnected' }

function ModuleModal({ form, onChange, onSubmit, onClose, isSaving, errorMessage }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>New Module</h3>
            <p className="topbar-subtext">Attach a new module to a robot</p>
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
            <span className="auth-label">Type</span>
            <input name="type" value={form.type} onChange={onChange} required />
          </label>
          <label className="auth-field">
            <span className="auth-label">Status</span>
            <select name="status" value={form.status} onChange={onChange}>
              <option value="connected">connected</option>
              <option value="disconnected">disconnected</option>
              <option value="error">error</option>
              <option value="standby">standby</option>
            </select>
          </label>

          {errorMessage && <p className="error">{errorMessage}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Creating…' : '+ Create Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Modules() {
  const queryClient = useQueryClient()
  const { currentUser } = useAuth()
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const {
    data: modules,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['modules'], queryFn: getModules, refetchInterval: 5000 })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => toggleModule(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  })

  const createMutation = useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      setShowForm(false)
      setForm(emptyForm)
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

  const moduleList = modules || []

  const stats = useMemo(() => {
    const list = modules || []
    return {
      active: list.filter((m) => m.is_active).length,
      inactive: list.filter((m) => !m.is_active && m.status !== 'error').length,
      error: list.filter((m) => m.status === 'error').length,
    }
  }, [modules])

  const filteredModules = moduleList.filter((m) => {
    if (filter === 'active') return m.is_active
    if (filter === 'inactive') return !m.is_active && m.status !== 'error'
    if (filter === 'error') return m.status === 'error'
    return true
  })

  return (
    <div className="users-page">
      <div className="page-topbar">
        <div>
          <h2>Modules</h2>
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
          <h3>Attached Modules</h3>
          <p className="topbar-subtext">{moduleList.length} modules</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
          + New Module
        </button>
      </div>

      {showForm && (
        <ModuleModal
          form={form}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          isSaving={createMutation.isPending}
          errorMessage={createMutation.isError ? createMutation.error.message : ''}
        />
      )}

      <div className="stat-cards">
        <div className="stat-card">
          <span>Active</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="stat-card">
          <span>Inactive</span>
          <strong>{stats.inactive}</strong>
        </div>
        <div className="stat-card">
          <span>Error</span>
          <strong>{stats.error}</strong>
        </div>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && <p>Loading modules…</p>}
      {isError && <p className="error">Failed to load modules: {error.message}</p>}

      {!isLoading && !isError && (
        <div className="card-grid">
          {filteredModules.map((mod) => (
            <div className="stat-card" key={mod.id}>
              <div className="user-cell">
                <strong>{mod.name}</strong>
                <input
                  type="checkbox"
                  checked={mod.is_active}
                  onChange={() => toggleMutation.mutate({ id: mod.id, isActive: !mod.is_active })}
                  disabled={toggleMutation.isPending}
                />
              </div>
              <div className="mt-4">
                <Badge
                  text={mod.temperature == null ? '—' : `${mod.temperature}°C`}
                  color={tempColor(mod.temperature)}
                />
              </div>
              <span>Robot #{mod.robot_id}</span>
              <span className="topbar-subtext">{formatDate(mod.last_update)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Modules
