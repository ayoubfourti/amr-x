import { useEffect, useState } from 'react'
import * as ROSLIB from 'roslib'

export function useRosImage(ros, topicName, enabled = true) {
  const [frame, setFrame] = useState(null)
  const [receivedAt, setReceivedAt] = useState(null)

  useEffect(() => {
    setFrame(null)
    setReceivedAt(null)
    if (!ros || !enabled || !topicName) return undefined

    const topic = new ROSLIB.Topic({
      ros,
      name: topicName,
      messageType: 'sensor_msgs/CompressedImage',
      queue_length: 1,
      throttle_rate: 100,
    })

    let staleTimer

    topic.subscribe((message) => {
      if (!message?.data) return
      const format = String(message.format || 'jpeg').toLowerCase()
      const mime = format.includes('png') ? 'image/png' : 'image/jpeg'
      setFrame(`data:${mime};base64,${message.data}`)
      setReceivedAt(Date.now())
      window.clearTimeout(staleTimer)
      staleTimer = window.setTimeout(() => {
        setFrame(null)
        setReceivedAt(null)
      }, 1500)
    })

    return () => {
      window.clearTimeout(staleTimer)
      topic.unsubscribe()
    }
  }, [ros, topicName, enabled])

  return { frame, receivedAt }
}
