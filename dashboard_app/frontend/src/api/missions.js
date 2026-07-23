import axios from 'axios'

const BASE = '/api'

export const getMissions = () => axios.get(`${BASE}/missions/`).then((r) => r.data)
export const getMission = (id) => axios.get(`${BASE}/missions/${id}`).then((r) => r.data)
export const createMission = (data) => axios.post(`${BASE}/missions/`, data).then((r) => r.data)
export const deleteMission = (id) => axios.delete(`${BASE}/missions/${id}`).then((r) => r.data)
