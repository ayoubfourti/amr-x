import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRobots } from '../api/robots'
import { getMissions } from '../api/missions'
import { getAlerts } from '../api/alerts'
import { getModules } from '../api/modules'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { useRos } from '../hooks/useRos'
import { useTeleopControl } from '../hooks/useTeleopControl'
import EmptyState from '../components/ui/EmptyState'

// Always-dark control-room palette — this page ignores ThemeContext by design.
const T = {
  bg: '#070d14',
  card: '#0c1520',
  cardBorder: '#1a2a3a',
  accent: '#00d4aa',
  accentDim: 'rgba(0,212,170,0.15)',
  text: '#e2e8f0',
  textSub: '#64748b',
  textMuted: '#334155',
  error: '#ef4444',
  warning: '#f59e0b',
  online: '#00d4aa',
}

// ============================================================
// LOCAL COMPONENTS
// ============================================================

function CircularGauge({ value = 0, size = 140, color = T.accent, label, sublabel }) {
  const r = 50
  const circumference = 2 * Math.PI * r
  const clamped = Math.min(Math.max(value, 0), 100)
  const offset = circumference * (1 - clamped / 100)

  return (
    <svg viewBox="0 0 120 120" width={size} height={size}>
      <defs>
        <filter id="gaugeGlow">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="60" cy="60" r={r} fill="none" stroke={T.cardBorder} strokeWidth="8" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
        filter="url(#gaugeGlow)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x="60" y="58" textAnchor="middle" fontSize="22" fontWeight="700" fontFamily="monospace" fill={T.text}>
        {label}
      </text>
      <text x="60" y="76" textAnchor="middle" fontSize="9" letterSpacing="1" fill={T.textSub}>
        {sublabel}
      </text>
    </svg>
  )
}

function SemiCircleGauge({ value = 0, maxValue = 2.5, size = 200 }) {
  const ratio = Math.min(Math.max(value / maxValue, 0), 1)
  const arcLen = 251
  const angle = 180 - ratio * 180
  const rad = (angle * Math.PI) / 180
  const needleX = 100 + 70 * Math.cos(rad)
  const needleY = 100 - 70 * Math.sin(rad)

  return (
    <svg viewBox="0 0 200 110" width={size} height={size * 0.55}>
      <defs>
        <filter id="gaugeGlow2">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M 20 100 A 80 80 0 0 1 180 100" stroke={T.cardBorder} strokeWidth={12} fill="none" />
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        stroke={T.accent}
        strokeWidth={12}
        fill="none"
        strokeDasharray={`${ratio * arcLen} ${arcLen}`}
        filter="url(#gaugeGlow2)"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <line x1="100" y1="100" x2={needleX} y2={needleY} stroke={T.error} strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="100" r="4" fill={T.error} />
      <text x="100" y="80" textAnchor="middle" fontSize="26" fontWeight="700" fontFamily="monospace" fill={T.text}>
        {value.toFixed(2)}
      </text>
      <text x="100" y="96" textAnchor="middle" fontSize="11" fill={T.textSub}>
        m/s
      </text>
      <text x="20" y="108" textAnchor="start" fontSize="9" fill={T.textMuted}>
        0
      </text>
      <text x="180" y="108" textAnchor="end" fontSize="9" fill={T.textMuted}>
        {maxValue}
      </text>
    </svg>
  )
}

function TimelineStep({ status, label, time, detail, isLast }) {
  const labelColor = status === 'pending' ? T.textMuted : T.text
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          className={status === 'active' ? 'status-dot-pulse' : ''}
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            background: status === 'done' ? T.accent : 'transparent',
            border:
              status === 'pending'
                ? `1px solid ${T.cardBorder}`
                : status === 'active'
                  ? `2px solid ${T.accent}`
                  : 'none',
            color: status === 'done' ? '#000' : T.accent,
          }}
        >
          {status === 'done' ? '✓' : ''}
        </div>
        {!isLast && <div style={{ width: 1, flex: 1, minHeight: 18, background: T.cardBorder, marginTop: 2 }} />}
      </div>
      <div style={{ paddingBottom: 14, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: labelColor }}>{label}</span>
          {status === 'active' && (
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: 0.5,
                color: T.accent,
                background: T.accentDim,
                borderRadius: 3,
                padding: '1px 5px',
              }}
            >
              LIVE
            </span>
          )}
        </div>
        <div style={{ fontSize: 10, color: T.textSub, fontFamily: 'monospace', marginTop: 2 }}>
          {time}
          {detail ? ` · ${detail}` : ''}
        </div>
      </div>
    </div>
  )
}

