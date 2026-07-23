const STORAGE_KEY = 'allUsers'

export function getAllUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveAllUsers(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function upsertUser(entry) {
  const list = getAllUsers()
  const index = list.findIndex((u) => u.id === entry.id)
  if (index === -1) {
    list.push(entry)
  } else {
    list[index] = { ...list[index], ...entry }
  }
  saveAllUsers(list)
  return list
}

export function getStatus(email, allUsers) {
  const entry = allUsers.find((u) => u.email === email)
  return entry?.status ?? 'pending'
}

export function setUserStatus(id, status) {
  const list = getAllUsers()
  const index = list.findIndex((u) => u.id === id)
  if (index !== -1) {
    list[index] = { ...list[index], status }
    saveAllUsers(list)
  }
  return list
}

export function removeUser(id) {
  const list = getAllUsers().filter((u) => u.id !== id)
  saveAllUsers(list)
  return list
}
