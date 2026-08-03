import { useState } from 'react'
import { DemoContext } from './internalContexts'

const DEMO_ROBOTS = [
  {
    id: 9001,
    name: 'AMR-X Demo',
    status: 'online',
    mode: 'autonomous',
    battery: 78,
    speed: 1.2,
    wifi_latency: 14,
    ip_address: '192.168.1.100',
    position_x: 8,
    position_y: 6,
    orientation: 45,
    last_seen: new Date().toISOString(),
  },
  {
    id: 9002,
    name: 'AMR-Y Demo',
    status: 'offline',
    mode: 'idle',
    battery: 34,
    speed: 0,
    wifi_latency: null,
    ip_address: '192.168.1.101',
    position_x: 20,
    position_y: 15,
    orientation: 180,
    last_seen: new Date(Date.now() - 3600000).toISOString(),
  },
]

const DEMO_MISSIONS = [
  {
    id: 9001,
    name: 'Delivery Run A',
    type: 'delivery',
    status: 'running',
    priority: 'high',
    progress: 65,
    destination: 'Zone B - Shelf 3',
    start_point: 'Charging Dock',
    robot_id: 9001,
    module_required: 'delivery_box',
    is_recurring: false,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    started_at: new Date(Date.now() - 900000).toISOString(),
    completed_at: null,
  },
  {
    id: 9002,
    name: 'Patrol Route 1',
    type: 'patrol',
    status: 'pending',
    priority: 'normal',
    progress: 0,
    destination: 'Perimeter A',
    start_point: 'Zone C',
    robot_id: 9001,
    module_required: 'none',
    is_recurring: true,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    started_at: null,
    completed_at: null,
  },
  {
    id: 9003,
    name: 'Inspection Alpha',
    type: 'inspection',
    status: 'completed',
    priority: 'low',
    progress: 100,
    destination: 'Sector 4',
    start_point: 'Zone A',
    robot_id: 9001,
    module_required: 'camera',
    is_recurring: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    started_at: new Date(Date.now() - 82800000).toISOString(),
    completed_at: new Date(Date.now() - 79200000).toISOString(),
  },
]

const DEMO_ALERTS = [
  {
    id: 9001,
    type: 'warning',
    message: 'Battery below 40% — AMR-Y Demo',
    is_resolved: false,
    robot_id: 9002,
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 9002,
    type: 'info',
    message: 'Mission "Delivery Run A" started',
    is_resolved: false,
    robot_id: 9001,
    created_at: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 9003,
    type: 'critical',
    message: 'AMR-Y Demo lost connection',
    is_resolved: true,
    robot_id: 9002,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

const DEMO_MODULES = [
  {
    id: 9001,
    name: 'Delivery Box Pro',
    type: 'delivery_box',
    status: 'active',
    robot_id: 9001,
  },
  {
    id: 9002,
    name: 'HD Camera',
    type: 'camera',
    status: 'active',
    robot_id: 9001,
  },
]

export function DemoProvider({ children }) {
  const [demo, setDemo] = useState(() => localStorage.getItem('amrx-demo') === 'true')

  function toggleDemo() {
    setDemo((d) => {
      const next = !d
      localStorage.setItem('amrx-demo', String(next))
      return next
    })
  }

  return (
    <DemoContext.Provider
      value={{ demo, toggleDemo, DEMO_ROBOTS, DEMO_MISSIONS, DEMO_ALERTS, DEMO_MODULES }}
    >
      {children}
    </DemoContext.Provider>
  )
}
