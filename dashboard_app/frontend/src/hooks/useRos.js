import { useEffect, useState } from 'react'

export function useRos(url = 'ws://localhost:9090') {
  const [ros, setRos] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let active = true
    let connection

    async function connect() {
      const ROSLIB = await import('roslib')
      if (!active) return

      connection = new ROSLIB.Ros({ url })
      setRos(connection)
      connection.on('connection', () => active && setConnected(true))
      connection.on('close', () => active && setConnected(false))
      connection.on('error', () => active && setConnected(false))
    }

    connect()

    return () => {
      active = false
      connection?.close()
    }
  }, [url])

  return { ros, connected }
}