function JoystickPad({ onMove, onRelease, size = 160 }) {
  const padRef = useRef(null)
  const draggingRef = useRef(false)
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  function updateFromPoint(clientX, clientY) {
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
    setKnob({ x: dx, y: dy })
    onMove?.(dx / radius, dy / radius)
  }

  function release() {
    if (!draggingRef.current) return
    draggingRef.current = false
    setKnob({ x: 0, y: 0 })
    onRelease?.()
  }

  function handleMouseDown(e) {
    draggingRef.current = true
    updateFromPoint(e.clientX, e.clientY)
  }
  function handleMouseMove(e) {
    if (draggingRef.current) updateFromPoint(e.clientX, e.clientY)
  }
  function handleTouchStart(e) {
    draggingRef.current = true
    const t = e.touches[0]
    if (t) updateFromPoint(t.clientX, t.clientY)
  }
  function handleTouchMove(e) {
    if (!draggingRef.current) return
    const t = e.touches[0]
    if (t) updateFromPoint(t.clientX, t.clientY)
  }

  return (
    <div
      ref={padRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={release}
      onMouseLeave={release}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={release}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: T.bg,
        border: `1px solid ${T.accent}44`,
        position: 'relative',
        cursor: 'grab',
        touchAction: 'none',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 28,
          height: 28,
          marginTop: -14,
          marginLeft: -14,
          borderRadius: '50%',
          background: T.accent,
          boxShadow: `0 0 10px ${T.accent}`,
          transform: `translate(${knob.x}px, ${knob.y}px)`,
          transition: draggingRef.current ? 'none' : 'transform 0.2s ease',
        }}
      />
    </div>
  )
}

