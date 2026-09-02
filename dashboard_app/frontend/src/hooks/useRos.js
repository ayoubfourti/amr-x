import { useEffect, useState } from 'react'

export function useRos(url = 'ws://localhost:9090') {
  const [ros, setRos] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let active = true
    let connection
    let reconnectTimer

    async function connect() {
      const ROSLIB = await import('roslib')
      if (!active) return

      connection = new ROSLIB.Ros()
      setRos(connection)

      const scheduleReconnect = () => {
        if (!active || reconnectTimer) return
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = undefined
          if (active) connection.connect(url)
        }, 2000)
      }

      connection.on('connection', () => {
        if (!active) return
        if (reconnectTimer) window.clearTimeout(reconnectTimer)
        reconnectTimer = undefined
        setConnected(true)
      })
      connection.on('close', () => {
        if (!active) return
        setConnected(false)
        scheduleReconnect()
      })
      connection.on('error', () => {
        if (!active) return
        setConnected(false)
        scheduleReconnect()
      })
      connection.connect(url)
    }

    connect()

    return () => {
      active = false
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      connection?.close()
    }
  }, [url])

  return { ros, connected }
}
