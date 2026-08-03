import { useCallback, useMemo } from 'react'
import * as ROSLIB from 'roslib'

export function useTeleopControl(ros) {
  const cmdVelTopic = useMemo(() => {
    if (!ros) return null
    return new ROSLIB.Topic({
      ros,
      name: '/cmd_vel',
      messageType: 'geometry_msgs/Twist',
    })
  }, [ros])

  const sendCommand = useCallback((linear, angular) => {
    if (!cmdVelTopic) return
    cmdVelTopic.publish({
      linear: { x: linear, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angular },
    })
  }, [cmdVelTopic])

  const emergencyStop = useCallback(() => {
    sendCommand(0, 0)
  }, [sendCommand])

  return { sendCommand, emergencyStop }
}
