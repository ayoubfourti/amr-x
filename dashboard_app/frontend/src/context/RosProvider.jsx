import { useMemo } from 'react'
import { useRos } from '../hooks/useRos'
import { RosContext } from './internalContexts'

const DEFAULT_ROSBRIDGE_URL = 'ws://localhost:9090'
const STORAGE_KEY = 'amrx-ws-url'

function readRosbridgeUrl() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_ROSBRIDGE_URL
  } catch {
    return DEFAULT_ROSBRIDGE_URL
  }
}

export function RosProvider({ children }) {
  const url = useMemo(readRosbridgeUrl, [])
  const connection = useRos(url)

  return (
    <RosContext.Provider value={{ ...connection, url }}>
      {children}
    </RosContext.Provider>
  )
}
