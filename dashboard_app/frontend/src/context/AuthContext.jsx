import { useState } from 'react'
import { AuthContext } from './internalContexts'
const STORAGE_KEY = 'currentUser'

function sanitizeUser(user) {
  const safe = { ...user }
  delete safe.password_hash
  return safe
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(readStoredUser)

  function login(user) {
    const safe = sanitizeUser(user)
    setCurrentUser(safe)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))
  }

  function logout() {
    setCurrentUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
