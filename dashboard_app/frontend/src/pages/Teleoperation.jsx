import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { getRobots } from '../api/robots'
import { useTeleopControl } from '../hooks/useTeleopControl'
import { useDemo } from '../hooks/useDemo'
import { useRosConnection } from '../hooks/useRosConnection'
import LiveCameraFeed from '../components/ui/LiveCameraFeed'
import SelectField from '../components/ui/SelectField'
import WarehouseMapSVG from '../components/ui/WarehouseMapSVG'
import Icon from '../components/ui/Icon'
import { PageShell, PageHeader, Surface, StatusPill } from '../components/ui/CommandUI'
import './Teleoperation.css'

const KEY_MAP = {
  z: 'forward',
  ArrowUp: 'forward',
  s: 'backward',
  ArrowDown: 'backward',
  q: 'left',
  ArrowLeft: 'left',
  d: 'right',
  ArrowRight: 'right',
}

const COMMANDS = {
  forward: { linear: 1, angular: 0 },
  backward: { linear: -1, angular: 0 },
  left: { linear: 0, angular: 1 },
  right: { linear: 0, angular: -1 },
}

function DrivePad({ direction, onStart, onStop }) {
  const buttons = [
    { direction: 'forward', icon: '↑', label: 'Forward' },
    { direction: 'left', icon: '↶', label: 'Rotate left' },
    { direction: 'stop', icon: '■', label: 'Stop' },
    { direction: 'right', icon: '↷', label: 'Rotate right' },
    { direction: 'backward', icon: '↓', label: 'Reverse' },
  ]
  return (
    <div className="hud-drive-pad">
      {buttons.map((button) => (
        <button
          type="button"
          className={`${button.direction} ${direction === button.direction ? 'active' : ''}`}
          onPointerDown={() => button.direction === 'stop' ? onStop() : onStart(button.direction)}
          onPointerUp={onStop}
          onPointerCancel={onStop}
          onPointerLeave={onStop}
          aria-label={button.label}
          key={button.direction}
        >
          <span className="drive-pad-glyph">{button.icon}</span>
          {button.direction !== 'stop' && <small>{button.label}</small>}
        </button>
      ))}
    </div>
  )
}

function Joystick({ maxSpeed, onCommand, onStop }) {
  const padRef = useRef(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)

  const update = (clientX, clientY) => {
    const rect = padRef.current?.getBoundingClientRect()
    if (!rect) return
    const radius = rect.width / 2
    let x = clientX - (rect.left + radius)
    let y = clientY - (rect.top + radius)
    const distance = Math.hypot(x, y)
    if (distance > radius - 18) {
      x = (x / distance) * (radius - 18)
      y = (y / distance) * (radius - 18)
    }
    setKnob({ x, y })
    onCommand((-y / radius) * maxSpeed, -x / radius)
  }

  const release = () => {
    dragging.current = false
    setKnob({ x: 0, y: 0 })
    onStop()
  }

  return (
    <div
      ref={padRef}
      className="hud-joystick"
      onPointerDown={(event) => {
        dragging.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        update(event.clientX, event.clientY)
      }}
      onPointerMove={(event) => dragging.current && update(event.clientX, event.clientY)}
      onPointerUp={release}
      onPointerCancel={release}
      role="application"
      aria-label="Robot drive joystick"
    >
      <span className="joystick-ring" />
      <span className="joystick-cross vertical" />
      <span className="joystick-cross horizontal" />
      <i style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  )
}

function Metric({ label, value, tone = 'cyan' }) {
  return (
    <span className={`hud-metric tone-${tone}`}>
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  )
}

