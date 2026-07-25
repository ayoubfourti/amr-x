import axios from 'axios'

const BASE = '/api'

export const getAlerts = () => axios.get(`${BASE}/alerts/`).then((r) => r.data)
export const resolveAlert = (id) =>
  axios.put(`${BASE}/alerts/${id}/resolve`).then((r) => r.data)
