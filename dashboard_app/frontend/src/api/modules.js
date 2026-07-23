import axios from 'axios'

const BASE = '/api'

export const getModules = () => axios.get(`${BASE}/modules/`).then((r) => r.data)
export const createModule = (data) => axios.post(`${BASE}/modules/`, data).then((r) => r.data)
export const toggleModule = (id, isActive) =>
  axios
    .put(`${BASE}/modules/${id}/toggle`, null, { params: { is_active: isActive } })
    .then((r) => r.data)