export default function Teleoperation({ initialRobotId = null, onClose = null }) {
  const [searchParams] = useSearchParams()
  const { ros, connected } = useRosConnection()
  const { sendCommand, emergencyStop } = useTeleopControl(ros)
  const { demo, DEMO_ROBOTS } = useDemo()
  const { data: apiRobots = [], isError } = useQuery({
    queryKey: ['robots'],
    queryFn: getRobots,
    refetchInterval: 4000,
  })
  const robots = demo || isError ? DEMO_ROBOTS : apiRobots
  const [selectedRobotId, setSelectedRobotId] = useState(
    () => initialRobotId ?? searchParams.get('robot'),
  )
  const robot = robots.find((item) => String(item.id) === String(selectedRobotId)) || robots[0]
  const [mode, setMode] = useState('pad')
  const [maxSpeed, setMaxSpeed] = useState(.6)
  const [direction, setDirection] = useState('stopped')
  const [linear, setLinear] = useState(0)
  const [angular, setAngular] = useState(0)
  const [mapExpanded, setMapExpanded] = useState(false)
  const [cameraExpanded, setCameraExpanded] = useState(false)
  const mapRef = useRef(null)
  const activeKeys = useRef(new Set())

  const command = useCallback((nextLinear, nextAngular, nextDirection = 'manual') => {
    setLinear(nextLinear)
    setAngular(nextAngular)
    setDirection(nextDirection)
    sendCommand(nextLinear, nextAngular)
  }, [sendCommand])

  const stop = useCallback(() => command(0, 0, 'stopped'), [command])

  const startDirection = useCallback((nextDirection) => {
    const values = COMMANDS[nextDirection]
    if (values) command(values.linear * maxSpeed, values.angular, nextDirection)
  }, [command, maxSpeed])

  const triggerEmergencyStop = useCallback(() => {
    emergencyStop()
    stop()
  }, [emergencyStop, stop])

  useEffect(() => {
    const keyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault()
        triggerEmergencyStop()
        return
      }
      if (event.key === 'Escape') {
        setCameraExpanded(false)
        setMapExpanded(false)
        return
      }
      const nextDirection = KEY_MAP[event.key]
      if (!nextDirection || activeKeys.current.has(nextDirection)) return
      activeKeys.current.add(nextDirection)
      startDirection(nextDirection)
    }
    const keyUp = (event) => {
      const nextDirection = KEY_MAP[event.key]
      if (!nextDirection) return
      activeKeys.current.delete(nextDirection)
      if (!activeKeys.current.size) stop()
    }
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', stop)
    return () => {
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', stop)
      sendCommand(0, 0)
    }
  }, [sendCommand, startDirection, stop, triggerEmergencyStop])

  useEffect(() => {
    document.body.classList.toggle('teleop-fullscreen-active', cameraExpanded)
    return () => document.body.classList.remove('teleop-fullscreen-active')
  }, [cameraExpanded])

  return (
    <PageShell className="teleoperation-page">
      <PageHeader
        eyebrow="Manual control"
        title="Teleoperation"
        description="Camera-first remote operation with live navigation and safety context"
        icon="teleop"
        actions={
          <div className="teleop-header-actions">
            <StatusPill tone={connected ? 'green' : 'amber'}>
              {connected ? 'Command link nominal' : demo ? 'Simulation standby' : 'Rosbridge offline'}
            </StatusPill>
            {onClose && (
              <button type="button" className="teleop-modal-close" onClick={onClose} autoFocus>
                <Icon name="close" size={17} />
                Close control
              </button>
            )}
          </div>
        }
      />

      <Surface className={`teleop-camera-stage ${cameraExpanded ? 'is-camera-expanded' : ''} ${mapExpanded ? 'is-map-expanded' : ''}`}>
        <LiveCameraFeed
          ros={ros}
          connected={connected}
          robotName={robot?.name || 'AMR-X 01'}
          demo={demo || isError}
          immersive
        />

        <div className="hud-top-actions">
          <button type="button" onClick={() => setCameraExpanded((value) => !value)}>
            <Icon name={cameraExpanded ? 'close' : 'overview'} size={16} />
            {cameraExpanded ? 'Exit full view' : 'Full camera'}
          </button>
        </div>

        <aside className="teleop-hud hud-unit-panel">
          <div className="hud-panel-title">
            <span><i /> Active unit</span>
            <strong>{robot?.name || 'No robot selected'}</strong>
          </div>
          <div className="hud-unit-select">
            <span>Controlled robot</span>
            <SelectField
              name="teleoperation-robot"
              value={robot?.id || ''}
              options={robots.map((item) => ({ value: item.id, label: item.name }))}
              onChange={(event) => setSelectedRobotId(event.target.value)}
              ariaLabel="Controlled robot"
              disabled={!robots.length}
            />
          </div>
          <div className="hud-unit-state">
            <span><Icon name="shield" size={14} /> Safety field clear</span>
            <b>{robot?.status || 'standby'}</b>
          </div>
        </aside>

        <aside className="teleop-hud hud-map-panel">
          <header>
            <div><small>Navigation</small><strong>Local map</strong></div>
            <div>
              <button type="button" onClick={() => robot && mapRef.current?.focusRobot(robot)} title="Locate robot"><Icon name="route" size={15} /></button>
              <button type="button" onClick={() => setMapExpanded((value) => !value)}>
                <Icon name={mapExpanded ? 'close' : 'overview'} size={15} />
                {mapExpanded ? 'Close' : 'Expand'}
              </button>
            </div>
          </header>
          <div className="hud-map-viewport">
            <WarehouseMapSVG ref={mapRef} robots={robots} height="100%" compact={!mapExpanded} />
          </div>
        </aside>

        <aside className="teleop-hud hud-drive-panel">
          <header>
            <div><small>Direct drive</small><strong>Motion control</strong></div>
            <span className={`hud-motion-state ${direction !== 'stopped' ? 'moving' : ''}`}><i />{direction}</span>
          </header>
          <div className="hud-mode-tabs">
            <button type="button" className={mode === 'pad' ? 'active' : ''} onClick={() => setMode('pad')}>Drive pad</button>
            <button type="button" className={mode === 'joystick' ? 'active' : ''} onClick={() => setMode('joystick')}>Joystick</button>
          </div>
          <div className="hud-drive-body">
            {mode === 'pad'
              ? <DrivePad direction={direction} onStart={startDirection} onStop={stop} />
              : <Joystick maxSpeed={maxSpeed} onCommand={(l, a) => command(l, a)} onStop={stop} />}
          </div>
          <label className="hud-speed-limit">
            <span><small>Speed limit</small><strong>{maxSpeed.toFixed(1)} m/s</strong></span>
            <input type="range" min=".1" max="1.5" step=".1" value={maxSpeed} onChange={(event) => setMaxSpeed(Number(event.target.value))} />
          </label>
          <div className="hud-key-hints"><span><kbd>Z</kbd><kbd>↑</kbd> Forward</span><span><kbd>Q</kbd><kbd>D</kbd> Turn</span><span><kbd>S</kbd><kbd>↓</kbd> Reverse</span></div>
        </aside>

        <div className="teleop-hud hud-telemetry-strip">
          <Metric label="Battery" value={`${robot?.battery ?? 0}%`} tone="green" />
          <Metric label="Link" value={`${robot?.wifi_latency ?? '—'} ms`} />
          <Metric label="Linear" value={`${linear.toFixed(2)} m/s`} />
          <Metric label="Angular" value={`${angular.toFixed(2)} rad/s`} />
        </div>

        <button type="button" className="hud-emergency-stop" onClick={triggerEmergencyStop}>
          <Icon name="alert" size={18} />
          <span><small>Immediate halt</small><strong>Emergency stop</strong></span>
          <kbd>Space</kbd>
        </button>
      </Surface>
    </PageShell>
  )
}
