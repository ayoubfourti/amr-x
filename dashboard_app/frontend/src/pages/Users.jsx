import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUser, deleteUser, patchUser } from '../api/users'
import { getRobots } from '../api/robots'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/ui/Badge'
import PageTopbar from '../components/ui/PageTopbar'
import { useToast } from '../components/ui/Toast'
import ConfirmModal from '../components/ui/ConfirmModal'
import { formatDate } from '../utils/format'
import { initials, avatarColor } from '../utils/avatar'

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
  const { showToast } = useToast()
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'

  const {
    data: users,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['users'], queryFn: getUsers, refetchInterval: 5000 })

  const { data: robots } = useQuery({
    queryKey: ['robots'],
    queryFn: getRobots,
    refetchInterval: 4000,
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeModal()
      showToast('User updated', 'success')
    },
    onError: () => {
      showToast('Failed to update user', 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeModal()
      showToast('User updated', 'success')
    },
    onError: () => {
      showToast('Failed to update user', 'error')
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id) => patchUser(id, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      showToast('User approved', 'success')
    },
    onError: () => {
      showToast('Failed to approve user', 'error')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => patchUser(id, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      showToast('User rejected', 'warning')
    },
    onError: () => {
      showToast('Failed to reject user', 'error')
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
        data: { name: form.name, email: form.email, role: form.role, status: form.status },
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

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      await deleteUser(confirmDelete.id)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const combinedUsers = useMemo(() => users || [], [users])

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

  const latency = (robots || []).find((r) => r.status === 'online')?.wifi_latency ?? null

  return (
    <div className="users-page">
      <PageTopbar title="Users" latency={latency} />

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
        <div className="data-table-wrapper">
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
                  {user.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="icon-button"
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(user.id)}
                      >
                        {approveMutation.isPending ? '…' : '✅ Approve'}
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        disabled={rejectMutation.isPending}
                        onClick={() => rejectMutation.mutate(user.id)}
                      >
                        {rejectMutation.isPending ? '…' : '⛔ Reject'}
                      </button>
                    </>
                  )}
                  <button type="button" className="icon-button" onClick={() => openEditModal(user)}>
                    ✏️
                  </button>
                  <button type="button" className="icon-button" onClick={() => setConfirmDelete(user)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete User"
        message={`Remove "${confirmDelete?.name}" from the system? This cannot be undone.`}
        confirmLabel="Delete User"
        confirmColor="#ef4444"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default Users
