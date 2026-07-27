import axios from 'axios'

const BASE = '/api'

export const getRobots = () => axios.get(`${BASE}/robots/`).then((r) => r.data)
export const getRobot = (id) => axios.get(`${BASE}/robots/${id}`).then((r) => r.data)
export const createRobot = (data) => axios.post(`${BASE}/robots/`, data).then((r) => r.data)
export const updateRobotStatus = (id, data) =>
  axios.put(`${BASE}/robots/${id}/status`, data).then((r) => r.data)
