import axios from 'axios'

const BASE = '/api'

export const getMissions = () => axios.get(`${BASE}/missions/`).then((r) => r.data)
export const getMission = (id) => axios.get(`${BASE}/missions/${id}`).then((r) => r.data)
export const createMission = (data) => axios.post(`${BASE}/missions/`, data).then((r) => r.data)
export const deleteMission = (id) => axios.delete(`${BASE}/missions/${id}`).then((r) => r.data)

export const startMission = (id) => axios.patch(`${BASE}/missions/${id}/start`).then((r) => r.data)
export const pauseMission = (id) => axios.patch(`${BASE}/missions/${id}/pause`).then((r) => r.data)
export const resumeMission = (id) => axios.patch(`${BASE}/missions/${id}/resume`).then((r) => r.data)
export const stopMission = (id) => axios.patch(`${BASE}/missions/${id}/stop`).then((r) => r.data)
