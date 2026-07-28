import axios from 'axios'

const BASE = '/api'

export const getUsers = () => axios.get(`${BASE}/users/`).then((r) => r.data)
export const createUser = (data) => axios.post(`${BASE}/users/`, data).then((r) => r.data)
export const updateUser = (id, data) =>
  axios.put(`${BASE}/users/${id}`, data).then((r) => r.data)
export const deleteUser = (id) => axios.delete(`${BASE}/users/${id}`).then((r) => r.data)
export const patchUser = (id, data) =>
  axios.patch(`${BASE}/users/${id}`, data).then((r) => r.data)
