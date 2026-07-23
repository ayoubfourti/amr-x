import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUser, deleteUser } from '../api/users'
import { useAuth } from '../context/AuthContext'
import { getAllUsers, upsertUser, setUserStatus, getStatus, removeUser } from '../utils/pendingUsers'

const ROLE_COLORS = {
  admin: '#dc2626',
  operator: '#2563eb',
  client: '#16a34a',
}

const STATUS_COLORS = {
  approved: '#16a34a',
  pending: '#d97706',
  rejected: '#dc2626',
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

const emptyForm = { name: '', email: '', password: '', role: 'operator', status: 'pending' }

function UserModal({ mode, form, onChange, onSubmit, onClose, isSaving, errorMessage }) {
  const isEdit = mode === 'edit'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{isEdit ? 'Edit User' : 'New User'}</h3>
            <p className="topbar-subtext">
              {isEdit ? 'Update team member details' : 'Add a new team member'}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-preview">
          <span className="avatar-chip large" style={{ backgroundColor: avatarColor(form.name) }}>
            {form.name ? initials(form.name) : '?'}
          </span>
          <div>
            <div className="modal-preview-name">{form.name || 'Full name'}</div>
            <div className="topbar-subtext">
              {form.role} · {form.status}
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <label className="auth-field">
            <span className="auth-label">Full Name</span>
            <input
              name="name"
              placeholder="e.g. Sara Mendez"
              value={form.name}
              onChange={onChange}
              required
            />
          </label>
          <label className="auth-field">
            <span className="auth-label">Email Address</span>
            <input
              name="email"
              type="email"
              placeholder="e.g. s.mendez@warebot.io"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          {!isEdit && (
            <label className="auth-field">
              <span className="auth-label">Password</span>
              <input
                name="password"
                type="password"
                placeholder="Temporary password"
                value={form.password}
                onChange={onChange}
                required
              />
            </label>
          )}

          <div className="modal-row">
            <label className="auth-field">
              <span className="auth-label">Role</span>
              <select name="role" value={form.role} onChange={onChange}>
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="client">Client</option>
              </select>
            </label>
            <label className="auth-field">
              <span className="auth-label">Status</span>
              <select name="status" value={form.status} onChange={onChange} disabled={!isEdit}>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>

          {errorMessage && <p className="error">{errorMessage}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : '✓ Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Users() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [allUsers, setAllUsers] = useState(getAllUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'

  const {
    data: users,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['users'], queryFn: getUsers, refetchInterval: 5000 })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (createdUser) => {
      const updated = upsertUser({
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        status: 'pending',
        created_at: createdUser.created_at,
      })
      setAllUsers(updated)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: (updatedUser, variables) => {
      const updated = setUserStatus(variables.id, variables.status)
      upsertUser({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: variables.status,
        created_at: updatedUser.created_at,
      })
      setAllUsers(updated)
      queryClient.invalidateQueries({ queryKey: ['users'] })
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

  function openEditModal(user) {
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
    })
    setEditingId(user.id)
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
      updateMutation.mutate({
        id: editingId,
        data: { name: form.name, email: form.email, role: form.role },
        status: form.status,
      })
    } else {
      createMutation.mutate({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      })
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this user? This cannot be undone.')) return
    await deleteUser(id)
    setAllUsers(removeUser(id))
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const combinedUsers = useMemo(
    () => (users || []).map((u) => ({ ...u, status: getStatus(u.email, allUsers) })),
    [users, allUsers],
  )

  const stats = useMemo(
    () => ({
      total: combinedUsers.length,
      approved: combinedUsers.filter((u) => u.status === 'approved').length,
      pending: combinedUsers.filter((u) => u.status === 'pending').length,
      rejected: combinedUsers.filter((u) => u.status === 'rejected').length,
    }),
    [combinedUsers],
  )

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return combinedUsers.filter((u) => {
      const matchesSearch =
        !term || u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [combinedUsers, search, roleFilter, statusFilter])

  if (!isAdmin) {
    return (
      <div className="users-page">
        <h2>Users</h2>
        <p className="error">Access restricted</p>
      </div>
    )
  }

  const activeMutation = editingId ? updateMutation : createMutation

  return (
    <div className="users-page">
      <div className="page-topbar">
        <div>
          <h2>Users</h2>
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
          <h3>User Management</h3>
          <p className="topbar-subtext">
            {stats.total} members · {stats.approved} active
          </p>
        </div>
        <button type="button" className="primary-button" onClick={openCreateModal}>
          + New User
        </button>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span>Total Users</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Approved</span>
          <strong>{stats.approved}</strong>
        </div>
        <div className="stat-card">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className="stat-card">
          <span>Rejected</span>
          <strong>{stats.rejected}</strong>
        </div>
      </div>

      {showForm && (
        <UserModal
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
          placeholder="🔍 Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="operator">Operator</option>
          <option value="client">Client</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="results-count">{filteredUsers.length} results</span>
      </div>

      {isLoading && <p>Loading users…</p>}
      {isError && <p className="error">Failed to load users: {error.message}</p>}

      {!isLoading && !isError && (
        <table className="users-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" disabled />
              </th>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Robots</th>
              <th>Last Seen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <input type="checkbox" disabled />
                </td>
                <td>
                  <div className="user-cell">
                    <span
                      className="avatar-chip"
                      style={{ backgroundColor: avatarColor(user.name) }}
                    >
                      {initials(user.name)}
                    </span>
                    <div>
                      <div>{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge text={user.role} color={ROLE_COLORS[user.role] || '#6b7280'} />
                </td>
                <td>
                  <Badge text={user.status} color={STATUS_COLORS[user.status] || '#6b7280'} />
                </td>
                <td>—</td>
                <td>{formatDate(user.last_login)}</td>
                <td>
                  <button type="button" className="icon-button" onClick={() => openEditModal(user)}>
                    ✏️
                  </button>
                  <button type="button" className="icon-button" onClick={() => handleDelete(user.id)}>
                    🗑️
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

export default Users
