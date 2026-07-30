import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRobots, createRobot, updateRobotStatus } from '../api/robots'
import Badge from '../components/ui/Badge'
import PageTopbar from '../components/ui/PageTopbar'
import { StatGrid } from '../components/ui/CommandUI'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../hooks/useToast'
import { useDemo } from '../hooks/useDemo'
import { formatDate } from '../utils/format'
import Icon from '../components/ui/Icon'
import SelectField from '../components/ui/SelectField'
import './Robots.css'

const STATUS_COLORS = {
  online: '#16a34a',
  offline: '#6b7280',
  error: '#dc2626',
}

const emptyForm = { name: '', ip_address: '', status: 'online', mode: 'idle' }
const ROBOT_STATUS_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'error', label: 'Error' },
]
const ROBOT_MODE_OPTIONS = [
  { value: 'idle', label: 'Idle' },
  { value: 'autonomous', label: 'Autonomous' },
  { value: 'manual', label: 'Manual' },
]

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
            <Icon name="close" size={16} />
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
              <div className="auth-field">
                <span className="auth-label">Status</span>
                <SelectField
                  name="status"
                  value={form.status}
                  options={ROBOT_STATUS_OPTIONS}
                  onChange={onChange}
                  ariaLabel="Robot status"
                />
              </div>
              <div className="auth-field">
                <span className="auth-label">Mode</span>
                <SelectField
                  name="mode"
                  value={form.mode}
                  options={ROBOT_MODE_OPTIONS}
                  onChange={onChange}
                  ariaLabel="Robot mode"
                />
              </div>
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
  const { showToast } = useToast()
  const { demo, DEMO_ROBOTS } = useDemo()
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
      showToast('Robot registered successfully', 'success')
    },
    onError: () => {
      showToast('Failed to register robot', 'error')
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, data }) => updateRobotStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['robots'] })
      closeModal()
      showToast('Robot updated', 'success')
    },
    onError: () => {
      showToast('Failed to update robot', 'error')
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
    if (demo) {
      showToast('Demo mode active — disable to add real robots', 'warning')
      return
    }
    if (editingId) {
      statusMutation.mutate({ id: editingId, data: { status: form.status, mode: form.mode } })
    } else {
      createMutation.mutate({ name: form.name, ip_address: form.ip_address })
    }
  }

  const displayRobots = useMemo(() => (demo ? DEMO_ROBOTS : robots || []), [demo, DEMO_ROBOTS, robots])

  const stats = useMemo(() => {
    const list = displayRobots
    return {
      total: list.length,
      online: list.filter((r) => r.status === 'online').length,
      offline: list.filter((r) => r.status === 'offline').length,
      error: list.filter((r) => r.status === 'error').length,
    }
  }, [displayRobots])

  const filteredRobots = useMemo(() => {
    const term = search.trim().toLowerCase()
    return displayRobots.filter((r) => {
      const matchesSearch =
        !term || r.name?.toLowerCase().includes(term) || r.ip_address?.toLowerCase().includes(term)
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [displayRobots, search, statusFilter])

  const activeMutation = editingId ? statusMutation : createMutation
  const latency = displayRobots.find((r) => r.status === 'online')?.wifi_latency ?? null

  return (
    <div className="users-page robots-page">
      <PageTopbar
        title="Robots"
        latency={latency}
        subtitle={`${stats.total} registered · ${stats.online} online`}
        action={
          <button type="button" className="primary-action" onClick={openCreateModal}>
            <Icon name="robot" size={16} /> Register robot
          </button>
        }
      />

      <StatGrid items={[
        { label: 'Total robots', value: stats.total, icon: 'robot', detail: 'Fleet inventory', tone: 'cyan' },
        { label: 'Online', value: stats.online, icon: 'wifi', detail: 'Connected now', tone: 'green' },
        { label: 'Offline', value: stats.offline, icon: 'pause', detail: 'Unavailable', tone: 'blue' },
        { label: 'Error', value: stats.error, icon: 'alert', detail: 'Needs attention', tone: 'red' },
      ]} />

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
          placeholder="Search name or IP…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SelectField
          name="robot-status-filter"
          value={statusFilter}
          options={[{ value: 'all', label: 'All statuses' }, ...ROBOT_STATUS_OPTIONS]}
          onChange={(event) => setStatusFilter(event.target.value)}
          ariaLabel="Filter robots by status"
        />
        <span className="results-count">{filteredRobots.length} results</span>
      </div>

      {isLoading && <p>Loading robots…</p>}
      {isError && <p className="error">Failed to load robots: {error.message}</p>}

      {!isLoading && !isError && displayRobots.length === 0 && (
        <EmptyState
          icon={<Icon name="robot" size={40} />}
          title="No robots registered yet"
          subtitle="Add your first robot to start managing your fleet"
          action={
            <button type="button" className="primary-button" onClick={openCreateModal}>
              <Icon name="robot" size={16} /> Register robot
            </button>
          }
        />
      )}

      {!isLoading && !isError && displayRobots.length > 0 && filteredRobots.length === 0 && (
        <EmptyState
          icon={<Icon name="search" size={40} />}
          title="No robots match your search"
          subtitle="Try a different name or status filter"
        />
      )}

      {!isLoading && !isError && filteredRobots.length > 0 && (
        <div className="data-table-wrapper">
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
                <td className="robot-name-cell">{robot.name}</td>
                <td className="robot-ip-cell">{robot.ip_address || '—'}</td>
                <td>
                  <Badge
                    className="robot-state-badge"
                    text={robot.status}
                    color={STATUS_COLORS[robot.status] || '#6b7280'}
                  />
                </td>
                <td>
                  <Badge className="robot-state-badge" text={robot.mode} color="#2563eb" />
                </td>
                <td>
                  <div className="robot-battery-cell">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${robot.battery ?? 0}%` }} />
                    </div>
                    <strong>{robot.battery ?? '—'}%</strong>
                  </div>
                </td>
                <td className="robot-live-value">
                  <strong>{robot.speed ?? '—'}</strong><span>m/s</span>
                </td>
                <td className="robot-live-value">
                  <strong>{robot.wifi_latency ?? '—'}</strong><span>ms</span>
                </td>
                <td className="robot-last-seen">{formatDate(robot.last_seen)}</td>
                <td>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => openEditModal(robot)}
                  >
                    <Icon name="settings" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

export default Robots