function CameraFeed() {
  const [view, setView] = useState('FRONT')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${T.cardBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 8, color: T.textSub, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            PERCEPTION
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Camera feed</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['FRONT', 'REAR', 'DECK'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              style={{
                padding: '3px 8px',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.8,
                background: view === v ? T.accent : 'transparent',
                color: view === v ? '#000' : T.textSub,
                border: `1px solid ${view === v ? T.accent : T.cardBorder}`,
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', background: '#050a10', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(
              to bottom,
              #1a2a1a 0%,
              #0d1a0d 30%,
              #050a05 100%
            )`,
          }}
        />

        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 300 140"
          preserveAspectRatio="none"
        >
          <line x1="150" y1="60" x2="0" y2="140" stroke="#1a3a1a" strokeWidth="1" />
          <line x1="150" y1="60" x2="300" y2="140" stroke="#1a3a1a" strokeWidth="1" />
          <line x1="150" y1="60" x2="60" y2="140" stroke="#1a3a1a" strokeWidth="0.5" />
          <line x1="150" y1="60" x2="240" y2="140" stroke="#1a3a1a" strokeWidth="0.5" />

          <rect x="0" y="20" width="55" height="120" fill="#0d1f0d" stroke="#1a3a1a" strokeWidth="0.5" />
          {[30, 50, 70, 90, 110].map((y) => (
            <line key={y} x1="0" y1={y} x2="55" y2={y} stroke="#1a3a1a" strokeWidth="0.5" />
          ))}

          <rect x="245" y="20" width="55" height="120" fill="#0d1f0d" stroke="#1a3a1a" strokeWidth="0.5" />
          {[30, 50, 70, 90, 110].map((y) => (
            <line key={y} x1="245" y1={y} x2="300" y2={y} stroke="#1a3a1a" strokeWidth="0.5" />
          ))}

          <rect x="55" y="60" width="190" height="80" fill="#080f08" opacity="0.5" />

          <line x1="0" y1="60" x2="300" y2="60" stroke="#1a3a1a" strokeWidth="0.5" opacity="0.5" />
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.08) 2px,
              rgba(0,0,0,0.08) 4px
            )`,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 4,
              padding: '2px 7px',
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: T.error,
                boxShadow: `0 0 4px ${T.error}`,
                animation: 'statusPulse 1.5s infinite',
              }}
            />
            <span style={{ fontSize: 9, fontWeight: 700, color: T.error, letterSpacing: 1 }}>REC</span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 9,
            color: 'rgba(0,212,170,0.6)',
            fontFamily: 'monospace',
            zIndex: 2,
          }}
        >
          1920×1000 · 30 fps
        </div>

        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 16,
            height: 16,
            borderTop: `2px solid ${T.accent}`,
            borderLeft: `2px solid ${T.accent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 16,
            height: 16,
            borderTop: `2px solid ${T.accent}`,
            borderRight: `2px solid ${T.accent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            width: 16,
            height: 16,
            borderBottom: `2px solid ${T.accent}`,
            borderLeft: `2px solid ${T.accent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 16,
            height: 16,
            borderBottom: `2px solid ${T.accent}`,
            borderRight: `2px solid ${T.accent}`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            fontSize: 9,
            fontFamily: 'monospace',
            color: 'rgba(0,212,170,0.6)',
            zIndex: 2,
          }}
        >
          {new Date().toLocaleTimeString('en-GB')}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            fontSize: 9,
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.3)',
            zIndex: 2,
          }}
        >
          ⊕ cam_{view.toLowerCase()}_01
        </div>
      </div>
    </div>
  )
}

function RobotView3D() {
  const [mode, setMode] = useState('SOLID')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${T.cardBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 8, color: T.textSub, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            DIGITAL TWIN
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>3D robot view</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['SOLID', 'FRAME'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setMode(v)}
              style={{
                padding: '3px 8px',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.8,
                background: mode === v ? T.accentDim : 'transparent',
                color: mode === v ? T.accent : T.textSub,
                border: `1px solid ${mode === v ? 'rgba(0,212,170,0.3)' : T.cardBorder}`,
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {mode === v ? '● ' : ''}
              {v}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          background: '#060e18',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
        >
          {Array.from({ length: 10 }, (_, i) => {
            const y = 150 + i * 20
            const xLeft = 200 - (i + 1) * 35
            const xRight = 200 + (i + 1) * 35
            return <line key={i} x1={xLeft} y1={y} x2={xRight} y2={y} stroke="#0f1f2f" strokeWidth="1" />
          })}
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={200} y1={150} x2={200 + (i - 6) * 40} y2={300} stroke="#0f1f2f" strokeWidth="1" />
          ))}

          <g transform="translate(200,160)">
            <ellipse cx="0" cy="40" rx="55" ry="10" fill="rgba(0,0,0,0.4)" />
            <rect x="-45" y="-20" width="90" height="55" rx="8" fill="#1a2a3a" stroke="#00d4aa" strokeWidth="1.5" />
            <rect x="-40" y="-30" width="80" height="15" rx="4" fill="#0f1f2f" stroke="#1a3a4a" strokeWidth="1" />
            <rect x="-6" y="-50" width="12" height="22" rx="2" fill="#1a2a3a" stroke="#00d4aa" strokeWidth="1" />
            <circle cx="0" cy="-54" r="5" fill="#00d4aa" fillOpacity="0.3" stroke="#00d4aa" strokeWidth="1" />
            {[
              [-38, -8],
              [-38, 28],
              [38, -8],
              [38, 28],
            ].map(([wx, wy], i) => (
              <rect key={i} x={wx - 6} y={wy - 10} width="12" height="20" rx="4" fill="#0a1520" stroke="#1a3a4a" strokeWidth="1" />
            ))}
            <rect x="-35" y="-22" width="70" height="4" rx="2" fill="#00d4aa" fillOpacity="0.4" />
            <line x1="-45" y1="5" x2="45" y2="5" stroke="#00d4aa" strokeWidth="0.5" strokeOpacity="0.3" />
          </g>

          <ellipse cx="200" cy="200" rx="50" ry="8" fill="rgba(0,212,170,0.08)" />
        </svg>

        {mode === 'FRAME' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,212,170,0.03)' }} />
        )}
      </div>
    </div>
  )
}

function PerceptionColumn() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: T.card }}>
      <div style={{ flex: 1, borderBottom: `1px solid ${T.cardBorder}`, minHeight: 0 }}>
        <CameraFeed />
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <RobotView3D />
      </div>
    </div>
  )
}

function TopBar({ robot, connected, currentUser, robotList, selectedRobotId, setSelectedRobotId, demo, navigate, unresolvedAlerts }) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  )

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        height: 48,
        background: '#0a121e',
        borderBottom: `1px solid ${T.cardBorder}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        flexShrink: 0,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: 0.5 }}>Fleet Control</div>
        <div style={{ fontSize: 9, color: T.textSub, letterSpacing: 1, textTransform: 'uppercase' }}>
          WAREHOUSE NORTH · {robotList.length} UNITS
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: T.card,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: 999,
            padding: '6px 14px',
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: robot?.status === 'online' ? T.online : T.textSub,
              boxShadow: robot?.status === 'online' ? `0 0 6px ${T.online}` : 'none',
            }}
          />
          <select
            value={selectedRobotId || ''}
            onChange={(e) => setSelectedRobotId(Number(e.target.value))}
            style={{
              background: 'transparent',
              border: 'none',
              color: T.text,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {robotList.map((r) => (
              <option key={r.id} value={r.id} style={{ background: T.card }}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        {demo && (
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: 1,
              color: T.warning,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 4,
              padding: '2px 6px',
            }}
          >
            DEMO
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.textSub, fontFamily: 'monospace' }}>
          <span style={{ color: connected ? T.online : T.error }}>{connected ? '▲' : '▼'}</span>
          ROS {connected ? '40' : '--'} Hz
        </div>

        <div style={{ fontSize: 10, color: T.textSub, fontFamily: 'monospace' }}>
          CPU {robot?.wifi_latency ?? '--'}%
        </div>

        <div
          style={{
            fontSize: 13,
            fontFamily: 'monospace',
            fontWeight: 700,
            color: T.accent,
            letterSpacing: 1,
            background: T.card,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: 6,
            padding: '4px 10px',
          }}
        >
          {time}
        </div>

        <div
          style={{
            position: 'relative',
            width: 28,
            height: 28,
            borderRadius: 6,
            background: T.card,
            border: `1px solid ${T.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 13,
          }}
          onClick={() => navigate('/alerts')}
        >
          🔔
          {unresolvedAlerts > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 14,
                height: 14,
                borderRadius: 7,
                background: T.error,
                color: '#fff',
                fontSize: 8,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
              }}
            >
              {unresolvedAlerts}
            </span>
          )}
        </div>

        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/profile')}
        >
          {(currentUser?.name || '?')[0].toUpperCase()}
        </div>
      </div>
    </div>
  )
}

function MissionColumn({ mission, robot }) {
  const [elapsed, setElapsed] = useState('--:--')

  useEffect(() => {
    if (!mission?.started_at) {
      setElapsed('--:--')
      return
    }
    function tick() {
      const startedAt = new Date(mission.started_at).getTime()
      const diff = Math.max(0, Date.now() - startedAt)
      const totalSec = Math.floor(diff / 1000)
      const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
      const ss = String(totalSec % 60).padStart(2, '0')
      setElapsed(`${mm}:${ss}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [mission?.started_at])

  const missionSteps = ['Start', 'Pick up', 'Transport', 'Drop off', 'Complete']
  const progress = mission?.progress ?? 0
  const thresholds = [1, 20, 40, 60, 80]
  const stepIndexDone = (idx) => progress >= thresholds[idx]
  const activeStepIndex = missionSteps.findIndex((_, idx) => !stepIndexDone(idx))
  const doneCount = missionSteps.filter((_, idx) => stepIndexDone(idx)).length

  const stepMeta = [
    { time: '09:41:02', detail: 'Dock B2' },
    { time: '09:47:18', detail: 'Rack A-14' },
    { time: 'In progress', detail: `${Math.max(0, 100 - progress)}m left` },
    { time: 'ETA 10:04', detail: 'Bay 7' },
    { time: 'Awaiting handoff', detail: null },
  ]

  const battery = robot?.battery ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.card, overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${T.cardBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 9, color: T.textSub, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>
            MSN-{mission?.id || '----'} · UNIT {robot?.name || '--'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Mission</div>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 1.5,
            color: mission?.status === 'running' ? T.accent : T.textSub,
            background: mission?.status === 'running' ? T.accentDim : T.card,
            border: `1px solid ${mission?.status === 'running' ? 'rgba(0,212,170,0.3)' : T.cardBorder}`,
            borderRadius: 4,
            padding: '3px 8px',
          }}
        >
          {(mission?.status || 'NO MISSION').toUpperCase()}
        </span>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <CircularGauge value={battery} size={160} color={T.accent} label={`${robot?.battery ?? '--'}%`} sublabel="BATTERY" />
        <div style={{ fontSize: 11, color: T.textSub, marginTop: 8, letterSpacing: 0.5 }}>
          ↻ {robot?.battery ? `${Math.round(robot.battery * 0.35)}W ${Math.round(robot.battery * 0.12)}M LEFT` : '-- LEFT'}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderTop: `1px solid ${T.cardBorder}`,
          borderBottom: `1px solid ${T.cardBorder}`,
          flexShrink: 0,
        }}
      >
        {[
          { label: 'ELAPSED', value: elapsed },
          { label: 'DISTANCE', value: `${Math.round((mission?.progress || 0) * 4.12)} m` },
          { label: 'PAYLOAD', value: mission?.module_required || '1 tote' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{ padding: '10px 12px', borderRight: i < 2 ? `1px solid ${T.cardBorder}` : 'none', textAlign: 'center' }}
          >
            <div style={{ fontSize: 8, color: T.textSub, letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>
              ⊙ {stat.label}
            </div>
            <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: T.text }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ fontSize: 9, color: T.textSub, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
          ROUTE TIMELINE &nbsp; {doneCount}/5 stages
        </div>
        {missionSteps.map((step, idx) => {
          const done = stepIndexDone(idx)
          const active = idx === activeStepIndex
          const status = done ? 'done' : active ? 'active' : 'pending'
          return (
            <TimelineStep
              key={step}
              status={status}
              label={step}
              time={stepMeta[idx].time}
              detail={stepMeta[idx].detail}
              isLast={idx === missionSteps.length - 1}
            />
          )
        })}
      </div>
    </div>
  )
}

function TeleopColumn({ connected, sendCommand, emergencyStop, robot }) {
  const [mode, setMode] = useState('keyboard')
  const [maxSpeed, setMaxSpeed] = useState(0.6)
  const [thrust, setThrust] = useState(0)
  const [heading, setHeading] = useState(0)
  const [stopHover, setStopHover] = useState(false)

  function handleMove(x, y) {
    setThrust(Math.round(Math.abs(y) * 100))
    setHeading(Math.round(x * 90))
    if (connected) sendCommand(y * maxSpeed, -x * 1.0)
  }

  function handleRelease() {
    setThrust(0)
    setHeading(0)
    if (connected) sendCommand(0, 0)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.card, overflow: 'hidden' }}>
      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${T.cardBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 8, color: T.textSub, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              MANUAL OVERRIDE
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Teleoperation</div>
          </div>
          <div
            style={{
              fontSize: 9,
              fontFamily: 'monospace',
              color: connected ? T.accent : T.textSub,
              background: connected ? T.accentDim : T.card,
              border: `1px solid ${connected ? 'rgba(0,212,170,0.3)' : T.cardBorder}`,
              borderRadius: 4,
              padding: '3px 8px',
            }}
          >
            {connected ? `LINK ${robot?.wifi_latency || 12} MS` : 'DISCONNECTED'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '10px 14px', borderBottom: `1px solid ${T.cardBorder}` }}>
          {['keyboard', 'buttons', 'joystick'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '7px 4px',
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'capitalize',
                background: mode === m ? T.accent : 'transparent',
                color: mode === m ? '#000' : T.textSub,
                border: `1px solid ${mode === m ? T.accent : T.cardBorder}`,
                borderRadius: 5,
                cursor: 'pointer',
              }}
            >
              {m === 'keyboard' ? '⌨ Keyboard' : m === 'buttons' ? '⊞ Buttons' : '⊕ Joystick'}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <JoystickPad onMove={handleMove} onRelease={handleRelease} />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              width: '100%',
              gap: 1,
              background: T.cardBorder,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {[
              ['THRUST', `${thrust}%`],
              ['HEADING', `${heading}°`],
              ['YAW', `${heading >= 0 ? '+' : ''}${(heading / 90).toFixed(1)}`],
            ].map(([label, val]) => (
              <div key={label} style={{ background: T.card, padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: T.textSub, letterSpacing: 1, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: T.text }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 14px 12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 9,
              color: T.textSub,
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            <span>SPEED LIMIT</span>
            <span style={{ color: T.accent, fontFamily: 'monospace', fontWeight: 700 }}>
              {Math.round((maxSpeed / 2.5) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2.5"
            step="0.1"
            value={maxSpeed}
            onChange={(e) => setMaxSpeed(Number(e.target.value))}
            style={{ width: '100%', accentColor: T.accent }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: T.textMuted, marginTop: 3 }}>
            <span>0.0 m/s</span>
            <span>2.5 m/s</span>
          </div>
        </div>

        <div style={{ padding: '0 14px 16px' }}>
          <button
            type="button"
            onClick={emergencyStop}
            onMouseEnter={() => setStopHover(true)}
            onMouseLeave={() => setStopHover(false)}
            style={{
              width: '100%',
              padding: '13px',
              background: stopHover ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 6,
              color: T.error,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.15s',
            }}
          >
            ⊗ EMERGENCY STOP
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderTop: `1px solid ${T.cardBorder}`, minHeight: 0 }}>
        <div
          style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${T.cardBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 8, color: T.textSub, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              DRIVE TELEMETRY
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Velocity</div>
          </div>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.accent }}>↑ CAP {maxSpeed.toFixed(2)} M/S</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, minHeight: 0 }}>
          <SemiCircleGauge value={robot?.speed ?? 0} maxValue={2.5} />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

function Dashboard() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { demo, DEMO_ROBOTS, DEMO_MISSIONS, DEMO_ALERTS } = useDemo()

  const [selectedRobotId, setSelectedRobotId] = useState(null)

  const wsUrl = localStorage.getItem('amrx-ws-url') || 'ws://localhost:9090'
  const { ros, connected } = useRos(wsUrl)
  const { sendCommand, emergencyStop } = useTeleopControl(ros)

  const { data: robots, isLoading: robotsLoading } = useQuery({
    queryKey: ['robots'],
    queryFn: getRobots,
    refetchInterval: 4000,
  })

  const { data: missions } = useQuery({
    queryKey: ['missions'],
    queryFn: getMissions,
    refetchInterval: 4000,
  })

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 4000,
  })

  // Kept so the modules cache stays warm for the Modules page — not rendered on this dashboard.
  useQuery({
    queryKey: ['modules'],
    queryFn: getModules,
    refetchInterval: 4000,
  })

  const robotList = useMemo(() => robots || [], [robots])
  const missionList = missions || []
  const alertList = alerts || []

  const displayRobots = demo ? DEMO_ROBOTS : robotList
  const displayMissions = demo ? DEMO_MISSIONS : missionList
  const displayAlerts = demo ? DEMO_ALERTS : alertList

  const robot = selectedRobotId ? displayRobots.find((r) => r.id === selectedRobotId) : displayRobots[0]

  useEffect(() => {
    setSelectedRobotId(null)
  }, [demo])

  useEffect(() => {
    if (displayRobots.length > 0 && !selectedRobotId) {
      setSelectedRobotId(displayRobots[0].id)
    }
  }, [displayRobots, selectedRobotId])

  const currentMission = robot
    ? displayMissions.find((m) => m.robot_id === robot.id && m.status === 'running')
    : null

  const unresolvedAlerts = displayAlerts.filter((a) => !a.is_resolved).length

  if (!demo && robotsLoading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: T.textSub }}>Loading robots…</p>
      </div>
    )
  }

  if (!robot) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState icon="🤖" title="No robots registered" subtitle="Register your first robot to start monitoring" />
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.text,
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TopBar
        robot={robot}
        connected={connected}
        currentUser={currentUser}
        robotList={displayRobots}
        selectedRobotId={selectedRobotId}
        setSelectedRobotId={setSelectedRobotId}
        demo={demo}
        navigate={navigate}
        unresolvedAlerts={unresolvedAlerts}
      />

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 1,
          background: T.cardBorder,
          minHeight: 0,
          height: 'calc(100vh - 48px)',
          overflow: 'hidden',
        }}
      >
        <MissionColumn mission={currentMission} robot={robot} />
        <PerceptionColumn />
        <TeleopColumn connected={connected} sendCommand={sendCommand} emergencyStop={emergencyStop} robot={robot} />
      </div>
    </div>
  )
}

export default Dashboard
