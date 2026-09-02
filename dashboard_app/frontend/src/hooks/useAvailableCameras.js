import { useEffect, useState } from 'react'

const COMPRESSED_IMAGE_TYPE = 'sensor_msgs/msg/CompressedImage'

function isCameraTopic(topic) {
  const normalized = topic.toLowerCase()
  return normalized.endsWith('/compressed')
    && (normalized.includes('camera') || normalized.includes('image'))
    && !normalized.startsWith('/out/')
}

export function useAvailableCameras(ros, connected) {
  const [topics, setTopics] = useState([])

  useEffect(() => {
    if (!ros || !connected) {
      setTopics([])
      return undefined
    }

    let active = true

    const discover = () => {
      ros.getTopicsForType(
        COMPRESSED_IMAGE_TYPE,
        (availableTopics) => {
          if (!active) return
          const cameras = [...new Set(availableTopics.filter(isCameraTopic))].sort()
          setTopics(cameras)
        },
        () => active && setTopics([]),
      )
    }

    discover()
    const interval = window.setInterval(discover, 5000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [ros, connected])

  return topics
}
