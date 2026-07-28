import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useRos } from '../hooks/useRos'
import { useTeleopControl } from '../hooks/useTeleopControl'

/**
 * Teleoperation.jsx — ported from amr-frontend-teleop-feature/amr-frontend's TeleopPage.jsx.
 * Connects to a rosbridge WebSocket via useRos/useTeleopControl and publishes real /cmd_vel commands.
 */

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

export default function Teleoperation() {
  const { colors: c, theme } = useTheme()
  const isLight = theme === 'light'
  const wsUrl = localStorage.getItem('amrx-ws-url') || 'ws://localhost:9090'
  const { ros, connected } = useRos(wsUrl)
  const { sendCommand, emergencyStop } = useTeleopControl(ros)
  const [mode, setMode] = useState('keyboard')
  const [maxSpeed, setMaxSpeed] = useState(0.6)
  const [direction, setDirection] = useState('stopped')
  const [angular, setAngular] = useState(0)
  const [knob, setKnob] = useState({ x: 0, y: 0, dragging: false })
  const activeKeys = useRef(new Set())
  const padRef = useRef(null)

  const move = useCallback(
    (dir) => {
      let linear = 0
      let ang = 0
      if (dir === 'forward') linear = maxSpeed
      if (dir === 'backward') linear = -maxSpeed
      if (dir === 'left') ang = 1.0
      if (dir === 'right') ang = -1.0
      setDirection(dir)
      setAngular(ang)
      sendCommand(linear, ang)
    },
    [maxSpeed, sendCommand],
  )

  const stop = useCallback(() => {
    setDirection('stopped')
    setAngular(0)
    sendCommand(0, 0)
  }, [sendCommand])

  useEffect(() => {
    if (mode !== 'keyboard') return
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        emergencyStop()
        stop()
        return
      }
      const dir = KEY_MAP[e.key]
      if (dir && !activeKeys.current.has(dir)) {
        activeKeys.current.add(dir)
        move(dir)
      }
    }
    const handleKeyUp = (e) => {
      const dir = KEY_MAP[e.key]
      if (dir) {
        activeKeys.current.delete(dir)
        if (activeKeys.current.size === 0) stop()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [mode, move, stop, emergencyStop])

  const updateJoystick = useCallback(
    (clientX, clientY) => {
      const pad = padRef.current
      if (!pad) return
      const rect = pad.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const radius = rect.width / 2

      let dx = clientX - cx
      let dy = clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > radius) {
        dx = (dx / dist) * radius
        dy = (dy / dist) * radius
      }
      setKnob({ x: dx, y: dy, dragging: true })

      const linear = (-dy / radius) * maxSpeed
      const ang = (-dx / radius) * 1.0
      setDirection(linear > 0.05 ? 'forward' : linear < -0.05 ? 'backward' : 'stopped')
      setAngular(ang)
      sendCommand(linear, ang)
    },
    [maxSpeed, sendCommand],
  )

  const releaseJoystick = useCallback(() => {
    setKnob({ x: 0, y: 0, dragging: false })
    stop()
  }, [stop])

  const directionLabel = {
    forward: 'FORWARD',
    backward: 'BACKWARD',
    left: 'LEFT',
    right: 'RIGHT',
    stopped: 'STOPPED',
  }[direction]

  const st = {
    app: {
      display: 'flex',
      minHeight: '100vh',
      background: c.bg,
      color: c.text,
      fontFamily: "'Segoe UI', Inter, sans-serif",
    },
    main: { flex: 1, padding: '24px 32px' },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: 700,
      color: c.text,
      margin: 0,
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    },
    connectedBadge: {
      padding: '6px 12px',
      borderRadius: 20,
      border: `1px solid ${c.border}`,
      background: c.card,
      fontSize: 12,
      color: c.textSub,
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: '#166534',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 700,
      color: '#fff',
    },
    layout: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20,
      maxWidth: 900,
    },
    card: {
      background: c.card,
      border: `1px solid ${c.border}`,
      borderRadius: 14,
      padding: 20,
      boxShadow: isLight ? '0 2px 16px rgba(0,0,0,0.08)' : '0 4px 24px rgba(0,0,0,0.3)',
      transition: 'background 0.2s, border-color 0.2s',
    },
    cardHeader: {
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: c.textSub,
      marginBottom: 16,
      paddingBottom: 10,
      borderBottom: `1px solid ${c.border}`,
    },
    modeToggle: {
      display: 'flex',
      gap: 6,
      background: c.bg,
      borderRadius: 10,
      padding: 4,
      marginBottom: 16,
      border: `1px solid ${c.border}`,
    },
    modeBtn: {
      flex: 1,
      padding: 8,
      border: 'none',
      borderRadius: 7,
      background: 'transparent',
      color: c.textSub,
      fontSize: 12,
      cursor: 'pointer',
      transition: 'background 0.15s, color 0.15s',
    },
    modeBtnActive: {
      background: '#38bdf8',
      color: '#0b0b10',
      fontWeight: 700,
    },
    keyHints: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      fontSize: 12,
      color: c.textSub,
      marginBottom: 16,
    },
    dpad: {
      display: 'grid',
      gridTemplateColumns: '52px 52px 52px',
      gridTemplateRows: '52px 52px 52px',
      gap: 5,
      justifyContent: 'center',
      margin: '0 0 16px',
    },
    dpadBtn: {
      border: `1px solid ${c.border}`,
      borderRadius: 8,
      background: c.bgSecondary,
      color: c.text,
      fontSize: 16,
      cursor: 'pointer',
      transition: 'background 0.1s',
    },
    dpadCenter: {
      borderRadius: 8,
      background: c.bg,
    },
    joystickWrap: {
      display: 'flex',
      justifyContent: 'center',
      margin: '4px 0 16px',
    },
    joystickPad: {
      width: 150,
      height: 150,
      borderRadius: '50%',
      background: c.bg,
      border: `1px solid ${c.border}`,
      position: 'relative',
      cursor: 'grab',
    },
    joystickKnob: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 46,
      height: 46,
      marginTop: -23,
      marginLeft: -23,
      borderRadius: '50%',
      background: '#38bdf8',
      border: `2px solid ${c.bg}`,
      boxShadow: '0 2px 8px rgba(56,189,248,0.4)',
      cursor: 'grab',
    },
    speedControl: { marginBottom: 16 },
    speedRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      color: c.textSub,
      marginBottom: 6,
    },
    speedVal: {
      fontFamily: 'monospace',
      color: '#38bdf8',
      fontWeight: 700,
    },
    slider: { width: '100%' },
    emergencyBtn: {
      width: '100%',
      padding: 12,
      background: isLight ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.10)',
      border: '1px solid rgba(239,68,68,0.4)',
      borderRadius: 10,
      color: '#ef4444',
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      letterSpacing: 0.5,
      transition: 'background 0.15s, box-shadow 0.15s',
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: `1px solid ${c.border}`,
      fontSize: 13,
    },
    cameraBox: { marginTop: 16 },
    cameraLabel: {
      fontSize: 11,
      color: c.textSub,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    cameraFrame: {
      height: 120,
      borderRadius: 10,
      background: c.bg,
      border: `1px solid ${c.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 28,
      opacity: 0.4,
    },
  }

  return (
    <div style={st.app}>
      <main style={st.main}>
        <div style={st.header}>
          <h1 style={st.pageTitle}>Teleoperation</h1>
          <div style={st.headerRight}>
            <span
              style={{
                ...st.connectedBadge,
                color: connected ? c.online : c.warning,
                background: connected ? 'rgba(0,212,170,0.1)' : 'rgba(245,158,11,0.1)',
                border: `1px solid ${connected ? c.online : c.warning}`,
              }}
            >
              {connected ? '● Connected' : '◌ Connecting…'}
            </span>
            <div style={st.avatar}>T</div>
          </div>
        </div>

        <div style={st.layout}>
          <div style={st.card}>
            <div style={st.cardHeader}>Manual Control</div>

            <div style={st.modeToggle}>
              {['keyboard', 'buttons', 'joystick'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{ ...st.modeBtn, ...(mode === m ? st.modeBtnActive : {}) }}
                >
                  {m === 'keyboard' ? 'Keyboard' : m === 'buttons' ? 'Buttons' : 'Joystick'}
                </button>
              ))}
            </div>

            {mode === 'keyboard' && (
              <div style={st.keyHints}>
                <span>
                  <Key>Z</Key> Forward
                </span>
                <span>
                  <Key>S</Key> Backward
                </span>
                <span>
                  <Key>Q</Key> Left
                </span>
                <span>
                  <Key>D</Key> Right
                </span>
                <span>
                  <Key wide>Space</Key> Stop
                </span>
              </div>
            )}

            {mode === 'buttons' && (
              <div style={st.dpad}>
                <div />
                <button style={st.dpadBtn} onMouseDown={() => move('forward')} onMouseUp={stop} onMouseLeave={stop}>
                  ▲
                </button>
                <div />
                <button style={st.dpadBtn} onMouseDown={() => move('left')} onMouseUp={stop} onMouseLeave={stop}>
                  ◄
                </button>
                <div style={st.dpadCenter} />
                <button style={st.dpadBtn} onMouseDown={() => move('right')} onMouseUp={stop} onMouseLeave={stop}>
                  ►
                </button>
                <div />
                <button style={st.dpadBtn} onMouseDown={() => move('backward')} onMouseUp={stop} onMouseLeave={stop}>
                  ▼
                </button>
                <div />
              </div>
            )}

            {mode === 'joystick' && (
              <div style={st.joystickWrap}>
                <div
                  ref={padRef}
                  style={st.joystickPad}
                  onMouseDown={(e) => updateJoystick(e.clientX, e.clientY)}
                  onMouseMove={(e) => knob.dragging && updateJoystick(e.clientX, e.clientY)}
                  onMouseUp={releaseJoystick}
                  onMouseLeave={releaseJoystick}
                >
                  <div
                    style={{
                      ...st.joystickKnob,
                      transform: `translate(${knob.x}px, ${knob.y}px)`,
                    }}
                  />
                </div>
              </div>
            )}

            <div style={st.speedControl}>
              <div style={st.speedRow}>
                <span>Max speed</span>
                <span style={st.speedVal}>{maxSpeed.toFixed(1)} m/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={maxSpeed}
                onChange={(e) => setMaxSpeed(parseFloat(e.target.value))}
                style={st.slider}
              />
            </div>

            <button
              style={st.emergencyBtn}
              onClick={() => {
                emergencyStop()
                stop()
              }}
            >
              EMERGENCY STOP
            </button>
          </div>

          <div style={st.card}>
            <div style={st.cardHeader}>Live Status</div>
            <InfoRow label="State" value={directionLabel} accent="#10b981" />
            <InfoRow label="Linear speed" value={`${maxSpeed.toFixed(1)} m/s`} accent="#38bdf8" />
            <InfoRow label="Angular speed" value={`${angular.toFixed(1)} rad/s`} />
            <InfoRow label="Mode" value={mode.toUpperCase()} accent="#f59e0b" />

            <div style={st.cameraBox}>
              <div style={st.cameraLabel}>Front camera</div>
              <div style={st.cameraFrame}>📷</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function InfoRow({ label, value, accent = 'var(--text)' }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
        fontSize: 13,
      }}
    >
      <span style={{ color: 'var(--text-sub)' }}>{label}</span>
      <span style={{ fontFamily: 'monospace', color: accent, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function Key({ children, wide }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        minWidth: wide ? 48 : 'auto',
        textAlign: 'center',
        background: 'var(--bg-secondary, #1c1c26)',
        border: '1px solid var(--border, #2a2a38)',
        borderRadius: 4,
        fontFamily: 'monospace',
        fontSize: 11,
        color: 'var(--text, #e5e7eb)',
        marginRight: 6,
      }}
    >
      {children}
    </span>
  )
}

