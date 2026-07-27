import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { createUser, getUsers } from '../api/users'
import { useAuth } from '../context/AuthContext'
import { getAllUsers, upsertUser } from '../utils/pendingUsers'

const emptyForm = { name: '', email: '', password: '', role: 'operator' }

function Register() {
  const [form, setForm] = useState(emptyForm)
  const [validationError, setValidationError] = useState('')
  const [duplicateEmail, setDuplicateEmail] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (createdUser, variables) => {
      const status = variables.role === 'admin' ? 'approved' : 'pending'
      upsertUser({
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        status,
        created_at: createdUser.created_at,
      })
      login({ ...createdUser, status })
      navigate(status === 'approved' ? '/' : '/pending')
    },
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'email') setDuplicateEmail(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setValidationError('')
    setDuplicateEmail(false)

    if (!form.name || !form.email || !form.password || !form.role) {
      setValidationError('All fields are required.')
      return
    }
    if (!form.email.includes('@')) {
      setValidationError('Email must contain @.')
      return
    }

    setIsChecking(true)
    try {
      const [backendUsers, localUsers] = await Promise.all([getUsers(), getAllUsers()])
      const exists =
        backendUsers.some((u) => u.email === form.email) ||
        localUsers.some((u) => u.email === form.email)
      if (exists) {
        setDuplicateEmail(true)
        return
      }
    } finally {
      setIsChecking(false)
    }

    mutation.mutate({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>AMR-X</h1>
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className={duplicateEmail ? 'input-error' : ''}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="admin">Admin</option>
            <option value="operator">Operator</option>
            <option value="client">Client</option>
          </select>
          <button type="submit" disabled={mutation.isPending || isChecking}>
            {mutation.isPending || isChecking ? 'Registering…' : 'Register'}
          </button>
        </form>
        {validationError && <p className="error">{validationError}</p>}
        {duplicateEmail && (
          <p className="error">
            An account with this email already exists. Please use a different email or go
            to login. <Link to="/login">Go to login</Link>
          </p>
        )}
        {mutation.isError && (
          <p className="error">Registration failed: {mutation.error.message}</p>
        )}
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
